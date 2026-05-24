import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, ChevronRight, FileText, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { analysisService } from '../services/api';
import { cn } from '../utils';

function getConsensusGradeFromResult(result) {
  if (!result) return null;

  const comparisons = Array.isArray(result.model_comparisons) ? result.model_comparisons : [];
  if (comparisons.length > 0) {
    const predictedClasses = [];
    const weights = [];
    const items = comparisons;

    items.forEach((item) => {
      const cls = Number(item.predicted_class);
      const confidence = Number(item.confidence_percent) || 0;
      const others = items.filter((i) => i !== item).map((i) => Number(i.predicted_class));
      const othersAvg = others.length > 0 ? others.reduce((a, b) => a + b, 0) / others.length : cls;
      const distance = Math.abs(cls - othersAvg);
      let finalWeight = confidence;
      if (distance >= 2) finalWeight *= 0.5;
      predictedClasses.push(cls);
      weights.push(finalWeight);
    });

    const sumWeights = weights.reduce((a, b) => a + b, 0);
    if (sumWeights > 0) {
      const center = predictedClasses.reduce((acc, cls, i) => acc + (cls * weights[i]), 0) / sumWeights;
      return Math.round(center);
    }
  }

  return result?.comparison_summary?.consensus_grade
    ?? result?.primary_result?.predicted_class
    ?? result?.predicted_class
    ?? null;
}

export default function HistoryPage({ onViewDetail }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [historyNotice, setHistoryNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("all"); // all | high | medium | low | mixed
  const [page, setPage] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const limit = 12;
  const hasHistoryToClear = history.length > 0;

  useEffect(() => {
    loadAllHistory();
  }, []);

  // Reset to page 0 whenever filter or search changes
  useEffect(() => {
    if (page !== 0) setPage(0);
  }, [riskFilter, search, dateFilter]);

  const getItemSummary = (item) => item.summary || {
    filename: item.filename,
    risk_level: item.risk_level,
    risk_max_level: item.risk_level,
    positive_models: item.positive_models,
    total_models: item.total_models,
    headline: item.result?.comparison_summary?.headline,
    primary_grade: item.result?.primary_result?.predicted_class,
    batch_filenames: item.items?.map(i => i.filename || i.result?.filename).filter(Boolean) || [],
    risk_counts: item.summary?.risk_counts || {},
  };

  const getBatchFilenames = (item) => {
    const summary = getItemSummary(item);
    return summary.batch_filenames?.length
      ? summary.batch_filenames
      : item.items?.map(i => i.filename || i.result?.filename).filter(Boolean) || [];
  };

  const getRiskBuckets = (item) => {
    const summary = getItemSummary(item);
    let high = 0;
    let medium = 0;
    let low = 0;
    let noRd = 0;

    const getGradeFromRecord = (record) => getConsensusGradeFromResult(record?.result);

    const classifyGrade = (gradeRaw) => {
      const grade = Number(gradeRaw);
      if (!Number.isFinite(grade)) return;
      if (grade >= 3) high += 1; // Severo + Proliferativo
      else if (grade === 2) medium += 1; // Moderado
      else if (grade === 1) low += 1; // Leve
      else if (grade === 0) noRd += 1; // NO R.D.
    };

    if (item.is_batch && Array.isArray(item.items) && item.items.length > 0) {
      item.items.forEach((it) => {
        const grade = getGradeFromRecord(it);
        classifyGrade(grade);
      });
    } else {
      const grade = getGradeFromRecord(item);
      classifyGrade(grade);
    }

    const nonZeroBuckets = [high, medium, low, noRd].filter((v) => v > 0).length;
    const isMixed = nonZeroBuckets >= 2;
    return { high, medium, low, noRd, isMixed };
  };

  const getSuggestions = () => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    const list = [];

    for (const item of history) {
      const summary = getItemSummary(item);
      const batchFilenames = getBatchFilenames(item);

      // 1. Coincidencia por ID de lote/análisis
      const bId = item.batch_id || "";
      const infId = item.inference_id || "";
      if (bId.toLowerCase().includes(query) || infId.toLowerCase().includes(query)) {
        list.push({
          type: item.is_batch ? 'batch' : 'individual',
          title: item.is_batch ? `Lote # ${bId.substring(0, 8)}` : `Análisis # ${infId.substring(0, 8)}`,
          subtitle: item.is_batch ? `Lote de ${item.batch_size} imágenes` : `Archivo: ${summary?.filename}`,
          item,
          targetIndex: 0
        });
      }

      // 2. Coincidencia por nombre de archivo individual
      if (!item.is_batch && summary?.filename && summary.filename.toLowerCase().includes(query)) {
        if (!list.some(s => s.item.inference_id === item.inference_id)) {
          list.push({
            type: 'individual',
            title: summary.filename,
            subtitle: `Análisis individual - ID: ${infId.substring(0, 8)}`,
            item,
            targetIndex: 0
          });
        }
      }

      // 3. Coincidencia por nombre de archivo dentro de un lote
      if (item.is_batch && batchFilenames.length) {
        batchFilenames.forEach((fn, idx) => {
          if (fn && fn.toLowerCase().includes(query)) {
            list.push({
              type: 'batch_image',
              title: fn,
              subtitle: `En Lote # ${bId.substring(0, 8)} (Imagen ${idx + 1})`,
              item,
              targetIndex: idx
            });
          }
        });
      }
    }

    // Evitar duplicados exactos en sugerencias
    const uniqueList = [];
    const seenKeys = new Set();
    for (const sug of list) {
      const key = `${sug.item.batch_id || sug.item.inference_id}-${sug.targetIndex}-${sug.title}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueList.push(sug);
      }
    }

    return uniqueList.slice(0, 6);
  };


  const loadAllHistory = async () => {
    setLoading(true);
    try {
      // Backend /history está limitado a 100 por request.
      const backendChunk = 100;
      let offset = 0;
      let aggregated = [];

      while (true) {
        const chunk = await analysisService.getHistory(backendChunk, offset);
        aggregated = aggregated.concat(chunk);

        if (chunk.length < backendChunk) break;
        offset += backendChunk;
      }

      setHistory(aggregated);
    } catch (e) {
      console.error("Error cargando historial:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    const query = search.toLowerCase();
    const summary = getItemSummary(item);
    const batchFilenames = getBatchFilenames(item);
    const matchesSearch = (item.batch_id || "").toLowerCase().includes(query) ||
      (item.inference_id || "").toLowerCase().includes(query) ||
      (summary?.filename || "").toLowerCase().includes(query) ||
      (summary?.headline || "").toLowerCase().includes(query) ||
      batchFilenames.some(fn => (fn || "").toLowerCase().includes(query));

    const itemLevel = summary?.risk_level || item.risk_level || 'low';
    const itemMaxLevel = summary?.risk_max_level || itemLevel;
    const buckets = getRiskBuckets(item);
    const matchesDate = !dateFilter || new Date(item.timestamp).toISOString().split('T')[0] === dateFilter;
    const hasRiskByFilter =
      (riskFilter === 'high' && buckets.high > 0) ||
      (riskFilter === 'medium' && buckets.medium > 0) ||
      (riskFilter === 'low' && buckets.low > 0);

    const matchesRisk =
      riskFilter === 'all' ||
      itemLevel === riskFilter ||
      hasRiskByFilter ||
      (buckets.isMixed && (
        (riskFilter === 'high' && (buckets.high > 0 || itemMaxLevel === 'high')) ||
        (riskFilter === 'medium' && (buckets.medium > 0 || itemMaxLevel === 'medium')) ||
        (riskFilter === 'low' && buckets.low > 0)
      ));

    return matchesSearch && matchesRisk && matchesDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / limit));
  const hasMore = page < totalPages - 1;
  const paginatedHistory = filteredHistory.slice(page * limit, (page + 1) * limit);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const openHistoryDetail = async (item, forceIndex = null) => {
    try {
      if (item.is_batch && item.batch_id) {
        const fullBatch = await analysisService.getBatch(item.batch_id);
        const mappedBatch = fullBatch.map(b => ({
          ...b.result,
          inference_id: b.inference_id,
          timestamp: b.timestamp,
          batch_id: b.batch_id, //se agrego batch_id para identificar que es parte de un lote en el deatiles jsx
          traceability: {
            inference_id: b.inference_id,
            models_used: b.models_used,
            inference_times_ms: b.inference_times_ms,
            timestamp: b.timestamp,
          }
        }));
        // Intentar encontrar el índice de la imagen si hay una búsqueda activa o un índice explícito
        let targetIndex = 0;
        if (forceIndex !== null) {
          targetIndex = forceIndex;
        } else if (search) {
          const foundIndex = mappedBatch.findIndex(b =>
            (b.filename || b.summary?.filename || "").toLowerCase().includes(search.toLowerCase())
          );
          if (foundIndex !== -1) targetIndex = foundIndex;
        }

        onViewDetail(mappedBatch, targetIndex);
      } else {
        const fullRecord = await analysisService.getInference(item.inference_id);
        if (fullRecord?.result) {
          onViewDetail({
            ...fullRecord.result,
            inference_id: fullRecord.inference_id,
            timestamp: fullRecord.timestamp,
            traceability: {
              inference_id: fullRecord.inference_id,
              models_used: fullRecord.models_used,
              inference_times_ms: fullRecord.inference_times_ms,
              timestamp: fullRecord.timestamp,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
    }
  };

  const confirmClearHistory = async () => {
    setClearingHistory(true);
    setHistoryNotice(null);
    try {
      await analysisService.clearHistory();
      setHistory([]);
      setPage(0);
      setHistoryNotice({ type: 'success', message: 'Historial limpiado correctamente.' });
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

  const deleteItem = (e, item) => {
    e.stopPropagation();
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const item = itemToDelete;
    const isBatch = item.is_batch && item.batch_id;

    // Borrado optimista
    const previousHistory = [...history];
    setHistory(prev => prev.filter(h => {
      if (isBatch) return h.batch_id !== item.batch_id;
      return h.inference_id !== item.inference_id;
    }));

    setDeleteModalOpen(false);
    setItemToDelete(null);

    try {
      if (isBatch) {
        await analysisService.deleteBatch(item.batch_id);
      } else {
        await analysisService.deleteAnalysis(item.inference_id);
      }
      setHistoryNotice({ type: 'success', message: isBatch ? 'Lote eliminado.' : 'Análisis eliminado.' });
    } catch (e) {
      console.error("Error eliminando:", e);
      setHistory(previousHistory);
      setHistoryNotice({ type: 'error', message: 'No se pudo eliminar del servidor.' });
    }
  };

  // Auto-hide notices after 2 seconds
  useEffect(() => {
    if (historyNotice) {
      const timer = setTimeout(() => {
        setHistoryNotice(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [historyNotice]);

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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">

        {/* Header & Controls */}
        {/* Header & Controls */}
        <div className="space-y-6 border-b border-slate-200/50 pb-6 mb-2">
          <div>
            <h1 className="text-3xl font-bold text-ocular-text-main">Historial de Evaluaciones</h1>
            <p className="text-ocular-text-muted mt-1">Gestión y consulta de todos los análisis realizados por la plataforma.</p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {/* Fila superior: Buscador escrito */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ocular-text-muted w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por ID o archivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="bg-white/50 border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-sm outline-none focus:border-primary transition-all w-full shadow-md font-medium text-ocular-text-main"
              />
              <AnimatePresence>
                {showSuggestions && search.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute left-0 right-0 mt-2 z-[99] rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden py-1.5 max-h-80 overflow-y-auto w-full"
                  >
                    {getSuggestions().length > 0 ? (
                      <>
                        <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                          Sugerencias de búsqueda
                        </div>
                        {getSuggestions().map((sug, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onMouseDown={() => {
                              openHistoryDetail(sug.item, sug.targetIndex);
                              setShowSuggestions(false);
                            }}
                            className="w-full px-4 py-2.5 hover:bg-primary/5 flex items-center justify-between text-left transition-all border-b border-slate-100/50 last:border-none group"
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <FileText size={14} />
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-800 truncate group-hover:text-primary transition-colors">
                                  {sug.title}
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                                  {sug.subtitle}
                                </p>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                          </button>
                        ))}
                      </>
                    ) : (
                      <div className="px-4 py-6 text-center text-xs text-slate-400 font-medium">
                        Sin sugerencias para "{search}"
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Fila inferior de filtros */}
            <div className="flex flex-wrap items-center justify-between gap-4 w-full">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-white/50 p-1 rounded-xl border border-slate-200/80 shadow-sm shrink-0">
                  {['all', 'high', 'medium', 'low', 'mixed'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setRiskFilter(f)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap",
                        riskFilter === f ? "bg-primary text-white shadow-sm" : "text-ocular-text-muted hover:text-primary"
                      )}
                    >
                      {f === 'all' ? 'Todos' : f === 'high' ? 'Críticos' : f === 'medium' ? 'Medios' : f === 'low' ? 'Bajos' : 'Mixtos'}
                    </button>
                  ))}
                </div>

                <div className="relative group shrink-0">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4 pointer-events-none group-focus-within:scale-110 transition-transform" />
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-white/70 border border-slate-200 pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-primary transition-all w-48 font-bold text-ocular-text-main shadow-sm"
                  />
                  {dateFilter && (
                    <button
                      onClick={(e) => { e.preventDefault(); setDateFilter(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-ocular-error uppercase hover:scale-105 transition-transform"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {hasHistoryToClear && (
                <button
                  type="button"
                  onClick={() => setClearModalOpen(true)}
                  disabled={clearingHistory}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white/80 text-slate-600 font-bold text-xs uppercase tracking-wider hover:border-ocular-error/45 hover:text-ocular-error hover:bg-red-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
                >
                  <Trash2 size={14} />
                  {clearingHistory ? 'Limpiando...' : 'Limpiar historial'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* History Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-bold text-ocular-text-muted uppercase tracking-widest">Sincronizando con la Base de Datos...</p>
          </div>
        ) : paginatedHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedHistory.map((item, index) => (
                <HistoryCard
                  key={item.inference_id || item.batch_id}
                  item={item}
                  index={index}
                  clearingHistory={clearingHistory}
                  onClick={() => openHistoryDetail(item)}
                  onDelete={(e) => deleteItem(e, item)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <GlassCard className="py-20 text-center border border-slate-200 shadow-md shadow-slate-200/50">
            <Search className="w-12 h-12 text-ocular-text-muted/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-ocular-text-main">No se encontraron resultados</h3>
            <p className="text-ocular-text-muted">Ajusta los filtros o intenta con otra búsqueda.</p>
            <button onClick={() => { setSearch(""); setRiskFilter("all"); setDateFilter(""); }} className="mt-4 text-primary font-bold hover:underline">Limpiar búsqueda y filtros</button>
          </GlassCard>
        )}

        {filteredHistory.length > 0 && totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-4 py-8">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl bg-white/40 text-ocular-text-main font-bold border border-white/60 hover:bg-white hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-sm font-bold text-ocular-text-muted">
              Página {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}

        <AnimatePresence>
          {clearModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="w-full max-w-md rounded-[2.5rem] border border-white/40 bg-white/95 backdrop-blur-2xl shadow-2xl p-8 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-ocular-error/10 rounded-3xl flex items-center justify-center mx-auto text-ocular-error">
                  <Trash2 size={40} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-ocular-text-main tracking-tight">¿Limpiar Historial?</h4>
                  <p className="text-sm text-ocular-text-muted font-medium">
                    Esta acción eliminará todos los registros de forma permanente. No se puede deshacer.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setClearModalOpen(false)}
                    className="px-6 py-4 rounded-2xl border border-white/60 bg-white text-ocular-text-main font-bold text-sm hover:bg-slate-50 transition-colors uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmClearHistory}
                    className="px-6 py-4 rounded-2xl bg-ocular-error text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-ocular-error/20 uppercase tracking-widest"
                  >
                    Confirmar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {deleteModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="w-full max-w-md rounded-[2.5rem] border border-white/40 bg-white/95 backdrop-blur-2xl shadow-2xl p-8 text-center space-y-6"
              >
                <div className="w-20 h-20 bg-ocular-error/10 rounded-3xl flex items-center justify-center mx-auto text-ocular-error">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-ocular-text-main tracking-tight">¿Eliminar Análisis?</h4>
                  <p className="text-sm text-ocular-text-muted font-medium">
                    {itemToDelete?.is_batch
                      ? `Estás por eliminar un lote de ${itemToDelete.batch_size} imágenes.`
                      : `Se eliminará el análisis del archivo "${(itemToDelete?.summary?.filename || itemToDelete?.filename) || 'Desconocido'}".`}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => { setDeleteModalOpen(false); setItemToDelete(null); }}
                    className="px-6 py-4 rounded-2xl border border-white/60 bg-white text-ocular-text-main font-bold text-sm hover:bg-slate-50 transition-colors uppercase tracking-widest"
                  >
                    No, volver
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="px-6 py-4 rounded-2xl bg-ocular-error text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-ocular-error/20 uppercase tracking-widest"
                  >
                    Sí, eliminar
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

function HistoryCard({ item, onClick, onDelete, index, clearingHistory = false }) {
  const summary = item.summary || {
    filename: item.filename,
    risk_level: item.risk_level,
    risk_max_level: item.risk_level,
    positive_models: item.positive_models,
    total_models: item.total_models,
    headline: item.result?.comparison_summary?.headline,
    primary_grade: item.result?.primary_result?.predicted_class,
    risk_counts: item.result?.comparison_summary?.risk_counts || {},
  };
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let noRdCount = 0;
  const getGradeFromRecord = (record) => getConsensusGradeFromResult(record?.result);
  const classifyGrade = (gradeRaw) => {
    const grade = Number(gradeRaw);
    if (!Number.isFinite(grade)) return;
    if (grade >= 3) highCount += 1;
    else if (grade === 2) mediumCount += 1;
    else if (grade === 1) lowCount += 1;
    else if (grade === 0) noRdCount += 1;
  };
  if (item.is_batch && Array.isArray(item.items) && item.items.length > 0) {
    item.items.forEach((it) => {
      const grade = getGradeFromRecord(it);
      classifyGrade(grade);
    });
  } else {
    const grade = getGradeFromRecord(item);
    classifyGrade(grade);
  }
  const hasMixedCounts = [highCount, mediumCount, lowCount, noRdCount].filter((c) => c > 0).length >= 2;
  const inferredRiskLevel = hasMixedCounts
    ? 'mixed'
    : (highCount > 0 ? 'high' : mediumCount > 0 ? 'medium' : lowCount > 0 ? 'low' : null);
  const riskLevel = inferredRiskLevel || summary?.risk_level || item.risk_level || 'low';

  const getRiskBadgeStyle = (level) => {
    switch (level) {
      case 'high':
        return 'border-red-500/45 bg-red-500/10 text-red-700 shadow-red-500/5';
      case 'medium':
        return 'border-amber-500/45 bg-amber-500/10 text-amber-700 shadow-amber-500/5';
      case 'low':
        return 'border-emerald-500/45 bg-emerald-500/10 text-emerald-700 shadow-emerald-500/5';
      case 'mixed':
      default:
        return 'border-primary/45 bg-primary/10 text-primary-dark shadow-primary/5';
    }
  };

  const riskText = riskLevel === 'mixed'
    ? (highCount > 0 ? 'Mixto (incluye altos)' : 'Mixto')
    : riskLevel === 'high'
      ? 'Prioridad Alta'
      : riskLevel === 'medium'
        ? 'Monitoreo'
        : 'Estable';

  const transitionDelay = clearingHistory ? 0 : (index || 0) * 0.05;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: transitionDelay }}
    >
      <GlassCard
        className="group hover:border-primary/50 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 cursor-pointer p-0 overflow-hidden h-full flex flex-col bg-gradient-to-br from-white via-white to-slate-50/70 border border-slate-200 shadow-md shadow-slate-200/80"
        onClick={onClick}
      >
        <div className="p-5 flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className={cn("px-3 py-1 rounded-full text-xs font-medium tracking-wider border backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.45)]", getRiskBadgeStyle(riskLevel))}>
              {riskText}
            </div>
            <span className="text-xs text-slate-700 font-medium flex items-center gap-1">
              <Calendar size={12} /> {new Date(item.timestamp).toLocaleDateString()}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(e); }}
              className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
              title="Eliminar este análisis"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-ocular-text-main group-hover:text-primary transition-colors flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              {item.is_batch ? `Lote # ${(item.batch_id || 'N/A').substring(0, 8)}` : `Archivo: ${summary?.filename || item.filename || 'Sin nombre'}`}
            </h3>
            {item.is_batch && (
              <p className="text-xs text-slate-700 font-medium truncate uppercase tracking-widest">
                Contiene <span className="text-primary">{item.batch_size} imágenes</span>
              </p>
            )}
            <p className="text-xs text-ocular-text-main font-medium mt-1">
              {item.is_batch
                ? `Altos: ${highCount} · Medios: ${mediumCount} · Bajos: ${lowCount} · NO R.D.: ${noRdCount}`
                : (summary?.headline || item.diagnosis || 'Comparaci?n de modelos RD')}
            </p>
            {summary?.is_mixed_risk}
          </div>

          {!item.is_batch && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/40 transition-colors">
                <p className="text-[8px] font-extrabold text-ocular-text-muted uppercase tracking-wider">Modelos Positivos</p>
                <p className="text-sm font-black text-ocular-text-main mt-0.5">
                  {summary?.positive_models ?? 0}/{summary?.total_models ?? item.models_used?.length ?? 0}
                </p>
              </div>
              <div className="bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/40 transition-colors">
                <p className="text-[8px] font-extrabold text-ocular-text-muted uppercase tracking-wider">Diagnóstico</p>
                <p className="text-xs font-black text-primary mt-0.5 truncate uppercase tracking-tight">
                  {summary?.primary_grade !== undefined && summary?.primary_grade !== null
                    ? ['NO R.D.', 'Leve', 'Moderado', 'Severo', 'Proliferativo'][summary.primary_grade] || 'N/A'
                    : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-primary/5 p-3.5 flex justify-between items-center group-hover:bg-gradient-to-r group-hover:from-sky-500/10 group-hover:to-primary/5 border-t border-slate-100/50 transition-all duration-300">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Ver Informe Detallado</span>
          <ChevronRight size={16} className="text-primary group-hover:translate-x-1.5 transition-transform" />
        </div>
      </GlassCard>
    </motion.div>
  );
}

