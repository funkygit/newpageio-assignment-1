# Local RAG System Walkthrough

# 1. System Overview
The system consists of:

- Backend: FastAPI server (Port 8000) handling document parsing (docling), embedding (sentence-transformers), and storage (chromadb).
- Frontend: React application (Port 5173/3000) for uploading documents and chatting.

---

# 2. Running the Application
**Prerequisites**
Python 3.10+
Node.js 16+
Ollama (installed and running with llama3 or similar model)

---

### Start Backend
Open a terminal in backend:

```bash
cd backend
# Create and activate virtual environment (Windows)
python -m venv .venv

# Install dependencies
pip install -r requirements.txt

# Run server using venv
python -m uvicorn main:app --reload
```

---

### Start Frontend
Open a terminal in frontend/:

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

---

# 3. Usage Guide
Open App: Go to http://localhost:5173 (or port shown in terminal).
## Upload Document:
- Drag and drop a PDF/Docx/TXT file.
- Wait for "Success" status. This means it has been parsed and indexed.

## Chat:
- Select "Ollama" (default) or other provider.
- Type your question.
- The system will retrieve relevant chunks and generate an answer using the local model.

---

# 4. Configuration
- **Models**: Edit 
```bash
backend/config.py
```
 to change embedding model or Ollama URL.
- **Keys**: Create a .env file in backend/ to add OPENAI_API_KEY etc. if using cloud models.

---

# 5. Troubleshooting
- **Ollama Error**: Ensure Ollama is running (ollama serve).
- **Docling Error**: Some PDFs might be complex. Check backend logs for parsing errors.