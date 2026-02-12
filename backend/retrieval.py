import chromadb
from sentence_transformers import SentenceTransformer
from .config import get_settings
from typing import List, Dict

settings = get_settings()
chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name="rag_documents")
embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)

def query_documents(query: str, n_results: int = 5) -> List[Dict]:
    query_embedding = embedding_model.encode([query]).tolist()
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results
    )
    
    formatted_results = []
    if results['documents']:
        for i, doc in enumerate(results['documents'][0]):
            meta = results['metadatas'][0][i] if results['metadatas'] else {}
            formatted_results.append({
                "content": doc,
                "source": meta.get("source", "Unknown"),
                "score": results['distances'][0][i] if results['distances'] else 0
            })
            
    return formatted_results
