# Service Booking Platform — Improved Agentic Architecture & Workflow

This document outlines the **Next-Gen Agentic Architecture** featuring an explicit **Agentic Orchestrator (LangGraph / StateGraph)**, an autonomous **Tool Registry**, multi-turn **Redis Session Memory**, and a dynamic **Multi-Model LLM Engine**.

---

## Improved System Architecture

```mermaid
flowchart TD
    %% ── 1. MERCHANT (ADMIN & INGESTION) ──
    subgraph MerchantEnd ["1. Merchant Admin Portal"]
        M1["Catalog Files - Excel / CSV"] --> API_CAT["POST /admin/catalog/upload"]
        M2["Policy Docs - PDF / TXT / DOCX"] --> API_DOC["POST /admin/knowledge-docs"]
        M3["Google Drive Storage"] --> TOOL_GDRIVE["Google Drive Ingestion Tool"]
        TOOL_GDRIVE --> API_DRIVE["POST /admin/gdrive-sync"]
        M4["BYOK Config - Keys / Prompt"] --> API_CONF["PATCH /admin/config"]
    end

    %% Ingestion to DB & Orchestrator
    API_CAT -->|Save in RDBMS postgres| PG[("PostgreSQL DB")]
    API_CONF -->|Save in RDBMS postgres| PG
    API_CAT --> ORCH_INGEST["Orchestrator Ingestion Worker"]
    API_DOC --> ORCH_INGEST
    API_DRIVE --> ORCH_INGEST
    API_DRIVE -->|Save in RDBMS postgres| PG

    %% Vectorization Pipeline
    ORCH_INGEST --> HF["HuggingFace all-MiniLM-L6-v2"]
    HF -->|Dense 384-dim Vectors| MILVUS[("Milvus Vector DB")]

    %% ── 2. USER (CUSTOMER & CHATBOT WIDGET) ──
    subgraph UserEnd ["2. Customer - Embeddable Chat Widget"]
        U_QUERY["Customer Inquiry / Booking Intent"] --> CHAT_EP["POST /user/chat"]
        CHAT_EP --> ORCH_CORE["AGENTIC ORCHESTRATOR - LangGraph / StateGraph"]
    end

    %% ── 3. AGENTIC ORCHESTRATOR ARCHITECTURE ──
    subgraph OrchestratorLayer ["3. Next-Gen Agentic Orchestrator"]
        ORCH_CORE --> INTENT{"Intent Router & Guardrails"}
        
        %% State & Memory
        ORCH_CORE <--> REDIS[("Redis Cache & Session Memory")]

        %% Agent Tools
        subgraph ToolSuite ["Agent Tool Registry"]
            TOOL_SEARCH["Semantic Search Tool"]
            TOOL_CATALOG["Catalog Filter Tool"]
            TOOL_AVAIL["Availability Check Tool"]
            TOOL_BOOK["Book Appointment Tool"]
            TOOL_INGEST["Cloud Ingestion Tool - Google Drive"]
        end

        INTENT -->|Policy / FAQ Inquiry| TOOL_SEARCH
        INTENT -->|Catalog / Price Inquiry| TOOL_CATALOG
        INTENT -->|Slot Check| TOOL_AVAIL
        INTENT -->|Booking Intent| TOOL_BOOK
        INTENT -->|Admin Ingestion Sync| TOOL_INGEST

        TOOL_SEARCH -->|Dense Vector Query| MILVUS
        TOOL_CATALOG -->|SQL Filtering| PG
        TOOL_AVAIL -->|Calendar / Staff Slots| PG
        TOOL_BOOK -->|Save in RDBMS postgres| PG
        TOOL_INGEST --> API_DRIVE

        TOOL_SEARCH --> CTX["Dynamic Context Synthesizer"]
        TOOL_CATALOG --> CTX
        TOOL_AVAIL --> CTX

        %% Reasoning Engine
        CTX --> LLM_ROUTER{"LLM Router & Fallback"}
        LLM_ROUTER -->|Primary| LLM_GEMINI["Gemini 2.5 Flash / Pro"]
        LLM_ROUTER -->|Alternative| LLM_OPENAI["OpenAI GPT-4o / o3-mini"]
        LLM_ROUTER -->|Fast Local| LLM_GROQ["Groq / Claude / Ollama"]

        LLM_GEMINI --> AGENT_OUT["Structured Turn Output"]
        LLM_OPENAI --> AGENT_OUT
        LLM_GROQ --> AGENT_OUT

        AGENT_OUT -->|Save State| REDIS
        AGENT_OUT -->|Render Response + Service Cards + Chips| CHAT_EP
    end

    %% ── 4. STAFF & DISPATCH DISPATCH ENGINE ──
    subgraph StaffEnd ["4. Staff Specialist Portal"]
        TOOL_BOOK -->|Trigger Router| ROUTER["Smart Routing Engine - Least Load & Skill Match"]
        ROUTER -->|Save in RDBMS postgres| PG
        
        PG -->|Real-time SSE / WebSocket| S_DASH["Staff Live Queue - /staff"]
        S_DASH --> S_DECISION{"Staff Decision"}
        
        S_DECISION -->|Claim| S_CLAIM["Claim Unassigned Ticket"]
        S_DECISION -->|Accept| S_ACCEPT["Confirm Appointment"]
        S_DECISION -->|Reject with Reason| S_REJECT["Cascade Re-route to Next Specialist"]
        
        S_ACCEPT --> S_OFFLINE["Offline Service / Test Drive"]
        S_OFFLINE --> S_FINAL["Finalize Booking with Notes & Payment"]
        
        S_CLAIM -->|Save in RDBMS postgres| PG
        S_ACCEPT -->|Save in RDBMS postgres| PG
        S_REJECT --> ROUTER
        S_FINAL -->|Save in RDBMS postgres| PG
    end

```

---

## Key Improvements Over Previous Architecture

| Area | Previous Architecture | Improved Agentic Architecture |
| :--- | :--- | :--- |
| **Orchestration** | Hardcoded if-else code in `/chat` endpoint | **Stateful Agentic Orchestrator (LangGraph StateGraph)** with intent classification and guardrails. |
| **Tool Calling** | Monolithic inline functions | **Modular Tool Registry** (`Semantic Search`, `Catalog Filter`, `Availability Check`, `Book Appointment`). |
| **Session Memory** | Short in-memory history slice passed from client | **Persistent Redis Session Memory & State Management** for uninterrupted multi-turn conversations. |
| **LLM Routing** | Single hardcoded provider lookup | **Adaptive LLM Router with Auto-Fallback** (Gemini &rarr; OpenAI &rarr; Groq). |
| **Ingestion** | Manual upload only | **Multi-Source Ingestion** (Excel/CSV, PDF/DOCX, and Google Drive Cloud Sync). |
| **Staff Dispatch** | Polling-based queue refresh | **Event-Driven Dispatch** via WebSocket/SSE with automatic round-robin cascading. |
