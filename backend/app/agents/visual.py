import urllib.parse
from app.agents.state import AgentState

def visual_node(state: AgentState) -> AgentState:
    """Generates images for posts using Pollinations.ai."""
    print("--- VISUAL AGENT ---")
    
    posts = state.get('posts', [])
    updated_posts = []
    
    for post in posts:
        if post.image_prompt:
            # Encode prompt for URL
            encoded_prompt = urllib.parse.quote(post.image_prompt)
            # Add seed for consistency if needed, or random
            image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?nologo=true"
            
            post.image_url = image_url
            
        updated_posts.append(post)
        
    return {"posts": updated_posts}
