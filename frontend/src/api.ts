import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
});

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatRequest {
    message: string;
    provider: 'ollama' | 'openai' | 'gemini' | 'anthropic';
    model?: string;
    history: ChatMessage[];
}

export interface DocumentSource {
    source: string;
    page?: number;
    content_snippet: string;
}

export interface ChatResponse {
    response: string;
    sources: DocumentSource[];
}

export const uploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData);
    return response.data;
};

export const sendMessage = async (data: ChatRequest) => {
    const response = await api.post<ChatResponse>('/chat', data);
    return response.data;
};

export const getModels = async () => {
    const response = await api.get<{ models: string[] }>('/models');
    return response.data.models;
};

export interface DocumentInfo {
    document_id: string;
    source: string;
    chunks: number;
    embedding_model: string;
}

export const getDocuments = async () => {
    const response = await api.get<{ documents: DocumentInfo[] }>('/documents');
    return response.data.documents;
};

export const deleteDocument = async (documentId: string) => {
    const response = await api.delete(`/documents/${encodeURIComponent(documentId)}`);
    return response.data;
};
