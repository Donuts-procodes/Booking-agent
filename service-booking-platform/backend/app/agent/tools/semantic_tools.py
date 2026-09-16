from typing import Any
from app.rag.retriever import retrieve_relevant_services, retrieve_knowledge_base


# Performs semantic dense vector lookup across catalog services for customer inquiry
def tool_search_catalog(query: str, merchant_id: str, limit: int = 4) -> list[dict[str, Any]]:
    return retrieve_relevant_services(query=query, merchant_id=merchant_id, limit=limit)


# Performs semantic vector similarity search across merchant policy documents
def tool_search_knowledge(query: str, merchant_id: str, limit: int = 3) -> list[dict[str, Any]]:
    return retrieve_knowledge_base(query=query, merchant_id=merchant_id, limit=limit)
