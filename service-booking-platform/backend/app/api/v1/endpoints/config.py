import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.security import encrypt_secret
from app.models.merchant import Merchant
from app.schemas.config import AgentConfigResponse, AgentConfigUpdate

router = APIRouter()


# Retrieves existing agent configuration, greeting, and model parameters for a merchant
@router.get("/{merchant_id}", response_model=AgentConfigResponse)
async def get_agent_config(merchant_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Retrieves the current LLM agent configuration for a merchant."""
    merchant = await db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    return AgentConfigResponse(
        llm_provider=merchant.llm_provider,
        llm_model_id=merchant.llm_model_id,
        has_api_key=bool(merchant.encrypted_api_key),
        system_prompt=merchant.system_prompt,
        agent_greeting=merchant.agent_greeting,
    )


# Updates LLM provider, model choice, encrypted BYOK secret, system prompt, and agent greeting
@router.patch("/{merchant_id}", response_model=AgentConfigResponse)
async def update_agent_config(
    merchant_id: uuid.UUID,
    payload: AgentConfigUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Updates LLM provider, model, system prompt, and BYOK API key."""
    merchant = await db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    if payload.llm_provider is not None:
        merchant.llm_provider = payload.llm_provider
    if payload.llm_model_id is not None:
        merchant.llm_model_id = payload.llm_model_id
    if payload.api_key is not None:
        merchant.encrypted_api_key = encrypt_secret(payload.api_key)
    if payload.system_prompt is not None:
        merchant.system_prompt = payload.system_prompt
    if payload.agent_greeting is not None:
        merchant.agent_greeting = payload.agent_greeting

    await db.commit()
    await db.refresh(merchant)

    return AgentConfigResponse(
        llm_provider=merchant.llm_provider,
        llm_model_id=merchant.llm_model_id,
        has_api_key=bool(merchant.encrypted_api_key),
        system_prompt=merchant.system_prompt,
        agent_greeting=merchant.agent_greeting,
    )
