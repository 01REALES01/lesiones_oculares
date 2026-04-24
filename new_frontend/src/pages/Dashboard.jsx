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
} from 'lucide-react';
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
      <div className="space-y-8 animate-in fade-in duration-500 min-h-0">
      <div className="relative overflow-hidden rounded-3xl border border-sky-100/80 bg-gradient-to-br from-sky-50/90 via-white to-white px-6 py-7 shadow-[0_12px_40px_-20px_rgba(30,100,200,0.2)] sm:px-8 sm:py-8">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Analizar nueva retinografía
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500 sm:text-base">
              Inicialice el pipeline de diagnóstico ocular en alta resolución. Compare uno, dos o tres modelos de retinopatía diabética en una sola ejecución.
            </p>
          </div>
          <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            {globalStats.total_analyses} análisis en sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Analisis totales" value={globalStats.total_analyses.toString()} icon={Activity} />
        <StatsCard title="RD detectada" value={`${globalStats.rd_detected_rate}%`} icon={AlertCircle} delay={0.1} />
        <StatsCard title="Confianza" value={`${globalStats.avg_confidence}%`} icon={CheckCircle2} delay={0.2} />
        <StatsCard title="Latencia" value={`${globalStats.avg_latency_ms}ms`} icon={Clock} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7 xl:col-span-8">
          <GlassCard className="border border-slate-200/60 bg-white/80 p-0 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="space-y-0 p-6 sm:p-8">
              {files.length > 0 && (
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFiles}
                    className="text-[10px] font-bold text-ocular-error hover:underline uppercase tracking-widest"
                  >
                    Vaciar lote
                  </button>
                </div>
              )}

              <div
                onClick={() => {
                  if (loading) return;
                  document.getElementById('dash-file-input')?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`
                  relative min-h-[240px] cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
                  flex flex-col items-center justify-center text-center gap-3 px-5 py-10
                  ${
                    isDragging
                      ? 'border-sky-400 bg-sky-50/80 scale-[1.01] shadow-[inset_0_0_0_1px_rgba(14,165,233,0.2)]'
                      : files.length > 0
                        ? 'border-sky-300/80 bg-sky-50/40'
                        : 'border-sky-200/80 bg-slate-50/30 hover:border-sky-300 hover:bg-sky-50/30'
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
                    flex h-16 w-16 items-center justify-center rounded-full border border-sky-200/60 bg-white shadow-sm transition-all
                    ${files.length > 0 ? 'text-sky-600 ring-2 ring-sky-200/50' : 'text-slate-400'}
                  `}
                >
                  <Upload className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-sky-700 sm:text-lg">
                    {files.length > 0 ? `${files.length} imágenes listas` : 'Suelte retinografías aquí'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">Compatible con JPEG, PNG, TIFF. También arrastre una carpeta.</p>
                </div>

                <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('dash-file-input')?.click();
                    }}
                    className="rounded-full border border-slate-200/90 bg-slate-100/90 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 transition hover:bg-slate-200/90"
                  >
                    Nube / archivos
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('dash-folder-input')?.click();
                    }}
                    className="rounded-full bg-sky-500/90 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-sky-600"
                  >
                    Carpeta
                  </button>
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

              <div className="mt-0 flex items-center justify-between border-t border-slate-100/80 px-1 py-3 text-[10px] font-bold uppercase tracking-widest text-sky-600/90">
                <span>
                  Estado:{' '}
                  {loading
                    ? 'procesando'
                    : files.length
                      ? `${files.length} archivo(s)`
                      : 'esperando imágenes'}
                </span>
                <span>Buffer: 1,2 GB</span>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-4 lg:col-span-5 xl:col-span-4">
          <GlassCard className="border border-slate-200/60 bg-white/80 p-6 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Modelos a procesar</h2>
              <span className="rounded-full bg-sky-600 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
                motor v3.2
              </span>
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
                id="resnet"
                labelId="lbl-resnet"
                icon={ScanEye}
                title="ResNet50"
                sub="Balance residuo y velocidad"
                active={models.resnet50}
                onToggle={() => toggleModel('resnet50', !models.resnet50)}
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
                  flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white transition
                  ${
                    loading || files.length === 0 || selectedModelCount === 0
                      ? 'cursor-not-allowed bg-slate-300/90 text-slate-500'
                      : 'bg-sky-500 shadow-md shadow-sky-500/25 hover:bg-sky-600'
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
              if (recentHistory[0]) openHistoryItem(recentHistory[0]);
            }}
            disabled={!recentHistory[0]}
            className="w-full text-left"
          >
            <GlassCard
              className={`
                flex w-full items-center gap-3 border border-slate-200/60 bg-white/90 p-4 transition
                ${recentHistory[0] ? 'hover:border-sky-300/80 hover:shadow-md' : 'opacity-60'}
              `}
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200/80 bg-slate-200/30">
                <div className="h-full w-full scale-125 bg-gradient-to-br from-slate-700 to-slate-900 opacity-90" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-sky-600">Referencia reciente</p>
                <p className="truncate text-sm font-bold text-slate-800">
                  {recentHistory[0]
                    ? (() => {
                        const h = recentHistory[0];
                        const batch =
                          h.is_batch ||
                          (h.batch_id && h.batch_size > 1) ||
                          ((h.summary?.headline || '').toLowerCase().includes('lote') && h.batch_id);
                        if (batch && h.batch_id) {
                          return `Lote #${h.batch_id.substring(0, 6)}: preprocesado`;
                        }
                        return `Paciente #${h.inference_id.substring(0, 5)}: preprocesado`;
                      })()
                    : 'Sin ejecuciones aún'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            </GlassCard>
          </button>

          <GlassCard className="bg-primary p-4 text-white shadow-md shadow-primary/20 sm:p-5">
            <h4 className="font-bold">Tip de uso</h4>
            <p className="mt-1 text-xs leading-relaxed text-white/85">
              Use imágenes nítidas, retinocentrada e iluminación homogénea. Active varios modelos para comparar la señal de
              riesgo de RD.
            </p>
          </GlassCard>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8 xl:col-span-9" ref={resultsRef}>
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
          {!results && (
            <p className="py-8 text-center text-xs text-slate-400">Los resultados del análisis aparecerán aquí.</p>
          )}
        </GlassCard>
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
