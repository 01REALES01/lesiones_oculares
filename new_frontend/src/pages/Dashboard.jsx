import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Clipboard,
  Upload,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  X,
  Trash2,
  Layers,
  Radio,
  ScanEye,
  ChevronRight,
  Zap,
  FileSpreadsheet,
  Info,
} from 'lucide-react';
import { cn } from '../utils';
import { GlassCard, StatsCard } from '../components/ui/GlassCard';
import { SwitchToggle } from '../components/ui/SwitchToggle';
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
  const folderInputRef = useRef(null);

  useEffect(() => {
    const el = folderInputRef.current;
    if (el) el.setAttribute('webkitdirectory', '');
  }, []);

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

  const openHistoryItem = async (historyItem, forceBatch = false, hideImage = true) => {
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
          onViewDetail(mappedBatch, 0, { hideImage });
        }
        return;
      }

      const fullRecord = await analysisService.getInference(historyItem.inference_id);
      if (!fullRecord?.result) return;

      if ((forceBatch || isBatchByFlags) && (fullRecord.batch_id || historyItem.batch_id)) {
        const fullBatch = await analysisService.getBatch(fullRecord.batch_id || historyItem.batch_id);
        const mappedBatch = (fullBatch || []).map(mapRecordToDetail);
        if (mappedBatch.length > 0) {
          onViewDetail(mappedBatch, 0, { hideImage });
          return;
        }
      }

      onViewDetail(mapRecordToDetail(fullRecord), 0, { hideImage });
    } catch (fetchError) {
      console.error(fetchError);
    }
  };

  const handleStartComparison = async () => {
    const res = await handleAnalyze();
    if (!res?.success) return;

    const withPreview = (res.data || []).map((item) => ({
      ...item,
      uploaded_image_preview: item.uploaded_image_preview
    }));

    setResults(withPreview);
    setResultsVisible(true);
    await loadHistory();
    await loadStats();
  };

  const handleExportExcelResults = async () => {
    const batchId = results?.[0]?.batch_id;
    if (!batchId) return;
    try {
      const blob = await analysisService.exportBatchExcel(batchId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `batch_${batchId}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Excel from dashboard:', error);
    }
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
          className={`fixed bottom-5 right-5 z-[95] max-w-md rounded-2xl border px-4 py-3 text-sm font-semibold shadow-xl ${historyNotice.type === 'success'
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
      <div className="space-y-8 animate-in fade-in duration-500 min-h-0">
        <div className="relative overflow-hidden rounded-3xl border-l-[6px] border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/40 px-6 py-7 shadow-[0_10px_30px_-10px_rgba(15,23,42,0.05)] sm:px-8 sm:py-8 border-l-primary">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_40%_at_10%_0%,rgba(14,165,233,0.05),transparent_50%)]" />
          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
                Analizar Nueva Retinografía
              </h1>
              <p className="mt-1.5 max-w-xl text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">
                Inicialice el pipeline de diagnóstico ocular en alta resolución. Compare uno, dos o tres modelos de retinopatía diabética en una sola ejecución.
              </p>
            </div>
            <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
              {globalStats.total_analyses} análisis en sistema
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Analisis totales" value={globalStats.total_analyses.toString()} icon={Activity} />
          <StatsCard title="RD detectada" value={`${globalStats.rd_detected_rate}%`} icon={AlertCircle} delay={0.1} />
          <StatsCard title="Confianza" value={`${globalStats.avg_confidence}%`} icon={CheckCircle2} delay={0.2} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            <GlassCard className="border border-slate-200/60 bg-white/85 p-0 shadow-[0_10px_35px_-10px_rgba(15,23,42,0.08)] backdrop-blur-xl overflow-hidden">
              <div className="space-y-0 p-6 sm:p-8">
                {/* Tip de uso clínico reubicado */}
                <GlassCard className="bg-slate-900 border border-slate-800 p-5 shadow-xl rounded-3xl relative overflow-hidden mb-6">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Info size={120} className="text-white" />
                  </div>
                  <div className="flex items-center gap-2 mb-2 text-primary">
                    <Info size={16} />
                    <h4 className="font-extrabold text-[10px] uppercase tracking-widest text-primary">Tip de Uso Clínico</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Use imágenes nítidas, retinocentradas e iluminación homogénea. Active varios modelos para comparar la señal de riesgo de retinopatía diabética.
                  </p>
                </GlassCard>


                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`
                    relative min-h-[260px] rounded-2xl border-2 border-dashed transition-all duration-300
                    flex flex-col items-center justify-center text-center gap-3 px-6 py-12
                    ${isDragging
                      ? 'border-primary bg-primary/10 scale-[1.01] shadow-[0_12px_40px_rgba(14,165,233,0.12),inset_0_0_0_1px_rgba(14,165,233,0.1)]'
                      : files.length > 0
                        ? 'border-primary/50 bg-primary/5 shadow-[0_8px_30px_rgb(14,165,233,0.05)]'
                        : 'border-slate-200 bg-slate-50/20 hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_8px_30px_rgb(14,165,233,0.03)]'
                    }
                  `}
                >
                  <input
                    id="dash-file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <input
                    ref={folderInputRef}
                    id="dash-folder-input"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div
                    className={`
                      flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300
                      ${files.length > 0
                        ? 'text-primary bg-primary/10 border-primary/20 shadow-[0_8px_20px_rgba(14,165,233,0.15)] scale-110'
                        : 'text-slate-400 bg-white border-slate-200 shadow-sm hover:scale-105 hover:text-primary hover:border-primary/30'
                      }
                    `}
                  >
                    <Upload className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-800 tracking-tight sm:text-lg">
                      {files.length > 0 ? `${files.length} imágenes listas` : 'Arrastre sus retinografías aquí'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 font-medium sm:text-sm">Compatible con JPEG, PNG, TIFF o carpetas completas.</p>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
                    <label
                      htmlFor="dash-file-input"
                      className="cursor-pointer flex items-center rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-sm hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all duration-150"
                    >
                      Archivos
                    </label>
                    <label
                      htmlFor="dash-folder-input"
                      className="cursor-pointer flex items-center rounded-full bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-primary/20 hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all duration-150"
                    >
                      Carpetas
                    </label>
                  </div>

                  {files.length > 0 && (
                    <div className="mt-2 flex max-h-32 w-full flex-wrap justify-center gap-2 overflow-y-auto p-1">
                      {files.map((f, i) => (
                        <div
                          key={i}
                          className="group/item flex max-w-full items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-2.5 py-1.5 pr-1 shadow-sm transition"
                        >
                          <span className="truncate text-[10px] font-bold text-slate-700 sm:max-w-[140px]">
                            {f.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(i);
                            }}
                            className="rounded-lg p-1 text-slate-400 transition hover:bg-red-50 hover:text-ocular-error"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-0 flex items-center justify-between border-t border-slate-100/80 px-1 py-3 text-[10px] font-black uppercase tracking-widest text-primary">
                  <span>
                    Estado:{' '}
                    {loading
                      ? 'procesando'
                      : files.length
                        ? `${files.length} archivo(s) cargado(s)`
                        : 'esperando imágenes de retinografía'}
                  </span>

                  {files.length > 0 && (
                    <button
                      type="button"
                      onClick={clearFiles}
                      className="text-xs font-bold text-ocular-error hover:underline lowercase normal-case visual-fix" // Hereda el tamaño y tracking del padre
                    >
                      Vaciar lote
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>

            <div ref={resultsRef}>
              <GlassCard className="border border-slate-200/50 bg-white/60 p-4 sm:p-6">
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
                            <div className="flex gap-2">
                              {results?.[0]?.batch_id && (
                                <button
                                  onClick={handleExportExcelResults}
                                  className="flex items-center gap-2 px-5 py-2 text-xs bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/45 hover:scale-[1.01] active:scale-[0.98] transition-all font-semibold text-sm uppercase tracking-wide"
                                >
                                  <FileSpreadsheet size={14} /> Exportar Lote en Excel
                                </button>
                              )}
                              <button
                                onClick={() => setResultsVisible(false)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-white/60 rounded-xl text-[10px] font-bold text-ocular-text-muted hover:text-primary hover:border-primary/30 transition-all uppercase tracking-widest shadow-sm"
                              >
                                <X size={14} /> Ocultar
                              </button>
                            </div>
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
                {!results && (
                  <p className="py-8 text-center text-xs text-slate-400">Los resultados del análisis aparecerán aquí.</p>
                )}
              </GlassCard>
            </div>
          </div>


          <div className="space-y-4 lg:col-span-5 xl:col-span-4">
            <GlassCard className="border border-slate-200/60 bg-white/85 p-6 shadow-[0_10px_35px_-10px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7 overflow-hidden">
              <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                  Modelos a Ejecutar
                </h3>
              </div>

              <ul className="space-y-3">
                <ModelRow
                  id="densenet"
                  labelId="lbl-densenet"
                  icon={Layers}
                  title="DenseNet169"
                  sub="Mapea representaciones en profundidad"
                  active={models.densenet169}
                  onToggle={() => toggleModel('densenet169', !models.densenet169)}
                />
                <ModelRow
                  id="xception"
                  labelId="lbl-xception"
                  icon={Radio}
                  title="Xception"
                  sub="Convoluciones separables en profundidad"
                  active={models.xception}
                  onToggle={() => toggleModel('xception', !models.xception)}
                />
                <ModelRow
                  id="mobilenetv3"
                  labelId="lbl-mobilenetv3"
                  icon={Activity}
                  title="MobileNetV3"
                  sub="Arquitectura optimizada y ligera"
                  active={models.mobilenetv3}
                  onToggle={() => toggleModel('mobilenetv3', !models.mobilenetv3)}
                />
              </ul>

              {error && (
                <div className="mt-4 rounded-2xl border border-ocular-error/25 bg-ocular-error/10 px-3 py-2.5 text-xs font-medium text-ocular-error">
                  {error}
                </div>
              )}

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  disabled={loading || files.length === 0 || selectedModelCount === 0}
                  onClick={handleStartComparison}
                  className={`
                  flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white transition-all duration-200
                  ${loading || files.length === 0 || selectedModelCount === 0
                      ? 'cursor-not-allowed bg-slate-300/90 text-slate-500 shadow-none'
                      : 'bg-primary shadow-lg shadow-primary/25 hover:bg-primary-dark hover:scale-[1.01] hover:shadow-primary/35 active:scale-[0.98]'
                    }
                `}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                      Procesando…
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 shrink-0" fill="currentColor" />
                      Procesar imágenes
                    </>
                  )}
                </button>
                {loading && (
                  <button
                    type="button"
                    onClick={cancelAnalyze}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-200 py-2.5 text-sm font-bold text-ocular-error transition hover:bg-red-50"
                  >
                    <X size={18} />
                    Cancelar
                  </button>
                )}
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Tiempo estimado:{' '}
                  {files.length && selectedModelCount
                    ? `~${Math.min(90, 8 + files.length * selectedModelCount * 2)} s`
                    : '—'}
                </p>
              </div>
            </GlassCard>

            <button
              type="button"
              onClick={() => {
                if (recentHistory[0]) openHistoryItem(recentHistory[0], false, false);
              }}
              disabled={!recentHistory[0]}
              className="w-full text-left"
            >
              <GlassCard
                className={`
                flex w-full items-center gap-3 border border-slate-200/60 bg-white/90 p-4 transition-all duration-200
                ${recentHistory[0] ? 'hover:border-primary/50 hover:shadow-md hover:scale-[1.01]' : 'opacity-60'}
              `}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <Zap size={20} fill="currentColor" className="opacity-80" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-medium uppercase tracking-widest text-primary">Referencia reciente</p>
                  <p className="truncate text-sm font-bold text-slate-800">
                    {recentHistory[0]
                      ? (() => {
                        const h = recentHistory[0];
                        const batch = h.is_batch || (h.batch_id && h.batch_size > 1);
                        const label = batch ? 'Lote' : 'Paciente';
                        const id = (h.batch_id || h.inference_id || '').substring(0, 6);
                        const fileName = h.summary?.filename || h.filename || 'Análisis';
                        return `${label} #${id}: ${fileName}`;
                      })()
                      : 'Sin ejecuciones aún'}
                  </p>
                  <p className="text-[10px] text-ocular-text-muted uppercase font-medium truncate">
                    {recentHistory[0]
                      ? (() => {
                        const h = recentHistory[0];
                        const batch = h.is_batch || (h.batch_id && h.batch_size > 1);
                        return batch
                          ? new Date(h.timestamp).toLocaleDateString()
                          : (h.summary?.headline || new Date(h.timestamp).toLocaleDateString());
                      })()
                      : '—'}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
              </GlassCard>
            </button>

            <GlassCard className="p-6 border border-slate-200/60 bg-white/85 shadow-[0_10px_35px_-10px_rgba(15,23,42,0.08)] backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Historial Reciente</h3>
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
                          onClick={() => openHistoryItem(item, false, true)}
                          className="w-full group p-3 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all text-left flex items-center gap-3 cursor-pointer"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.summary?.risk_level === 'high'
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
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wide ${isBatchItem ? 'bg-primary/10 text-primary' : 'bg-slate-200/70 text-slate-600'}`}>
                                {isBatchItem ? `Lote${item.batch_size ? ` (${item.batch_size})` : ''}` : 'Individual'}
                              </span>
                            </div>
                            <p className="text-[10px] text-ocular-text-muted uppercase font-medium truncate">
                              {isBatchItem
                                ? new Date(item.timestamp).toLocaleDateString()
                                : (item.summary?.headline || new Date(item.timestamp).toLocaleDateString())}
                            </p>
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

function ModelRow({ id, labelId, icon: Icon, title, sub, active, onToggle }) {
  return (
    <li
      className={`
        flex items-center gap-3 rounded-2xl border p-3 transition-all
        ${active ? 'border-sky-200/80 bg-sky-50/50 shadow-sm' : 'border-slate-200/60 bg-slate-50/40'}
      `}
    >
      <div
        className={`
          flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border
          ${active ? 'border-sky-200/80 bg-white text-sky-600' : 'border-slate-200/80 bg-white/80 text-slate-400'}
        `}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900" id={labelId}>
          {title}
        </p>
        <p className="text-[11px] text-slate-500">{sub}</p>
      </div>
      <SwitchToggle id={id} labelId={labelId} active={active} onToggle={onToggle} />
    </li>
  );
}

function ResultMiniCard({ result, onClick }) {
  const comparisonSummary = result.comparison_summary || {};
  const isError = result.success === false || !!result.error;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "glass-panel p-4 flex items-center justify-between group transition-all border-white/40",
        isError ? "hover:border-red-400/40" : "hover:border-primary/40"
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          isError ? "bg-red-100 text-red-600" : "bg-ocular-success/10 text-ocular-success"
        )}>
          {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
        </div>
        <div className="text-left overflow-hidden">
          <p className="text-sm font-bold text-ocular-text-main group-hover:text-primary transition-colors truncate">{result.filename}</p>
          <p className={cn(
            "text-[10px] font-bold truncate",
            isError ? "text-red-500" : "text-ocular-text-muted"
          )}>
            {isError ? (result.error || 'Error en análisis') : (comparisonSummary.headline || 'Análisis finalizado')}
          </p>
        </div>
      </div>
      <Plus size={16} className="text-ocular-text-muted group-hover:text-primary transition-all shrink-0 ml-2" />
    </button>
  );
}
