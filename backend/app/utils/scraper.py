import httpx
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

async def scrape_url(url: str) -> str:
    """
    Fetches the content of a URL and extracts the text.
    """
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
            
        # Get text
        text = soup.get_text(separator='\n')
        
        # Break into lines and remove leading/trailing space on each
        lines = (line.strip() for line in text.splitlines())
        # Break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # Drop blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        # Limit length to avoid token limits
        return text[:15000]
        
    except Exception as e:
        logger.error(f"Error scraping {url}: {e}")
        return f"Error scraping content: {str(e)}"
