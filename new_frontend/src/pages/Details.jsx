import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Activity, ShieldCheck, Eye, Info, ClipboardList, ChevronLeft, ChevronRight, Printer, FileDown, Trash2, FileSpreadsheet, Search } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { cn } from '../utils';
import api, { analysisService } from '../services/api';

const probabilityLabels = ['NO R.D.', 'Leve', 'Moderado', 'Severo', 'Proliferativo'];

function getImageUrl(result) {
  if (!result) return null;
  if (result.uploaded_image_preview) return result.uploaded_image_preview;
  
  // Si no hay preview en base64, intentar construir la URL estática de la imagen
  const filename = result.filename || result.summary?.filename;
  if (!filename) return null;
  
  // Obtener URL base de la API
  let baseUrl = 'http://127.0.0.1:8000';
  try {
    const apiBase = api?.defaults?.baseURL;
    if (apiBase) {
      // Si termina en /api, el mount está en el host base
      baseUrl = apiBase.endsWith('/api') ? apiBase.substring(0, apiBase.length - 4) : apiBase;
    }
  } catch (e) {
    console.error("Error getting baseURL:", e);
  }
  
  return `${baseUrl}/images/${filename}`;
}

function normalizeProbability(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  //const percent = parsed <= 1 ? parsed * 100 : parsed;
  return Math.max(0, Math.min(100, parsed));
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function riskLabel(level) {
  if (level === 'high') return 'Alto';
  if (level === 'medium') return 'Medio';
  return 'Bajo';
}

function gradeToLabel(grade) {
  const labels = ['NO R.D.', 'Leve', 'Moderado', 'Severo', 'Proliferativo'];
  return labels[grade] || `Grado ${grade}`;
}

function suggestionByGrade(grade) {
  if (grade >= 4) return 'Compatible con retinopatia diabetica proliferativa. Se recomienda evaluacion oftalmologica urgente.';
  if (grade >= 3) return 'Compatible con retinopatia diabetica severa. Se recomienda derivacion prioritaria a oftalmologia.';
  if (grade >= 2) return 'Compatible con retinopatia diabetica moderada. Se recomienda seguimiento oftalmologico estrecho.';
  if (grade >= 1) return 'Compatible con retinopatia diabetica leve. Se sugiere control oftalmologico programado.';
  return 'No se observan signos aparentes de retinopatia diabetica. Se recomienda control oftalmologico periodico.';
}

function getGradeStyle(grade) {
  switch (grade) {
    case 0: // NO R.D.
      return 'border border-emerald-500 bg-emerald-500/10 text-emerald-700';
    case 1: // Leve
      return 'border border-sky-500 bg-sky-500/10 text-sky-700';
    case 2: // Moderado
      return 'border border-amber-500 bg-amber-500/10 text-amber-700';
    case 3: // Severo
      return 'border border-orange-500 bg-orange-500/10 text-orange-700';
    case 4: // Proliferativo
      return 'border border-rose-500 bg-rose-500/10 text-rose-700';
    default:
      return 'border border-slate-500 bg-slate-500/10 text-slate-700';
  }
}

function ZoomableImage({ src, alt, className }) {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [[x, y], setXY] = useState([0, 0]);
  const [[imgWidth, imgHeight], setSize] = useState([0, 0]);
  const magnifierSize = 200;
  const zoomLevel = 2.5;

  return (
    <div 
      className={cn("relative overflow-hidden cursor-crosshair", className)}
      onMouseEnter={(e) => {
        const elem = e.currentTarget;
        const { width, height } = elem.getBoundingClientRect();
        setSize([width, height]);
        setShowMagnifier(true);
      }}
      onMouseMove={(e) => {
        const elem = e.currentTarget;
        const { top, left } = elem.getBoundingClientRect();
        const x = e.pageX - left - window.scrollX;
        const y = e.pageY - top - window.scrollY;
        setXY([x, y]);
      }}
      onMouseLeave={() => setShowMagnifier(false)}
    >
      <img src={src} alt={alt} className="w-full h-full object-contain" />
      
      <div data-html2canvas-ignore="true" className="absolute top-4 right-4 bg-primary text-white p-2 rounded-full shadow-lg no-print animate-pulse">
        <Search size={18} />
      </div>
      
      {showMagnifier && (
        <div
          style={{
            position: "absolute",
            pointerEvents: "none",
            height: `${magnifierSize}px`,
            width: `${magnifierSize}px`,
            top: `${y - magnifierSize / 2}px`,
            left: `${x - magnifierSize / 2}px`,
            opacity: "1",
            border: "2px solid rgba(255, 255, 255, 0.5)",
            borderRadius: "50%",
            backgroundColor: "white",
            backgroundImage: `url('${src}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${imgWidth * zoomLevel}px ${imgHeight * zoomLevel}px`,
            backgroundPosition: `${-x * zoomLevel + magnifierSize / 2}px ${-y * zoomLevel + magnifierSize / 2}px`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            zIndex: 50
          }}
        />
      )}
    </div>
  );
}

export default function AnalysisDetail({
  result,
  batch = [],
  currentIndex = 0,
  onNext,
  onPrev,
  onBack,
  showActions = true,
  showReportId = true,
  onDelete,
  hideImage = false,
}) {
  const reportRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!result) return null;

  const isBatch = batch.length > 1;
  const comparisonModels = Array.isArray(result.model_comparisons) ? result.model_comparisons : [];
  const hasComparison = comparisonModels.length > 0;
  const summary = result.comparison_summary || {};
  const primaryResult = result.primary_result || result;
  const traceability = result.traceability || {};
  const timestamp = result.timestamp || traceability.timestamp || result.timestamp || null;
  const averageLatency = hasComparison
    ? (comparisonModels.reduce((total, item) => total + Number(item.inference_time_ms || 0), 0) / comparisonModels.length)
    : Number(result.inference_time_ms ?? traceability?.inference_times_ms?.C ?? 0);
  
  const inferenceId = result.inference_id || traceability.inference_id || 'N/A';
  const activeRisk = summary.risk_level || primaryResult.risk_level || result.risk_level || 'low';
  const consensusGrade = summary.consensus_grade ?? primaryResult.predicted_class ?? result.predicted_class ?? 0;
  const rightPanelTitle = hasComparison ? 'Comparacion de Modelos RD' : 'Imagen Analizada';
  const rightPanelSubtitle = hasComparison
    ? 'Comparativa de clasificacion y confianza entre modelos seleccionados'
    : 'Visualizacion de la retinografia procesada';

  const singleProbabilities = probabilityLabels.map((label, index) => ({
    label,
    value: normalizeProbability(primaryResult.raw_probabilities?.[index] ?? result.raw_probabilities?.[index] ?? 0),
  }));
  const singleHasProbabilityData = singleProbabilities.some((item) => item.value > 0);

  const handlePrint = async () => {
    setIsGeneratingPdf(true);
    
    // Pequeño delay para asegurar que el React state se renderice (el header de Dr Ocular)
    setTimeout(async () => {
      if (!reportRef.current) return;
      try {
        const canvas = await html2canvas(reportRef.current, {
          scale: 2, // Mejor calidad
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Crear PDF con dimensiones adaptadas al canvas (una sola pagina larga o ancha)
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'l' : 'p',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        
        const fileName = result.filename || result.summary?.filename || 'analisis';
        const cleanName = fileName.replace(/\.[^/.]+$/, ""); 
        pdf.save(`Ocular_AI_${cleanName}.pdf`);
      } catch (err) {
        console.error('Error al generar el PDF', err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 150);
  };

  const handleExportJSON = () => {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(result, null, 2))}`;
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `ocular_ai_report_${result.inference_id}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const handleExportExcel = async () => {
    if (!isBatch || !batch[0]?.batch_id) return;
    try {
      const blob = await analysisService.exportBatchExcel(batch[0].batch_id);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `batch_${batch[0].batch_id}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      // Optionally show a toast or alert
    }
  };


  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500 pb-12 print:p-0">
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

        {showActions && (
          <div className="flex gap-3">
            <button 
              onClick={handlePrint} 
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 transition-all font-bold text-xs uppercase tracking-wide"
            >
              <Printer size={18} /> Imprimir / Guardar PDF
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-white/60 text-ocular-text-main rounded-xl border border-white/80 hover:bg-white transition-all font-bold text-xs uppercase shadow-sm">
              {isBatch ? <FileSpreadsheet size={18} /> : <FileDown size={18} />}
              {isBatch ? 'Exportar Excel' : 'Exportar Datos'}
            </button>
            <button 
              onClick={() => onDelete?.(result.inference_id)} 
              className="flex items-center gap-2 px-4 py-2 bg-white/40 border border-white/60 text-ocular-error rounded-xl hover:bg-ocular-error/10 transition-all font-bold text-xs uppercase"
              title="Eliminar este analisis"
            >
              <Trash2 size={18} /> Borrar
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={result.inference_id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          <div ref={reportRef} className="bg-slate-50/50 p-2 sm:p-6 rounded-3xl grid grid-cols-1 xl:grid-cols-12 gap-8">
            {isGeneratingPdf && (
              <div className="xl:col-span-12 mb-4 pb-4 border-b border-slate-200">
                <h1 className="text-3xl font-black text-primary uppercase tracking-widest">Ocular AI Report</h1>
                <p className="text-sm font-bold text-ocular-text-muted mt-1 uppercase">Emitido por: Dr. Ocular Admin User</p>
                <p className="text-xs text-slate-400 mt-1">ID de Reporte: {inferenceId}</p>
              </div>
            )}
            <div className="xl:col-span-4 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-ocular-text-main">Veredicto Clinico</h2>
              {showReportId && (
                <p className="text-[10px] text-ocular-text-muted font-bold uppercase tracking-widest">
                  Nombre del archivo: <span className="text-primary">{result.filename || result.summary?.filename || 'Sin nombre'}</span>
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-ocular-text-muted uppercase tracking-wider">
                  Fecha: {formatTimestamp(timestamp)}
                </span>
                <span className="text-ocular-text-muted">|</span>
                <span className="text-[10px] font-bold text-ocular-text-muted uppercase tracking-wider">
                  Latencia media: {Number.isFinite(averageLatency) ? `${averageLatency.toFixed(2)} ms` : 'N/A'}
                </span>
              </div>
            </div>

            <GlassCard className="relative overflow-hidden border-none text-white bg-gradient-to-br from-primary-dark to-indigo-600 shadow-primary/20">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 opacity-80">
                  <ShieldCheck size={18} />
                  <span className="text-xs font-bold uppercase tracking-widest">Resumen de Riesgo RD</span>
                </div>
                <div>
                  <h3 className="text-4xl font-extrabold uppercase tracking-tight">{riskLabel(activeRisk)}</h3>
                  <p className="text-sm font-medium text-white/70 mt-1">
                    {hasComparison
                      ? `${summary.positive_models ?? 0} de ${summary.total_models ?? comparisonModels.length} modelos detectan retinopatia diabetica.`
                      : `Estimacion basada en ${primaryResult.model_used || 'modelo seleccionado'}.`}
                  </p>
                </div>
              </div>
              <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
            </GlassCard>

            {hasComparison ? (
              <div className="space-y-4">
                <GlassCard className="p-5 border-indigo-200">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Consenso Comparativo</span>
                      <p className="text-xl font-bold text-ocular-text-main">{summary.headline || 'Comparacion de modelos RD'}</p>
                    </div>
                    <div className={cn(
                      'px-3 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-sm',
                      getGradeStyle(consensusGrade)
                    )}>
                      {gradeToLabel(consensusGrade)}
                    </div>
                  </div>
                </GlassCard>

                {comparisonModels.map((item) => (
                  <GlassCard key={item.model_id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-ocular-text-muted uppercase tracking-wider">{item.model_name}</span>
                        <p className="text-lg font-bold text-ocular-text-main">{item.diagnosis}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className={cn(
                            'w-fit px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                            item.model_loaded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          )}>
                            {item.model_loaded ? 'Modelo real' : 'Fallback'}
                          </span>
                          <span className="w-fit px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/70 text-ocular-text-muted border border-white/70">
                            {item.inference_time_ms.toFixed(2)} ms
                          </span>
                        </div>
                      </div>
                      <div className={cn(
                        'px-3 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-sm',
                        getGradeStyle(item.predicted_class)
                      )}>
                        {gradeToLabel(item.predicted_class)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-ocular-text-main">
                        <span>Confianza</span>
                        <span>{Number(item.confidence_percent).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${normalizeProbability(item.confidence_percent)}%` }} />
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <GlassCard className="p-5 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-ocular-text-muted uppercase tracking-wider">Modelo</span>
                    <span className="text-xl font-bold text-ocular-text-main">{primaryResult.model_used || 'Modelo RD'}</span>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-primary/20 flex items-center justify-center">
                    <div className="text-[10px] font-bold text-primary">IA</div>
                  </div>
                </GlassCard>

                <GlassCard className="p-5 flex items-center justify-between border-indigo-200">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Retinopatia Diabetica</span>
                    <span className="text-xl font-bold text-ocular-text-main">{primaryResult.diagnosis || result.diagnosis}</span>
                  </div>
                  <div className={cn(
                    'px-3 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-sm',
                    getGradeStyle(primaryResult.predicted_class ?? 0)
                  )}>
                    {gradeToLabel(primaryResult.predicted_class ?? 0)}
                  </div>
                </GlassCard>

                <GlassCard className="p-5 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-ocular-text-muted uppercase tracking-wider">Confianza del Modelo</span>
                    <span className="text-xl font-bold text-ocular-text-main">
                      {primaryResult.confidence_percent !== null && primaryResult.confidence_percent !== undefined
                        ? `${Number(primaryResult.confidence_percent).toFixed(1)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 bg-ocular-success/10 text-ocular-success rounded-lg">
                    <Eye size={20} />
                  </div>
                </GlassCard>

                {singleHasProbabilityData && (
                  <GlassCard className="p-5 space-y-3">
                    <span className="text-[10px] font-bold text-ocular-text-muted uppercase tracking-wider">Distribucion por grado (G0-G4)</span>
                    <div className="space-y-2">
                      {singleProbabilities.map((item) => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-ocular-text-main">
                            <span>{item.label}</span>
                            <span>{item.value.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                item.label === gradeToLabel(primaryResult.predicted_class ?? 0) ? 'bg-primary' : 'bg-indigo-300'
                              )}
                              style={{ width: `${item.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </div>
            )}

            <div className="p-6 bg-white/40 border border-white/60 rounded-3xl space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <ClipboardList size={18} /> Sugerencia
              </div>
              <p className="text-sm text-ocular-text-main leading-relaxed italic font-medium">
                "{summary.recommendation_short || primaryResult.recommendation_short || suggestionByGrade(consensusGrade)}"
              </p>
            </div>
          </div>

          <div className="xl:col-span-8">
            <GlassCard className="h-full p-2 flex flex-col overflow-hidden bg-black/5 border-none shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ocular-text-main uppercase tracking-tight">{rightPanelTitle}</h3>
                    <p className="text-[10px] text-ocular-text-muted font-bold">{rightPanelSubtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/60 rounded-full border border-white text-[10px] font-bold text-ocular-text-muted">
                  <Info size={12} />
                  {hasComparison ? `${comparisonModels.length} MODELOS RD` : (primaryResult.model_used || result.model_used || 'MODELO IA').toUpperCase()}
                </div>
              </div>

              {hasComparison ? (
                <div className="p-6 space-y-6">
                  {!hideImage && getImageUrl(result) && (
                    <GlassCard className="p-4 border border-white/50 bg-white/60">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-ocular-text-muted uppercase tracking-wider">Retinografia analizada</p>
                        </div>
                        <div className="rounded-2xl overflow-hidden bg-black/10 border border-white/50 flex items-center justify-center min-h-[220px]">
                          <ZoomableImage
                            src={getImageUrl(result)}
                            alt="Retinografia analizada"
                            className="max-h-[320px]"
                          />
                        </div>
                      </div>
                    </GlassCard>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {comparisonModels.map((item) => {
                      const itemProbabilities = probabilityLabels.map((label, index) => ({
                        label,
                        value: normalizeProbability(item.raw_probabilities?.[index] ?? 0),
                      }));
                      return (
                        <GlassCard key={item.model_id} className="p-5 border border-white/50 bg-white/60 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-bold text-ocular-text-muted uppercase tracking-wider">{item.model_name}</p>
                              <p className="text-lg font-bold text-ocular-text-main">{item.diagnosis}</p>
                            </div>
                            <span className={cn(
                              'px-3 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-sm',
                              getGradeStyle(item.predicted_class)
                            )}>
                              {gradeToLabel(item.predicted_class)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-2xl bg-white/70 border border-white/70 p-3">
                              <p className="text-[10px] font-bold text-ocular-text-muted uppercase tracking-wider">Confianza</p>
                              <p className="text-lg font-bold text-ocular-text-main">{Number(item.confidence_percent).toFixed(1)}%</p>
                            </div>
                            <div className="rounded-2xl bg-white/70 border border-white/70 p-3">
                              <p className="text-[10px] font-bold text-ocular-text-muted uppercase tracking-wider">Latencia</p>
                              <p className="text-lg font-bold text-ocular-text-main">{item.inference_time_ms.toFixed(2)} ms</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {itemProbabilities.map((probability) => (
                              <div key={`${item.model_id}-${probability.label}`} className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-ocular-text-main">
                                  <span>{probability.label}</span>
                                  <span>{probability.value.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all duration-500',
                                      probability.label === gradeToLabel(item.predicted_class) ? 'bg-primary' : 'bg-indigo-300'
                                    )}
                                    style={{ width: `${probability.value}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "flex-1 relative bg-black/60 m-2 rounded-2xl overflow-hidden flex items-center justify-center min-h-[500px]",
                  hideImage && "print:hidden"
                )}>
                  {!hideImage && getImageUrl(result) ? (
                    <ZoomableImage
                      src={getImageUrl(result)}
                      alt="Retinografia analizada"
                      className="max-h-[70vh] w-full"
                    />
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-white/10 rounded-3xl mx-auto flex items-center justify-center animate-pulse">
                        <Eye size={40} className="text-white/20" />
                      </div>
                      <p className="text-white/40 text-sm font-bold uppercase tracking-widest">
                        {hideImage ? 'Visualización de imagen omitida' : 'Previsualización no disponible'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="px-6 py-4 bg-primary/5 text-center">
                <p className="text-[9px] text-ocular-text-muted font-bold leading-relaxed px-10">
                  LOS RESULTADOS PRESENTADOS SON PARA APOYO CLINICO Y EDUCATIVO. NO CONSTITUYEN DIAGNOSTICO MEDICO DEFINITIVO.
                </p>
              </div>
            </GlassCard>
          </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
