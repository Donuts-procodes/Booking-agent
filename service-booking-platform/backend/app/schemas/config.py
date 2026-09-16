from pydantic import BaseModel, ConfigDict


class AgentConfigUpdate(BaseModel):
    llm_provider: str | None = None
    llm_model_id: str | None = None
    api_key: str | None = None
    system_prompt: str | None = None
    agent_greeting: str | None = None


class AgentConfigResponse(BaseModel):
    llm_provider: str | None
    llm_model_id: str | None
    has_api_key: bool
    system_prompt: str | None
    agent_greeting: str | None

    model_config = ConfigDict(from_attributes=True)
