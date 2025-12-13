from tavily import TavilyClient
import os
from app.models import BrandProfile, NewsInput
from typing import List

def get_tavily():
    api_key = os.getenv("TAVILY_API_KEY")
    if not api_key:
        # Mock for development if key is missing
        return None
    return TavilyClient(api_key=api_key)

async def search_brand_mentions(brand: BrandProfile) -> List[NewsInput]:
    """
    Searches for recent news about the brand using Tavily.
    """
    client = get_tavily()
    if not client:
        # Mock response
        return [
            NewsInput(
                url="https://example.com/mock-news",
                text=f"Mock news about {brand.name}. They released a new amazing product that changes the market.",
                brand_profile=brand
            )
        ]
        
    query = f"{brand.name} {' OR '.join(brand.keywords)}"
    
    try:
        response = client.search(
            query=query,
            search_depth="advanced",
            topic="news",
            days=1
        )
        
        results = []
        for result in response.get("results", []):
            results.append(NewsInput(
                url=result["url"],
                text=result["content"], # Tavily returns a snippet/content
                brand_profile=brand
            ))
            
        return results
        
    except Exception as e:
        print(f"Tavily Search Error: {e}")
        return []
