import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useQuery } from "@tanstack/react-query";
import WordCloud, { type WordData } from "./components/WordCloud";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SAMPLE_LINKS = {
  "React Wiki": "https://en.wikipedia.org/wiki/React_(software)",
  "Three.js Wiki": "https://en.wikipedia.org/wiki/Three.js",
  "NLP Overview": "https://en.wikipedia.org/wiki/Natural_language_processing",
};

function App() {
  const [inputUrl, setInputUrl] = useState("");
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const {
    data: words = [],
    isFetching: isAnalyzing,
    error: analyzeError,
  } = useQuery({
    queryKey: ["analyze", activeUrl],
    queryFn: async ({ signal }) => {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: activeUrl }),
        signal,
      });
      if (!res.ok) throw new Error("Failed to analyze URL.");
      const data = await res.json();
      return data.topics as WordData[];
    },
    enabled: !!activeUrl,
    staleTime: Infinity,
  });

  const { data: summary, isFetching: isSummaryLoading } = useQuery({
    queryKey: ["summary", activeUrl],
    queryFn: async ({ signal }) => {
      const res = await fetch(`${API_BASE}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: activeUrl }),
        signal,
      });
      if (!res.ok) throw new Error("Failed to generate summary");
      const data = await res.json();
      return data.summary as string;
    },
    enabled: !!activeUrl,
    staleTime: Infinity,
  });

  const { data: explanation, isFetching: isExplanationLoading } = useQuery({
    queryKey: ["explain", activeUrl, selectedWord],
    queryFn: async ({ signal }) => {
      const res = await fetch(`${API_BASE}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: activeUrl, word: selectedWord }),
        signal,
      });
      if (!res.ok) throw new Error("Failed to explain word");
      const data = await res.json();
      return data.explanation as string;
    },
    enabled: !!activeUrl && !!selectedWord,
    staleTime: Infinity,
  });

  const handleAnalyze = (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setActiveUrl(targetUrl);
    setSelectedWord(null);
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>3D Word Cloud</h1>
        <p className="subtitle">
          Enter an article URL to extract topics and visualize them. Click words
          to learn more!
        </p>

        <div className="input-group">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="https://example.com/article"
            disabled={isAnalyzing}
          />
          <button
            onClick={() => handleAnalyze(inputUrl)}
            disabled={isAnalyzing || !inputUrl}
          >
            {isAnalyzing ? "Analyzing..." : "Generate"}
          </button>
        </div>

        {analyzeError && <div className="error">{analyzeError.message}</div>}

        <div className="samples">
          <p>Or try a sample link:</p>
          <ul>
            {Object.entries(SAMPLE_LINKS).map(([label, link]) => (
              <li key={label}>
                <button
                  className="sample-btn"
                  onClick={() => {
                    setInputUrl(link);
                    handleAnalyze(link);
                  }}
                  disabled={isAnalyzing}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="summary-section">
          {isExplanationLoading ? (
            <p className="text-muted">
              Analyzing relevance of "{selectedWord}"...
            </p>
          ) : explanation ? (
            <div className="summary-box">
              <h3>Why "{selectedWord}"?</h3>
              <p>{explanation}</p>
              <button
                className="sample-btn"
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem",
                  textAlign: "center",
                }}
                onClick={() => setSelectedWord(null)}
              >
                Back to Article Summary
              </button>
            </div>
          ) : isSummaryLoading ? (
            <p className="text-muted">Generating AI summary...</p>
          ) : summary ? (
            <div className="summary-box">
              <h3>Article Summary</h3>
              <p>{summary}</p>
            </div>
          ) : null}
        </div>
      </aside>

      <main className="canvas-container">
        {isAnalyzing && (
          <div className="overlay">Extracting text & running NLP...</div>
        )}

        {!isAnalyzing && words.length === 0 && !analyzeError && (
          <div className="overlay text-muted">Awaiting input...</div>
        )}

        <Canvas camera={{ position: [0, 0, 25], fov: 60 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          {words.length > 0 && (
            <WordCloud words={words} onWordClick={setSelectedWord} />
          )}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
        </Canvas>
      </main>
    </div>
  );
}

export default App;
