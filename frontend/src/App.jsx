import { useState, useEffect, useCallback } from "react";
import Landing from "./Landing";
import Login from "./Login";
import "./landing.css"; // Reuse some landing styles + new dashboard styles
import {
  UploadIcon, CheckIcon, AlertIcon, ArrowLeftIcon,
  CloseIcon, Sparkline, LogoutIcon, HomeIcon, HistoryIcon, UserIcon
} from "./Icons";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar, SidebarBody, SidebarLink } from "./components/ui/sidebar";
import { ExpandableTabs } from "./components/ui/expandable-tabs";
import { LayoutDashboard, FileClock, LogOut, Search, Eye, Activity, CloudUpload } from "lucide-react";

const API = "/api";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [showLanding, setShowLanding] = useState(!localStorage.getItem("token"));

  // Dashboard State
  const [activeTab, setActiveTab] = useState("upload"); // upload | history
  const [view, setView] = useState("dashboard"); // dashboard | result-detail
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data State
  const [files, setFiles] = useState([]);
  const [models, setModels] = useState({ A: true, B: true, C: true });
  const [drModelType, setDrModelType] = useState("resnet50v2");
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Auth Handlers ---
  const handleEnterApp = () => setShowLanding(false);
  const handleLoginSuccess = () => setToken(localStorage.getItem("token"));
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setShowLanding(true);
    setFiles([]);
    setResults(null);
    setActiveTab("upload");
  };

  const authHeaders = useCallback(() => ({ "Authorization": `Bearer ${token}` }), [token]);

  // --- Data Fetching ---
  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API}/history?limit=20`, { headers: authHeaders() });
      if (r.status === 401) { handleLogout(); return; }
      const data = await r.json();
      setHistory(data.inferences || []);
    } catch (e) {
      console.warn("Error cargando historial", e);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    if (token) fetchHistory();
  }, [token, fetchHistory]);

  // --- Actions ---
  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError("Por favor, selecciona al menos una imagen.");
      return;
    }
    setError(null);
    setResults(null);
    setLoading(true);

    const form = new FormData();
    files.forEach((f) => form.append("files", f));

    const modelsStr = Object.entries(models)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(",");

    try {
      const res = await fetch(`${API}/analyze-retina/?models=${modelsStr}&model_c_type=${drModelType}&include_heatmap=true`, {
        method: "POST", headers: authHeaders(), body: form,
      });

      if (res.status === 401) { handleLogout(); throw new Error("Sesión expirada."); }
      if (!res.ok) throw new Error((await res.json()).detail || res.statusText);

      const data = await res.json();
      setResults(data);
      setFiles([]); // Clear files after success
      fetchHistory(); // Refresh history
    } catch (e) {
      setError(e.message || "Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryDetail = async (inferenceId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/inferences/${inferenceId}`, { headers: authHeaders() });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Análisis no encontrado");
      const data = await res.json();
      setSelectedResult(data.result || data);
      setView("detail");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Render Routing ---
  if (showLanding && !token) return <Landing onEnterApp={handleEnterApp} />;
  if (!token) return <Login onLoginSuccess={handleLoginSuccess} onBack={() => setShowLanding(true)} />;

  const sidebarLinks = [
    {
      label: "Nuevo Análisis",
      href: "#",
      key: "upload",
      icon: <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => { setActiveTab("upload"); setView("dashboard"); }
    },
    {
      label: "Historial",
      href: "#",
      key: "history",
      icon: <FileClock className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
      onClick: () => { setActiveTab("history"); setView("dashboard"); }
    }
  ];

  return (
    <div className="dashboard-shell flex w-full h-screen overflow-hidden bg-neutral-100 dark:bg-[#0a0e1a]">
      {/* Dynamic Animated Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo area */}
            <div className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20 mb-8 mt-2 px-2">
              <div className="h-6 w-8 bg-blue-500 rounded-lg flex-shrink-0 shadow-lg shadow-blue-500/20" />
              <motion.span
                animate={{ display: sidebarOpen ? "inline-block" : "none", opacity: sidebarOpen ? 1 : 0 }}
                className="font-bold text-lg text-neutral-800 dark:text-white whitespace-pre"
              >
                RetinaAI
              </motion.span>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col gap-2">
              {sidebarLinks.map((link) => (
                <SidebarLink
                  key={link.key}
                  link={link}
                  onClick={link.onClick}
                  active={activeTab === link.key && view === "dashboard"}
                />
              ))}
            </div>
          </div>

          {/* Footer User Area */}
          <div>
            <div className="flex flex-col gap-2 border-t border-neutral-200 dark:border-neutral-800 pt-4">
              <div className="flex items-center gap-3 py-2 px-2">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-500">
                  <UserIcon />
                </div>
                <motion.div
                  animate={{ display: sidebarOpen ? "block" : "none", opacity: sidebarOpen ? 1 : 0 }}
                  className="flex flex-col"
                >
                  <span className="text-sm font-semibold text-neutral-800 dark:text-white">Dr. Admin</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">Oftalmólogo</span>
                </motion.div>
              </div>
              <SidebarLink
                onClick={handleLogout}
                className="log-out text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                link={{
                  label: "Cerrar Sesión",
                  href: "#",
                  icon: <LogOut className="h-5 w-5 flex-shrink-0" />
                }}
              />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-white/50 dark:bg-neutral-900/50 relative">
        <div className="mx-auto max-w-5xl w-full min-h-full p-4 md:p-8 lg:p-12">
          <AnimatePresence mode="wait">
            {view === "detail" && selectedResult ? (
              <ResultDetail
                key="detail"
                result={selectedResult}
                onBack={() => setView("dashboard")}
              />
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                {/* Header Section */}
                <header className="mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                    {activeTab === "upload" ? (
                      <><Sparkline className="h-6 w-6 text-blue-500" /> Analizar Nueva Retinografía</>
                    ) : (
                      "Historial de Evaluaciones"
                    )}
                  </h1>
                  <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    {activeTab === "upload"
                      ? "Cargue imágenes de fondo de ojo para detección asistida por IA."
                      : "Revise y exporte los resultados de análisis previos."
                    }
                  </p>
                </header>

                {activeTab === "upload" && (
                  <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 mt-4">
                    {/* Draggable upload zone redesigned purely with Tailwind */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm p-6 md:p-10 flex flex-col">
                      <div
                        className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${files.length > 0 ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : "border-neutral-300 dark:border-neutral-700 hover:border-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}
                        onClick={() => document.getElementById("file-input").click()}
                      >
                        <input
                          id="file-input" type="file" multiple accept="image/*" className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.length) { setFiles(Array.from(e.target.files)); setError(null); setResults(null); }
                          }}
                        />
                        <div className={`p-4 rounded-full mb-4 transition-colors ${files.length > 0 ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 group-hover:bg-blue-50 group-hover:text-blue-500"}`}>
                          <CloudUpload size={32} />
                        </div>
                        <p className="text-center font-medium text-neutral-700 dark:text-neutral-300">
                          {files.length > 0 ? `${files.length} imágenes seleccionadas` : "Arrastre imágenes o haga clic para explorar"}
                        </p>
                        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-2 text-center">JPG, PNG o DICOM permitidos (max. 10MB)</p>
                      </div>

                      {files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-6">
                          {files.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-lg text-sm font-medium border border-neutral-200 dark:border-neutral-700">
                              <span className="truncate max-w-[150px]">{f.name}</span>
                              <span className="text-neutral-400 hover:text-red-500 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, idx) => idx !== i)); }}>
                                <CloseIcon />
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Models Selection - Expandable Tabs */}
                      <div className="mt-8 flex flex-col gap-3">
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">Modelos de IA a procesar</span>
                        <div className="flex flex-wrap gap-4 items-center gap-y-4">
                          <ExpandableTabs
                            tabs={[{ title: "Segmentación", icon: Search, selected: models.A, activeColor: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" }]}
                            onChange={(idx, active) => setModels({ ...models, A: active })}
                            className="border-blue-100 dark:border-neutral-800"
                          />
                          <ExpandableTabs
                            tabs={[{ title: "Diagnóstico Glaucoma", icon: Eye, selected: models.B, activeColor: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" }]}
                            onChange={(idx, active) => setModels({ ...models, B: active })}
                            className="border-emerald-100 dark:border-neutral-800"
                          />
                          <ExpandableTabs
                            tabs={[{ title: "Detección de Lesiones", icon: Activity, selected: models.C, activeColor: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20" }]}
                            onChange={(idx, active) => setModels({ ...models, C: active })}
                            className="border-purple-100 dark:border-neutral-800"
                          />
                        </div>
                        {models.C && (
                          <div className="mt-3 ml-2 flex gap-4 text-sm bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800 w-fit">
                            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Motor de Lesiones:</span>
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                              <input type="radio" value="resnet50v2" checked={drModelType === "resnet50v2"} onChange={() => setDrModelType("resnet50v2")} className="text-purple-500 focus:ring-purple-500 cursor-pointer" />
                              ResNet50V2
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-neutral-700 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                              <input type="radio" value="mobilenetv3" checked={drModelType === "mobilenetv3"} onChange={() => setDrModelType("mobilenetv3")} className="text-purple-500 focus:ring-purple-500 cursor-pointer" />
                              MobileNetV3 <span className="text-[10px] bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded-md font-bold">New</span>
                            </label>
                          </div>
                        )}
                      </div>

                      {error && <div className="error-banner"><AlertIcon /> {error}</div>}

                      {/* Process Button */}
                      <div className="flex justify-end mt-4">
                        <button
                          className="btn btn-primary px-8 py-3 text-lg font-semibold shadow-lg shadow-blue-500/30"
                          onClick={handleAnalyze}
                          disabled={files.length === 0 || (!models.A && !models.B && !models.C)}
                        >
                          <UploadIcon />
                          {files.length > 0 ? `Procesar ${files.length} file(s)` : "Procesar Imágenes"}
                        </button>
                      </div>
                    </div>

                    {/* Results preview within Upload tab */}
                    {results && (
                      <div className="results-preview-section">
                        <h3>Resultados Recientes</h3>
                        <div className="results-grid">
                          {results.map((res, i) => (
                            <ResultCard key={i} result={res} onView={() => { setSelectedResult(res); setView("detail"); }} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="history-grid">
                    {history.map(item => (
                      <div key={item.inference_id} className="glass-panel history-card" onClick={() => loadHistoryDetail(item.inference_id)}>
                        <div className="history-header">
                          <span className="date">{new Date(item.timestamp).toLocaleDateString()}</span>
                          <span className={`status-dot ${item.risk_score > 0.5 ? 'high' : 'low'}`}></span>
                        </div>
                        <div className="history-body">
                          <strong>ID: {item.inference_id.substring(0, 8)}</strong>
                          <div className="mini-stats">
                            {item.summary?.cup_to_disc_ratio && <span>CDR: {item.summary.cup_to_disc_ratio.toFixed(2)}</span>}
                          </div>
                        </div>
                        <button className="btn-link">Ver Informe</button>
                      </div>
                    ))}
                    {history.length === 0 && <p className="text-muted">No hay historial disponible.</p>}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Subcomponents ---

function ResultCard({ result, onView }) {
  return (
    <motion.div
      className="glass-panel result-card-compact"
      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      onClick={onView}
    >
      <div className="result-header">
        <span className="filename">{result.filename}</span>
        {result.success ? <CheckIcon /> : <AlertIcon />}
      </div>
      {result.success && (
        <div className="result-metrics">
          <div className="metric">
            <span className="label">Glaucoma</span>
            <span className={`value ${result.glaucoma_probability > 0.5 ? 'danger' : ''}`}>
              {(result.glaucoma_probability * 100).toFixed(0)}%
            </span>
          </div>
          <div className="metric">
            <span className="label">CDR</span>
            <span className="value">{result.cup_to_disc_ratio?.toFixed(2)}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ResultDetail({ result, onBack }) {
  const modelsUsed = result.traceability?.models_used || [];

  return (
    <motion.div
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
    >
      {/* Header */}
      <div className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 font-medium transition-colors">
          <ArrowLeftIcon /> Volver al Resumen
        </button>
        <span className="text-xs font-mono text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800 px-3 py-1 rounded-full">
          ID: {result.inference_id?.split('-')[0]}
        </span>
      </div>

      <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Columna Izquierda: Resultados Clínicos */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800 dark:text-white flex items-center gap-2 mb-6">
              <Activity className="h-6 w-6 text-blue-500" /> Veredicto Clínico
            </h2>

            <div className="flex flex-col gap-4">
              {modelsUsed.includes("C") && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-900/30 p-5 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity size={64} />
                  </div>
                  <span className="block text-sm font-semibold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 mb-1">Retinopatía Diabética</span>
                  <span className="block text-3xl font-bold text-neutral-800 dark:text-white">
                    {result.explanation?.dr_grade > 0 ? `Grado ${result.explanation.dr_grade}` : "Normal"}
                  </span>
                  <p className="text-sm mt-2 font-medium text-neutral-600 dark:text-neutral-400">
                    Confianza de la IA: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{(result.lesions_found?.[0]?.confidence * 100)?.toFixed(1) || 99.9}%</span>
                  </p>
                </div>
              )}

              {modelsUsed.includes("B") && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-2xl">
                  <span className="block text-sm font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 mb-1">Riesgo Glaucoma</span>
                  <span className="block text-3xl font-bold text-neutral-800 dark:text-white">
                    {result.glaucoma_probability !== null ? (result.glaucoma_probability * 100).toFixed(1) : "0.0"}%
                  </span>
                </div>
              )}

              {modelsUsed.includes("A") && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-5 rounded-2xl">
                  <span className="block text-sm font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400 mb-1">Cup-to-Disc Ratio (CDR)</span>
                  <span className="block text-3xl font-bold text-neutral-800 dark:text-white">
                    {result.cup_to_disc_ratio !== null ? result.cup_to_disc_ratio.toFixed(2) : "N/A"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {result.recommendation && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-5 rounded-r-2xl mt-auto">
              <h4 className="text-amber-800 dark:text-amber-400 font-bold text-sm uppercase mb-2">Recomendación Médica Sugerida</h4>
              <p className="text-amber-900/80 dark:text-amber-200/80 text-sm leading-relaxed">{result.recommendation}</p>
            </div>
          )}
        </div>

        {/* Columna Derecha: Evidencia Visual (XAI) */}
        <div className="lg:col-span-8">
          <div className="bg-neutral-100 dark:bg-black/20 border border-neutral-200 dark:border-neutral-800 p-2 rounded-3xl h-full flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 mb-2">
              <h3 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                <Eye className="h-4 w-4" /> Mapeo de Activación Neuronal (XAI)
              </h3>
              <span className="text-xs text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded-md">Original Processed</span>
            </div>

            <div className="flex-1 rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 relative flex items-center justify-center min-h-[300px]">
              {result.heatmap_image_base64 ? (
                <img
                  src={`data:image/png;base64,${result.heatmap_image_base64}`}
                  alt="Heatmap"
                  className="w-full h-full object-contain rounded-2xl drop-shadow-2xl"
                />
              ) : (
                <div className="text-center p-10 text-neutral-400">
                  <Eye className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Mapa de atención no disponible para esta imagen.</p>
                </div>
              )}

              {/* Overlay Overlay Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDAsMCwwLDAuMikiLz4KPC9zdmc+')] opacity-20 dark:opacity-40"></div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
