import os
from core.config import GEMINI_MODEL
from functools import lru_cache
from fastapi import HTTPException
from google import genai
from services.scraper import fetch_article_text

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client() if api_key else None

@lru_cache(maxsize=100)
def generate_cached_summary(url: str) -> str:
    if not client:
        return "AI summary generation is disabled because no Gemini API key was provided locally."
        
    text = fetch_article_text(url)
    prompt = f"Please provide a short, concise summary (about 3-4 sentences) of the following article:\n\n{text}"
    
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        return response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")

@lru_cache(maxsize=500)
def generate_cached_explanation(url: str, word: str) -> str:
    if not client:
        return f"AI explanation for '{word}' is disabled because no Gemini API key was provided locally."

    text = fetch_article_text(url)
    prompt = f"Based on the following article, explain how the word '{word}' is relevant or impactful to the overall context of the text. Keep the explanation to 2-3 concise sentences.\n\nArticle Text:\n{text}"
    
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        return response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")