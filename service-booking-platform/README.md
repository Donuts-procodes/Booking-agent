# Booking Agent: Universal Service Booking Platform

An enterprise-grade, full-stack AI conversational service booking platform powered by **FastAPI**, **Milvus Vector DB**, **PostgreSQL**, **MinIO/S3**, and **React (Vite + TypeScript)** with Bring-Your-Own-Key (BYOK) multi-LLM orchestration.

---

## 🏛 Architecture Overview

```
                        ┌──────────────────────────────────────────────────────────┐
                        │              Frontend Client (Vite + React)              │
                        │   • /       -> Conversational AI Booking Assistant       │
                        │   • /staff  -> Dispatch Queue & Finalization Portal      │
                        │   • /admin  -> BYOK Config, Catalog & RAG Ingestion      │
                        └────────────────────────────┬─────────────────────────────┘
                                                     │ REST API / JWT
                                                     ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             FastAPI Application (app/)                           │
│  app/api/v1/endpoints/                                                           │
│    ├── auth.py       (Staff JWT authentication)                                  │
│    ├── bookings.py   (Booking lifecycle, status check, verify cancellation)      │
│    ├── catalog.py    (Public active category and service browsing)               │
│    ├── staff.py      (Queue listing, accept/reject routing cascade, finalize)    │
│    ├── admin.py      (Excel catalog upload, knowledge document upload, staff)    │
│    ├── config.py     (BYOK LLM provider selection & AES-256 encrypted keys)      │
│    └── feedback.py   (Customer 1-5 star feedback ratings)                        │
└───────────────┬────────────────────────────┬─────────────────────────────┬───────┘
                │                            │                             │
                ▼                            ▼                             ▼
┌───────────────────────────────┐ ┌──────────────────────────────┐ ┌───────────────┐
│     PostgreSQL (SQLAlchemy)   │ │      Milvus Vector DB        │ │   MinIO S3    │
│  • Merchants & Staff accounts │ │  • catalog_semantic_idx      │ │  • Catalog    │
│  • Categories & Services      │ │    (Cosine similarity HNSW)  │ │    media      │
│  • Bookings (#BK prefix)      │ │  • merchant_knowledge_idx    │ │  • Policy     │
│  • Customer Feedback (1-5)    │ │    (512-token RAG chunks)    │ │    documents  │
└───────────────────────────────┘ └──────────────────────────────┘ └───────────────┘
```

---

## 🚀 Quick Start with Docker Compose

To spin up all platform microservices (PostgreSQL, MinIO, Milvus standalone, Backend, and Frontend):

```bash
# 1. Clone or navigate to the repository
cd service-booking-platform

# 2. Copy environment template
cp .env.example .env

# 3. Start containers
docker-compose up -d --build
```

Services will be live at:

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001)
- **Milvus Vector Port**: `localhost:19530`

---

## 💻 Local Development

### 1. Backend (Python 3.10+)

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\Activate.ps1

# Install dependencies
pip install -e .

# Run database migrations
alembic upgrade head

# Run tests
pytest

# Start development server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (Vite + React + TS)

```bash
cd frontend

# Install dependencies
npm install

# Type-check and build
npm run build

# Start Vite dev server
npm run dev -- --port 3000
```

---

## 🔒 Security & BYOK Architecture

- **AES-256-GCM Encryption**: Merchant external API keys (OpenAI, Anthropic, Groq) are authenticated and encrypted at rest prior to PostgreSQL storage using authenticated Galois/Counter Mode.
- **Ephemeral JWT Cancellation Tokens**: To prevent unauthorized cancellation of bookings, cancellation requests require two-step verification (`/api/v1/bookings/verify` followed by `/api/v1/bookings/{id}/cancel` with a signed 15-minute token).
- **Least-Loaded Round-Robin Routing**: Incoming service requests are dynamically assigned to available active specialists qualified for the requested service. If rejected, the booking cascades automatically to the next available specialist.

---

## 🧪 Testing

Run the automated backend test suite:

```bash
cd backend
python -m pytest tests/ -v
```

Run frontend TypeScript type checking:

```bash
cd frontend
npx tsc --noEmit
```
