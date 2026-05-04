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

  const handleAnalyze = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setLoading(true);
    setError(null);
    setWords([]);

    try {
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setWords(data.topics);
      console.log(data.topics, "data in app", data.topics.length);
    } catch (err: any) {
      setError(err.message || "Failed to analyze URL.");
    } finally {
      setLoading(false);
    }
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
