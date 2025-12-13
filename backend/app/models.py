from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum
from datetime import datetime

class Platform(str, Enum):
    TELEGRAM = "telegram"
    VK = "vk"
    TENCHAT = "tenchat"
    VC = "vc"
    DZEN = "dzen"
    EMAIL = "email"
    PRESS_RELEASE = "press_release"
    IMAGE = "image"

class BrandProfile(BaseModel):
    name: str = Field(..., description="Название бренда")
    description: str = Field(..., description="Описание деятельности")
    tone_of_voice: str = Field(..., description="Стиль общения (Tone of Voice)")
    target_audience: str = Field(..., description="Целевая аудитория")
    keywords: List[str] = Field(default=[], description="Ключевые слова для мониторинга")
    examples: List[str] = Field(default=[], description="Примеры удачных постов (Few-Shot)")
    
class NewsAnalysis(BaseModel):
    summary: str = Field(..., description="Краткая выжимка новости")
    facts: List[str] = Field(..., description="Список ключевых фактов")
    quotes: List[str] = Field(..., description="Цитаты из текста")
    sentiment: str = Field(..., description="Тональность новости (позитивная/негативная/нейтральная)")
    topics: List[str] = Field(..., description="Темы/Теги")
    relevance_score: int = Field(..., description="Оценка релевантности для бренда (0-100)")
    pr_verdict: str = Field(..., description="Вердикт PR-стратега (Отвечать/Игнорировать/...)")
    pr_reasoning: str = Field(..., description="Обоснование вердикта")
    category: str = Field(..., description="Категория новости: CRISIS, PRODUCT, COMPETITOR, ROUTINE")
    tips: List[str] = Field(default=[], description="Советы по реализации стратегии")

class GeneratedPost(BaseModel):
    platform: Platform
    content: str
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    status: str = "draft" # draft, approved, published

class NewsInput(BaseModel):
    url: Optional[str] = None
    text: Optional[str] = None
    model_provider: str = Field("claude", description="Модель: claude, qwen, deepseek")
    brand_profile: Optional[BrandProfile] = None # Context for analysis
    mode: str = Field("pr", description="Режим: blogger или pr")
    target_brand: Optional[str] = Field(None, description="Для блогера: бренд для анализа")

class MediaPlan(BaseModel):
    id: str
    created_at: datetime = Field(default_factory=datetime.now)
    original_news: NewsInput
    analysis: NewsAnalysis
    posts: List[GeneratedPost]
    liked: bool = False

class RegenerateRequest(BaseModel):
    plan_id: str
    platform: Platform
    original_news: NewsInput
    analysis: NewsAnalysis
    current_content: Optional[str] = None
