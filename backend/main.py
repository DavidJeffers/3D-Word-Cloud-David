from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import trafilatura
import nltk
import re
from sklearn.feature_extraction.text import TfidfVectorizer

nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    url: HttpUrl

class WordWeight(BaseModel):
    word: str
    weight: float

class AnalyzeResponse(BaseModel):
    topics: list[WordWeight]


def fetch_article_text(url: str) -> str:
    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        raise HTTPException(status_code=422, detail="Could not fetch the article.")

    text = trafilatura.extract(downloaded, include_comments=False, include_tables=False)
    if not text or len(text.strip()) < 100:
        raise HTTPException(status_code=422, detail="Could not extract meaningful text from the article.")

    return text


def extract_keywords(text: str, top_n: int = 35) -> list[WordWeight]:
    lemmatizer = WordNetLemmatizer()

    weak = {"also", "could", "due", "like", "good", "get", "see", "one", "said", "since", "set", "come"}
    stop_words = set(stopwords.words("english")) | weak
    cleaned = re.sub(r"http\S+", " ", text.lower())
    cleaned = re.sub(r"[^a-zA-Z\s]", " ", cleaned)

  
    words = []
    for w in cleaned.split():
        if len(w) > 2 and w not in stop_words:
            lemma = lemmatizer.lemmatize(w)
            if lemma not in stop_words:
                words.append(lemma)
    cleaned = " ".join(words)

    vectorizer = TfidfVectorizer(
        max_features=top_n,
        ngram_range=(1, 1),
        min_df=1,
    )

    tfidf_matrix = vectorizer.fit_transform([cleaned])
    scores = tfidf_matrix.toarray()[0]
    vocab = vectorizer.get_feature_names_out()

    results = [
        WordWeight(word=word, weight=round(float(score), 4))
        for word, score in zip(vocab, scores)
        if score > 0
    ]

    results.sort(key=lambda x: x.weight, reverse=True)
    return results


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(body: AnalyzeRequest):
    text = fetch_article_text(str(body.url))
    keywords = extract_keywords(text, top_n=35)
    return AnalyzeResponse(topics=keywords)