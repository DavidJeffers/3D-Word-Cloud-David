# 3D Word Cloud

An interactive full-stack web app that transforms any news article URL into an animated 3D word cloud. Paste a link, and the app scrapes the article, extracts the most meaningful keywords using TF-IDF, and renders them as an interactive 3D visualization — with an AI-powered summary and per-word explanations via Google Gemini.

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ and pnpm
- A [Google AI Studio](https://aistudio.google.com/) API key _(optional — required only for the AI summary and word explanation features)_

### Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/DavidJeffers/3D-Word-Cloud-David.git
   ```

2. **Optional: Add your Gemini API key**

   Create a `.env` file inside the `backend/` directory:

   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the setup script**

   From the project root:

   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   This installs all Python and Node dependencies and starts both servers concurrently. When you see both servers running, open your browser to:
   - **Frontend:** http://localhost:5173
   - **Backend API docs:** http://localhost:8000/docs

---

## Using the App

1. **Enter a URL** — paste any news article link into the input field, or click one of the pre-populated sample articles.
2. **Generate** — click the Generate button. Two things happen in parallel:
   - The 3D word cloud appears as soon as keyword extraction finishes (a few seconds).
   - An AI-written article summary loads in the sidebar below the input.
3. **Explore the cloud** — drag to rotate, scroll to zoom, hover over words to highlight them.
4. **Click a word** — selecting a word sends it to Gemini along with the full article context. The sidebar displays a short explanation of _why that specific word matters in that article_ — not a generic dictionary definition.
5. **Try another article** — enter a new URL and repeat.

---

## Architecture

### Overview

```
┌─────────────────────────────────────────────────────┐
│                      Browser                        │
│   React + React Three Fiber  (port 5173)            │
│   ┌──────────────┐   ┌──────────────────────────┐   │
│   │   Sidebar    │   │   3D Canvas (WebGL)       │   │
│   │  URL input   │   │   Word Cloud + Controls   │   │
│   │  AI summary  │   │   Billboard text nodes    │   │
│   │  Word panel  │   │   Spherical word layout   │   │
│   └──────────────┘   └──────────────────────────┘   │
└───────────────────┬─────────────────────────────────┘
                    │ HTTP (fetch)
┌───────────────────▼─────────────────────────────────┐
│           FastAPI Backend  (port 8000)               │
│                                                      │
│  POST /analyze  → scrape + TF-IDF keywords            │
│  POST /summary  → scrape + Gemini summary             │
│  POST /explain  → scrape + Gemini word context        │
│  GET  /health   → liveness check                     │
│                                                      │
│  Services: scraper → nlp → Gemini AI                 │
│  In-memory LRU cache on summaries and scraper        │
└──────────────────────────────────────────────────────┘
```

### Backend

**Entry point:** `backend/main.py` — a thin FastAPI app that registers middleware and mounts routers. All logic lives in the layers below it.

```
backend/
├── main.py
├── requirements.txt
├── .env                    ← GEMINI_API_KEY (not committed)
├── core/
│   └── config.py           ← env vars, CORS origins
├── models/
│   └── schemas.py          ← Pydantic request/response models
├── services/
│   ├── scraper.py          ← article fetching + LRU cache
│   ├── nlp.py              ← TF-IDF keyword extraction + NLTK preprocessing
│   └── llm.py              ← Gemini client init + cached summary/explain calls
└── routers/
    └── api.py              ← all route handlers in one file
```

**Request flow for `/analyze`:**

1. `scraper.py` — `fetch_article_text(url)` uses **trafilatura** to fetch and strip the raw HTML down to just the article body. The result is cached by URL via `@lru_cache` so concurrent calls (the frontend fires `/analyze` and `/summary` at the same time) only hit the network once.
2. `nlp.py` — `extract_keywords(text)` runs the text through **NLTK** (tokenize → lowercase → remove stopwords → lemmatize) then fits a **scikit-learn** TF-IDF vectorizer on the cleaned text to score each term by relevance. The top 35 scored terms are returned as `[{ word, weight }]`.
3. The router serializes the result through a Pydantic response model and returns it as JSON.

**Gemini routes** (`/summary`, `/explain`) follow the same scrape-then-LLM pattern. The article text is retrieved from the scraper cache and sent to **Gemini 2.5 Flash** with a targeted prompt. Both routes are also `@lru_cache`'d — clicking the same word twice never makes a second API call. The Gemini client itself is initialized in `services/llm.py`.

**Python packages:**

| Package         | Purpose                                           |
| --------------- | ------------------------------------------------- |
| `fastapi`       | Web framework — routing, validation, OpenAPI docs |
| `uvicorn`       | ASGI server that runs FastAPI                     |
| `pydantic`      | Request/response schema validation                |
| `trafilatura`   | HTML scraping and article text extraction         |
| `scikit-learn`  | TF-IDF vectorizer for keyword scoring             |
| `nltk`          | Tokenization, stopword removal, lemmatization     |
| `google-genai`  | Official Gemini AI SDK                            |
| `python-dotenv` | Loads `GEMINI_API_KEY` from `.env`                |

---

### Frontend

**Entry point:** `frontend/src/main.tsx` — standard React + Vite bootstrap.

```
frontend/src/
├── main.tsx              ← React root
├── App.tsx               ← layout, state, API calls (React Query)
├── App.css               ← sidebar + layout styles
├── index.css             ← global design tokens
└── components/
    └── WordCloud.tsx     ← entire 3D scene
```

**`App.tsx`** manages all application state and data fetching. It uses **TanStack Query** (`useQuery`) for the `/analyze` and `/summary` calls, which gives automatic loading/error states, deduplication of in-flight requests, and caching by URL — so switching back to a previous URL never re-fetches.

**`WordCloud.tsx`** is the entire Three.js scene, built with **React Three Fiber**. Key pieces:

- **Spherical layout** — `useMemo` distributes word positions across a sphere using phi/theta math derived from each word's index and weight. This ensures even spread and only recomputes when the words array changes.
- **`<Billboard>`** from `@react-three/drei` — wraps each word so it always rotates to face the camera, keeping every label readable at any rotation angle.
- **`<Text>`** from `troika-three-text` — GPU-rendered SDF text (crisp at any zoom level, no canvas pixel blowup).
- **`useFrame`** — runs the hover animation at 60fps. On hover, the word smoothly scales to 1.4× via `lerp` using a stable `useRef` vector (no per-frame allocations).
- **`<OrbitControls>`** — drag, zoom, and rotate the cloud with mouse or touch.
- Word size is mapped from the TF-IDF weight, and color is assigned using a dynamic HSL scale (`hsl(${hue}, 80%, 65%)`) where the hue adjusts based on the word's weight relative to the maximum weight.

**TypeScript packages:**

| Package                 | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `@react-three/fiber`    | React renderer for Three.js                            |
| `@react-three/drei`     | Three.js helpers: `Billboard`, `OrbitControls`, `Text` |
| `three`                 | Core 3D engine (WebGL abstraction)                     |
| `troika-three-text`     | High-quality SDF text rendering in WebGL               |
| `@tanstack/react-query` | Async data fetching, caching, loading states           |
| `vite`                  | Dev server and build tool                              |

---

## Notes

- The `.env` file is gitignored. You must create it manually — see Setup above.
- `setup.sh` is written for macOS. It uses `pnpm` for the frontend and creates a Python virtual environment at `.venv/` in the backend directory.
- Article scraping works best on standard news sites (BBC, NYT, Reuters, etc.). Paywalled or JavaScript-heavy pages may return limited text.
- The backend runs with `--reload` in development, so any changes to Python files restart the server automatically.
- Gemini responses for both `/summary` and `/explain` are cached in memory for the lifetime of the server process. Restarting the backend clears the cache.
