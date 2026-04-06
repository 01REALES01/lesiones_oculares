import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, ChevronRight, FileText, AlertCircle, CheckCircle2, Loader2, Trash2 } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { analysisService } from '../services/api';
import { cn } from '../utils';

export default function HistoryPage({ onViewDetail }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all"); // all | high | medium | low

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await analysisService.getHistory(50);
      setHistory(data);
    } catch (e) {
      console.error("Error cargando historial:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.inference_id.toLowerCase().includes(search.toLowerCase()) || 
                         (item.summary?.filename || "").toLowerCase().includes(search.toLowerCase());
    
    // El backend devuelve risk_score o lo calculamos del resumen
    const risk = item.risk_score || (item.summary?.glaucoma_risk_level === 'high' ? 0.8 : item.summary?.glaucoma_risk_level === 'medium' ? 0.5 : 0.2);
    
    const itemLevel = risk > 0.6 ? 'high' : risk > 0.3 ? 'medium' : 'low';
    const matchesRisk = riskFilter === 'all' || itemLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-ocular-text-main">Historial de Evaluaciones</h1>
          <p className="text-ocular-text-muted">Gestión y consulta de todos los análisis realizados por la plataforma.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
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
            {['all', 'high', 'medium', 'low'].map((f) => (
              <button
                key={f}
                onClick={() => setRiskFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                  riskFilter === f ? "bg-primary text-white shadow-md" : "text-ocular-text-muted hover:text-primary"
                )}
              >
                {f === 'all' ? 'Todos' : f === 'high' ? 'Críticos' : f === 'medium' ? 'Medios' : 'Bajos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <Loader2 className="w-10 h-10 text-primary animate-spin" />
           <p className="text-sm font-bold text-ocular-text-muted uppercase tracking-widest">Sincronizando con la Base de Datos...</p>
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredHistory.map((item, index) => (
              <HistoryCard 
                key={item.inference_id} 
                item={item} 
                index={index} 
                onClick={() => onViewDetail(item, 0)} 
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <GlassCard className="py-20 text-center">
            <Search className="w-12 h-12 text-ocular-text-muted/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-ocular-text-main">No se encontraron resultados</h3>
            <p className="text-ocular-text-muted">Ajusta los filtros o intenta con otra búsqueda.</p>
            <button onClick={() => {setSearch(""); setRiskFilter("all")}} className="mt-4 text-primary font-bold hover:underline">Ver todo el historial</button>
        </GlassCard>
      )}
    </div>
  );
}

function HistoryCard({ item, onClick, index }) {
  const risk = item.risk_score || (item.summary?.glaucoma_risk_level === 'high' ? 0.8 : 0.2);
  const color = risk > 0.6 ? 'bg-ocular-error' : risk > 0.3 ? 'bg-amber-400' : 'bg-ocular-success';

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
                {risk > 0.6 ? 'Prioridad Alta' : risk > 0.3 ? 'Monitoreo' : 'Estable'}
            </div>
            <span className="text-[10px] text-ocular-text-muted font-bold flex items-center gap-1">
                <Calendar size={12} /> {new Date(item.timestamp).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-1">
             <h3 className="font-bold text-ocular-text-main group-hover:text-primary transition-colors flex items-center gap-2">
                <FileText size={16} className="text-primary" /> Analisis #{item.inference_id.substring(0,8)}
             </h3>
             <p className="text-[10px] text-ocular-text-muted font-medium truncate uppercase tracking-tighter">Archivo: {item.summary?.filename || 'Desconocido'}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
             <div className="bg-white/40 p-2 rounded-xl border border-white/60">
                <p className="text-[8px] font-bold text-ocular-text-muted uppercase">Glaucoma</p>
                <p className="text-xs font-extrabold text-ocular-text-main">
                    {(item.summary?.glaucoma_probability_percent || (risk * 100)).toFixed(1)}%
                </p>
             </div>
             <div className="bg-white/40 p-2 rounded-xl border border-white/60">
                <p className="text-[8px] font-bold text-ocular-text-muted uppercase">CDR</p>
                <p className="text-xs font-extrabold text-ocular-text-main">
                    {item.summary?.cup_to_disc_ratio?.toFixed(2) || 'N/A'}
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
