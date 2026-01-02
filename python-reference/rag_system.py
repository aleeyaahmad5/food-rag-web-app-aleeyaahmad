"""
Week 2-3 Python Reference Code
Food RAG System - Original Python Implementation

This folder contains the original Python code developed during Weeks 2-3
of the course for comparison with the Next.js implementation.
"""

import os
from dotenv import load_dotenv
from upstash_vector import Index
import groq

# Load environment variables
load_dotenv()

# Initialize Upstash Vector
index = Index(
    url=os.getenv("UPSTASH_VECTOR_REST_URL"),
    token=os.getenv("UPSTASH_VECTOR_REST_TOKEN")
)

# Initialize Groq client
client = groq.Groq(api_key=os.getenv("GROQ_API_KEY"))


def embed_text(text: str) -> list[float]:
    """
    Generate embeddings for text using Upstash's built-in embedding.
    
    Args:
        text: The text to embed
        
    Returns:
        A list of floats representing the embedding vector
    """
    # Upstash Vector handles embedding automatically with data parameter
    pass


def search_food_items(query: str, top_k: int = 5) -> list[dict]:
    """
    Search for relevant food items in the vector database.
    
    Args:
        query: The search query
        top_k: Number of results to return
        
    Returns:
        List of relevant food items with scores
    """
    results = index.query(
        data=query,  # Upstash embeds this automatically
        top_k=top_k,
        include_metadata=True,
        include_data=True
    )
    
    return [
        {
            "id": r.id,
            "score": r.score,
            "data": r.data,
            "metadata": r.metadata
        }
        for r in results
    ]


def build_context(search_results: list[dict]) -> str:
    """
    Build context string from search results.
    
    Args:
        search_results: List of search results from vector database
        
    Returns:
        Formatted context string for the LLM
    """
    context_parts = []
    
    for i, result in enumerate(search_results, 1):
        data = result.get("data", "")
        metadata = result.get("metadata", {})
        score = result.get("score", 0)
        
        context_parts.append(
            f"[Source {i}] (Relevance: {score:.2%})\n{data}"
        )
    
    return "\n\n".join(context_parts)


def generate_response(query: str, context: str) -> str:
    """
    Generate a response using Groq LLM.
    
    Args:
        query: The user's question
        context: Relevant context from vector search
        
    Returns:
        The generated response
    """
    system_prompt = """You are a helpful food expert assistant. 
Answer questions about food using ONLY the provided context.
If the context doesn't contain relevant information, say so.
Be concise and helpful. Cite sources when possible."""

    user_message = f"""Context:
{context}

Question: {query}

Please provide a helpful answer based on the context above."""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        temperature=0.7,
        max_tokens=1024
    )
    
    return response.choices[0].message.content


def rag_query(query: str) -> dict:
    """
    Main RAG pipeline function.
    
    Args:
        query: The user's question
        
    Returns:
        Dictionary containing answer and sources
    """
    import time
    
    start_time = time.time()
    
    # Step 1: Vector Search
    vector_start = time.time()
    search_results = search_food_items(query, top_k=5)
    vector_time = time.time() - vector_start
    
    # Step 2: Build Context
    context = build_context(search_results)
    
    # Step 3: Generate Response
    llm_start = time.time()
    answer = generate_response(query, context)
    llm_time = time.time() - llm_start
    
    total_time = time.time() - start_time
    
    return {
        "answer": answer,
        "sources": [
            {
                "data": r.get("data", ""),
                "score": r.get("score", 0)
            }
            for r in search_results
        ],
        "metrics": {
            "vector_search_time": vector_time,
            "llm_processing_time": llm_time,
            "total_response_time": total_time
        }
    }


# Example usage
if __name__ == "__main__":
    query = "What fruits are high in vitamin C?"
    result = rag_query(query)
    
    print(f"Question: {query}\n")
    print(f"Answer: {result['answer']}\n")
    print(f"Performance Metrics:")
    print(f"  - Vector Search: {result['metrics']['vector_search_time']:.3f}s")
    print(f"  - LLM Processing: {result['metrics']['llm_processing_time']:.3f}s")
    print(f"  - Total Time: {result['metrics']['total_response_time']:.3f}s")
