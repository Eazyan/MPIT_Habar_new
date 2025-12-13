from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
import os

def get_llm(model_provider: str = "claude"):
    """
    Factory to get the appropriate LLM client.
    model_provider: 'claude', 'qwen', 'deepseek'
    """
    
    if model_provider == "claude":
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY is not set")
        return ChatAnthropic(
            model="claude-sonnet-4-20250514",
            api_key=api_key,
            temperature=0.7
        )
        
    elif model_provider == "qwen":
        api_key = os.getenv("OPENROUTER_API_KEY")
        base_url = os.getenv("OPENAI_API_BASE", "https://openrouter.ai/api/v1")
        # Use the specific model requested or default to 72B
        model_name = "qwen/qwen-2.5-72b-instruct"
        
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY is not set")
            
        return ChatOpenAI(
            model=model_name,
            api_key=api_key,
            base_url=base_url,
            temperature=0.7
        )
        
    elif model_provider == "deepseek":
        api_key = os.getenv("OPENROUTER_API_KEY")
        base_url = os.getenv("OPENAI_API_BASE", "https://openrouter.ai/api/v1")
        model_name = "deepseek/deepseek-chat" # OpenRouter alias
        
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY is not set")
            
        return ChatOpenAI(
            model=model_name,
            api_key=api_key,
            base_url=base_url,
            temperature=0.7
        )
        
    elif model_provider == "ollama":
        from langchain_ollama import ChatOllama
        base_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
        # User specified model
        model_name = "gpt-oss:20B" 
        
        return ChatOllama(
            model=model_name,
            base_url=base_url,
            temperature=0.7
        )
    
    else:
        # Default to Claude
        return get_llm("claude")
