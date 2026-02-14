from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import httpx
import chromadb
from config import get_settings
from models import ChatRequest, ChatResponse, UploadResponse, DocumentSource
from llm_provider import get_llm_provider
from ingest import process_file
from retrieval import query_documents

app = FastAPI(title="Local RAG System")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings = get_settings()
UPLOAD_DIR = "./uploaded_docs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PATH)

@app.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process the file
        num_chunks = process_file(file_path)
        
        return UploadResponse(
            filename=file.filename,
            chunks=num_chunks,
            status="Success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # 1. Retrieve relevant context
    context_docs = query_documents(request.message, n_results=3)
    context_text = "\n\n".join([f"Source: {d['source']}\nContent: {d['content']}" for d in context_docs])
    
    # 2. Construct Prompt
    system_prompt = (
        "You are a helpful assistant. Use the following context to answer the user's question. "
        "If the answer is not in the context, say you don't know."
        "\n\nContext:\n" + context_text
    )
    
    messages = [{"role": "system", "content": system_prompt}] + \
               [{"role": m.role, "content": m.content} for m in request.history] + \
               [{"role": "user", "content": request.message}]

    # 3. Generate Answer
    provider = get_llm_provider(request.provider)
    model = request.model if request.model else ("llama3" if request.provider == "ollama" else "gpt-4o")
    
    try:
        # For non-streaming response in this simple endpoint (we can upgrade to streaming later)
        response_content = ""
        for chunk in provider.generate_stream(messages, model):
            response_content += chunk
            
        sources = [DocumentSource(source=d['source'], content_snippet=d['content'][:200]) for d in context_docs]
        return ChatResponse(response=response_content, sources=sources)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents")
async def list_documents():
    """List all ingested documents with their chunk counts."""
    try:
        collection = chroma_client.get_or_create_collection(name="rag_documents")
        all_metadata = collection.get(include=["metadatas"])
        
        if not all_metadata["metadatas"]:
            return {"documents": []}
        
        # Aggregate by document_id
        doc_map = {}
        for meta in all_metadata["metadatas"]:
            doc_id = meta.get("document_id", "Unknown")
            if doc_id not in doc_map:
                doc_map[doc_id] = {
                    "document_id": doc_id,
                    "source": meta.get("source", doc_id),
                    "chunks": 0,
                    "embedding_model": meta.get("embedding_model", "unknown"),
                }
            doc_map[doc_id]["chunks"] += 1
        
        return {"documents": list(doc_map.values())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete all chunks for a given document from ChromaDB."""
    try:
        collection = chroma_client.get_or_create_collection(name="rag_documents")
        
        # Check if document exists
        existing = collection.get(where={"document_id": document_id}, include=["metadatas"])
        if not existing["metadatas"]:
            raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")
        
        chunk_count = len(existing["metadatas"])
        collection.delete(where={"document_id": document_id})
        
        # Also remove the physical file if it exists
        file_path = os.path.join(UPLOAD_DIR, document_id)
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return {"status": "deleted", "document_id": document_id, "chunks_removed": chunk_count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "provider": "Ollama (default)"}

@app.get("/models")
async def get_models():
    print("ACCESSED /models ENDPOINT")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if response.status_code == 200:
                models_data = response.json()
                return {"models": [model["name"] for model in models_data.get("models", [])]}
    except Exception as e:
        print(f"Error fetching models: {e}")
    
    return {"models": ["llama3"]} # Fallback

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
