# Architecture Decision Record (ADR)
## Local Document RAG – Design Decisions & Technical Rationale

- **Status:** POC
- **Date:** 2026-02-13
- **Owner:** Abhishek
- **Scope:** Local Retrieval-Augmented Generation (RAG) system for document analysis and conversational querying.

---

# 1. Context

The objective is to design a **local document-based RAG system** that enables conversational analysis over internal documents while operating within constrained hardware (my laptop hardware constraints):

- GPU: 4 GB VRAM
- RAM: 24 GB
- CPU: Older generation (limited parallel processing capability)

Primary engineering goals:

- Enable **local-first AI workflows**
- Maintain **flexibility to integrate stronger LLMs later**
- Avoid heavy infrastructure dependencies during POC
- Optimize for **retrieval efficiency over model size**
- Ensure future migration paths without re-indexing data

Key constraints identified:

- Large local LLMs are not feasible for real-time inference.
- CPU-bound environments require lightweight embedding and parsing strategies.
- Rapid iteration is more valuable than production-grade infrastructure at this stage.

---

# 2. Decision Drivers

The following factors influenced architectural decisions:

1. Hardware limitations requiring efficient resource usage.
2. Need for pluggable LLM integration. (Currently I'm using local model, in future if compute resources permit, I can scale)
3. Minimizing infrastructure complexity for initial development. (Avoiding docker for vector DB (Qdrant), but still ensuring future migrations for Qdrant)
4. Future scalability and migration capability. (I want to be able to switch to a better model later without re-indexing data)
5. Avoidance of tight coupling with orchestration frameworks. (Avoiding LangChain for initial development)
6. Structured document parsing for improved retrieval accuracy. (Docling has support for structured parsing and chunking)

---

# 3. Considered Options

## 3.1 LLM Strategy

### Options Considered
- Large local models (Llama variants, Mixtral, DeepSeek)
- Cloud-only LLM integration
- Local fallback with pluggable interface

### Decision
Adopt a **flexible LLM adapter architecture** with:

- Local LLM as default/fallback
- External LLM integration supported via abstraction

### Rationale
- My PC's hardware constraints prevent reliance on large models.
- Decoupling enables future upgrades without redesigning retrieval layers.

---

## 3.2 Embedding Model

### Options Considered
- Gemma-based embeddings
- BGE family models
- SentenceTransformers variants

### Decision
Use: SentenceTransformers: all-MiniLM-L6-v2

### Rationale
- Lightweight and CPU-efficient
- Stable semantic similarity performance
- Low memory usage
- Suitable for rapid indexing during POC phase

### Trade-off Accepted
- Slightly reduced semantic accuracy compared to larger embedding models.

---

## 3.3 Vector Database

### Options Considered
- Qdrant (production-grade vector DB)
- ChromaDB
- FAISS

### Decision
Use: ChromaDB (POC Phase)

### Rationale
- No Docker or infrastructure overhead
- Fast local setup
- Simplified experimentation

### Future Plan
Design data schema to allow migration to Qdrant without regenerating embeddings.

---

## 3.4 Parsing & Orchestration

### Options Considered
- Heavy orchestration frameworks (LangChain, LlamaIndex)
- Custom pipeline with structured parsing
- Minimal ingestion architecture

### Decision
Use: Docling for parsing + structural chunking (I have used Docling in the past in one of the projects and I preferred thsi for quicker setup)
Custom lightweight orchestration

### Rationale
- Structural parsing reduces token waste.
- Improves retrieval quality without increasing LLM size.
- Avoids framework lock-in.

---

# 4. Final Architecture
Docling → Structural Chunking
        → SentenceTransformers (MiniLM)
        → ChromaDB  
        → Retrieval Layer
        → LLM Adapter Interface
            ↳ Local LLM (default)
            ↳ External LLM (future)


---

# 5. Key Technical Decisions

## 5.1 LLM-Agnostic Architecture

Implemented via an interface-based adapter pattern:

- Retrieval layer does not depend on specific LLM implementations.
- Enables switching between local and remote models seamlessly.

---

## 5.2 Structured Chunking Strategy

Chunking approach:

- Structural boundaries prioritized (headings, sections).
- Token limit ~600–700 tokens.
- Overlap ~80–100 tokens.

Reasoning:

- Improves semantic retrieval.
- Reduces prompt size sent to LLM.

---

## 5.3 Metadata-Driven Embedding Storage

Each embedding includes metadata:
embedding_model
embedding_dim
chunk_version
document_id
chunk_id


Purpose:

- Prevents conflicts when upgrading embedding models.
- Enables safe migration to Qdrant.

---

## 5.4 Separation of Concerns

Distinct components:

- Ingestion Pipeline
- Vector Storage Layer
- Retrieval Service
- LLM Interface

Benefits:

- Future scalability
- Easier testing
- Model replacement without reindexing

---

# 6. Engineering Standards Followed

- Modular architecture with clear abstractions.
- Hardware-aware design decisions.
- Minimal infrastructure overhead for POC.
- Migration-first data modeling.
- Avoidance of vendor or framework lock-in.
- Separation of ingestion and chat pipelines.

---

# 7. Engineering Trade-offs / Standards Deferred

## 7.1 No Reranker Model
Reason:
- CPU cost too high for current environment.

---

## 7.2 No Hybrid Search (BM25 + Vector)
Reason:
- Added complexity not justified for early-stage validation.

---

## 7.3 No Production Vector DB (Yet)
Reason:
- Operational overhead unnecessary during experimentation.

---

## 7.4 Lightweight Embeddings Over High-Accuracy Models
Reason:
- Faster indexing and lower memory footprint prioritized.

---

# 8. Consequences

## Positive Outcomes

- Rapid local development with minimal infrastructure.
- Flexible architecture supporting future LLM upgrades.
- Efficient operation under constrained hardware.
- Clean migration path toward production-grade stack.

## Risks / Limitations

- Retrieval accuracy limited by MiniLM embeddings.
- Local LLM performance constrained by hardware.
- Scaling beyond POC requires vector DB migration.

---

# 9. Future Evolution Path

Planned improvements when resources allow:

- Replace ChromaDB with Qdrant.
- Upgrade embedding model to BGE-small or BGE-M3.
- Add optional reranking stage.
- Introduce hybrid keyword + vector search.
- Enable larger context-window LLMs.

---

# 10. Summary

This architecture prioritizes:

- Retrieval Efficiency
- Hardware Awareness
- Long-Term Flexibility

over immediate adoption of large models or complex orchestration frameworks.

The design deliberately focuses on building a **stable, extensible foundation** that can evolve into a production-ready RAG system without requiring a full redesign.