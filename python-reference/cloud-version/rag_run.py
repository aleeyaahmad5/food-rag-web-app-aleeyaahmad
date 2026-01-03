"""
RAG System with Upstash Vector and Groq Cloud
Migrated from ChromaDB + Ollama to cloud-based services
"""

import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv
from upstash_vector import Index
from groq import Groq

# Load environment variables from .env file in same directory
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Debug: verify env vars are loaded (can be removed after testing)
if not os.getenv("GROQ_API_KEY"):
    print(f"⚠️ Warning: GROQ_API_KEY not found. Checking .env at: {env_path}")
    print(f"   .env exists: {env_path.exists()}")

# Constants - Use foods.json in same directory
JSON_FILE = Path(__file__).parent / "foods.json"
TOP_K = 3
MAX_RETRIES = 3

# ============================================
# Initialize Cloud Clients
# ============================================

def init_upstash_client():
    """Initialize Upstash Vector client with error handling"""
    try:
        index = Index(
            url=os.getenv("UPSTASH_VECTOR_REST_URL"),
            token=os.getenv("UPSTASH_VECTOR_REST_TOKEN")
        )
        return index
    except Exception as e:
        print(f"❌ Failed to initialize Upstash Vector: {e}")
        raise

def init_groq_client():
    """Initialize Groq client with error handling"""
    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        return client
    except Exception as e:
        print(f"❌ Failed to initialize Groq client: {e}")
        raise

# Initialize clients
print("🔌 Connecting to cloud services...")
index = init_upstash_client()
groq_client = init_groq_client()
print("✅ Connected to Upstash Vector and Groq Cloud")

# Load data
with open(JSON_FILE, "r", encoding="utf-8") as f:
    food_data = json.load(f)

# ============================================
# Document Indexing (Upstash auto-embeds text)
# ============================================

def index_documents(food_data, force_reindex=False):
    """
    Index documents in Upstash Vector.
    Upstash automatically generates embeddings using mixedbread-ai/mxbai-embed-large-v1
    No manual embedding generation required!
    """
    try:
        # Check current index stats
        info = index.info()
        current_count = info.vector_count
        
        if current_count >= len(food_data) and not force_reindex:
            print(f"✅ All {current_count} documents already indexed in Upstash Vector.")
            return
        
        print(f"📦 Indexing {len(food_data)} documents to Upstash Vector...")
        
        vectors = []
        for item in food_data:
            # Enrich text with metadata (same as before)
            enriched_text = item["text"]
            if "region" in item:
                enriched_text += f" This food is popular in {item['region']}."
            if "type" in item:
                enriched_text += f" It is a type of {item['type']}."
            
            vectors.append({
                "id": str(item["id"]),
                "data": enriched_text,  # Raw text - Upstash handles embedding automatically!
                "metadata": {
                    "text": item["text"],
                    "region": item.get("region", "Unknown"),
                    "type": item.get("type", "Unknown")
                }
            })
        
        # Batch upsert (more efficient than individual inserts)
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            index.upsert(vectors=batch)
            print(f"  ✅ Uploaded batch {i//batch_size + 1}/{(len(vectors)-1)//batch_size + 1}")
        
        print(f"🎉 Successfully indexed {len(vectors)} documents!")
        
    except Exception as e:
        print(f"❌ Error indexing documents: {e}")
        raise

# ============================================
# LLM Generation with Groq (with retry logic)
# ============================================

def generate_with_groq(prompt, context, retries=MAX_RETRIES):
    """
    Generate answer using Groq Cloud API with retry logic and error handling.
    Uses llama-3.1-8b-instant model for fast inference.
    """
    system_prompt = """You are a knowledgeable food expert assistant. 
Answer questions based on the provided context accurately and helpfully.
If the context doesn't contain relevant information, acknowledge that and provide general knowledge if appropriate."""

    full_prompt = f"""Use the following context to answer the question.

Context:
{context}

Question: {prompt}
Answer:"""

    for attempt in range(retries):
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": full_prompt}
                ],
                temperature=0.7,
                max_tokens=1024,
                top_p=1
            )
            return completion.choices[0].message.content.strip()
        
        except Exception as e:
            error_msg = str(e).lower()
            
            # Handle rate limiting with exponential backoff
            if "rate" in error_msg or "limit" in error_msg:
                if attempt < retries - 1:
                    wait_time = 2 ** attempt  # 1, 2, 4 seconds
                    print(f"⏳ Rate limited. Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    continue
                else:
                    return "⚠️ Rate limit exceeded. Please try again in a moment."
            
            # Handle authentication errors
            if "auth" in error_msg or "key" in error_msg:
                return "❌ Authentication error. Please check your GROQ_API_KEY."
            
            # Handle other errors
            if attempt < retries - 1:
                print(f"⚠️ Attempt {attempt + 1} failed, retrying...")
                time.sleep(1)
            else:
                return f"❌ Error generating response: {str(e)}"
    
    return "❌ Failed to generate response after multiple attempts."

# ============================================
# RAG Query Function
# ============================================

def rag_query(question):
    """
    RAG query using Upstash Vector for retrieval and Groq for generation.
    - Upstash automatically embeds the question text
    - No manual embedding generation needed!
    """
    # Validate input
    if not question or len(question.strip()) < 2:
        return "Please enter a valid question."
    
    try:
        # Step 1: Query Upstash Vector (auto-embeds the question)
        results = index.query(
            data=question,  # Raw text - Upstash handles embedding automatically!
            top_k=TOP_K,
            include_metadata=True,
            include_data=True
        )
        
        # Handle no results
        if not results:
            return "No relevant documents found for your question."
        
        # Step 2: Extract documents and IDs
        top_docs = [r.metadata.get("text", "") for r in results]
        top_ids = [r.id for r in results]
        scores = [r.score for r in results]
        
        # Step 3: Show friendly explanation of retrieved documents
        print("\n🧠 Retrieving relevant information to reason through your question...\n")
        
        for i, (doc, doc_id, score) in enumerate(zip(top_docs, top_ids, scores)):
            print(f"🔹 Source {i + 1} (ID: {doc_id}, Relevance: {score:.3f}):")
            print(f"    \"{doc}\"\n")
        
        print("📚 These seem to be the most relevant pieces of information to answer your question.\n")
        
        # Step 4: Build context from retrieved documents
        context = "\n".join(top_docs)
        
        # Step 5: Generate answer with Groq
        return generate_with_groq(question, context)
        
    except Exception as e:
        error_msg = str(e).lower()
        
        # Handle Upstash connection errors
        if "connection" in error_msg or "timeout" in error_msg:
            return "❌ Connection error. Please check your internet connection."
        
        # Handle authentication errors
        if "auth" in error_msg or "token" in error_msg:
            return "❌ Authentication error. Please check your Upstash credentials."
        
        return f"❌ Error processing query: {str(e)}"

# ============================================
# Main Execution
# ============================================

if __name__ == "__main__":
    # Index documents (Upstash auto-embeds, skips if already indexed)
    index_documents(food_data)
    
    # Interactive loop
    print("\n🧠 RAG is ready. Ask a question (type 'exit' to quit):\n")
    while True:
        try:
            question = input("You: ")
            if question.lower() in ["exit", "quit"]:
                print("👋 Goodbye!")
                break
            answer = rag_query(question)
            print("🤖:", answer, "\n")
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}\n")
