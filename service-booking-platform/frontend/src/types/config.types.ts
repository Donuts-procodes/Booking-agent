export interface AgentConfig {
  llm_provider: string | null;
  llm_model_id: string | null;
  has_api_key: boolean;
  system_prompt: string | null;
  agent_greeting: string | null;
}

export type LLMProvider = "openai" | "anthropic" | "gemini" | "deepseek" | "groq" | "ollama";
