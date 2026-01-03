# RAG System Migration Plan
## ChromaDB → Upstash Vector & Ollama → Groq Cloud

**Document Version:** 1.0  
**Date:** December 9, 2025  
**Author:** Aleeya Ahmad

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Target Architecture](#target-architecture)
4. [Architecture Comparison](#architecture-comparison)
5. [Vector Database Migration (ChromaDB → Upstash Vector)](#vector-database-migration-chromadb--upstash-vector)
6. [LLM Migration (Ollama → Groq Cloud)](#llm-migration-ollama--groq-cloud)
7. [Implementation Plan](#implementation-plan)
8. [Code Structure Changes](#code-structure-changes)
9. [Error Handling Strategies](#error-handling-strategies)
10. [Performance Considerations](#performance-considerations)
11. [Cost Analysis](#cost-analysis)
12. [Security Considerations](#security-considerations)
13. [Testing Strategy](#testing-strategy)
14. [Rollback Plan](#rollback-plan)
15. [Migration Checklist](#migration-checklist)

---

## Executive Summary

This document outlines a comprehensive migration plan for transitioning a Python-based RAG (Retrieval-Augmented Generation) system from:

| Component | Current | Target |
|-----------|---------|--------|
| **Vector Database** | ChromaDB (local) | Upstash Vector (cloud) |
| **Embedding Model** | Ollama mxbai-embed-large (local) | Upstash built-in mixedbread-ai/mxbai-embed-large-v1 |
| **LLM** | Ollama llama3.2 (local) | Groq Cloud llama-3.1-8b-instant |

### Key Benefits of Migration

- ✅ **Serverless Architecture** - No local infrastructure to maintain
- ✅ **Simplified Embedding** - Automatic text vectorization (no manual embedding)
- ✅ **Faster Inference** - Groq's LPU technology for ultra-fast LLM responses
- ✅ **Scalability** - Cloud-native services scale automatically
- ✅ **Reduced Complexity** - Fewer moving parts in the system

---

## Current Architecture Analysis

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CURRENT ARCHITECTURE (Local)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌─────────────────┐    ┌───────────────────┐  │
│  │  foods.json  │───▶│  Ollama Server  │───▶│    ChromaDB       │  │
│  │  (90 items)  │    │  (Embeddings)   │    │  (Local Storage)  │  │
│  └──────────────┘    │  mxbai-embed    │    │  chroma_db/       │  │
│                      └─────────────────┘    └───────────────────┘  │
│                              │                        │             │
│                              │                        │             │
│  ┌──────────────┐            │                        │             │
│  │  User Query  │────────────┼────────────────────────┘             │
│  └──────────────┘            │                                      │
│         │                    ▼                                      │
│         │           ┌─────────────────┐                             │
│         └──────────▶│  Ollama Server  │                             │
│                     │  (LLM Response) │                             │
│                     │  llama3.2       │                             │
│                     └─────────────────┘                             │
│                              │                                      │
│                              ▼                                      │
│                     ┌─────────────────┐                             │
│                     │   RAG Answer    │                             │
│                     └─────────────────┘                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Current Implementation Details

| Aspect | Details |
|--------|---------|
| **Data Source** | `foods.json` - 90 food items with text, region, and type |
| **Vector DB** | ChromaDB PersistentClient at `./chroma_db` |
| **Collection** | `foods` collection |
| **Embedding Model** | Ollama `mxbai-embed-large` |
| **Embedding Endpoint** | `http://localhost:11434/api/embeddings` |
| **LLM Model** | Ollama `llama3.2` |
| **LLM Endpoint** | `http://localhost:11434/api/generate` |
| **Similarity Metric** | Cosine similarity (ChromaDB default) |
| **Top K Results** | 3 documents per query |

### Current Code Flow

```python
# 1. Embedding Generation
def get_embedding(text):
    response = requests.post("http://localhost:11434/api/embeddings", json={
        "model": "mxbai-embed-large",
        "prompt": text
    })
    return response.json()["embedding"]

# 2. Document Indexing (Manual)
emb = get_embedding(enriched_text)
collection.add(
    documents=[item["text"]],
    embeddings=[emb],
    ids=[item["id"]]
)

# 3. Query Processing
q_emb = get_embedding(question)
results = collection.query(query_embeddings=[q_emb], n_results=3)

# 4. LLM Generation
response = requests.post("http://localhost:11434/api/generate", json={
    "model": "llama3.2",
    "prompt": prompt,
    "stream": False
})
```

### Current Dependencies

```
- chromadb (vector storage)
- requests (HTTP client for Ollama)
- json (data loading)
- os (file system operations)
```

---


## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TARGET ARCHITECTURE (Cloud)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐         ┌────────────────────────────────────┐   │
│  │  foods.json  │────────▶│        Upstash Vector               │   │
│  │  (90 items)  │  Text   │  ┌──────────────────────────────┐  │   │
│  └──────────────┘  Only   │  │  Built-in Embedding Model    │  │   │
│                           │  │  mixedbread-ai/mxbai-embed   │  │   │
│                           │  │  1024 dim, 512 seq length    │  │   │
│                           │  └──────────────────────────────┘  │   │
│                           │              │                      │   │
│                           │              ▼                      │   │
│                           │  ┌──────────────────────────────┐  │   │
│                           │  │    Vector Storage (Cloud)    │  │   │
│                           │  │    Cosine Similarity         │  │   │
│                           │  └──────────────────────────────┘  │   │
│                           └────────────────────────────────────┘   │
│                                          │                          │
│  ┌──────────────┐                        │                          │
│  │  User Query  │────────────────────────┘                          │
│  └──────────────┘                                                   │
│         │                                                           │
│         │              ┌────────────────────────────────────┐      │
│         └─────────────▶│          Groq Cloud API            │      │
│                        │  ┌──────────────────────────────┐  │      │
│                        │  │   llama-3.1-8b-instant       │  │      │
│                        │  │   LPU Inference Engine       │  │      │
│                        │  └──────────────────────────────┘  │      │
│                        └────────────────────────────────────┘      │
│                                          │                          │
│                                          ▼                          │
│                               ┌─────────────────┐                   │
│                               │   RAG Answer    │                   │
│                               └─────────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Target Configuration

| Component | Configuration |
|-----------|---------------|
| **Upstash Vector URL** | `https://communal-garfish-93384-gcp-usc1-vector.upstash.io` |
| **Embedding Model** | `mixedbread-ai/mxbai-embed-large-v1` (built-in) |
| **Embedding Dimensions** | 1024 |
| **Max Sequence Length** | 512 tokens |
| **MTEB Score** | 64.68 |
| **Similarity Metric** | Cosine similarity |
| **Groq Model** | `llama-3.1-8b-instant` |
| **Groq Max Tokens** | 1024 |

---


## Architecture Comparison

### Side-by-Side Comparison

| Feature | Current (Local) | Target (Cloud) |
|---------|-----------------|----------------|
| **Vector Storage** | ChromaDB (local SQLite) | Upstash Vector (serverless) |
| **Embedding Generation** | Manual via Ollama API | Automatic (Upstash built-in) |
| **Embedding Model** | mxbai-embed-large | mixedbread-ai/mxbai-embed-large-v1 |
| **Embedding Dimensions** | Variable | 1024 (fixed) |
| **LLM Provider** | Ollama (local) | Groq Cloud |
| **LLM Model** | llama3.2 | llama-3.1-8b-instant |
| **Infrastructure** | Local machine | Cloud-hosted |
| **Scaling** | Limited by hardware | Auto-scaling |
| **Availability** | Depends on local uptime | 99.9% SLA |
| **Latency** | Network + local compute | Network only |
| **Cost** | Electricity + hardware | Usage-based pricing |

### Data Flow Comparison

#### Current Data Flow (7 steps)
```
1. Load food item from JSON
2. Enrich text with metadata
3. Send to Ollama for embedding
4. Receive embedding vector
5. Store embedding + document in ChromaDB
6. Query: Send question to Ollama for embedding
7. Search ChromaDB with query embedding
```

#### Target Data Flow (4 steps)
```
1. Load food item from JSON
2. Enrich text with metadata
3. Send raw text to Upstash (auto-embeds)
4. Query: Send question text to Upstash (auto-embeds + searches)
```

---
## Vector Database Migration (ChromaDB → Upstash Vector)

### Architecture Changes: ChromaDB → Upstash Vector

| Aspect | ChromaDB | Upstash Vector |
|--------|----------|----------------|
| **Storage Type** | Local SQLite | Cloud-hosted |
| **Authentication** | None (local) | REST Token |
| **Infrastructure** | Self-managed | Serverless |
| **Scaling** | Manual | Automatic |
| **Availability** | Local uptime | 99.9% SLA |

### Upstash Vector Client Setup

```python
from upstash_vector import Index
from dotenv import load_dotenv
import os

load_dotenv()

index = Index(
    url=os.getenv("UPSTASH_VECTOR_REST_URL"),
    token=os.getenv("UPSTASH_VECTOR_REST_TOKEN")
)
```

---

### Embedding Strategy: Ollama → Upstash Built-in Embeddings

| Aspect | Before (Ollama) | After (Upstash) |
|--------|-----------------|-----------------|
| **Model** | mxbai-embed-large | mixedbread-ai/mxbai-embed-large-v1 |
| **Location** | Local API call | Built-in (automatic) |
| **Input** | Text → Manual API → Vector | Text → Auto-vectorized |
| **Code Required** | `get_embedding()` function | None (deleted) |
| **Data Format** | Pre-computed embeddings | Raw text |

#### BEFORE: Manual Embedding with Ollama

```python
# REMOVE - This entire function is no longer needed
def get_embedding(text):
    response = requests.post("http://localhost:11434/api/embeddings", json={
        "model": "mxbai-embed-large",
        "prompt": text
    })
    return response.json()["embedding"]

# Manual embedding before storage
emb = get_embedding(enriched_text)
collection.add(documents=[text], embeddings=[emb], ids=[id])
```

#### AFTER: Automatic Embedding with Upstash

```python
# Upstash handles embedding automatically - just send text!
index.upsert(vectors=[{
    "id": item["id"],
    "data": enriched_text,  # Raw text - auto-embedded
    "metadata": {"text": item["text"], "region": region}
}])

# Query with raw text - auto-embedded
results = index.query(data=question, top_k=3)
```

#### Key Benefits

- ✅ **Delete `get_embedding()` function** - No longer needed
- ✅ **Remove Ollama dependency** - No localhost:11434 calls
- ✅ **Simplified upsert** - Send `data` (text) not `embeddings` (vectors)
- ✅ **Simplified query** - Send `data` (text) not `query_embeddings`
- ✅ **Same model quality** - Both use mxbai-embed-large architecture

---


### Migration Steps for Vector Database

#### Step 1: Install Upstash Vector SDK

```bash
pip install upstash-vector
```

#### Step 2: Remove ChromaDB Dependencies

```python
# REMOVE these lines:
import chromadb
chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
```

#### Step 3: Update Upsert Logic

```python
# BEFORE (ChromaDB with manual embeddings):
emb = get_embedding(enriched_text)
collection.add(
    documents=[item["text"]],
    embeddings=[emb],
    ids=[item["id"]]
)

# AFTER (Upstash with auto-embeddings):
index.upsert(
    vectors=[{
        "id": item["id"],
        "data": enriched_text,  # Raw text - Upstash handles embedding
        "metadata": {
            "text": item["text"],
            "region": item.get("region", "Unknown"),
            "type": item.get("type", "Unknown")
        }
    }]
)
```

#### Step 4: Update Query Logic

```python
# BEFORE (ChromaDB):
q_emb = get_embedding(question)
results = collection.query(query_embeddings=[q_emb], n_results=3)
top_docs = results['documents'][0]
top_ids = results['ids'][0]

# AFTER (Upstash):
results = index.query(
    data=question,  # Raw text - Upstash handles embedding
    top_k=3,
    include_metadata=True,
    include_data=True
)
top_docs = [r.metadata["text"] for r in results]
top_ids = [r.id for r in results]
```

### Data Migration Strategy

Since we're moving from local to cloud storage, we need to re-index all documents:

```python
def migrate_data_to_upstash(food_data, index):
    """Migrate all food data to Upstash Vector"""
    vectors = []
    
    for item in food_data:
        # Build enriched text (same as before)
        enriched_text = item["text"]
        if "region" in item:
            enriched_text += f" This food is popular in {item['region']}."
        if "type" in item:
            enriched_text += f" It is a type of {item['type']}."
        
        vectors.append({
            "id": item["id"],
            "data": enriched_text,
            "metadata": {
                "text": item["text"],
                "region": item.get("region", "Unknown"),
                "type": item.get("type", "Unknown")
            }
        })
    
    # Batch upsert for efficiency (Upstash supports up to 1000 per batch)
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch)
        print(f"✅ Uploaded batch {i//batch_size + 1}")
    
    print(f"🎉 Migration complete! {len(vectors)} documents indexed.")
```

---


## LLM Migration (Ollama → Groq Cloud)

### Key Differences

| Aspect | Ollama (Local) | Groq Cloud |
|--------|----------------|------------|
| **Model** | llama3.2 | llama-3.1-8b-instant |
| **Endpoint** | localhost:11434 | api.groq.com |
| **Authentication** | None | Bearer Token |
| **Response Format** | Custom JSON | OpenAI-compatible |
| **Streaming** | Optional | Supported |
| **Rate Limits** | Hardware-bound | API limits |
| **Latency** | ~2-10s (hardware dependent) | ~100-500ms (LPU) |

### Groq API Reference

#### Basic Completion

```python
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

completion = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[
        {"role": "system", "content": "You are a helpful food expert."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.7,
    max_tokens=1024
)

answer = completion.choices[0].message.content
```

#### Streaming Response

```python
completion = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=[{"role": "user", "content": prompt}],
    stream=True
)

for chunk in completion:
    print(chunk.choices[0].delta.content or "", end="")
```

### Migration Steps for LLM

#### Step 1: Install Groq SDK

```bash
pip install groq
```

#### Step 2: Remove Ollama LLM Code

```python
# REMOVE:
response = requests.post("http://localhost:11434/api/generate", json={
    "model": LLM_MODEL,
    "prompt": prompt,
    "stream": False
})
answer = response.json()["response"].strip()
```

#### Step 3: Initialize Groq Client

```python
# ADD:
from groq import Groq

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
```

#### Step 4: Update Generation Function

```python
def generate_answer(prompt, context):
    """Generate answer using Groq Cloud API"""
    
    system_prompt = """You are a knowledgeable food expert assistant. 
    Use the provided context to answer questions about food accurately. 
    If the context doesn't contain relevant information, say so."""
    
    full_prompt = f"""Use the following context to answer the question.

Context:
{context}

Question: {prompt}
Answer:"""
    
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
        return f"Error generating response: {str(e)}"
```

### Groq Rate Limits

| Tier | Requests/Minute | Tokens/Minute | Tokens/Day |
|------|-----------------|---------------|------------|
| Free | 30 | 6,000 | 500,000 |
| Pro | 100 | 100,000 | Unlimited |

### Rate Limit Handling

```python
import time
from groq import RateLimitError

def generate_with_retry(prompt, max_retries=3):
    """Generate with exponential backoff for rate limits"""
    for attempt in range(max_retries):
        try:
            return generate_answer(prompt)
        except RateLimitError as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # 1, 2, 4 seconds
                print(f"⏳ Rate limited. Waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise e
```

---

## Implementation Plan

### Phase 1: Environment Setup (Day 1)

- [ ] Install new dependencies (`upstash-vector`, `groq`, `python-dotenv`)
- [ ] Verify `.env` file has all required credentials
- [ ] Test Upstash Vector connection
- [ ] Test Groq API connection

### Phase 2: Vector Database Migration (Day 2-3)

- [ ] Create backup of current ChromaDB data
- [ ] Implement Upstash Vector client initialization
- [ ] Create data migration script
- [ ] Run migration and verify document count
- [ ] Test query functionality
- [ ] Remove ChromaDB dependencies

### Phase 3: LLM Migration (Day 4-5)

- [ ] Implement Groq client initialization
- [ ] Update generate function with Groq API
- [ ] Implement error handling and rate limiting
- [ ] Test response quality
- [ ] Remove Ollama dependencies

### Phase 4: Integration & Testing (Day 6-7)

- [ ] Integration testing of full RAG pipeline
- [ ] Performance benchmarking
- [ ] Error scenario testing
- [ ] Documentation updates
- [ ] Code cleanup

### Phase 5: Deployment (Day 8)

- [ ] Final review
- [ ] Delete local ChromaDB files
- [ ] Update README
- [ ] Tag release

---

## Code Structure Changes

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `rag_run.py` | Modify | Main migration changes |
| `.env` | Keep | Already has required credentials |
| `requirements.txt` | Create | Document new dependencies |
| `chroma_db/` | Delete | No longer needed |

### New Dependencies (requirements.txt)

```txt
upstash-vector>=0.3.0
groq>=0.4.0
python-dotenv>=1.0.0
```

### Complete Migrated Code Structure

```python
# rag_run.py - Migrated Version

import os
import json
from dotenv import load_dotenv
from upstash_vector import Index
from groq import Groq

# Load environment variables
load_dotenv()

# Constants
JSON_FILE = "foods.json"
TOP_K = 3

# Initialize clients
index = Index(
    url=os.getenv("UPSTASH_VECTOR_REST_URL"),
    token=os.getenv("UPSTASH_VECTOR_REST_TOKEN")
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Load data
with open(JSON_FILE, "r", encoding="utf-8") as f:
    food_data = json.load(f)

def index_documents(food_data):
    """Index documents in Upstash Vector"""
    vectors = []
    for item in food_data:
        enriched_text = item["text"]
        if "region" in item:
            enriched_text += f" This food is popular in {item['region']}."
        if "type" in item:
            enriched_text += f" It is a type of {item['type']}."
        
        vectors.append({
            "id": item["id"],
            "data": enriched_text,
            "metadata": {
                "text": item["text"],
                "region": item.get("region", "Unknown"),
                "type": item.get("type", "Unknown")
            }
        })
    
    # Batch upsert
    index.upsert(vectors=vectors)
    print(f"✅ Indexed {len(vectors)} documents")

def rag_query(question):
    """RAG query with Upstash Vector and Groq"""
    
    # Step 1: Query Upstash (auto-embeds question)
    results = index.query(
        data=question,
        top_k=TOP_K,
        include_metadata=True,
        include_data=True
    )
    
    # Step 2: Extract documents
    top_docs = [r.metadata["text"] for r in results]
    top_ids = [r.id for r in results]
    
    # Step 3: Display retrieved context
    print("\n🧠 Retrieving relevant information...\n")
    for i, (doc, doc_id) in enumerate(zip(top_docs, top_ids)):
        print(f"🔹 Source {i + 1} (ID: {doc_id}):")
        print(f"    \"{doc}\"\n")
    
    # Step 4: Build context
    context = "\n".join(top_docs)
    
    # Step 5: Generate answer with Groq
    completion = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful food expert. Answer questions based on the provided context."
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
            }
        ],
        temperature=0.7,
        max_tokens=1024
    )
    
    return completion.choices[0].message.content.strip()

# Main execution
if __name__ == "__main__":
    # Index documents (run once)
    print("📦 Indexing documents...")
    index_documents(food_data)
    
    # Interactive loop
    print("\n🧠 RAG is ready. Ask a question (type 'exit' to quit):\n")
    while True:
        question = input("You: ")
        if question.lower() in ["exit", "quit"]:
            print("👋 Goodbye!")
            break
        answer = rag_query(question)
        print("🤖:", answer)
```

---

## Error Handling Strategies

### Upstash Vector Errors

```python
from upstash_vector import Index
from upstash_vector.errors import UpstashError

def safe_query(question):
    try:
        results = index.query(data=question, top_k=3)
        return results
    except UpstashError as e:
        print(f"❌ Upstash Error: {e}")
        return []
    except ConnectionError:
        print("❌ Network error connecting to Upstash")
        return []
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return []
```

### Groq API Errors

```python
from groq import Groq, APIError, RateLimitError, AuthenticationError
import time

def safe_generate(prompt, context, max_retries=3):
    for attempt in range(max_retries):
        try:
            completion = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1024
            )
            return completion.choices[0].message.content
        
        except AuthenticationError:
            print("❌ Invalid Groq API key")
            return "Authentication error. Please check your API key."
        
        except RateLimitError as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"⏳ Rate limited. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                return "Rate limit exceeded. Please try again later."
        
        except APIError as e:
            print(f"❌ Groq API Error: {e}")
            return f"API error: {str(e)}"
        
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return "An unexpected error occurred."
```

### Comprehensive Error Wrapper

```python
def rag_query_safe(question):
    """RAG query with comprehensive error handling"""
    
    # Validate input
    if not question or len(question.strip()) < 3:
        return "Please enter a valid question."
    
    # Query vector database
    try:
        results = index.query(data=question, top_k=3, include_metadata=True)
        if not results:
            return "No relevant documents found for your question."
    except Exception as e:
        return f"Error searching knowledge base: {str(e)}"
    
    # Generate response
    context = "\n".join([r.metadata.get("text", "") for r in results])
    return safe_generate(question, context)
```

---



## Performance Considerations

### Latency Comparison

| Operation | Current (Local) | Target (Cloud) | Notes |
|-----------|-----------------|----------------|-------|
| Embedding (single) | ~100-500ms | ~50-200ms | Network vs. local compute |
| Vector Query | ~10-50ms | ~50-150ms | Network overhead |
| LLM Generation | ~2-10s | ~100-500ms | Groq LPU advantage |
| **Total RAG Query** | **~3-12s** | **~200-850ms** | **Significant improvement** |

### Optimization Strategies

#### 1. Batch Upserts
```python
# Instead of individual upserts
for item in items:
    index.upsert(vectors=[item])  # Slow - N API calls

# Use batch upserts
index.upsert(vectors=items)  # Fast - 1 API call
```

#### 2. Connection Pooling
```python
# Initialize client once at module level
index = Index(url=URL, token=TOKEN)  # Reuses connections
```

#### 3. Async Operations (Advanced)
```python
import asyncio
from upstash_vector import AsyncIndex

async_index = AsyncIndex(url=URL, token=TOKEN)

async def async_query(question):
    results = await async_index.query(data=question, top_k=3)
    return results
```

#### 4. Caching Frequent Queries
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def cached_query(question):
    return rag_query(question)
```

### Scaling Considerations

| Aspect | Recommendation |
|--------|----------------|
| **High Traffic** | Upstash auto-scales; monitor Groq rate limits |
| **Large Dataset** | Batch upserts; consider namespaces |
| **Global Users** | Use region-specific Upstash endpoints |
| **Cost Control** | Implement query caching; optimize context length |

---

## Cost Analysis

### Current Costs (Local)

| Component | Monthly Cost |
|-----------|--------------|
| Electricity | ~$5-20 |
| Hardware depreciation | ~$20-50 |
| Maintenance time | ~2-4 hours |
| **Total** | **~$50-100 + time** |

### Target Costs (Cloud)

#### Upstash Vector Pricing

| Tier | Price | Queries | Storage |
|------|-------|---------|---------|
| Free | $0 | 10K queries/day | 10K vectors |
| Pay-as-you-go | $0.40/100K queries | Unlimited | $0.40/100K vectors |

#### Groq Pricing

| Model | Price per 1M tokens |
|-------|---------------------|
| llama-3.1-8b-instant | ~$0.05 input / $0.08 output |

### Cost Projections

| Usage Scenario | Monthly Queries | Est. Monthly Cost |
|----------------|-----------------|-------------------|
| Development | 1,000 | $0 (free tier) |
| Light Production | 10,000 | ~$5-10 |
| Medium Production | 100,000 | ~$50-80 |
| Heavy Production | 1,000,000 | ~$400-600 |

### Cost Optimization Tips

1. **Stay in Free Tier**: 10K queries/day covers most development
2. **Optimize Context**: Shorter prompts = fewer tokens
3. **Cache Results**: Reduce redundant API calls
4. **Monitor Usage**: Set up alerts for unexpected spikes

---

## Security Considerations

### API Key Management

```python
# ✅ GOOD: Use environment variables
from dotenv import load_dotenv
load_dotenv()

upstash_token = os.getenv("UPSTASH_VECTOR_REST_TOKEN")
groq_key = os.getenv("GROQ_API_KEY")

# ❌ BAD: Hardcoded keys
upstash_token = "AB8FMGNvbW11bmFsLWdhcm..."  # Never do this!
```

### .env File Security

```bash
# .gitignore - MUST include:
.env
.env.local
.env.*.local
```

### API Key Rotation

1. Generate new keys in Upstash/Groq consoles
2. Update `.env` file
3. Restart application
4. Revoke old keys

### Network Security

| Aspect | Implementation |
|--------|----------------|
| **Transport** | HTTPS (enforced by Upstash/Groq) |
| **Authentication** | Bearer tokens |
| **IP Whitelisting** | Available in Upstash paid tiers |
| **Audit Logs** | Available in both platforms |

### Data Privacy

- **Upstash**: Data encrypted at rest and in transit
- **Groq**: Prompts not used for training (API ToS)
- **PII**: Avoid storing personal data in vectors

---

## Testing Strategy

### Unit Tests

```python
import pytest
from unittest.mock import Mock, patch

def test_index_documents():
    """Test document indexing"""
    mock_index = Mock()
    with patch('rag_run.index', mock_index):
        index_documents([{"id": "1", "text": "Test"}])
        mock_index.upsert.assert_called_once()

def test_rag_query():
    """Test RAG query pipeline"""
    mock_result = Mock()
    mock_result.metadata = {"text": "Test document"}
    mock_result.id = "1"
    
    with patch('rag_run.index.query', return_value=[mock_result]):
        with patch('rag_run.groq_client.chat.completions.create') as mock_groq:
            mock_groq.return_value.choices = [Mock(message=Mock(content="Test answer"))]
            result = rag_query("test question")
            assert result == "Test answer"
```

### Integration Tests

```python
def test_upstash_connection():
    """Test Upstash Vector connectivity"""
    try:
        info = index.info()
        assert info is not None
        print(f"✅ Connected to Upstash: {info.vector_count} vectors")
    except Exception as e:
        pytest.fail(f"Failed to connect to Upstash: {e}")

def test_groq_connection():
    """Test Groq API connectivity"""
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "Say 'test'"}],
            max_tokens=10
        )
        assert response.choices[0].message.content
        print("✅ Groq API connected")
    except Exception as e:
        pytest.fail(f"Failed to connect to Groq: {e}")
```

### End-to-End Tests

```python
def test_full_rag_pipeline():
    """Test complete RAG flow"""
    # 1. Ensure documents are indexed
    index_documents(food_data)
    
    # 2. Test query
    answer = rag_query("What is a banana?")
    
    # 3. Validate response
    assert len(answer) > 10
    assert "fruit" in answer.lower() or "yellow" in answer.lower()
    print(f"✅ RAG response: {answer[:100]}...")
```

### Performance Tests

```python
import time

def test_query_performance():
    """Test query latency"""
    start = time.time()
    answer = rag_query("What foods are from India?")
    elapsed = time.time() - start
    
    print(f"⏱️ Query completed in {elapsed:.2f}s")
    assert elapsed < 5.0, f"Query too slow: {elapsed}s"
```

---

## Rollback Plan

### If Migration Fails

1. **Keep Original Code**: Maintain `rag_run_backup.py`
2. **Keep ChromaDB**: Don't delete `chroma_db/` until verified
3. **Environment Toggle**: Use feature flag

```python
# Feature flag for rollback
USE_CLOUD = os.getenv("USE_CLOUD_SERVICES", "true").lower() == "true"

if USE_CLOUD:
    from upstash_vector import Index
    from groq import Groq
    # Cloud implementation
else:
    import chromadb
    # Local implementation
```

### Rollback Steps

1. Set `USE_CLOUD_SERVICES=false` in `.env`
2. Ensure Ollama service is running
3. Restart application
4. Verify local functionality
5. Investigate cloud issues

---

## Migration Checklist

### Pre-Migration

- [ ] Backup current `rag_run.py`
- [ ] Backup `chroma_db/` directory
- [ ] Verify `.env` has all required credentials
- [ ] Test Upstash Vector URL connectivity
- [ ] Test Groq API key validity
- [ ] Document current system performance metrics

### Migration

- [ ] Install `upstash-vector` package
- [ ] Install `groq` package
- [ ] Install `python-dotenv` package
- [ ] Update imports in `rag_run.py`
- [ ] Replace ChromaDB initialization with Upstash
- [ ] Remove `get_embedding()` function
- [ ] Update document indexing code
- [ ] Update query function
- [ ] Replace Ollama LLM with Groq
- [ ] Implement error handling
- [ ] Add rate limiting for Groq

### Post-Migration

- [ ] Run all unit tests
- [ ] Run integration tests
- [ ] Run end-to-end tests
- [ ] Benchmark performance
- [ ] Verify all 90 food items are searchable
- [ ] Test edge cases (empty queries, special characters)
- [ ] Update `README.md` with new setup instructions
- [ ] Create `requirements.txt`
- [ ] Delete `chroma_db/` directory
- [ ] Remove unused dependencies from environment

### Documentation

- [ ] Update README with new architecture
- [ ] Document environment variables
- [ ] Add troubleshooting section
- [ ] Update deployment instructions

---

## Appendix A: Complete Migrated Code

See separate file: `rag_run_migrated.py`

## Appendix B: Environment Variables Reference

```env
# Upstash Vector Configuration
UPSTASH_VECTOR_REST_URL=https://your-endpoint.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your-admin-token
UPSTASH_VECTOR_REST_READONLY_TOKEN=your-readonly-token  # Optional

# Groq Configuration
GROQ_API_KEY=gsk_your_api_key

# Optional Feature Flags
USE_CLOUD_SERVICES=true
DEBUG_MODE=false
```

## Appendix C: Useful Links

- [Upstash Vector Documentation](https://upstash.com/docs/vector/features/embeddingmodels)
- [Groq API Documentation](https://console.groq.com/docs)
- [Groq Console (API Keys)](https://console.groq.com/keys)
- [Upstash Console](https://console.upstash.com)

---

**Document End**

*This migration plan was generated with AI assistance using GitHub Copilot/Claude on December 9, 2025.*
