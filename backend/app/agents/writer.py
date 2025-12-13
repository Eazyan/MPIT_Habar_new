from langchain_core.messages import SystemMessage, HumanMessage
from app.agents.state import AgentState
from app.models import GeneratedPost, Platform
from app.llm_factory import get_llm
import os

def writer_node(state: AgentState) -> AgentState:
    """Generates posts based on analysis and context."""
    print("--- WRITER AGENT ---")
    
    if state.get("errors"):
        return {"errors": state["errors"]}
        
    # Get model provider from input
    model_provider = state['input'].model_provider if state.get('input') else "claude"
    
    analysis = state.get('analysis')
    if not analysis:
        return {"errors": ["No analysis found. Analyzer agent likely failed."]}

    context = state.get('context', [])
    context_str = "\n".join(context)
    
    # Define platforms and their specific strategies
    platforms = [
        Platform.TELEGRAM, 
        Platform.VK, 
        Platform.TENCHAT,
        Platform.VC,
        Platform.DZEN,
        Platform.EMAIL,
        Platform.PRESS_RELEASE
    ]
    
    posts = []
    
    try:
        llm = get_llm(model_provider)
        
        # Extract brand name and mode safely
        mode = state.get("mode", "pr")
        target_brand = state.get("target_brand")
        brand_name = "Unknown Brand"
        
        if mode == "blogger":
            brand_name = target_brand or "Unknown Brand"
            role_description = f"You are a TECH/BUSINESS BLOGGER reviewing news about {brand_name}."
            voice_instruction = f"Write as an independent blogger giving your opinion on {brand_name}."
        else:
            # PR mode
            if state.get("input") and state["input"].brand_profile:
                brand_name = state["input"].brand_profile.name
            role_description = f"You are the Head of Communications for {brand_name}."
            voice_instruction = f"Write AS {brand_name}. You are the official voice of the brand."

        for platform in platforms:
            # Define specific constraints per platform
            if platform == Platform.EMAIL:
                style_guide = """
                ФОРМАТ СЛУЖЕБНОЙ ЗАПИСКИ.
                Структура:
                Тема: [Четкая, побуждающая к действию тема]
                Кому: [Целевые стейкхолдеры]
                Рекомендация: [Конкретный совет]
                
                Текст:
                [Краткий анализ ситуации и обоснование позиции. Официально, но прямо.]
                """
            elif platform == Platform.PRESS_RELEASE:
                style_guide = """
                ФОРМАТ ОФИЦИАЛЬНОГО ПРЕСС-РЕЛИЗА.
                Структура:
                ДЛЯ НЕМЕДЛЕННОГО РАСПРОСТРАНЕНИЯ
                
                [ЗАГОЛОВОК]
                
                [Город, Дата] — [Лид-абзац]
                
                [Основной текст]
                
                [О компании]
                
                Контакты для СМИ:
                [Имя/Email]
                """
            elif platform == Platform.TELEGRAM:
                style_guide = "Telegram Channel Style. Use Markdown (*bold*) and Emojis 🚀. Short paragraphs."
            else:
                style_guide = "Engaging social media style. Emojis allowed. NO Markdown headers. Ready to publish."

            prompt = f"""
            {voice_instruction}
            
            CRITICAL RULES:
            1. **Perspective**: {voice_instruction}
            2. **Language**: The post MUST be in RUSSIAN (except for the Image Prompt).
            3. **Structure**: Follow the Style Guide for {platform.value} strictly.
            4. **Grounding**: Base content on facts.
            
            Analysis:
            - Summary: {analysis.summary}
            - Facts: {", ".join(analysis.facts)}
            - Sentiment: {analysis.sentiment}
            - PR Verdict: {analysis.pr_verdict} ({analysis.pr_reasoning})
            
            Brand Context:
            {context_str}
            
            Style Guide: {style_guide}
            
            REQUIRED OUTPUT FORMAT:
            1. Output ONLY the final post text.
            2. For Email/Press Release, include the headers (Subject, Title) as part of the text.
            3. Do NOT include "Image Prompt:" label.
            
            At the very end, strictly separated by "|||", provide the Image Prompt in English.
            """
            
            messages = [
                SystemMessage(content=role_description),
                HumanMessage(content=prompt)
            ]
            
            response = llm.invoke(messages)
            
            # Parse content and image prompt
            full_content = response.content
            content = full_content
            image_prompt = "Abstract modern technology, 4k, digital art" # Default
            
            if "|||" in full_content:
                parts = full_content.split("|||")
                content = parts[0].strip()
                if len(parts) > 1:
                    image_prompt = parts[1].strip()
            
            posts.append(GeneratedPost(
                platform=platform,
                content=content,
                image_prompt=image_prompt,
                status="draft"
            ))
            
    except Exception as e:
        return {"errors": [f"Writer LLM Error: {str(e)}"]}
        
    return {"posts": posts}
