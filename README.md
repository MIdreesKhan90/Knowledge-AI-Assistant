# KnowledgeAI — AI Knowledge Assistant SaaS

An AI-powered Knowledge Assistant that allows users to upload documents, organize knowledge bases, and interact with their data through intelligent AI conversations using Retrieval-Augmented Generation (RAG).

KnowledgeAI transforms static documents into searchable knowledge, helping users find relevant information and get context-aware answers from their own content.

---

## 🚀 Key Features

### 📄 Document Management
- Upload and manage documents.
- Support for PDF, DOCX, and TXT files.
- Organize documents inside knowledge bases.
- Process and extract document content.
- Download and delete documents.

### 🧠 AI-Powered Knowledge Assistant
- Ask questions about uploaded documents.
- Get context-aware answers using RAG.
- Retrieve relevant document chunks using vector similarity.
- Generate AI responses using Google Gemini.
- Maintain conversation history.

### 🔍 Semantic Search
- Search documents using natural language.
- Generate text embeddings.
- Store and retrieve vector embeddings using PostgreSQL with pgvector.
- Filter search results by user and knowledge base.

### 📚 Knowledge Base Management
- Create and manage multiple knowledge bases.
- Organize documents by knowledge base.
- Update and delete knowledge bases.
- Keep document content organized and accessible.

### 📊 Dashboard & Analytics
- Overview of knowledge bases and documents.
- Dashboard statistics.
- Conversation history.
- User activity and usage insights.

### 🔐 Admin & Security
- JWT-based authentication.
- User registration and login.
- Role-based access control.
- Admin dashboard and user management.
- Document ownership and access protection.
- API rate limiting and input validation.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, Vite |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Routing | React Router |
| HTTP Client | Axios |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Vector Database | PostgreSQL + pgvector |
| AI Model | Google Gemini |
| Embeddings | Gemini Embedding API |
| Authentication | JWT |
| Document Processing | PyMuPDF, python-docx |

---

## 📸 Application Screenshots

Add screenshots of your application in this section to showcase the interface.

Suggested screenshots:

- Dashboard
- Knowledge Base Management
- Document Management
- AI Chat Interface
- Semantic Search
- Admin Dashboard
- Login & Registration

<!-- Add your application screenshots here when ready. -->

---

## 📁 Project Structure

```text
knowledge-ai-assistant/
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── uploads/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

Follow these steps to run KnowledgeAI locally.

### 1. Prerequisites

Make sure you have installed:

- Python 3.12+
- Node.js and npm
- PostgreSQL
- pgvector PostgreSQL extension
- Google Gemini API key

### 2. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd knowledge-ai-assistant
```

### 3. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

### 4. Database Configuration

Create a PostgreSQL database named:

```text
knowledgeai_db
```

Enable the pgvector extension in your database:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 5. Environment Configuration

Create a `.env` file inside the `backend` directory.

Use `.env.example` as a reference.

Configure the following variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/knowledgeai_db

JWT_SECRET_KEY=replace_with_your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

GEMINI_API_KEY=your_gemini_api_key

EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIMENSIONS=768
```

**Important:** Never upload your actual `.env` file or API keys to GitHub.

### 6. Run the Backend

From the backend directory:

```bash
python -m uvicorn app.main:app --reload
```

Backend will run at:

```text
http://127.0.0.1:8000
```

### 7. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

---

## 🔗 API Documentation

KnowledgeAI uses FastAPI for its backend REST API.

Once the backend is running, access the interactive API documentation:

| Documentation | URL |
|---|---|
| Swagger UI | http://127.0.0.1:8000/docs |
| ReDoc | http://127.0.0.1:8000/redoc |
| Health Check | http://127.0.0.1:8000/health |

---

## 🧠 How RAG Works

KnowledgeAI uses Retrieval-Augmented Generation (RAG) to answer questions using uploaded documents.

The workflow:

1. User uploads a document.
2. The backend extracts its text.
3. Extracted text is cleaned and divided into chunks.
4. Embeddings are generated using the Gemini Embedding API.
5. Embeddings are stored in PostgreSQL using pgvector.
6. User submits a question.
7. The system retrieves relevant document chunks using vector similarity search.
8. Retrieved context is sent to the Gemini model.
9. The AI generates a context-aware response.

---

## 🔒 Security

- JWT-based authentication.
- Password hashing.
- Role-based authorization.
- User-specific document access.
- Protected API endpoints.
- Request rate limiting.
- Environment-based configuration.
- Input validation.

---

## 👨‍💻 Development

This project was built to explore and implement:

- Full-stack application development.
- REST API development with FastAPI.
- React frontend architecture.
- PostgreSQL database integration.
- Vector embeddings and semantic search.
- Retrieval-Augmented Generation (RAG).
- LLM-powered applications.
- Authentication and role-based access control.

---

## 📌 Project Status

**Development:** Core application features and testing completed.

**Deployment:** Not configured yet.

---

## 📄 License

No open-source license has been added to this repository yet.