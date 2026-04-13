import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, ChevronRight, FileText, Loader2, Trash2 } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { analysisService } from '../services/api';
import { cn } from '../utils';

export default function HistoryPage({ onViewDetail }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [historyNotice, setHistoryNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all"); // all | high | medium | low | mixed
  const [page, setPage] = useState(0);
  const limit = 12;
  const hasHistoryToClear = history.length > 0;

  useEffect(() => {
    loadAllHistory();
  }, []);

  // Reset to page 0 whenever filter or search changes
  useEffect(() => {
    if (page !== 0) setPage(0);
  }, [riskFilter, search]);


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
    const matchesSearch = item.inference_id.toLowerCase().includes(search.toLowerCase()) || 
                         (item.summary?.filename || "").toLowerCase().includes(search.toLowerCase());

    const itemLevel = item.summary?.risk_level || 'low';
    const itemMaxLevel = item.summary?.risk_max_level || itemLevel;
    const riskCounts = item.summary?.risk_counts || {};
    const mixedHasRisk = (level) => Number(riskCounts[level] || 0) > 0;
    const matchesRisk =
      riskFilter === 'all' ||
      itemLevel === riskFilter ||
      (itemLevel === 'mixed' && (
        (riskFilter === 'high' && (mixedHasRisk('high') || itemMaxLevel === 'high')) ||
        (riskFilter === 'medium' && (mixedHasRisk('medium') || itemMaxLevel === 'medium')) ||
        (riskFilter === 'low' && mixedHasRisk('low'))
      ));

    return matchesSearch && matchesRisk;
  });

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / limit));
  const hasMore = page < totalPages - 1;
  const paginatedHistory = filteredHistory.slice(page * limit, (page + 1) * limit);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  const openHistoryDetail = async (item) => {
    try {
      if (item.is_batch && item.batch_id) {
        const fullBatch = await analysisService.getBatch(item.batch_id);
        const mappedBatch = fullBatch.map(b => ({
          ...b.result,
          inference_id: b.inference_id,
          timestamp: b.timestamp,
          traceability: {
            inference_id: b.inference_id,
            models_used: b.models_used,
            inference_times_ms: b.inference_times_ms,
            timestamp: b.timestamp,
          }
        }));
        onViewDetail(mappedBatch, 0);
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
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

      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold text-ocular-text-main">Historial de Evaluaciones</h1>
          <p className="text-ocular-text-muted">Gestión y consulta de todos los análisis realizados por la plataforma.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ocular-text-muted w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por ID o archivo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/50 border border-white/60 pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-primary transition-all w-64"
            />
          </div>
          
          <div className="flex bg-white/40 p-1 rounded-xl border border-white/60">
            {['all', 'high', 'medium', 'low', 'mixed'].map((f) => (
              <button
                key={f}
                onClick={() => setRiskFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                  riskFilter === f ? "bg-primary text-white shadow-md" : "text-ocular-text-muted hover:text-primary"
                )}
              >
                {f === 'all' ? 'Todos' : f === 'high' ? 'Críticos' : f === 'medium' ? 'Medios' : f === 'low' ? 'Bajos' : 'Mixtos'}
              </button>
            ))}
          </div>

          {hasHistoryToClear && (
            <button
              type="button"
              onClick={() => setClearModalOpen(true)}
              disabled={clearingHistory}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/60 bg-white/75 text-slate-600 font-bold text-xs uppercase tracking-wider hover:border-ocular-error/40 hover:text-ocular-error transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} />
              {clearingHistory ? 'Limpiando...' : 'Limpiar historial'}
            </button>
          )}
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
                key={item.inference_id}
                item={item}
                index={index}
                onClick={() => openHistoryDetail(item)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <GlassCard className="py-20 text-center">
          <Search className="w-12 h-12 text-ocular-text-muted/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-ocular-text-main">No se encontraron resultados</h3>
          <p className="text-ocular-text-muted">Ajusta los filtros o intenta con otra búsqueda.</p>
          <button onClick={() => { setSearch(""); setRiskFilter("all"); }} className="mt-4 text-primary font-bold hover:underline">Ver todo el historial</button>
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
                  Esto eliminará todos los registros de historial.
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
  );
}

function HistoryCard({ item, onClick, index }) {
  const riskLevel = item.summary?.risk_level || 'low';
  const riskMaxLevel = item.summary?.risk_max_level || riskLevel;
  const color = riskLevel === 'mixed'
    ? 'bg-sky-500'
    : riskLevel === 'high'
      ? 'bg-ocular-error'
      : riskLevel === 'medium'
        ? 'bg-amber-400'
        : 'bg-ocular-success';
  const riskText = riskLevel === 'mixed'
    ? `Mixto (${riskMaxLevel === 'high' ? 'incluye críticos' : riskMaxLevel === 'medium' ? 'incluye medios' : 'estable'})`
    : riskLevel === 'high'
      ? 'Prioridad Alta'
      : riskLevel === 'medium'
        ? 'Monitoreo'
        : 'Estable';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
    >
      <GlassCard 
        className="group hover:border-primary/40 transition-all cursor-pointer p-0 overflow-hidden h-full flex flex-col"
        onClick={onClick}
      >
        <div className="p-5 flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className={cn("px-2 py-1 rounded-md text-[8px] font-bold text-white uppercase", color)}>
                {riskText}
            </div>
            <span className="text-[10px] text-ocular-text-muted font-bold flex items-center gap-1">
                <Calendar size={12} /> {new Date(item.timestamp).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-1">
             <h3 className="font-bold text-ocular-text-main group-hover:text-primary transition-colors flex items-center gap-2">
                <FileText size={16} className="text-primary" /> {item.is_batch ? `Lote de ${item.batch_size} Análisis` : `Analisis #${item.inference_id.substring(0,8)}`}
             </h3>
             <p className="text-[10px] text-ocular-text-muted font-medium truncate uppercase tracking-tighter">Archivo: {item.summary?.filename || 'Desconocido'}</p>
             <p className="text-xs text-ocular-text-main font-semibold">{item.summary?.headline || 'Comparación de modelos RD'}</p>
             {item.summary?.is_mixed_risk && (
              <p className="text-[10px] text-ocular-text-muted font-semibold uppercase tracking-tight">
                Altos: {item.summary?.risk_counts?.high ?? 0} | Medios: {item.summary?.risk_counts?.medium ?? 0} | Bajos: {item.summary?.risk_counts?.low ?? 0}
              </p>
             )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
             <div className="bg-white/40 p-2 rounded-xl border border-white/60">
               <p className="text-[8px] font-bold text-ocular-text-muted uppercase">Modelos Positivos</p>
                <p className="text-xs font-extrabold text-ocular-text-main">
                  {item.summary?.positive_models ?? 0}/{item.summary?.total_models ?? item.models_used?.length ?? 0}
                </p>
             </div>
             <div className="bg-white/40 p-2 rounded-xl border border-white/60">
               <p className="text-[8px] font-bold text-ocular-text-muted uppercase">Grado Principal</p>
                <p className="text-xs font-extrabold text-ocular-text-main">
                  {item.summary?.primary_grade !== undefined && item.summary?.primary_grade !== null ? `G${item.summary.primary_grade}` : 'N/A'}
                </p>
             </div>
          </div>
        </div>

        <div className="bg-primary/5 p-3 flex justify-between items-center group-hover:bg-primary/10 transition-colors">
            <span className="text-[10px] font-bold text-primary uppercase">Ver Informe Detallado</span>
            <ChevronRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
        </div>
      </GlassCard>
    </motion.div>
  );
}
