from fastapi import APIRouter
from models.schemas import (
    AnalyzeRequest, AnalyzeResponse, 
    SummaryResponse, ExplainRequest, ExplainResponse
)
from services.scraper import fetch_article_text
from services.nlp import extract_keywords
from services.llm import generate_cached_summary, generate_cached_explanation

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(body: AnalyzeRequest):
    text = fetch_article_text(str(body.url))
    keywords = extract_keywords(text, top_n=35)
    return AnalyzeResponse(topics=keywords)

@router.post("/summary", response_model=SummaryResponse)
def summarize(body: AnalyzeRequest):
    summary_text = generate_cached_summary(str(body.url))
    return SummaryResponse(summary=summary_text)

@router.post("/explain", response_model=ExplainResponse)
def explain(body: ExplainRequest):
    explanation_text = generate_cached_explanation(str(body.url), body.word)
    return ExplainResponse(explanation=explanation_text)