import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clipboard, Upload, Cpu, Plus, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';
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
  } = analysis;

  const [recentHistory, setRecentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const selectedModelCount = Object.values(models).filter(Boolean).length;

  const loadHistory = async () => {
    try {
      const data = await analysisService.getHistory(5);
      setRecentHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
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

  const openHistoryItem = async (historyItem) => {
    try {
      const fullRecord = await analysisService.getInference(historyItem.inference_id);
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
    loadHistory();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ocular-text-main">Panel de Control</h1>
          <p className="text-ocular-text-muted">Compara uno, dos o tres modelos de retinopatia diabetica en una sola ejecucion.</p>
        </div>
        <div className="flex items-center gap-3">
          <GlassCard className="py-2 px-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-ocular-success animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-ocular-text-muted">Servidor IA: Online</span>
          </GlassCard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Analisis Totales" value="1,284" icon={Activity} trend={{ positive: true, value: 12 }} />
        <StatsCard title="Casos RD Detectados" value="24%" icon={AlertCircle} trend={{ positive: false, value: 3 }} delay={0.1} />
        <StatsCard title="Precision Promedio" value="98.2%" icon={CheckCircle2} delay={0.2} />
        <StatsCard title="Latencia Media" value="420ms" icon={Clock} delay={0.3} />
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
                  <ModelToggle icon={Cpu} label="MobileNetV3" active={models.mobilenetv3} onClick={() => toggleModel('mobilenetv3', !models.mobilenetv3)} />
                  <ModelToggle icon={Cpu} label="EfficientNet" active={models.efficientnet} onClick={() => toggleModel('efficientnet', !models.efficientnet)} />
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

              <div className="pt-4">
                <button
                  type="button"
                  disabled={loading || files.length === 0 || selectedModelCount === 0}
                  onClick={handleStartComparison}
                  className={`
                    w-full btn-premium py-4 text-lg
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

          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <h3 className="text-lg font-bold text-ocular-text-main px-1">Resultados Recientes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((res, i) => (
                    <ResultMiniCard key={i} result={res} onClick={() => onViewDetail(results, i)} />
                  ))}
                </div>
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
              <button type="button" onClick={() => onGoHistory?.()} className="text-[10px] font-bold uppercase text-primary hover:underline">
                Ver Todo
              </button>
            </div>

            <div className="space-y-4">
              {historyLoading ? (
                Array(3)
                  .fill(0)
                  .map((_, i) => <div key={i} className="h-16 animate-pulse bg-white/30 rounded-2xl" />)
              ) : recentHistory.length > 0 ? (
                recentHistory.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => openHistoryItem(item)}
                    className="w-full group p-3 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all text-left flex items-center gap-3"
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
                    <div>
                      <p className="text-sm font-bold text-ocular-text-main group-hover:text-primary transition-colors">Analisis #{item.inference_id.substring(0, 5)}</p>
                      <p className="text-[10px] text-ocular-text-muted uppercase font-bold">{item.summary?.headline || new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))
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
    </div>
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
