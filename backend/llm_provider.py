from abc import ABC, abstractmethod
from typing import List, Generator
import os
from openai import OpenAI
import google.generativeai as genai
from anthropic import Anthropic
from .config import get_settings

settings = get_settings()

class BaseLLMProvider(ABC):
    @abstractmethod
    def generate_stream(self, messages: List[dict], model: str) -> Generator[str, None, None]:
        pass

class OllamaProvider(BaseLLMProvider):
    def generate_stream(self, messages: List[dict], model: str = "llama3") -> Generator[str, None, None]:
        # Ollama supports OpenAI-compatible API
        client = OpenAI(
            base_url=f"{settings.OLLAMA_BASE_URL}/v1",
            api_key="ollama", 
        )
        try:
            stream = client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
            )
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"Error connecting to Ollama: {str(e)}"

class OpenAIProvider(BaseLLMProvider):
    def generate_stream(self, messages: List[dict], model: str = "gpt-4o") -> Generator[str, None, None]:
        if not settings.OPENAI_API_KEY:
            yield "Error: OpenAI API Key not configured."
            return
        
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        try:
            stream = client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True
            )
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"Error connecting to OpenAI: {str(e)}"

class GeminiProvider(BaseLLMProvider):
    def generate_stream(self, messages: List[dict], model: str = "gemini-pro") -> Generator[str, None, None]:
        if not settings.GEMINI_API_KEY:
            yield "Error: Gemini API Key not configured."
            return
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model_instance = genai.GenerativeModel(model)
        
        # Convert messages to Gemini format
        chat_history = []
        last_user_message = ""
        
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            if msg["role"] == "system":
                 # Gemini doesn't have a direct system role in chat history the same way, 
                 # usually prepend to first user message or use system instructions (beta)
                 # For simplicity, we'll prepend to the prompt or ignore for now if not supported directly in simpler chat.
                 continue
            
            if role == "user":
                last_user_message = msg["content"]
            else:
                chat_history.append({"role": role, "parts": [msg["content"]]})

         # For simple turn-based, we might just use generate_content for the last message with history
        try:
            response = model_instance.generate_content(last_user_message, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"Error connecting to Gemini: {str(e)}"

class AnthropicProvider(BaseLLMProvider):
    def generate_stream(self, messages: List[dict], model: str = "claude-3-opus-20240229") -> Generator[str, None, None]:
        if not settings.ANTHROPIC_API_KEY:
            yield "Error: Anthropic API Key not configured."
            return
            
        client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        
        # Extract system message if present
        system_message = None
        filtered_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                filtered_messages.append(msg)

        try:
            kwargs = {
                "max_tokens": 1024,
                "messages": filtered_messages,
                "model": model,
                "stream": True,
            }
            if system_message:
                kwargs["system"] = system_message

            with client.messages.stream(**kwargs) as stream:
                for text in stream.text_stream:
                    yield text
        except Exception as e:
            yield f"Error connecting to Anthropic: {str(e)}"

def get_llm_provider(provider_name: str) -> BaseLLMProvider:
    providers = {
        "ollama": OllamaProvider(),
        "openai": OpenAIProvider(),
        "gemini": GeminiProvider(),
        "anthropic": AnthropicProvider(),
    }
    return providers.get(provider_name, OllamaProvider())
