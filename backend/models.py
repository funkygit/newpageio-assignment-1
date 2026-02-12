from pydantic import BaseModel
from typing import List, Optional, Literal

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    message: str
    provider: Literal["ollama", "openai", "gemini", "anthropic"] = "ollama"
    model: Optional[str] = None
    history: List[ChatMessage] = []

class DocumentSource(BaseModel):
    source: str
    page: Optional[int] = None
    content_snippet: str

class ChatResponse(BaseModel):
    response: str
    sources: List[DocumentSource] = []

class UploadResponse(BaseModel):
    filename: str
    chunks: int
    status: str
