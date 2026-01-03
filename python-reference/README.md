# Cloud RAG Food Database - Migration Showcase

**By Aleeya Ahmad, Melbourne, Australia**  
**AI Week 3 Deliverables - Cloud Migration Project**

---

## 🚀 Cloud Migration Overview

This project demonstrates the **complete migration** of a local RAG (Retrieval-Augmented Generation) system to production-ready cloud infrastructure, achieving **29.4x faster response times**.

### Architecture Transformation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BEFORE: Local System (v1.0)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   foods.json ──► Ollama mxbai-embed-large ──► ChromaDB ──► Ollama llama3.2 │
│      (90)            (LOCAL ~2.2s)           (LOCAL)        (LOCAL ~21s)   │
│                                                                             │
│                    Average Response Time: 23,691ms (~24 seconds)            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AFTER: Cloud System (v2.0)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   foods.json ──► Upstash Vector (auto-embed) ──► Groq Cloud llama-3.1-8b   │
│     (110)         (CLOUD ~259ms)                  (CLOUD ~547ms)           │
│                                                                             │
│                    Average Response Time: 806ms (<1 second)                 │
│                                                                             │
│                         🚀 29.4x FASTER! 🚀                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Migration Changes

| Component | Before (Local) | After (Cloud) |
|-----------|---------------|---------------|
| **Vector Database** | ChromaDB (local SQLite) | Upstash Vector (serverless) |
| **Embeddings** | Ollama mxbai-embed-large (manual) | Upstash built-in (automatic) |
| **LLM** | Ollama llama3.2 (local) | Groq llama-3.1-8b-instant (cloud) |
| **Embedding Model** | mxbai-embed-large | mixedbread-ai/mxbai-embed-large-v1 |
| **Response Time** | ~23.7 seconds | ~0.8 seconds |

---

## 📁 Repository Structure

```
week3deliverable-1/
│
├── cloud-version/              # ☁️ Week 3: Upstash + Groq System (FULLY FUNCTIONAL)
│   ├── rag_run.py              # Cloud-migrated RAG implementation
│   ├── test_queries.py         # Advanced testing suite (15 queries)
│   ├── foods.json              # Enhanced food database (110 items)
│   ├── requirements.txt        # Cloud dependencies
│   ├── .env                    # API credentials (gitignored)
│   ├── .env.example            # Environment template
│   ├── TEST_RESULTS.md         # Performance comparison report
│   └── test_report.json        # Raw test data
│
├── local-version/              # 📦 Week 2: ChromaDB + Ollama System
│   ├── rag_run.py              # Original local RAG implementation
│   ├── foods.json              # Original 90-item database
│   ├── local_performance_test.py  # Local baseline testing
│   ├── local_baseline.json     # Performance measurements
│   └── README.md               # Local version documentation
│
├── data/                       # 🗃️ Shared Enhanced Food Database
│   └── foods.json              # 110 diverse food items
│
├── docs/                       # 📚 Documentation
│   ├── MIGRATION_PLAN.md       # AI-assisted migration planning
│   ├── TEST_RESULTS.md         # Performance comparison report
│   └── test_report.json        # Raw test data
│
├── README.md                   # This file
└── .gitignore                  # Git ignore rules
```

---

## ⚡ Performance Comparison: Local vs Cloud

### Response Time Analysis

| Metric | Cloud (Upstash + Groq) | Local (ChromaDB + Ollama) | Improvement |
|--------|------------------------|---------------------------|-------------|
| **Embedding + Retrieval** | 258.92ms | 2,196.10ms | **+88.2%** |
| **LLM Generation** | 547.21ms | 21,493.33ms | **+97.5%** |
| **Total Response** | **806.12ms** | **23,690.74ms** | **+96.6%** |

### Speed Multiplier
> **☁️ Cloud is 29.4x faster than local system!**

### Performance Range (Cloud)
- ⚡ **Fastest Query:** 524.8ms
- 🐢 **Slowest Query:** 1,502.65ms

### Cost Comparison

| Aspect | Local | Cloud |
|--------|-------|-------|
| **Hardware** | Requires GPU/CPU | None (serverless) |
| **Setup Time** | Hours (model downloads) | Minutes (API keys) |
| **Maintenance** | Manual updates | Automatic |
| **Scaling** | Limited by hardware | Auto-scaling |
| **Availability** | Machine must be on | 24/7 availability |
| **Cost Model** | Electricity + hardware | Pay-per-use |

---

## 🍽️ Enhanced Food Database (110 Items)

The database has been expanded from **90 to 110 items** with culturally diverse additions:

### Database Composition

| Category | Count | Examples |
|----------|-------|----------|
| **Pakistani/Lahore Heritage** | 15+ | Haleem, Karahi Gosht, Seekh Kebab, Paya Gosht |
| **Mediterranean** | 10+ | Greek Salad, Hummus, Falafel, Tabbouleh |
| **Asian Cuisines** | 15+ | Laksa, Pad Thai, Bibimbap, Tom Yum |
| **European** | 10+ | Risotto, Coq au Vin, Paella |
| **Health-Conscious** | 15+ | Grilled Salmon, Quinoa Bowls, Vegan options |
| **Comfort Foods** | 10+ | Mac & Cheese, Ramen, Tacos |
| **Other World Cuisines** | 35+ | Various global dishes |

### Each Item Includes
- ✅ Comprehensive description (75+ words)
- ✅ Cooking methods and preparation techniques
- ✅ Nutritional information and health benefits
- ✅ Cultural background and regional variations
- ✅ Dietary tags (vegan, gluten-free, etc.)
- ✅ Allergen information

---

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.10+
- Upstash account (free tier available)
- Groq account (free tier available)

### Cloud Version Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/aleeyaahmad5/week3deliverable-1.git
cd week3deliverable-1
```

#### 2. Create Virtual Environment
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python -m venv .venv
source .venv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install -r cloud-version/requirements.txt
```

#### 4. Configure Environment Variables

Create a `.env` file in the root directory:
```env
# Upstash Vector Database
# Get from: https://console.upstash.com/vector
UPSTASH_VECTOR_REST_URL=your_upstash_url_here
UPSTASH_VECTOR_REST_TOKEN=your_upstash_token_here

# Groq Cloud API
# Get from: https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here
```

#### 5. Run the Cloud RAG System
```bash
cd cloud-version
python rag_run.py
```

The cloud-version folder is **self-contained and fully functional**. All necessary files (.env, foods.json, etc.) are included.

### Local Version Setup (Week 2)

#### Prerequisites for Local
- Ollama installed and running
- ~4GB disk space for models

```bash
# Install Ollama models
ollama pull mxbai-embed-large
ollama pull llama3.2

# Run local version
cd local-version
python rag_run.py
```

---

## 🔐 Environment Variables Configuration

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `UPSTASH_VECTOR_REST_URL` | Upstash Vector endpoint URL | [Upstash Console](https://console.upstash.com/vector) |
| `UPSTASH_VECTOR_REST_TOKEN` | Upstash authentication token | [Upstash Console](https://console.upstash.com/vector) |
| `GROQ_API_KEY` | Groq Cloud API key | [Groq Console](https://console.groq.com/keys) |

### Upstash Vector Setup
1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Vector Database
3. Settings:
   - **Name:** `rag-food-advanced-yourname`
   - **Region:** Select closest to you
   - **Embedding Model:** `mixedbread-ai/mxbai-embed-large-v1`
   - **Dimensions:** 1024
   - **Similarity Function:** Cosine
4. Copy the REST URL and Token

### Groq Setup
1. Go to [Groq Console](https://console.groq.com)
2. Create an API key
3. Copy the key to your `.env` file

---

## 🧪 Advanced Query Examples

### Test Categories & Expected Responses

#### 1. Semantic Similarity
```
Query: "healthy Mediterranean options"
Expected: Greek Salad with Chickpeas, Mediterranean dishes with nutritional info
Response Time: ~800ms
```

#### 2. Multi-Criteria Search
```
Query: "spicy vegetarian Asian dishes"
Expected: Vegetarian adaptations of Laksa, Tom Yum with spice levels
Response Time: ~750ms
```

#### 3. Nutritional Queries
```
Query: "high-protein low-carb foods"
Expected: Grilled Chicken Breast (31g protein), Salmon with Quinoa
Response Time: ~700ms
```

#### 4. Cultural Exploration
```
Query: "traditional comfort foods"
Expected: Paya Gosht (Pakistani), Mac & Cheese (American), cultural context
Response Time: ~680ms
```

#### 5. Cooking Method Queries
```
Query: "dishes that can be grilled"
Expected: Seekh Kebab with charcoal grilling method details
Response Time: ~550ms
```

### Running the Test Suite
```bash
cd cloud-version
python test_queries.py
```

This generates:
- `test_report.json` - Raw performance data
- `TEST_RESULTS.md` - Formatted comparison report

---

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### ❌ "GROQ_API_KEY not found"
```
⚠️ Warning: GROQ_API_KEY not found
```
**Solution:**
1. Check `.env` file exists in root directory
2. Verify no quotes around values: `GROQ_API_KEY=gsk_xxx` (not `"gsk_xxx"`)
3. Restart your terminal/IDE after creating `.env`

#### ❌ "Failed to initialize Upstash Vector"
**Solution:**
1. Verify `UPSTASH_VECTOR_REST_URL` starts with `https://`
2. Check token is complete (no truncation)
3. Ensure vector database is created with correct embedding model

#### ❌ "Rate limit exceeded"
**Solution:**
1. Wait 1-2 minutes (Groq has rate limits on free tier)
2. The system has built-in retry logic with exponential backoff
3. Consider upgrading Groq plan for higher limits

#### ❌ "Connection timeout"
**Solution:**
1. Check internet connection
2. Verify Upstash/Groq services are operational
3. Try again in a few minutes

#### ❌ "No relevant documents found"
**Solution:**
1. Ensure documents are indexed: run `index_documents(food_data)`
2. Check `data/foods.json` exists and is valid JSON
3. Verify Upstash database has vectors: check console for vector count

#### ❌ ModuleNotFoundError
**Solution:**
```bash
pip install upstash-vector groq python-dotenv
```

---

## 📊 Quality Assessment Results

### Test Coverage
- **Total Queries:** 15
- **Success Rate:** 100%
- **Categories:** 5 (Semantic, Multi-criteria, Nutritional, Cultural, Cooking)

### Quality Scores
| Metric | Score |
|--------|-------|
| **Retrieval Relevance** | 90% (4.5/5) |
| **Answer Accuracy** | 90% (4.5/5) |
| **Overall Quality** | **90%** |

### Strengths
- ✅ Accurate nutritional data with specific values
- ✅ Cultural awareness and regional context
- ✅ Cooking method understanding
- ✅ Multi-cuisine coverage

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) | AI-assisted migration planning with architecture decisions |
| [TEST_RESULTS.md](docs/TEST_RESULTS.md) | Comprehensive performance comparison and quality assessment |
| [test_report.json](docs/test_report.json) | Raw JSON data from test execution |

---

## 🏷️ Version History

| Version | Description | Date |
|---------|-------------|------|
| **v1.0** | Local RAG System (ChromaDB + Ollama) | Dec 2025 |
| **v2.0** | Cloud RAG System (Upstash + Groq) - **29.4x faster** | Dec 2025 |

---

## 🎓 Learning Outcomes

### Technical Skills Demonstrated
1. **Cloud Migration** - Moved from local to serverless architecture
2. **Vector Databases** - Upstash Vector with automatic embeddings
3. **LLM APIs** - Groq Cloud integration with retry logic
4. **Performance Optimization** - 29.4x improvement documented
5. **Professional Documentation** - Portfolio-ready project showcase

### Key Insights
- Cloud serverless eliminates local GPU/model dependencies
- Automatic embeddings simplify architecture significantly
- Groq provides sub-second LLM inference
- Proper error handling essential for production systems

---

## 🙏 Acknowledgments

- **Original RAG Project:** Based on [ragfood](https://github.com/gocallum/ragfood) by Callum
- **Cloud Services:** [Upstash](https://upstash.com), [Groq](https://groq.com), [Vercel](https://vercel.com)
- **AI Assistance:** Migration planning with GitHub Copilot and Claude

---

## 📬 Contact

**Author:** Aleeya Ahmad  
**Location:** Melbourne, Australia  
**Repository:** https://github.com/aleeyaahmad5/week3deliverable-1

---

**Last Updated:** December 13, 2025  
**Status:** AI Week 3 Deliverables - Cloud Migration Complete ✅

#   w e e k 4 d e l i v e r a b l e  
 