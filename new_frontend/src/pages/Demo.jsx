import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, Zap, ArrowLeft, FlaskConical } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { analysisService } from '../services/api';
import Details from './Details';

const MODEL_OPTIONS = [
  { key: 'densenet169', label: 'DenseNet169' },
  { key: 'resnet50', label: 'ResNet50' },
  { key: 'xception', label: 'Xception' },
];

export default function DemoPage({ onGoLanding }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('densenet169');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setError('Por favor selecciona una imagen válida');
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) { setError('Selecciona una imagen primero'); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await analysisService.analyzeDemo(selectedFile, selectedModel);
      if (data?.success) {
        setResult({
          ...data,
          model_response: data.diagnosis || 'Sin Hallazgos',
          uploaded_image_preview: preview, // usar base64 local, /images/ no está proxied en dev
          explanation: data.explanation || {},
        });
      } else {
        setError('Error en el análisis: ' + (data?.detail || 'Desconocido'));
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error al procesar la imagen');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setSelectedFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_45%),linear-gradient(180deg,_#f8fbff_0%,_#eef5fb_50%,_#f8fbff_100%)] text-slate-900">
      {/* Header — mismo estilo que Landing */}
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/55 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          {/* Logo */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-primary">OcularAI</p>
            <p className="text-sm font-semibold text-slate-500">Demostración gratuita</p>
          </div>

          {/* Badge demo */}
          <div className="hidden items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-primary shadow-sm sm:flex">
            <FlaskConical size={14} />
            Demo · Sin registro
          </div>

          {/* Volver */}
          <button
            onClick={onGoLanding}
            className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 hover:text-primary group"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            Volver a la landing
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {result ? (
          /* ── Vista de resultado ── */
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-7xl px-6 py-10 md:px-10"
          >
            <Details result={result} onBack={resetForm} showActions={false} showReportId={false} />
          </motion.div>
        ) : (
          /* ── Formulario centrado ── */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-4 py-16"
          >
            {/* Título */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-5 py-2 text-xs font-black uppercase tracking-[0.25em] text-primary shadow-sm">
                <Zap size={14} />
                1 imagen · 1 modelo · resultado inmediato
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                Análisis de Retinopatía Diabética
              </h1>
              <p className="text-base text-slate-500">
                Carga una retinografía y elige el modelo de IA para obtener una clasificación instantánea.
              </p>
            </div>

            {/* Selector de modelo */}
            <GlassCard className="w-full p-5 border-white/40 flex flex-col items-center gap-y-4">
              <div className="hidden items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-primary shadow-sm sm:flex">
                Modelos de IA
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {MODEL_OPTIONS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setSelectedModel(m.key)} // Nota: corregido el espacio en setSelectedModel
                    className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-md ${selectedModel === m.key
                      ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                      : 'border-gray-400/60 bg-white/70 text-slate-700 hover:border-primary/40 hover:text-primary'
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Zona de carga / preview */}
            {!selectedFile ? (
              <GlassCard
                className={`w-full cursor-pointer border-2 border-dashed p-14 transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50'
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Upload size={30} className="text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800">
                      {isDragging ? 'Suelta la imagen aquí' : 'Sube una imagen retinográfica'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Arrastra y suelta o haz clic para seleccionar</p>
                  </div>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="w-full overflow-hidden border-white/40 p-6">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl bg-black/20 h-72">
                    <img src={preview} alt="Preview" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-slate-700">{selectedFile.name}</p>
                    <button
                      onClick={() => { setSelectedFile(null); setPreview(null); }}
                      className="ml-4 shrink-0 text-xs font-semibold text-slate-400 transition hover:text-primary"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Botón analizar */}
            {selectedFile && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" />Analizando imagen...</>
                ) : (
                  <><Zap size={18} />Analizar con {MODEL_OPTIONS.find((o) => o.key === selectedModel)?.label}</>
                )}
              </motion.button>
            )}

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Disclaimer */}
            <p className="text-center text-xs text-slate-400 max-w-md leading-relaxed">
              Resultados orientativos para <strong>apoyo clínico y educativo</strong>. No reemplazan el juicio de un especialista. El análisis no queda registrado en ningún historial.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
