from pydantic import BaseModel, HttpUrl

class AnalyzeRequest(BaseModel):
    url: HttpUrl

class ExplainRequest(BaseModel):
    url: HttpUrl
    word: str

class WordWeight(BaseModel):
    word: str
    weight: float

class AnalyzeResponse(BaseModel):
    topics: list[WordWeight]

class SummaryResponse(BaseModel):
    summary: str

class ExplainResponse(BaseModel):
    explanation: str