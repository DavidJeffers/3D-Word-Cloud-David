import trafilatura
from functools import lru_cache
from fastapi import HTTPException

@lru_cache(maxsize=100)
def fetch_article_text(url: str) -> str:
    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        raise HTTPException(status_code=422, detail="Could not fetch the article.")

    text = trafilatura.extract(downloaded, include_comments=False, include_tables=False)
    if not text or len(text.strip()) < 100:
        raise HTTPException(status_code=422, detail="Could not extract meaningful text from the article.")

    return text