from docling.document_converter import DocumentConverter
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import chromadb
from .config import get_settings
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

# Initialize globally
embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
collection = chroma_client.get_or_create_collection(name="rag_documents")

def process_file(file_path: str):
    logger.info(f"Processing file: {file_path}")
    try:
        converter = DocumentConverter()
        result = converter.convert(file_path)
        # Export to markdown for better chunking context
        markdown_content = result.document.export_to_markdown()
        
        # Chunking
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2500,
            chunk_overlap=400,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        chunks = text_splitter.split_text(markdown_content)
        
        if not chunks:
            logger.warning(f"No text extracted from {file_path}")
            return 0
            
        logger.info(f"Generated {len(chunks)} chunks from {file_path}")
        
        # Embed and Store
        embeddings = embedding_model.encode(chunks)
        embedding_dim = embeddings.shape[1] if len(embeddings) > 0 else 0
        
        # Create unique IDs
        base_name = os.path.basename(file_path)
        ids = [f"{base_name}_{i}" for i in range(len(chunks))]
        
        # ADR Alignment: Metadata schema
        metadatas = [{
            "source": base_name,
            "document_id": base_name,
            "chunk_id": ids[i],
            "chunk_index": i,
            "chunk_version": "v1.0",
            "embedding_model": settings.EMBEDDING_MODEL,
            "embedding_dim": embedding_dim,
        } for i in range(len(chunks))]
        
        collection.add(
            documents=chunks,
            embeddings=embeddings.tolist(),
            ids=ids,
            metadatas=metadatas
        )  
        return len(chunks)
    except Exception as e:
        logger.error(f"Error processing file {file_path}: {e}")
        raise e
