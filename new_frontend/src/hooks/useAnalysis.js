import { useState, useRef } from 'react';
import { analysisService } from '../services/api';

export const useAnalysis = () => {
  const [files, setFiles] = useState([]);
  const [models, setModels] = useState({ densenet169: false, resnet50: false, xception: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const abortControllerRef = useRef(null);

  const addFiles = (newFiles) => {
    setFiles(prev => {
      // Filtrar duplicados (por nombre y tamaño)
      const unique = Array.from(newFiles).filter(nf => 
        !prev.some(pf => pf.name === nf.name && pf.size === nf.size)
      );
      return [...prev, ...unique];
    });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => setFiles([]);

  const toggleModel = (modelKey, value) => {
    setModels(prev => ({ ...prev, [modelKey]: value }));
  };

  const cancelAnalyze = () => {
    abortControllerRef.current?.abort();
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError("Por favor, selecciona al menos una imagen.");
      return;
    }

    const selectedModels = Object.entries(models)
      .filter(([, value]) => value)
      .map(([key]) => key);

    if (selectedModels.length === 0) {
      setError("Selecciona al menos un modelo para comparar.");
      return;
    }
    
    setError(null);
    setLoading(true);

    const modelsStr = selectedModels.join(",");

    try {
      abortControllerRef.current = new AbortController();
      const data = await analysisService.analyzeComparison(files, modelsStr, abortControllerRef.current.signal);
      return { success: true, data };
    } catch (e) {
            if (e.name === 'CanceledError' || e.code === 'ERR_CANCELED') {
              setError(null);
              return { success: false, cancelled: true };
            }
      console.error("Análisis fallido:", e);
      let msg = e.response?.data?.detail;
      if (!msg) {
        if (e.code === 'ERR_NETWORK' || e.message === 'Network Error') {
          msg =
            'No hay respuesta del servidor. ¿Está la API en marcha en http://127.0.0.1:8000? (desde la raíz del repo: npm run dev, o uvicorn backend.main:app --reload). Luego recarga esta página.';
        } else {
          msg = e.message || 'Error de conexión con el servidor.';
        }
      }
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  return {
    files, addFiles, removeFile, clearFiles,
    models, toggleModel,
    loading, error, setError,
    results, setResults,
    handleAnalyze,
    cancelAnalyze,
  };
};
