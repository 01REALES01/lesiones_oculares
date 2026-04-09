import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2, Zap } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { analysisService } from '../services/api';
import Details from './Details';

export default function DemoPage({ onBack }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError(null);
      
      // Preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setError('Por favor selecciona una imagen válida');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Selecciona una imagen primero');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await analysisService.analyzeDenseNet(selectedFile);
      
      if (data.success) {
        // Pasamos la respuesta real del backend y solo normalizamos campos faltantes.
        setResult({
          ...data,
          model_used: data.model_used || 'DenseNet169',
          model_response: data.diagnosis || data.explanation?.dr_diagnosis || 'Sin Hallazgos',
          uploaded_image_preview: preview || null,
          explanation: data.explanation || {},
          traceability: data.traceability || {
            inference_id: data.inference_id,
            models_used: ['C'],
            inference_times_ms: { C: data.inference_time_ms || 0 },
          },
        });
      } else {
        setError('Error en el análisis: ' + (data.detail || 'Desconocido'));
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.detail || err.message || 'Error al procesar la imagen');
    } finally {
      setLoading(false);
    }
  };

  // Si hay resultado, mostrar Details
  if (result) {
    return (
      <div className="space-y-6">
        <Details result={result} onBack={() => setResult(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8 animate-in slide-in-from-bottom-5 duration-500">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 max-w-2xl"
      >
        <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-indigo-600 text-white px-6 py-3 rounded-full w-fit mx-auto shadow-lg shadow-primary/30">
          <Zap size={20} />
          <span className="font-bold uppercase tracking-wider text-sm">DEMO - DenseNet169</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-ocular-text-main">
          Análisis de Retinopatía
        </h1>
        <p className="text-ocular-text-muted text-lg">
          Carga una imagen de fondo de ojo para detectar Retinopatía Diabética con IA
        </p>
      </motion.div>

      {/* File Upload Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-2xl"
      >
        <GlassCard 
          className={`p-12 border-2 border-dashed transition-all cursor-pointer ${
            isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-white/20 hover:border-primary/50'
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

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Upload size={32} className="text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-ocular-text-main mb-1">
                {isDragging ? 'Suelta la imagen' : 'Sube una imagen retinográfica'}
              </h3>
              <p className="text-sm text-ocular-text-muted">
                Arrastra y suelta o haz clic para seleccionar
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Image Preview y botón */}
      {(selectedFile || preview) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl space-y-6"
        >
          {/* Preview */}
          <GlassCard className="p-6 border-none overflow-hidden">
            <div className="space-y-4">
              <p className="text-sm font-bold text-ocular-text-muted uppercase tracking-wider">
                Archivo seleccionado
              </p>
              <div className="bg-black/30 rounded-xl overflow-hidden h-80">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-sm text-ocular-text-main font-medium">
                📄 {selectedFile?.name}
              </p>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="text-xs text-ocular-text-muted hover:text-primary transition-colors"
              >
                ✕ Cambiar imagen
              </button>
            </div>
          </GlassCard>

          {/* Analyze Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analizando imagen...
              </>
            ) : (
              <>
                <Zap size={20} />
                Analizar con DenseNet
              </>
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-2xl p-4 bg-red-100 border border-red-300 rounded-xl"
        >
          <p className="text-red-800 font-medium">{error}</p>
        </motion.div>
      )}

      {/* Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <GlassCard className="p-6 border-none bg-indigo-50/50">
          <div className="space-y-2">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">ℹ️ Sobre este demo</p>
            <p className="text-sm text-ocular-text-main leading-relaxed">
              Este es un análisis de <strong>demostración</strong> que utiliza el modelo <strong>DenseNet169</strong> entrenado con el dataset APTOS para detectar grados de Retinopatía Diabética (0-4). Los resultados son para <strong>apoyo clínico y educativo</strong>, no para diagnóstico definitivo.
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
