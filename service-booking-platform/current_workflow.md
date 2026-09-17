# Service Booking Platform — Current 3-End Workflow

This document outlines the workflow across the three distinct personas:
1. **Merchant (Admin)**: Sets up catalog, knowledge docs, and AI keys.
2. **User (Customer)**: Interacts with the AI widget, browses services, and creates bookings.
3. **Staff (Specialist)**: Receives, claims, accepts/rejects, and finalizes bookings.

---

## High-Level 3-End Architecture

```mermaid
flowchart TD
    %% ── 1. MERCHANT (ADMIN) ──
    subgraph MerchantEnd ["1. Merchant - Admin Portal"]
        M1["Upload Catalog - Excel / CSV"] --> M_API["/api/v1/admin/catalog/upload"]
        M2["Upload Policy Docs - PDF / TXT"] --> M_DOC["/api/v1/admin/knowledge-docs"]
        M3["Configure BYOK LLM and Prompt"] --> M_CFG["/api/v1/admin/config/{id}"]
    end

    %% Storage & Embeddings
    M_API -->|Store Services| PG[("PostgreSQL DB")]
    M_API -->|Auto-Vectorize Services| MILVUS[("Milvus Vector DB")]
    M_DOC -->|Chunk 512w and Embed| MILVUS
    M_CFG -->|AES-256 Encrypt Key| PG

    %% ── 2. USER (CUSTOMER) ──
    subgraph UserEnd ["2. User - Customer / Chat Widget"]
        U1["User sends inquiry<br/>'i want a swift under 6 lac'"] --> U_CHAT["POST /api/v1/user/chat"]
        U_CHAT --> ORCH["AI Orchestrator"]
        
        %% Dual retrieval
        ORCH -->|1. Query Catalog| PG
        ORCH -->|2. Vector Search all-MiniLM| MILVUS
        PG --> CTX["Context Builder"]
        MILVUS --> CTX
        
        CTX --> LLM["LLM Model - Gemini / OpenAI"]
        LLM --> U_RESP["Chat Reply + Car Cards + Chips"]
        U_RESP --> U2["User clicks Book and Enters Phone / Name"]
        U2 --> U_BOOK["POST /api/v1/user/bookings"]
    end

    %% Router to Staff
    U_BOOK --> ROUTER["Least-Loaded Router"]
    ROUTER -->|Create Booking status: pending| PG

    %% ── 3. STAFF (SPECIALIST) ──
    subgraph StaffEnd ["3. Staff - Dispatch Dashboard"]
        PG -->|Real-time Queue| S_DASH["Staff Queue /staff"]
        S_DASH --> S_ACT{"Staff Action"}
        
        S_ACT -->|Claim unassigned| S_CLAIM["POST /staff/bookings/{id}/claim"]
        S_ACT -->|Accept| S_ACC["PATCH /staff/bookings/{id}/decision accept"]
        S_ACT -->|Reject| S_REJ["Cascade Re-route to Next Staff"]
        
        S_ACC -->|Status: ACCEPTED| S_OFF["Contact Customer and Offline Service"]
        S_OFF --> S_FIN["PATCH /staff/bookings/{id}/finalize"]
        S_FIN -->|Status: FINALIZED| PG
    end
```

---

## 1. Merchant (Admin) Workflow

The merchant controls the business configuration via `/admin`:

1. **Catalog Ingestion**:
   - Merchant uploads an Excel/CSV file with columns: `name`, `category`, `price_range`, `description`.
   - Backend auto-creates categories and services in PostgreSQL and vectorizes items into Milvus.
2. **Policy & Knowledge Ingestion**:
   - Merchant uploads PDF/TXT/MD documents (e.g., test-drive rules, store timings, warranty terms).
   - Backend chunks text into 512-word windows, embeds using `sentence-transformers/all-MiniLM-L6-v2`, and stores dense vectors in Milvus.
3. **AI & BYOK Configuration**:
   - Merchant inputs their LLM API key (Gemini, OpenAI, Claude, or Groq) and custom system prompt.
   - API key is encrypted at rest using AES-256-GCM.

---

## 2. User (Customer) Workflow

The customer interacts via the embeddable floating chat widget or web app:

1. **Conversational Inquiry**:
   - User types an inquiry (e.g., *"Show cars under 8 lakhs"* or *"Do I need a license for a test drive?"*).
   - Frontend calls `POST /api/v1/user/chat`.
2. **Dual-Path Orchestration**:
   - **Catalog path**: Checks PostgreSQL for matching models and budget ranges.
   - **Knowledge path**: Converts query into a 384-dim vector and searches Milvus for policy chunks.
   - **Context Builder**: Combines catalog results + document policies + conversation history into a structured prompt.
   - **LLM Call**: Model generates a natural answer accompanied by interactive Service Cards and suggestion chips.
3. **Booking Creation**:
   - User selects a service and enters full name, phone number, and optional notes.
   - Frontend calls `POST /api/v1/user/bookings`.
   - Router assigns the ticket to the least-loaded staff specialist. Status becomes `pending`.

---

## 3. Staff (Operator) Workflow

Specialists manage customer requests through `/staff`:

1. **Queue Monitoring**:
   - Staff views pending tickets assigned directly to them or unassigned in the merchant pool.
2. **Decision (Accept / Reject / Claim)**:
   - **Claim**: If ticket is unassigned, any merchant specialist can claim it.
   - **Accept**: Moves status to `accepted`. Staff contacts the customer to confirm time and paperwork.
   - **Reject**: Staff provides a reason (e.g., *"Schedule conflict"*). The system round-robin cascades the booking to the next available specialist.
3. **Finalize**:
   - After completing the in-person appointment or test drive, staff logs completion notes and marks the ticket `finalized`.
