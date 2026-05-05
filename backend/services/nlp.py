import nltk
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from models.schemas import WordWeight

nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

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