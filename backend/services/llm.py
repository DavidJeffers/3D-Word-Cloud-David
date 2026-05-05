from core.config import GEMINI_MODEL
from functools import lru_cache
from fastapi import HTTPException
from google import genai
from services.scraper import fetch_article_text

client = genai.Client()

@lru_cache(maxsize=100)
def generate_cached_summary(url: str) -> str:
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