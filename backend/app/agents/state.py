from typing import TypedDict, Annotated, List, Dict, Literal
from app.models import NewsInput, NewsAnalysis, GeneratedPost

class AgentState(TypedDict):
    input: NewsInput
    user_id: int  # Current user ID for data isolation
    mode: Literal["blogger", "pr"]  # Blogger or PR mode
    target_brand: str | None  # For blogger mode: brand they're covering
    analysis: NewsAnalysis
    context: List[str] # Retrieved from RAG
    posts: List[GeneratedPost]
    errors: List[str]
