from typing import Any, cast
import anthropic
import openai

from app.core.security import decrypt_secret


class LLMProviderFactory:
    """Dynamically instantiates and returns configured LLM client per merchant configuration."""

    # Routes conversational inference request to the configured dynamic BYOK provider (OpenAI, Anthropic, Gemini, Groq, DeepSeek, Ollama)
    @staticmethod
    def get_completion(
        provider: str,
        encrypted_api_key: str,
        model_id: str,
        system_prompt: str,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
    ) -> str:
        api_key = decrypt_secret(encrypted_api_key)

        if provider.lower() == "openai":
            client = openai.OpenAI(api_key=api_key)
            formatted_messages: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}] + list(messages)
            response = client.chat.completions.create(
                model=model_id,
                messages=cast(Any, formatted_messages),
                temperature=temperature,
            )
            return response.choices[0].message.content or ""

        elif provider.lower() == "anthropic":
            client = anthropic.Anthropic(api_key=api_key)
            anthropic_messages: list[dict[str, Any]] = [
                {"role": m.get("role", "user"), "content": m.get("content", "")}
                for m in messages
                if m.get("role") != "system"
            ]
            response = client.messages.create(
                model=model_id,
                max_tokens=1024,
                system=system_prompt,
                messages=cast(Any, anthropic_messages),
                temperature=temperature,
            )
            return response.content[0].text

        elif provider.lower() == "groq":
            client = openai.OpenAI(
                base_url="https://api.groq.com/openai/v1",
                api_key=api_key,
            )
            formatted_messages = [{"role": "system", "content": system_prompt}] + list(messages)
            response = client.chat.completions.create(
                model=model_id,
                messages=cast(Any, formatted_messages),
                temperature=temperature,
            )
            return response.choices[0].message.content or ""

        elif provider.lower() == "deepseek":
            client = openai.OpenAI(
                base_url="https://api.deepseek.com",
                api_key=api_key,
            )
            formatted_messages = [{"role": "system", "content": system_prompt}] + list(messages)
            response = client.chat.completions.create(
                model=model_id,
                messages=cast(Any, formatted_messages),
                temperature=temperature,
            )
            return response.choices[0].message.content or ""

        elif provider.lower() == "ollama":
            client = openai.OpenAI(
                base_url="http://localhost:11434/v1",
                api_key="ollama",
            )
            formatted_messages = [{"role": "system", "content": system_prompt}] + list(messages)
            response = client.chat.completions.create(
                model=model_id,
                messages=cast(Any, formatted_messages),
                temperature=temperature,
            )
            return response.choices[0].message.content or ""

        elif provider.lower() in ("gemini", "google"):
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            gemini_contents: list[str] = [m.get("content", "") for m in messages]
            response = client.models.generate_content(
                model=model_id or "gemini-2.5-flash",
                contents=cast(Any, gemini_contents),
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=temperature,
                ),
            )
            return response.text or ""

        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")
