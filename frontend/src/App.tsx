import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import WordCloud, { type WordData } from "./WordCloud";
import "./App.css";

const SAMPLE_LINKS = {
  "React Wiki": "https://en.wikipedia.org/wiki/React_(software)",
  "Three.js Wiki": "https://en.wikipedia.org/wiki/Three.js",
  "NLP Overview": "https://en.wikipedia.org/wiki/Natural_language_processing",
};

function App() {
  const [url, setUrl] = useState("");
  const [words, setWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const handleAnalyze = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setLoading(true);
    setError(null);
    setWords([]);
    setSummary(null);
    setSummaryLoading(true);

    fetch("http://localhost:8000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: targetUrl }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error: ${res.statusText}`);
        return res.json();
      })
      .then((data) => setWords(data.topics))
      .catch((err) => setError(err.message || "Failed to analyze URL."))
      .finally(() => setLoading(false));

    fetch("http://localhost:8000/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: targetUrl }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to generate summary");
        return res.json();
      })
      .then((data) => setSummary(data.summary))
      .catch((err) => console.error("Summary error:", err))
      .finally(() => setSummaryLoading(false));
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>3D Word Cloud</h1>
        <p className="subtitle">
          Enter an article URL to extract topics and visualize them.
        </p>

        <div className="input-group">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            disabled={loading}
          />
          <button onClick={() => handleAnalyze(url)} disabled={loading || !url}>
            {loading ? "Analyzing..." : "Generate"}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="samples">
          <p>Or try a sample link:</p>
          <ul>
            {Object.entries(SAMPLE_LINKS).map(([label, link]) => (
              <li key={label}>
                <button
                  className="sample-btn"
                  onClick={() => {
                    setUrl(link);
                    handleAnalyze(link);
                  }}
                  disabled={loading}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="summary-section">
          {summaryLoading && (
            <p className="text-muted">Generating AI summary...</p>
          )}
          {summary && (
            <div className="summary-box">
              <h3>Article Summary</h3>
              <p>{summary}</p>
            </div>
          )}
        </div>
      </aside>

      <main className="canvas-container">
        {loading && (
          <div className="overlay">Extracting text & running NLP...</div>
        )}

        {!loading && words.length === 0 && !error && (
          <div className="overlay text-muted">Awaiting input...</div>
        )}

        {words.length > 0 && (
          <Canvas camera={{ position: [0, 0, 25], fov: 60 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            <WordCloud words={words} />

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
            />
          </Canvas>
        )}
      </main>
    </div>
  );
}

export default App;
