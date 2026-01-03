"""
Local RAG Performance Test Script
Tests ChromaDB + Ollama system to establish baseline metrics for cloud comparison.

Author: Aleeya Ahmad
Date: December 2025
Purpose: Week 3 AI Builder - Performance baseline for migration comparison
"""

import os
import json
import time
import chromadb
import requests
from datetime import datetime

# ============================================================================
# CONFIGURATION
# ============================================================================

CHROMA_DIR = "chroma_db"
COLLECTION_NAME = "foods"
EMBED_MODEL = "mxbai-embed-large"
LLM_MODEL = "llama3.2"
OUTPUT_FILE = "local_baseline.json"

# ============================================================================
# TEST QUERIES (15 queries across 5 categories)
# ============================================================================

TEST_QUERIES = {
    "semantic_similarity": [
        "healthy Mediterranean options",
        "light and refreshing summer dishes",
        "warm comforting winter meals"
    ],
    "multi_criteria": [
        "spicy vegetarian Asian dishes",
        "quick easy breakfast options",
        "creamy pasta dishes from Italy"
    ],
    "nutritional": [
        "high-protein low-carb foods",
        "foods rich in vitamins and antioxidants",
        "heart-healthy meal options"
    ],
    "cultural_exploration": [
        "traditional comfort foods",
        "authentic street food dishes",
        "festive celebration meals"
    ],
    "cooking_method": [
        "dishes that can be grilled",
        "slow-cooked tender meals",
        "fresh raw preparations"
    ]
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_embedding_timed(text):
    """Get embedding from Ollama and return (embedding, time_ms)"""
    start = time.perf_counter()
    response = requests.post("http://localhost:11434/api/embeddings", json={
        "model": EMBED_MODEL,
        "prompt": text
    })
    elapsed_ms = (time.perf_counter() - start) * 1000
    return response.json()["embedding"], elapsed_ms


def query_chromadb_timed(collection, query_embedding, n_results=3):
    """Query ChromaDB and return (results, time_ms)"""
    start = time.perf_counter()
    results = collection.query(query_embeddings=[query_embedding], n_results=n_results)
    elapsed_ms = (time.perf_counter() - start) * 1000
    return results, elapsed_ms


def generate_response_timed(prompt):
    """Generate LLM response from Ollama and return (response, time_ms)"""
    start = time.perf_counter()
    response = requests.post("http://localhost:11434/api/generate", json={
        "model": LLM_MODEL,
        "prompt": prompt,
        "stream": False
    })
    elapsed_ms = (time.perf_counter() - start) * 1000
    return response.json()["response"].strip(), elapsed_ms


def run_rag_query_timed(collection, question):
    """
    Run full RAG query with timing for each phase.
    Returns dict with timings and results.
    """
    total_start = time.perf_counter()
    
    # Phase 1: Embedding
    query_embedding, embedding_ms = get_embedding_timed(question)
    
    # Phase 2: Retrieval
    results, retrieval_ms = query_chromadb_timed(collection, query_embedding)
    
    # Phase 3: Build context
    top_docs = results['documents'][0]
    top_ids = results['ids'][0]
    context = "\n".join(top_docs)
    
    prompt = f"""Use the following context to answer the question.

Context:
{context}

Question: {question}
Answer:"""
    
    # Phase 4: Generation
    response, generation_ms = generate_response_timed(prompt)
    
    total_ms = (time.perf_counter() - total_start) * 1000
    
    return {
        "embedding_ms": round(embedding_ms, 2),
        "retrieval_ms": round(retrieval_ms, 2),
        "generation_ms": round(generation_ms, 2),
        "total_ms": round(total_ms, 2),
        "retrieved_ids": top_ids,
        "response_preview": response[:200] + "..." if len(response) > 200 else response
    }


# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def run_performance_tests():
    """Run all 15 test queries and collect timing data."""
    
    print("=" * 70)
    print("🚀 LOCAL RAG PERFORMANCE TEST")
    print("=" * 70)
    print(f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🗄️  Database: ChromaDB ({CHROMA_DIR})")
    print(f"🔢 Embedding Model: {EMBED_MODEL}")
    print(f"🤖 LLM Model: {LLM_MODEL}")
    print("=" * 70)
    
    # Connect to ChromaDB
    print("\n📂 Connecting to ChromaDB...")
    chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
    collection = chroma_client.get_collection(name=COLLECTION_NAME)
    doc_count = collection.count()
    print(f"✅ Connected! Collection '{COLLECTION_NAME}' has {doc_count} documents.\n")
    
    # Warmup run (first query is often slower due to model loading)
    print("🔥 Warming up models with test query...")
    _ = run_rag_query_timed(collection, "test warmup query")
    print("✅ Warmup complete!\n")
    
    # Run all test queries
    results = []
    query_count = 0
    total_queries = sum(len(queries) for queries in TEST_QUERIES.values())
    
    for category, queries in TEST_QUERIES.items():
        print(f"\n📁 Category: {category.upper().replace('_', ' ')}")
        print("-" * 50)
        
        for query in queries:
            query_count += 1
            print(f"\n[{query_count}/{total_queries}] Testing: \"{query}\"")
            
            try:
                timing_data = run_rag_query_timed(collection, query)
                
                result = {
                    "query": query,
                    "category": category,
                    "embedding_ms": timing_data["embedding_ms"],
                    "retrieval_ms": timing_data["retrieval_ms"],
                    "generation_ms": timing_data["generation_ms"],
                    "total_ms": timing_data["total_ms"],
                    "retrieved_ids": timing_data["retrieved_ids"],
                    "status": "success"
                }
                results.append(result)
                
                print(f"   ⏱️  Embedding:  {timing_data['embedding_ms']:>8.2f} ms")
                print(f"   ⏱️  Retrieval:  {timing_data['retrieval_ms']:>8.2f} ms")
                print(f"   ⏱️  Generation: {timing_data['generation_ms']:>8.2f} ms")
                print(f"   ⏱️  TOTAL:      {timing_data['total_ms']:>8.2f} ms")
                print(f"   📋 Retrieved IDs: {timing_data['retrieved_ids']}")
                
            except Exception as e:
                print(f"   ❌ Error: {str(e)}")
                results.append({
                    "query": query,
                    "category": category,
                    "status": "error",
                    "error": str(e)
                })
    
    return results


def calculate_summary(results):
    """Calculate summary statistics from test results."""
    successful = [r for r in results if r.get("status") == "success"]
    
    if not successful:
        return {"error": "No successful queries"}
    
    embedding_times = [r["embedding_ms"] for r in successful]
    retrieval_times = [r["retrieval_ms"] for r in successful]
    generation_times = [r["generation_ms"] for r in successful]
    total_times = [r["total_ms"] for r in successful]
    
    return {
        "total_queries": len(results),
        "successful_queries": len(successful),
        "failed_queries": len(results) - len(successful),
        "avg_embedding_ms": round(sum(embedding_times) / len(embedding_times), 2),
        "avg_retrieval_ms": round(sum(retrieval_times) / len(retrieval_times), 2),
        "avg_generation_ms": round(sum(generation_times) / len(generation_times), 2),
        "avg_total_ms": round(sum(total_times) / len(total_times), 2),
        "min_total_ms": round(min(total_times), 2),
        "max_total_ms": round(max(total_times), 2),
        "median_total_ms": round(sorted(total_times)[len(total_times) // 2], 2)
    }


def save_results(results, summary):
    """Save results to JSON file."""
    output = {
        "test_date": datetime.now().isoformat(),
        "system": "Local RAG (ChromaDB + Ollama)",
        "model_embedding": EMBED_MODEL,
        "model_llm": LLM_MODEL,
        "database": {
            "type": "ChromaDB",
            "path": CHROMA_DIR,
            "collection": COLLECTION_NAME
        },
        "results": results,
        "summary": summary
    }
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    return output


def print_summary(summary):
    """Print formatted summary to console."""
    print("\n" + "=" * 70)
    print("📊 PERFORMANCE SUMMARY")
    print("=" * 70)
    print(f"   Total Queries:      {summary['total_queries']}")
    print(f"   Successful:         {summary['successful_queries']}")
    print(f"   Failed:             {summary['failed_queries']}")
    print("-" * 70)
    print(f"   Avg Embedding:      {summary['avg_embedding_ms']:>8.2f} ms")
    print(f"   Avg Retrieval:      {summary['avg_retrieval_ms']:>8.2f} ms")
    print(f"   Avg Generation:     {summary['avg_generation_ms']:>8.2f} ms")
    print("-" * 70)
    print(f"   Avg Total:          {summary['avg_total_ms']:>8.2f} ms")
    print(f"   Min Total:          {summary['min_total_ms']:>8.2f} ms")
    print(f"   Max Total:          {summary['max_total_ms']:>8.2f} ms")
    print(f"   Median Total:       {summary['median_total_ms']:>8.2f} ms")
    print("=" * 70)


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    try:
        # Run tests
        results = run_performance_tests()
        
        # Calculate summary
        summary = calculate_summary(results)
        
        # Save to JSON
        output = save_results(results, summary)
        
        # Print summary
        print_summary(summary)
        
        print(f"\n💾 Results saved to: {OUTPUT_FILE}")
        print("\n✅ Performance test complete!")
        print("📝 Use this baseline data to compare against your cloud-migrated version.")
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrupted by user.")
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        raise
