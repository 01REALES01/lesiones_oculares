import { useState, useEffect, useCallback } from "react";

const API = "/api";

export default function App() {
  const [file, setFile] = useState(null);
  const [models, setModels] = useState({ A: true, B: true, C: true });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      const r = await fetch(`${API}/history?limit=20`);
      const data = await r.json();
      setHistory(data.inferences || []);
    } catch (e) {
      console.warn("No se pudo cargar historial", e);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleAnalyze = async () => {
    if (!file) {
      setError("Selecciona una imagen.");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    const modelsStr = Object.entries(models)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(",");
    if (!modelsStr) {
      setError("Selecciona al menos un modelo (A, B o C).");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API}/analyze-retina/?models=${modelsStr}&include_heatmap=true`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || res.statusText);
      }
      const data = await res.json();
      setResult(data);
      fetchHistory();
    } catch (e) {
      setError(e.message || "Error al analizar.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryDetail = async (inferenceId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/inferences/${inferenceId}`);
      if (!res.ok) throw new Error("No encontrado");
      const data = await res.json();
      setResult(data.result || data);
      setSelectedHistoryId(inferenceId);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const postprocessing = result?.postprocessing;
  const graphData = postprocessing?.graph_data;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Análisis de retinografías</h1>
        <p>Plataforma de apoyo clínico y educativo. Carga una imagen, elige los modelos y revisa los resultados.</p>
      </header>

      <div className="disclaimer-banner">
        <strong>Uso informativo.</strong> Este sistema no constituye diagnóstico médico. Los resultados deben ser interpretados por un profesional de la salud.
      </div>

      <section className="section">
        <h2>1. Cargar imagen</h2>
        <div
          className={`upload-zone ${file ? "has-file" : ""}`}
          onClick={() => document.getElementById("file-input").click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setResult(null);
            }}
          />
          {file ? file.name : "Haz clic o arrastra una retinografía (jpg, png)"}
        </div>
      </section>

      <section className="section">
        <h2>2. Seleccionar modelos</h2>
        <div className="model-selection">
          <label>
            <input
              type="checkbox"
              checked={models.A}
              onChange={(e) => setModels((m) => ({ ...m, A: e.target.checked }))}
            />
            Modelo A (segmentación disco/copa, CDR)
          </label>
          <label>
            <input
              type="checkbox"
              checked={models.B}
              onChange={(e) => setModels((m) => ({ ...m, B: e.target.checked }))}
            />
            Modelo B (clasificación glaucoma)
          </label>
          <label>
            <input
              type="checkbox"
              checked={models.C}
              onChange={(e) => setModels((m) => ({ ...m, C: e.target.checked }))}
            />
            Modelo C (detección lesiones)
          </label>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleAnalyze}
          disabled={loading || !file}
        >
          {loading ? "Analizando…" : "Analizar"}
        </button>
      </section>

      {error && <p className="error-msg">{error}</p>}

      {result && (
        <section className="section results-panel">
          <h2>Resultados</h2>
          {result.inference_id && (
            <div className="traceability">
              ID de inferencia: <code>{result.inference_id}</code>
              {result.traceability?.inference_times_ms && (
                <> · Tiempos (ms): {Object.entries(result.traceability.inference_times_ms).map(([k, v]) => `${k}: ${Math.round(v)}`).join(", ")}</>
              )}
            </div>
          )}
          <div className="metrics">
            {result.cup_to_disc_ratio != null && (
              <div className="metric">
                <strong>CDR</strong>
                <span>{result.cup_to_disc_ratio?.toFixed(2) ?? "—"}</span>
              </div>
            )}
            {result.glaucoma_probability != null && (
              <div className="metric">
                <strong>Prob. glaucoma</strong>
                <span>{(result.glaucoma_probability * 100).toFixed(1)}%</span>
              </div>
            )}
            {result.lesions_found?.length != null && (
              <div className="metric">
                <strong>Lesiones</strong>
                <span>{result.lesions_found.length}</span>
              </div>
            )}
          </div>
          {graphData?.probability_bars?.length > 0 && (
            <div className="graph-bars">
              <strong>Probabilidades</strong>
              {graphData.probability_bars.map((b) => (
                <div key={b.name} className="bar-row">
                  <span className="bar-label">{b.name}</span>
                  <div className="bar-fill" style={{ width: `${b.percent}%` }} />
                  <span>{b.percent}%</span>
                </div>
              ))}
            </div>
          )}
          {graphData?.inference_time_bars?.length > 0 && (
            <div className="graph-bars">
              <strong>Tiempos de inferencia (ms)</strong>
              {graphData.inference_time_bars.map((b) => (
                <div key={b.model} className="bar-row">
                  <span className="bar-label">Modelo {b.model}</span>
                  <div className="bar-fill" style={{ width: `${Math.min(100, b.ms / 2)}%` }} />
                  <span>{b.ms} ms</span>
                </div>
              ))}
            </div>
          )}
          {result.recommendation && (
            <div className="recommendation">
              <strong>Recomendación:</strong> {result.recommendation}
            </div>
          )}
          {result.heatmap_image_base64 && (
            <div>
              <strong>Mapa de relevancia (explicabilidad)</strong>
              <img
                src={`data:image/png;base64,${result.heatmap_image_base64}`}
                alt="Heatmap"
                style={{ maxHeight: 320 }}
              />
            </div>
          )}
          {result.disclaimer && (
            <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.75rem" }}>{result.disclaimer}</p>
          )}
        </section>
      )}

      <section className="section">
        <h2>Historial de análisis</h2>
        <ul className="history-list">
          {history.length === 0 && <li>Aún no hay análisis. Ejecuta uno arriba.</li>}
          {history.map((item) => (
            <li key={item.inference_id}>
              <span>
                {new Date(item.timestamp).toLocaleString()} · Modelos: {item.models_used?.join(", ")}
                {item.summary?.cup_to_disc_ratio != null && ` · CDR: ${item.summary.cup_to_disc_ratio}`}
                {item.summary?.glaucoma_probability != null && ` · Glaucoma: ${(item.summary.glaucoma_probability * 100)?.toFixed(1)}%`}
              </span>
              <button type="button" onClick={() => loadHistoryDetail(item.inference_id)}>
                Ver detalle
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
