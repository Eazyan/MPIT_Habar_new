from typing import TypedDict, Annotated, List, Dict
from app.models import NewsInput, NewsAnalysis, GeneratedPost

class AgentState(TypedDict):
    input: NewsInput
    user_id: int  # Current user ID for data isolation
    analysis: NewsAnalysis
    context: List[str] # Retrieved from RAG
    posts: List[GeneratedPost]
    errors: List[str]
