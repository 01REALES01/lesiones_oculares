import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Activity, ShieldCheck, Eye, Info, Download, Share2, ClipboardList, ChevronLeft, ChevronRight, Printer, FileDown } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { cn } from '../utils';

export default function AnalysisDetail({ result, batch = [], currentIndex = 0, onNext, onPrev, onBack }) {
  if (!result) return null;

  const diagnosis = result.explanation || result.summary || {};
  const modelsUsed = result.traceability?.models_used || ["A", "B", "C"];
  const isBatch = batch.length > 1;
  
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `ocular_ai_report_${result.inference_id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500 pb-12 print:p-0">
      {/* Navigation Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-ocular-text-muted hover:text-primary transition-colors font-bold text-sm bg-white/40 px-4 py-2 rounded-xl border border-white/60"
          >
            <ArrowLeft size={18} /> Volver
          </button>
          
          {isBatch && (
            <div className="flex items-center gap-2 bg-white/40 px-4 py-2 rounded-xl border border-white/60">
               <button 
                onClick={onPrev} 
                disabled={currentIndex === 0}
                className="text-ocular-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
               >
                 <ChevronLeft size={20} />
               </button>
               <span className="text-[10px] font-bold text-ocular-text-main uppercase tracking-widest min-w-[80px] text-center">
                 Imagen {currentIndex + 1} / {batch.length}
               </span>
               <button 
                onClick={onNext} 
                disabled={currentIndex === batch.length - 1}
                className="text-ocular-text-muted hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
               >
                 <ChevronRight size={20} />
               </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
           <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white/40 rounded-xl border border-white/60 text-ocular-text-muted hover:text-primary transition-all font-bold text-xs uppercase">
             <Printer size={18}/> Imprimir
           </button>
           <button onClick={handleExportJSON} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all font-bold text-xs uppercase">
             <FileDown size={18}/> Exportar Datos
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={result.inference_id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="grid grid-cols-1 xl:grid-cols-12 gap-8"
        >
          {/* Left Column: Metrics & Verdicts */}
          <div className="xl:col-span-4 space-y-6">
             <div className="space-y-1">
               <h2 className="text-2xl font-bold text-ocular-text-main">Veredicto Clínico</h2>
               <p className="text-sm text-ocular-text-muted font-medium uppercase tracking-widest">ID Reporte: #{result.inference_id?.substring(0,8)}</p>
             </div>

             {/* Risk Gauge Card */}
             <GlassCard className="relative overflow-hidden border-none text-white bg-gradient-to-br from-primary-dark to-indigo-600 shadow-primary/20">
                <div className="relative z-10 space-y-4">
                   <div className="flex items-center gap-2 opacity-80">
                     <ShieldCheck size={18} />
                     <span className="text-xs font-bold uppercase tracking-widest">Nivel de Riesgo IA</span>
                   </div>
                   <div>
                     <h3 className="text-4xl font-extrabold uppercase tracking-tight">
                       {diagnosis.glaucoma_risk_level === 'high' ? 'Alto' : diagnosis.glaucoma_risk_level === 'medium' ? 'Medio' : 'Bajo'}
                     </h3>
                     <p className="text-sm font-medium text-white/70 mt-1">Estimación basada en {modelsUsed.length} modelos neuronales.</p>
                   </div>
                </div>
                <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
             </GlassCard>

             {/* Detailed Scores */}
             <div className="space-y-4">
                <GlassCard className="p-5 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-ocular-text-muted uppercase tracking-wider">Probabilidad Glaucoma</span>
                    <span className="text-xl font-bold text-ocular-text-main">
                      {result.glaucoma_probability 
                        ? (result.glaucoma_probability * 100).toFixed(1) 
                        : diagnosis.glaucoma_probability_percent || '0.0'}%
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-primary/20 flex items-center justify-center">
                     <div className="text-[10px] font-bold text-primary">IA</div>
                  </div>
                </GlassCard>

                <GlassCard className="p-5 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-ocular-text-muted uppercase tracking-wider">CUP-TO-DISC RATIO (CDR)</span>
                    <span className="text-xl font-bold text-ocular-text-main">
                      {result.cup_to_disc_ratio?.toFixed(2) || diagnosis.cup_to_disc_ratio || 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 bg-ocular-success/10 text-ocular-success rounded-lg">
                    <Eye size={20} />
                  </div>
                </GlassCard>

                <GlassCard className="p-5 flex items-center justify-between border-indigo-200">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Retinopatía Diabética</span>
                    <span className="text-xl font-bold text-ocular-text-main">
                      {diagnosis.dr_diagnosis || 'Sin Hallazgos'}
                    </span>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                    diagnosis.dr_grade > 0 ? "bg-indigo-100 text-indigo-600" : "bg-green-100 text-green-600"
                  )}>
                    G{diagnosis.dr_grade || 0}
                  </div>
                </GlassCard>
             </div>

             <div className="p-6 bg-white/40 border border-white/60 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <ClipboardList size={18} /> Sugerencia de la IA
                </div>
                <p className="text-sm text-ocular-text-main leading-relaxed italic font-medium">
                  "{result.recommendation || diagnosis.recommendation_short || 'Se recomienda seguimiento clínico habitual.'}"
                </p>
             </div>
          </div>

          {/* Right Column: XAI Heatmap Viewer */}
          <div className="xl:col-span-8">
             <GlassCard className="h-full p-2 flex flex-col overflow-hidden bg-black/5 border-none shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Eye size={20} />
                     </div>
                     <div>
                       <h3 className="text-sm font-bold text-ocular-text-main uppercase tracking-tight">Análisis Espacial XAI</h3>
                       <p className="text-[10px] text-ocular-text-muted font-bold">Mapeo de Activación de Red Neuronal</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 bg-white/60 rounded-full border border-white text-[10px] font-bold text-ocular-text-muted">
                      <Info size={12} />
                      PROCESADO POR EFFICIENTNET-B0
                   </div>
                </div>

                <div className="flex-1 relative bg-black/60 m-2 rounded-2xl overflow-hidden flex items-center justify-center min-h-[500px]">
                   {result.heatmap_image_base64 ? (
                     <div className="relative group">
                       <img 
                        src={`data:image/png;base64,${result.heatmap_image_base64}`} 
                        alt="Neuronal Activation"
                        className="max-h-[70vh] object-contain transition-transform duration-700 group-hover:scale-105"
                       />
                       <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,...')] opacity-20" />
                     </div>
                   ) : (
                     <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-white/10 rounded-3xl mx-auto flex items-center justify-center animate-pulse">
                           <Eye size={40} className="text-white/20" />
                        </div>
                        <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Previsualización no disponible</p>
                     </div>
                   )}
                   
                   <div className="absolute bottom-6 right-6 p-4 glass-panel bg-black/40 text-white border-white/10 scale-90">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2 border-b border-white/20 pb-2">Leyenda de Calor</p>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_red]" /><span className="text-[8px] font-bold uppercase">Lesión</span></div>
                         <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_yellow]" /><span className="text-[8px] font-bold uppercase">Sospecha</span></div>
                      </div>
                   </div>
                </div>

                <div className="px-6 py-4 bg-primary/5 text-center">
                   <p className="text-[9px] text-ocular-text-muted font-bold leading-relaxed px-10">
                     LOS RESULTADOS PRESENTADOS SON PARA APOYO CLÍNICO Y EDUCATIVO. NO CONSTITUYEN DIAGNÓSTICO MÉDICO DEFINITIVO.
                   </p>
                </div>
             </GlassCard>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
