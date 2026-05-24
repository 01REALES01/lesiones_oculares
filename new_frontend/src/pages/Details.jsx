import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Activity, ShieldCheck, Eye, Info, ClipboardList, ChevronLeft, ChevronRight, Printer, FileDown, Trash2, FileSpreadsheet, Search, X, Plus, Minus, RotateCcw } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { cn } from '../utils';
import api, { analysisService } from '../services/api';
import { SwitchToggle } from '../components/ui/SwitchToggle';

const probabilityLabels = ['NO R.D.', 'Leve', 'Moderado', 'Severo', 'Proliferativo'];
function getImageUrl(result) {
  if (!result) return null;

  let baseUrl = 'http://127.0.0.1:8000';
  try {
    const apiBase = api?.defaults?.baseURL;
    if (apiBase) {
      baseUrl = apiBase.endsWith('/api') ? apiBase.substring(0, apiBase.length - 4) : apiBase;
    }
  } catch (e) {
    console.error("Error getting baseURL:", e);
  }

  let preview = result.uploaded_image_preview;
  if (preview) {
    if (preview.startsWith('/')) return `${baseUrl}${preview}`;
    return preview;
  }

  const filename = result.filename || result.summary?.filename;
  if (!filename) return null;

  return `${baseUrl}/images/${filename}`;
}

// Función similar para la imagen con filtro Ben-Graham, asumiendo que el backend la devuelve como uploaded_image_braham o tiene una ruta similar
function getImageUrl_filtro(result) {
  if (!result) return null;

  let baseUrl = 'http://127.0.0.1:8000';
  try {
    const apiBase = api?.defaults?.baseURL;
    if (apiBase) {
      baseUrl = apiBase.endsWith('/api') ? apiBase.substring(0, apiBase.length - 4) : apiBase;
    }
  } catch (e) {
    console.error("Error getting baseURL:", e);
  }

  let preview = result.uploaded_image_braham;
  if (preview) {
    if (preview.startsWith('/')) return `${baseUrl}${preview}`;
    return preview;
  }

  const filename = result.filename || result.summary?.filename;
  if (!filename) return null;

  return `${baseUrl}/images_braham/${filename}`;
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
      return 'border-emerald-500/45 bg-emerald-500/10 text-emerald-700 shadow-emerald-500/5';
    case 1: // Leve
      return 'border-primary/45 bg-primary/10 text-primary-dark shadow-primary/5';
    case 2: // Moderado
      return 'border-amber-500/45 bg-amber-500/10 text-amber-700 shadow-amber-500/5';
    case 3: // Severo
      return 'border-orange-500/45 bg-orange-500/10 text-orange-700 shadow-orange-500/5';
    case 4: // Proliferativo
      return 'border-rose-500/45 bg-rose-500/10 text-rose-700 shadow-rose-500/5';
    default:
      return 'border-slate-300/45 bg-slate-100/10 text-slate-700';
  }
}

function getGradeGradient(grade) {
  switch (grade) {
    case 0:
      return 'from-emerald-600 to-emerald-500 shadow-emerald-500/25 hover:shadow-emerald-500/45';
    case 1:
      return 'from-primary-dark to-primary shadow-primary/25 hover:shadow-primary/45';
    case 2:
      return 'from-amber-500 to-amber-400 shadow-amber-500/25 hover:shadow-amber-500/45';
    case 3:
      return 'from-orange-500 to-orange-400 shadow-orange-500/25 hover:shadow-orange-500/45';
    case 4:
      return 'from-rose-600 to-rose-500 shadow-rose-500/25 hover:shadow-rose-500/45';
    default:
      return 'from-slate-600 to-slate-500 shadow-slate-500/25 hover:shadow-slate-500/45';
  }
}

function ZoomableImage({
  src,
  alt,
  className,
  onClick,
  initialZoom = 1,
  minZoom = 1,
  maxZoom = 5,
  zoomStep = 0.25,
  showControls = false,
  enableMagnifier = false,
}) {
  const [zoomLevel, setZoomLevel] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const magnifierSize = 180;

  useEffect(() => {
    setZoomLevel(initialZoom);
    setPan({ x: 0, y: 0 });
  }, [src, initialZoom]);

  const clampZoom = (value) => Math.max(minZoom, Math.min(maxZoom, value));

  const handleZoomIn = (e) => {
    e?.stopPropagation?.();
    setZoomLevel((prev) => clampZoom(prev + zoomStep));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation?.();
    setZoomLevel((prev) => clampZoom(prev - zoomStep));
  };

  const handleReset = (e) => {
    e?.stopPropagation?.();
    setZoomLevel(initialZoom);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!showControls) return;
    const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
    setZoomLevel((prev) => clampZoom(prev + delta));
  };

  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl", className)}
      onClick={onClick}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}
      onMouseEnter={(e) => {
        if (!enableMagnifier) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setImgSize({ width: rect.width, height: rect.height });
        setShowMagnifier(true);
      }}
      onMouseMoveCapture={(e) => {
        if (!enableMagnifier) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setCursorPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }}
      onMouseOutCapture={() => setShowMagnifier(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div
        className={cn(
          "h-full w-full flex items-center justify-center",
          zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
        )}
        onMouseDown={handleMouseDown}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            transformOrigin: 'center center',
          }}
        />
      </div>

      <div data-html2canvas-ignore="true" className="absolute top-4 right-4 z-10 bg-primary text-white p-2 rounded-full shadow-lg no-print animate-pulse">
        <Search size={18} />
      </div>

      {enableMagnifier && showMagnifier && !showControls && (
        <div
          className="pointer-events-none absolute z-20 rounded-full border-2 border-white/70 bg-white shadow-2xl"
          style={{
            width: `${magnifierSize}px`,
            height: `${magnifierSize}px`,
            left: `${cursorPos.x - magnifierSize / 2}px`,
            top: `${cursorPos.y - magnifierSize / 2}px`,
            backgroundImage: `url('${src}')`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${imgSize.width * 2.3}px ${imgSize.height * 2.3}px`,
            backgroundPosition: `${-cursorPos.x * 2.3 + magnifierSize / 2}px ${-cursorPos.y * 2.3 + magnifierSize / 2}px`,
          }}
        />
      )}

      {showControls && (
        <div
          data-html2canvas-ignore="true"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-white/25 bg-slate-950/80 px-3 py-2 text-white shadow-2xl backdrop-blur"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={handleZoomOut} className="p-1 rounded-md hover:bg-white/10 transition" aria-label="Alejar zoom">
            <Minus size={14} />
          </button>
          <span className="text-[11px] font-semibold min-w-[58px] text-center">{(zoomLevel * 100).toFixed(0)}%</span>
          <button type="button" onClick={handleZoomIn} className="p-1 rounded-md hover:bg-white/10 transition" aria-label="Acercar zoom">
            <Plus size={14} />
          </button>
          <button type="button" onClick={handleReset} className="ml-1 p-1 rounded-md hover:bg-white/10 transition" aria-label="Resetear zoom">
            <RotateCcw size={14} />
          </button>
        </div>
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
  // hooks para controlar que foto se muestra
  const [usarOriginal, setUsarOriginal] = useState(true);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupSrc, setPopupSrc] = useState(null);
  const [popupAlt, setPopupAlt] = useState('Imagen ampliada');

  const openImagePopup = (src, alt = 'Imagen ampliada') => {
    if (!src) return;
    setPopupSrc(src);
    setPopupAlt(alt);
    setPopupOpen(true);
  };

  const closeImagePopup = () => {
    setPopupOpen(false);
    setPopupSrc(null);
    setPopupAlt('Imagen ampliada');
  };

  const imageUrl = usarOriginal ? getImageUrl(result) : getImageUrl_filtro(result);

  // función para el botón, para que cambie de estado y muestre la imagen filtrada o la original
  const handleToggle = () => {
    setUsarOriginal((prev) => !prev);
  };

  useEffect(() => {
    if (!popupOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeImagePopup();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [popupOpen]);

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

  // PONDERADO:



const calculo_ponderado_total = () => {
  const predictedClasses = [];
  const pesos = [];
  const items = Object.values(comparisonModels);

  if (items.length === 0) return { probabilidades: [0, 0, 0, 0, 0], grado: 0 };

  items.forEach((item) => {
    const clase = Number(item.predicted_class);
    const confianza = Number(item.confidence_percent) || 0;
    
    const otros = items.filter(i => i !== item).map(i => Number(i.predicted_class));
    const promedioOtros = otros.length > 0 ? otros.reduce((a, b) => a + b, 0) / otros.length : clase;
    const distancia = Math.abs(clase - promedioOtros);
    
    let pesoFinal = confianza;
    if (distancia >= 2) pesoFinal *= 0.5; 
    
    predictedClasses.push(clase);
    pesos.push(pesoFinal);
  });

  const sumaPesos = pesos.reduce((a, b) => a + b, 0);
  const centroGravedad = predictedClasses.reduce((acc, clase, i) => acc + (clase * pesos[i]), 0) / (sumaPesos || 1);
  const gradoFinal = Math.round(centroGravedad);

  // --- NUEVA LÓGICA DE CONCENTRACIÓN ---
  const numCoincidencias = predictedClasses.filter(c => c === gradoFinal).length;
  // Si hay más coincidencias, el exponente es mayor y la barra es más alta
  const factorSharp = numCoincidencias + 1.5; 

  let probs = [0, 0, 0, 0, 0];
  for (let i = 0; i < 5; i++) {
    const distanciaAlCentro = Math.abs(i - centroGravedad);
    // Usamos una potencia mayor para que el pico sea mucho más claro
    probs[i] = 1 / Math.pow(1 + distanciaAlCentro, factorSharp);
  }

  const sumaProbs = probs.reduce((a, b) => a + b, 0);
  const probabilidadesFinales = probs.map(p => (p / (sumaProbs || 1)) * 100);

  return {
    probabilidades: probabilidadesFinales,
    grado: gradoFinal
  };
};

const resultadoConsenso = useMemo(() => 
  (hasComparison ? calculo_ponderado_total() : null), 
  [comparisonModels, hasComparison]
);

const consensusProbabilities = resultadoConsenso?.probabilidades ?? null;

const calculatedConsensusGrade = useMemo(() => {
  if (hasComparison && resultadoConsenso) {
    return resultadoConsenso.grado;
  }
  return summary.consensus_grade ?? primaryResult.predicted_class ?? result.predicted_class ?? 0;
}, [hasComparison, resultadoConsenso, primaryResult, result, summary]);





  // HASTA AQUÍ NUEVO PONDERADO
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
  }; return (
    <>
      <AnimatePresence>
        {popupOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0" onClick={closeImagePopup} />
            <motion.div
              className="relative z-10 w-full max-w-[1180px] h-[88vh] rounded-[2rem] overflow-hidden border border-slate-200/70 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.28)]"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/70 bg-slate-50/70">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">Visor clínico</p>
                  <p className="text-sm font-bold text-slate-800 truncate max-w-[75vw]">{popupAlt}</p>
                </div>
                <button
                  type="button"
                  onClick={closeImagePopup}
                  className="rounded-xl border border-slate-200 bg-white text-slate-700 p-2 shadow-sm hover:border-primary/40 hover:text-primary transition"
                  aria-label="Cerrar visor"
                >
                  <X size={18} />
                </button>
              </div>

              <button
                type="button"
                onClick={closeImagePopup}
                className="hidden"
              >
                <X size={18} />
              </button>
              <div className="h-[calc(88vh-68px)] w-full p-5 bg-gradient-to-b from-slate-100/70 to-slate-200/60">
                <ZoomableImage
                  src={popupSrc}
                  alt={popupAlt}
                  className="h-full w-full border border-slate-200 bg-white"
                  showControls
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500 pb-12 print:p-0">
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-semibold text-sm bg-white/80 px-4 py-2 rounded-xl border border-slate-200/50 shadow-sm"
            >
              <ArrowLeft size={18} /> Volver
            </button>

            {isBatch && (
              <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-xl border border-slate-200/50 shadow-sm">
                <button
                  onClick={onPrev}
                  disabled={currentIndex === 0}
                  className="text-slate-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-widest min-w-[80px] text-center">
                  Imagen {currentIndex + 1} / {batch.length}
                </span>
                <button
                  onClick={onNext}
                  disabled={currentIndex === batch.length - 1}
                  className="text-slate-400 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 hover:shadow-md transition-all font-semibold text-sm uppercase"
              >
                <Printer size={18} /> Imprimir / Guardar PDF
              </button>
              <button onClick={handleExportExcel} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl shadow-md shadow-primary/20 hover:shadow-primary/45 hover:scale-[1.01] active:scale-[0.98] transition-all font-semibold text-sm uppercase tracking-wide">
                {isBatch ? <FileSpreadsheet size={18} /> : <FileDown size={18} />}
                {isBatch ? 'Exportar Excel' : 'Exportar Datos'}
              </button>
              <button
                onClick={() => onDelete?.(result.inference_id)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-100 text-rose-600 rounded-xl hover:bg-rose-50 hover:shadow-md transition-all font-semibold text-sm uppercase shadow-sm"
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
            <div ref={reportRef} className="bg-slate-200 border border-slate-300/85 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] p-6 sm:p-8 rounded-[2rem] grid grid-cols-1 xl:grid-cols-12 gap-8">
              {isGeneratingPdf && (
                <div className="xl:col-span-12 mb-4 pb-4 border-b border-slate-250">
                  <h1 className="text-3xl font-black text-primary uppercase tracking-widest">Ocular AI Report</h1>
                  <p className="text-sm font-semibold text-slate-800 mt-1 uppercase">Emitido por: Dr. Ocular Admin User</p>
                  <p className="text-xs text-slate-600 font-semibold mt-1">ID de Reporte: {inferenceId}</p>
                </div>
              )}

              {/* PANEL IZQUIERDO */}
              <div className="xl:col-span-4 space-y-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-slate-955">Diagnóstico de Soporte</h2>
                  {showReportId && (
                    <p className="text-sm text-slate-900 font-semibold uppercase tracking-widest">
                      Nombre del archivo: <span className="text-primary-dark font-bold">{result.filename || result.summary?.filename || 'Sin nombre'}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    <span className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                      Fecha: {formatTimestamp(timestamp)}
                    </span>
                  </div>
                </div>

                {/* Tarjeta de Riesgo Principal */}
                <div className={cn("relative overflow-hidden border-none text-white bg-gradient-to-r shadow-xl hover:-translate-y-0.5 transition-all duration-300 rounded-3xl p-6", getGradeGradient(calculatedConsensusGrade))}>
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 opacity-95">
                      <ShieldCheck size={18} />
                      <span className="text-xs font-semibold uppercase tracking-widest">Resumen de Riesgo RD</span>
                    </div>
                    <div>
                      <h3 className="text-4xl font-black uppercase tracking-tight">{gradeToLabel(calculatedConsensusGrade)}</h3>
                      <p className="text-sm font-medium text-white/95 mt-1 leading-relaxed">
                        {hasComparison
                          ? `${summary.positive_models ?? 0} de ${summary.total_models ?? comparisonModels.length} modelos detectan retinopatia diabetica.`
                          : `Estimación basada en ${primaryResult.model_used || 'modelo seleccionado'}.`}
                      </p>
                    </div>
                  </div>
                  <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
                </div>

                {hasComparison ? (
                  <div className="space-y-4">
                    {/* Consenso Comparativo */}
                    <div className="p-5 bg-white border border-slate-300 shadow-[0_15px_40px_-5px_rgba(15,23,42,0.1)] hover:shadow-[0_25px_50px_-8px_rgba(15,23,42,0.18)] hover:border-primary/45 hover:-translate-y-0.5 transition-all duration-300 rounded-3xl">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-xs font-semibold text-primary-dark uppercase tracking-widest">Consenso Comparativo</span>
                          <p className="text-lg font-bold text-slate-900 mt-0.5">{summary.headline || 'Comparación de modelos RD'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Lista de Modelos Comparados (Panel Izquierdo) - REPLACED WITH VERTICAL TABLE */}
                    <div className="p-5 bg-white border border-slate-300 shadow-[0_15px_40px_-5px_rgba(15,23,42,0.1)] rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_25px_50px_-8px_rgba(15,23,42,0.18)]">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Modelo</th>
                              <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Diagnóstico</th>
                              <th className="py-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confianza</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonModels.map((item, idx) => (
                              <tr key={item.model_id} className={cn("border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors")}>
                                <td className="py-3 px-3 text-[11px] font-black text-slate-900 uppercase">{item.model_name}</td>
                                <td className="py-3 px-3">
                                  <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border whitespace-nowrap', getGradeStyle(item.predicted_class))}>
                                    {gradeToLabel(item.predicted_class)}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-[11px] font-bold text-primary-dark">{Number(item.confidence_percent).toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Modo Single Model */}
                    <div className="p-6 bg-white border border-slate-300 shadow-[0_15px_40px_-5px_rgba(15,23,42,0.1)] hover:shadow-[0_25px_50px_-8px_rgba(15,23,42,0.18)] hover:border-primary/45 hover:-translate-y-0.5 transition-all duration-300 rounded-3xl flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-700 uppercase tracking-widest">Modelo</span>
                        <span className="text-xl font-bold text-slate-900">{primaryResult.model_used || 'Modelo RD'}</span>
                      </div>
                      <div className="w-11 h-11 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-center shadow-sm">
                        <div className="text-xs font-bold text-primary-dark">IA</div>
                      </div>
                    </div>

                    <div className="p-6 bg-white border border-slate-300 shadow-[0_15px_40px_-5px_rgba(15,23,42,0.1)] hover:shadow-[0_25px_50px_-8px_rgba(15,23,42,0.18)] hover:border-primary/45 hover:-translate-y-0.5 transition-all duration-300 rounded-3xl flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-primary-dark uppercase tracking-widest">Retinopatía Diabética</span>
                        <span className="text-xl font-bold text-slate-900">{primaryResult.diagnosis || result.diagnosis}</span>
                      </div>
                      <div className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.45)]',
                        getGradeStyle(primaryResult.predicted_class ?? 0)
                      )}>
                        {gradeToLabel(primaryResult.predicted_class ?? 0)}
                      </div>
                    </div>

                    <div className="p-6 bg-white border border-slate-300 shadow-[0_15px_40px_-5px_rgba(15,23,42,0.1)] hover:shadow-[0_25px_50px_-8px_rgba(15,23,42,0.18)] hover:border-primary/45 hover:-translate-y-0.5 transition-all duration-300 rounded-3xl flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-700 uppercase tracking-widest">Confianza del Modelo</span>
                        <span className="text-xl font-bold text-slate-900">
                          {primaryResult.confidence_percent !== null && primaryResult.confidence_percent !== undefined
                            ? `${Number(primaryResult.confidence_percent).toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg shadow-sm">
                        <Eye size={18} />
                      </div>
                    </div>

                    {singleHasProbabilityData && (
                      <div className="p-6 bg-white border border-slate-300 shadow-[0_15px_40px_-5px_rgba(15,23,42,0.1)] hover:shadow-[0_25px_50px_-8px_rgba(15,23,42,0.18)] hover:border-primary/45 hover:-translate-y-0.5 transition-all duration-300 rounded-3xl space-y-4">
                        <span className="text-sm font-bold text-slate-800 uppercase tracking-widest">Distribución por grado</span>
                        <div className="space-y-3">
                          {singleProbabilities.map((item) => {
                            const isActive = item.label === gradeToLabel(primaryResult.predicted_class ?? 0);
                            return (
                              <div key={item.label} className="space-y-1">
                                <div className="flex items-center justify-between text-sm font-medium">
                                  <span className={isActive ? 'text-slate-950 font-semibold' : 'text-slate-750 font-normal'}>{item.label}</span>
                                  <span className={isActive ? 'text-primary-dark font-semibold' : 'text-slate-700 font-normal'}>{item.value.toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/30">
                                  <div
                                    className={cn(
                                      'h-full rounded-full transition-all duration-500',
                                      isActive
                                        ? 'bg-gradient-to-r from-sky-400 to-primary shadow-sm shadow-primary/10'
                                        : 'bg-slate-300'
                                    )}
                                    style={{ width: `${item.value}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-6 bg-primary/10 border border-primary/35 rounded-3xl space-y-2.5 shadow-xl shadow-primary/10 hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex items-center gap-2 text-primary-dark font-bold text-sm uppercase tracking-wider">
                    <ClipboardList size={16} /> Sugerencia
                  </div>
                  <p className="text-sm text-slate-950 leading-relaxed font-semibold italic">
                    "{summary.recommendation_short || primaryResult.recommendation_short || suggestionByGrade(consensusGrade)}"
                  </p>
                </div>
              </div>

              {/* PANEL DERECHO */}
              <div className="xl:col-span-8">
                <div className="h-full flex flex-col overflow-hidden bg-slate-100/70 border border-slate-200/80 shadow-2xl rounded-3xl">
                  {/* Header Panel Derecho */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/40 bg-white/40">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary-dark shadow-sm shadow-primary/5">
                        <Eye size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">{rightPanelTitle}</h3>
                        <p className="text-xs text-slate-600 font-medium">{rightPanelSubtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
                      <Info size={12} className="text-primary-dark" />
                      {hasComparison ? `${comparisonModels.length} MODELOS RD` : (primaryResult.model_used || result.model_used || 'MODELO IA').toUpperCase()}
                    </div>
                  </div>

                  {hasComparison ? (
                    <div className="p-5 space-y-6">
                      {/* Tarjeta Retina Analizada */}
                      {!hideImage && imageUrl && (
                        <div className="p-4 border border-slate-300 bg-white shadow-[0_15px_40px_-5px_rgba(15,23,42,0.1)] rounded-3xl hover:shadow-[0_25px_50px_-8px_rgba(15,23,42,0.18)] hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-300">
                          <div className="space-y-3">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-800 uppercase">Retinografía analizada</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-semibold text-slate-600 uppercase">Aplicar Filtro Ben-Graham</p>
                                  <SwitchToggle active={!usarOriginal} onToggle={handleToggle} />
                                </div>
                              </div>
                              <p className="text-xs font-light text-slate-900">Haz clic en la imagen para ampliarla. Usa scroll dentro del visor para ajustar el zoom.</p>
                            </div>
                            <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/40 flex items-center justify-center w-full h-[260px] max-h-[280px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_25px_50px_-8px_rgba(15,23,42,0.18)]">
                              <ZoomableImage
                                src={imageUrl}
                                alt="Retinografia analizada"
                                className="h-full w-full"
                                onClick={() => openImagePopup(imageUrl, result.filename || 'Retinografía analizada')}
                                enableMagnifier
                              />
                              <div className="absolute bottom-4 left-4 rounded-full bg-gradient-to-r from-primary to-primary-dark px-3 py-1 text-[11px] text-white uppercase tracking-[0.12em] shadow-lg">
                                Clic para ampliar
                              </div>
                            </div>
                          </div>
                        </div>
                      )}



                      {/* CARTA PONDERADO */}
                      {hasComparison && consensusProbabilities && (
                        <div className="p-6 border bg-white shadow-[0_15px_40px_-5px_rgba(15,23,42,0.1)] hover:shadow-[0_25px_50px_-8px_rgba(15,23,42,0.18)] hover:-translate-y-0.5 transition-all duration-300 rounded-3xl space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xl font-bold text-slate-900 uppercase">Consenso Ponderado</p>
                              <p className="text-xs font-light text-slate-900">Distribución conjunta por grado</p>
                            </div>
                            <div className={cn(
                              'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.45)]',
                              getGradeStyle(calculatedConsensusGrade)
                            )}>
                              Consenso
                            </div>
                          </div>

                          <div className="space-y-2 pt-1">
                            {probabilityLabels.map((label, idx) => {
                              const value = normalizeProbability(consensusProbabilities[idx] ?? 0);
                              const maxVal = Math.max(...consensusProbabilities);
                              const isMax = consensusProbabilities[idx] === maxVal && maxVal > 0;

                              // Mapeamos dinámicamente cada etiqueta a su degradado de Tailwind exacto
                              // Esto asegura que cada fila mantenga la identidad de su color de riesgo correspondiente
                              const getRowGradientClass = (rowLabel) => {
                                switch (rowLabel?.toLowerCase()) {
                                  case 'proliferativo':
                                    return 'from-rose-500 to-red-600 shadow-rose-500/20';
                                  case 'severo':
                                    return 'from-orange-400 to-amber-500 shadow-orange-500/20';
                                  case 'moderado':
                                    return 'from-yellow-400 to-yellow-500 shadow-yellow-500/20';
                                  case 'leve':
                                    return 'from-sky-400 to-blue-500 shadow-blue-500/20';
                                  default: // 'no r.d.' o estados por defecto
                                    return 'from-emerald-400 to-teal-500 shadow-emerald-500/20';
                                }
                              };

                              return (
                                <div key={`consensus-${idx}`} className="space-y-1">
                                  <div className="flex items-center justify-between text-sm font-medium">
                                    <span className={isMax ? 'text-slate-950 font-semibold' : 'text-slate-750 font-normal'}>
                                      {label}
                                    </span>
                                    <span className={isMax ? 'text-primary-dark font-semibold' : 'text-slate-700 font-normal'}>
                                      {value.toFixed(1)}%
                                    </span>
                                  </div>

                                  {/* Contenedor de la barra */}
                                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/30">
                                    <div
                                      className={cn(
                                        // Clases base esenciales y animación fluida de ancho
                                        'relative h-full rounded-full bg-slate-300 transition-all duration-500',
                                        // Inicialización del pseudo-elemento para lograr la transición suave de color
                                        'after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-r after:transition-opacity after:duration-500',
                                        // Inyectamos las clases de Tailwind reales según la fila actual
                                        isMax
                                          ? `after:opacity-100 shadow-sm ${getRowGradientClass(label)}`
                                          : 'after:opacity-0 shadow-none'
                                      )}
                                      style={{ width: `${value}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={cn(
                      "flex-1 relative bg-slate-900 m-2 rounded-2xl overflow-hidden flex items-center justify-center min-h-[360px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_25px_50px_-8px_rgba(0,0,0,0.2)]",
                      hideImage && "print:hidden"
                    )}>
                      {!hideImage && imageUrl ? (
                        <ZoomableImage
                          src={imageUrl}
                          alt="Retinografia analizada"
                          className="min-h-[260px] max-h-[360px] w-full"
                          onClick={() => openImagePopup(imageUrl, result.filename || 'Retinografía analizada')}
                          enableMagnifier
                        />
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-white/5 rounded-3xl mx-auto flex items-center justify-center animate-pulse">
                            <Eye size={36} className="text-white/20" />
                          </div>
                          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest">
                            {hideImage ? 'Visualización de imagen omitida' : 'Previsualización no disponible'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* Footer del Reporte Completo */}
              <div className="xl:col-span-12 mt-6 pt-4 border-t border-slate-300/80 text-center">
                <p className="text-[10px] text-slate-700 font-semibold leading-relaxed px-10 tracking-widest uppercase">
                  Los resultados presentados son para apoyo clínico y educativo. No constituyen diagnóstico médico definitivo.
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
