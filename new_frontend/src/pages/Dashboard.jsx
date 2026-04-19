import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clipboard, Upload, Cpu, Plus, CheckCircle2, AlertCircle, Loader2, Clock, X, Trash2 } from 'lucide-react';
import { GlassCard, StatsCard } from '../components/ui/GlassCard';
import { analysisService } from '../services/api';

export default function Dashboard({ onViewDetail, onGoHistory, analysis }) {
  const {
    files,
    addFiles,
    removeFile,
    clearFiles,
    models,
    toggleModel,
    loading,
    error,
    results,
    setResults,
    handleAnalyze,
    cancelAnalyze,
  } = analysis;

  const [recentHistory, setRecentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [historyNotice, setHistoryNotice] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    total_analyses: 0,
    rd_detected_rate: 0.0,
    avg_confidence: 0.0,
    avg_latency_ms: 0.0
  });
  const hasHistoryToClear = globalStats.total_analyses > 0;
  const resultsRef = useRef(null);

  useEffect(() => {
    if (historyNotice) {
      const timer = setTimeout(() => {
        setHistoryNotice(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [historyNotice]);

  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [results]);

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await analysisService.getStats();
      if (stats) setGlobalStats(stats);
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  };

  const selectedModelCount = Object.values(models).filter(Boolean).length;

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await analysisService.getHistory(5);
      setRecentHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const confirmClearHistory = async () => {
    setClearingHistory(true);
    setHistoryNotice(null);
    try {
      await analysisService.clearHistory();
      setRecentHistory([]);
      setGlobalStats({
        total_analyses: 0,
        rd_detected_rate: 0.0,
        avg_confidence: 0.0,
        avg_latency_ms: 0.0,
      });
      await loadHistory();
      await loadStats();
      setHistoryNotice({ type: 'success', message: 'Historial limpiado y métricas reiniciadas.' });
      setClearModalOpen(false);
    } catch (e) {
      console.error('Error clearing history:', e);
      const status = e?.response?.status;
      const backendMsg = e?.response?.data?.detail || e?.response?.data?.message;
      const hint = status === 404 || status === 405
        ? ' Reinicia el backend para cargar el endpoint /history.'
        : '';
      setHistoryNotice({
        type: 'error',
        message: `No se pudo limpiar el historial.${backendMsg ? ` ${backendMsg}` : ''}${hint}`,
      });
      setClearModalOpen(false);
    } finally {
      setClearingHistory(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const items = e.dataTransfer.items;
    const extractedFiles = [];

    const traverse = async (entry) => {
      if (entry.isFile) {
        const file = await new Promise((res) => entry.file(res));
        if (file.type.startsWith('image/')) extractedFiles.push(file);
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const entries = await new Promise((res) => reader.readEntries(res));
        for (const child of entries) await traverse(child);
      }
    };

    const promises = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry();
      if (entry) promises.push(traverse(entry));
    }

    await Promise.all(promises);
    if (extractedFiles.length > 0) addFiles(extractedFiles);
  };

  const mapRecordToDetail = (record) => ({
    ...record.result,
    inference_id: record.inference_id,
    timestamp: record.timestamp,
    traceability: {
      inference_id: record.inference_id,
      models_used: record.models_used,
      inference_times_ms: record.inference_times_ms,
      timestamp: record.timestamp,
    },
  });

  const openHistoryItem = async (historyItem, forceBatch = false) => {
    try {
      const isBatchByFlags = Boolean(
        historyItem.is_batch ||
        (historyItem.batch_id && historyItem.batch_size > 1) ||
        ((historyItem.summary?.headline || '').toLowerCase().includes('lote') && historyItem.batch_id)
      );

      if ((forceBatch || isBatchByFlags) && historyItem.batch_id) {
        const fullBatch = await analysisService.getBatch(historyItem.batch_id);
        const mappedBatch = (fullBatch || []).map(mapRecordToDetail);

        if (mappedBatch.length > 0) {
          onViewDetail(mappedBatch, 0);
        }
        return;
      }

      const fullRecord = await analysisService.getInference(historyItem.inference_id);
      if (!fullRecord?.result) return;

      if ((forceBatch || isBatchByFlags) && (fullRecord.batch_id || historyItem.batch_id)) {
        const fullBatch = await analysisService.getBatch(fullRecord.batch_id || historyItem.batch_id);
        const mappedBatch = (fullBatch || []).map(mapRecordToDetail);
        if (mappedBatch.length > 0) {
          onViewDetail(mappedBatch, 0);
          return;
        }
      }

      onViewDetail(mapRecordToDetail(fullRecord));
    } catch (fetchError) {
      console.error(fetchError);
    }
  };

  const handleStartComparison = async () => {
    const res = await handleAnalyze();
    if (!res?.success) return;

    const previews = files.map((file) => URL.createObjectURL(file));
    const withPreview = (res.data || []).map((item, index) => ({
      ...item,
      uploaded_image_preview: previews[index] || null,
    }));

    setResults(withPreview);
    setResultsVisible(true);
    await loadHistory();
    await loadStats();
  };

  const deleteItem = async (e, item) => {
    e.stopPropagation();
    const isBatch = item.is_batch && item.batch_id;
    try {
      if (isBatch) {
        await analysisService.deleteBatch(item.batch_id);
      } else {
        await analysisService.deleteAnalysis(item.inference_id);
      }
      
      setRecentHistory(prev => prev.filter(h => {
        if (isBatch) return h.batch_id !== item.batch_id;
        return h.inference_id !== item.inference_id;
      }));
      
      await loadStats();
      setHistoryNotice({ type: 'success', message: isBatch ? 'Lote eliminado.' : 'Analisis eliminado.' });
    } catch (e) {
      console.error("Error eliminando:", e);
      setHistoryNotice({ type: 'error', message: 'No se pudo eliminar.' });
    }
  };

  return (
    <>
      {historyNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed bottom-5 right-5 z-[95] max-w-md rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl ${
            historyNotice.type === 'success'
              ? 'border-ocular-success/30 bg-ocular-success/10 text-ocular-success'
              : 'border-ocular-error/30 bg-ocular-error/10 text-ocular-error'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{historyNotice.message}</span>
            <button
              type="button"
              onClick={() => setHistoryNotice(null)}
              className="text-xs font-bold uppercase hover:opacity-80"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      )}
      <div className="space-y-8 animate-in fade-in duration-500">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ocular-text-main">Panel de Control</h1>
          <p className="text-ocular-text-muted">Compara uno, dos o tres modelos de retinopatia diabetica en una sola ejecucion.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Servidor IA removido a petición del usuario */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Analisis Totales" value={globalStats.total_analyses.toString()} icon={Activity} />
        <StatsCard title="Casos RD Detectados" value={`${globalStats.rd_detected_rate}%`} icon={AlertCircle} delay={0.1} />
        <StatsCard title="Confianza Promedio" value={`${globalStats.avg_confidence}%`} icon={CheckCircle2} delay={0.2} />
        <StatsCard title="Latencia Media" value={`${globalStats.avg_latency_ms}ms`} icon={Clock} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <GlassCard className="overflow-hidden p-0 border-none shadow-2xl">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Upload size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-ocular-text-main">Nuevo Analisis</h2>
                </div>
                {files.length > 0 && (
                  <button
                    type="button"
                    onClick={clearFiles}
                    className="text-[10px] font-bold text-ocular-error hover:underline uppercase tracking-widest"
                  >
                    Limpiar Lote
                  </button>
                )}
              </div>

              <div
                onClick={() => document.getElementById('dash-file-input').click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 cursor-pointer
                  group flex flex-col items-center justify-center text-center gap-4
                  ${isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : files.length > 0 ? 'border-primary bg-primary/5' : 'border-white/40 hover:border-primary/50 hover:bg-white/40'}
                `}
              >
                <input id="dash-file-input" type="file" multiple className="hidden" onChange={handleFileChange} />

                <div
                  className={`
                    p-5 rounded-2xl transition-all duration-300
                    ${files.length > 0 ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'bg-white/50 text-ocular-text-muted group-hover:text-primary'}
                  `}
                >
                  <Upload size={32} />
                </div>

                <div>
                  <p className="text-lg font-bold text-ocular-text-main">
                    {files.length > 0 ? `${files.length} archivos en espera` : 'Cargar Lote o Carpetas'}
                  </p>
                  <p className="text-sm text-ocular-text-muted mt-1">Arrastra carpetas completas o haz clic para anadir imagenes</p>
                </div>

                {files.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4 max-h-32 overflow-y-auto p-2">
                    {files.map((f, i) => (
                      <div key={i} className="group/item flex items-center gap-2 px-3 py-1.5 bg-white/50 hover:bg-white border border-white rounded-xl transition-all animate-in zoom-in-75 duration-200">
                        <span className="text-[10px] font-bold text-ocular-text-main truncate max-w-[120px]">{f.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(i);
                          }}
                          className="text-ocular-text-muted hover:text-ocular-error transition-colors"
                        >
                          <Plus size={14} className="rotate-45" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-ocular-text-muted uppercase tracking-widest px-1">Modelos de Retinopatia Diabetica</p>
                <div className="flex flex-wrap gap-4">
                  <ModelToggle icon={Cpu} label="DenseNet169" active={models.densenet169} onClick={() => toggleModel('densenet169', !models.densenet169)} />
                  <ModelToggle icon={Cpu} label="ResNet50" active={models.resnet50} onClick={() => toggleModel('resnet50', !models.resnet50)} />
                  <ModelToggle icon={Cpu} label="Xception" active={models.xception} onClick={() => toggleModel('xception', !models.xception)} />
                </div>

                <div className="p-4 bg-white/40 rounded-2xl border border-white/20 flex items-center justify-between gap-6">
                  <span className="text-xs font-bold text-ocular-text-muted uppercase tracking-wider">Comparacion activa</span>
                  <span className="text-sm font-bold text-ocular-text-main">
                    {selectedModelCount === 0
                      ? 'Selecciona al menos un modelo'
                      : `${selectedModelCount} ${selectedModelCount === 1 ? 'modelo seleccionado' : 'modelos seleccionados'}`}
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-ocular-error/20 bg-ocular-error/10 px-4 py-3 text-sm font-medium text-ocular-error">
                  {error}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  disabled={loading || files.length === 0 || selectedModelCount === 0}
                  onClick={handleStartComparison}
                  className={`
                    flex-1 btn-premium py-4 text-lg
                    ${loading || files.length === 0 || selectedModelCount === 0 ? 'bg-ocular-text-muted/20 text-ocular-text-muted cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark shadow-primary/30'}
                  `}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Ejecutando comparacion de modelos...
                    </>
                  ) : (
                    <>
                      <Activity size={22} />
                      Iniciar Comparacion Clinica
                    </>
                  )}
                </button>
                {loading && (
                  <button
                    type="button"
                    onClick={cancelAnalyze}
                    className="px-5 py-4 rounded-2xl border-2 border-ocular-error/40 text-ocular-error font-bold hover:bg-ocular-error/10 transition-all flex items-center gap-2"
                    title="Cancelar ejecucion"
                  >
                    <X size={20} />
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {loading && (
              <motion.div
                className="h-1 bg-primary"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </GlassCard>

          <AnimatePresence mode="wait">
            {results && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {resultsVisible ? (
                  <motion.div 
                    key="results-list"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 pt-4"
                  >
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-ocular-success" />
                        <h3 className="text-lg font-bold text-ocular-text-main">Resultados del Análisis</h3>
                      </div>
                      <button 
                        onClick={() => setResultsVisible(false)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-white/60 rounded-xl text-[10px] font-bold text-ocular-text-muted hover:text-primary hover:border-primary/30 transition-all uppercase tracking-widest shadow-sm"
                      >
                        <X size={14} /> Ocultar
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.map((res, i) => (
                        <ResultMiniCard key={i} result={res} onClick={() => onViewDetail(results, i)} />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="results-hidden"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="pt-4"
                  >
                    <button
                      onClick={() => setResultsVisible(true)}
                      className="w-full p-4 bg-white/40 border border-white/60 border-dashed rounded-3xl flex items-center justify-center gap-3 text-ocular-text-muted hover:text-primary hover:bg-white/60 transition-all group"
                    >
                      <Plus className="group-hover:rotate-90 transition-transform" />
                      <span className="text-sm font-bold uppercase tracking-widest">Mostrar resultados del último análisis ({results.length})</span>
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-primary" />
                <h3 className="font-bold text-ocular-text-main">Historial</h3>
              </div>
              <div className="flex items-center gap-3">
                {hasHistoryToClear && (
                  <button
                    type="button"
                    onClick={() => setClearModalOpen(true)}
                    disabled={clearingHistory}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/60 bg-white/80 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-ocular-error/40 hover:text-ocular-error transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={12} />
                    {clearingHistory ? 'Limpiando...' : 'Limpiar'}
                  </button>
                )}
                <button type="button" onClick={() => onGoHistory?.()} className="text-[10px] font-bold uppercase text-primary hover:underline">
                  Ver Todo
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {historyLoading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => <div key={i} className="h-16 animate-pulse bg-white/30 rounded-2xl" />)
              ) : recentHistory.length > 0 ? (
                recentHistory.map((item, i) => {
                  const isBatchItem = Boolean(
                    item.is_batch ||
                    (item.batch_id && item.batch_size > 1) ||
                    ((item.summary?.headline || '').toLowerCase().includes('lote') && item.batch_id)
                  );
                  return (
                    <div key={i} className="space-y-2">
                      <div
                        role="button"
                        onClick={() => openHistoryItem(item)}
                        className="w-full group p-3 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all text-left flex items-center gap-3 cursor-pointer"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            item.summary?.risk_level === 'high'
                              ? 'bg-ocular-error/10 text-ocular-error'
                              : item.summary?.risk_level === 'medium'
                                ? 'bg-amber-400/10 text-amber-500'
                                : 'bg-ocular-success/10 text-ocular-success'
                          }`}
                        >
                          <Clipboard size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-ocular-text-main group-hover:text-primary transition-colors">
                              {isBatchItem && item.batch_id
                                ? `Lote #${item.batch_id.substring(0, 6)}`
                                : `Analisis #${item.inference_id.substring(0, 5)}`}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${isBatchItem ? 'bg-primary/10 text-primary' : 'bg-slate-200/70 text-slate-600'}`}>
                              {isBatchItem ? `Lote${item.batch_size ? ` (${item.batch_size})` : ''}` : 'Individual'}
                            </span>
                          </div>
                          <p className="text-[10px] text-ocular-text-muted uppercase font-bold truncate">{item.summary?.headline || new Date(item.timestamp).toLocaleDateString()}</p>
                        </div>
                        <div
                          role="button"
                          onClick={(e) => deleteItem(e, item)}
                          className="p-2 rounded-xl text-ocular-text-muted hover:bg-ocular-error/10 hover:text-ocular-error transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar este analisis o lote"
                        >
                          <Trash2 size={16} />
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-ocular-text-muted py-8">No hay registros previos.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="bg-primary text-white border-none shadow-primary/20">
            <h4 className="font-bold mb-2">Tip de Uso</h4>
            <p className="text-xs text-white/80 leading-relaxed">Para comparar correctamente los modelos de retinopatia diabetica, utiliza imagenes nitidas, bien iluminadas y con la retina centrada.</p>
          </GlassCard>
        </div>
      </div>

      <AnimatePresence>
        {clearModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              className="w-full max-w-md rounded-3xl border border-white/30 bg-white/90 backdrop-blur-xl shadow-2xl p-6 space-y-5"
            >
              <div className="space-y-2">
                <h4 className="text-lg font-black text-ocular-text-main">Limpiar historial</h4>
                <p className="text-sm text-ocular-text-muted">
                  Esto eliminará todo el historial y reiniciará las métricas del dashboard.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setClearModalOpen(false)}
                  disabled={clearingHistory}
                  className="px-4 py-2 rounded-xl border border-white/60 bg-white/80 text-ocular-text-main font-bold text-sm hover:bg-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmClearHistory}
                  disabled={clearingHistory}
                  className="px-4 py-2 rounded-xl bg-ocular-error text-white font-bold text-sm hover:opacity-90 disabled:opacity-60"
                >
                  {clearingHistory ? 'Limpiando...' : 'Sí, limpiar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

function ModelToggle({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 rounded-2xl border font-bold text-sm transition-all
        ${active ? 'bg-white text-primary border-white shadow-md' : 'bg-white/30 text-ocular-text-muted border-white/20 hover:bg-white/40'}
      `}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

function ResultMiniCard({ result, onClick }) {
  const comparisonSummary = result.comparison_summary || {};
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-panel p-4 flex items-center justify-between group hover:border-primary/40 transition-all border-white/40"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-ocular-success/10 text-ocular-success rounded-xl flex items-center justify-center">
          <CheckCircle2 size={18} />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-ocular-text-main group-hover:text-primary transition-colors truncate max-w-[120px]">{result.filename}</p>
          <p className="text-[10px] text-ocular-text-muted font-bold">{comparisonSummary.headline || 'PROCESO EXITOSO'}</p>
        </div>
      </div>
      <Plus size={16} className="text-ocular-text-muted group-hover:text-primary transition-all" />
    </button>
  );
}
