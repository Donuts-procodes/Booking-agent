import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.category import Category
from app.models.merchant import Merchant
from app.models.service import Service
from app.rag.llm_factory import LLMProviderFactory
from app.rag.retriever import VectorRetriever
from app.schemas.catalog import ServiceRead

logger = logging.getLogger("app.agent.chat")
router = APIRouter()


class ChatTurnRequest(BaseModel):
    merchant_id: uuid.UUID
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    message: str
    history: list[dict[str, str]] = Field(default_factory=list)


class ChatTurnResponse(BaseModel):
    session_id: str
    response: str
    matching_services: list[ServiceRead] = Field(default_factory=list)
    suggested_action: str | None = None
    suggestion_chips: list[str] = Field(default_factory=list)


@router.post("", response_model=ChatTurnResponse)
async def process_chat_turn(
    payload: ChatTurnRequest,
    db: AsyncSession = Depends(get_db),
) -> ChatTurnResponse:
    """Processes user message with RAG knowledge retrieval and dynamic LLM completion."""
    merchant = await db.get(Merchant, payload.merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    cat_stmt = (
        select(Category)
        .where(Category.merchant_id == payload.merchant_id, Category.is_active.is_(True))
    )
    categories = (await db.execute(cat_stmt)).scalars().all()

    from app.services.catalog_service import search_services
    matched_services = await search_services(db, payload.merchant_id, payload.message)

    # RAG knowledge retrieval
    knowledge_context = ""
    try:
        chunks = await VectorRetriever.search_knowledge_base(
            merchant_id=str(payload.merchant_id),
            query=payload.message,
            top_k=3,
        )
        if chunks:
            knowledge_context = "\n".join(f"- {c['chunk_text']}" for c in chunks)
    except Exception as exc:
        logger.warning("Milvus knowledge search skipped: %s", exc)

    catalog_summary = "\n".join(
        f"• {s.name} ({s.price_range or 'Price on request'}): {s.description}"
        for s in matched_services[:8]
    )
    categories_summary = ", ".join(c.name for c in categories)

    # Build vertical-agnostic system prompt from merchant metadata
    system_prompt = (
        merchant.system_prompt
        or f"You are {merchant.name}'s intelligent AI booking concierge."
    )
    system_prompt += f"""

MERCHANT CONTEXT:
Business Name: {merchant.name}
Available Categories: {categories_summary or "General services"}

MATCHING SERVICES FOR CURRENT INQUIRY:
{catalog_summary if catalog_summary else "Full catalog available. Ask the customer about their preferences."}

BUSINESS POLICIES & KNOWLEDGE:
{knowledge_context if knowledge_context else "Please refer to our team for detailed business hours and policies."}

INSTRUCTIONS:
1. Provide a direct, helpful, and conversational response to the customer's question.
2. If relevant services exist above, recommend 1-3 specific options with price and key features.
3. Guide the customer toward selecting a service to schedule an appointment or booking.
4. Keep replies concise and polite (2-3 sentences max).
5. Never invent services, prices, or policies not listed above.
"""

    messages_for_llm: list[dict[str, str]] = []
    for h in payload.history[-6:]:
        messages_for_llm.append({"role": h.get("role", "user"), "content": h.get("content", "")})
    messages_for_llm.append({"role": "user", "content": payload.message})

    response_text = ""

    if merchant.llm_provider and merchant.encrypted_api_key and merchant.llm_model_id:
        try:
            response_text = LLMProviderFactory.get_completion(
                provider=merchant.llm_provider,
                encrypted_api_key=merchant.encrypted_api_key,
                model_id=merchant.llm_model_id,
                system_prompt=system_prompt,
                messages=messages_for_llm,
                temperature=0.3,
            )
        except Exception as err:
            logger.warning("Dynamic LLM completion failed, falling back: %s", err)

    if not response_text:
        q_lower = payload.message.lower()
        if matched_services:
            first_few = [f"{s.name} ({s.price_range or 'Price on request'})" for s in matched_services[:3]]
            response_text = f"We have great options matching your request: {', '.join(first_few)}. Would you like to select one below to schedule your appointment?"
        elif any(w in q_lower for w in ("hello", "hi", "hey", "start")):
            cat_list = ", ".join(c.name for c in categories[:6])
            response_text = f"Hello! Welcome to {merchant.name}. We offer services across {cat_list or 'various categories'}. What are you looking for?"
        else:
            cat_list = ", ".join(c.name for c in categories[:4])
            response_text = f"We currently do not have matching options for '{payload.message}' in our catalog. You can explore our available categories: {cat_list or 'services'} or ask our team for details."


    # Dynamic suggestion chips based on context
    suggestion_chips: list[str] = []
    if not matched_services and categories:
        suggestion_chips = [c.name for c in categories[:5]]
    elif matched_services:
        suggestion_chips = [s.name for s in matched_services[:3]]

    return ChatTurnResponse(
        session_id=payload.session_id,
        response=response_text,
        matching_services=matched_services,
        suggested_action="browse_services" if matched_services else "browse_categories",
        suggestion_chips=suggestion_chips,
    )
