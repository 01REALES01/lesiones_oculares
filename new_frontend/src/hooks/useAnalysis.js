import { useState, useCallback } from 'react';
import { analysisService } from '../services/api';

export const useAnalysis = () => {
  const [files, setFiles] = useState([]);
  const [models, setModels] = useState({ A: true, B: true, C: true });
  const [drModelType, setDrModelType] = useState('resnet50v2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

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

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError("Por favor, selecciona al menos una imagen.");
      return;
    }
    
    setError(null);
    setResults(null);
    setLoading(true);

    const modelsStr = Object.entries(models)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(",");

    try {
      const data = await analysisService.analyze(files, modelsStr, drModelType);
      setResults(data);
      setFiles([]); // Limpiamos el lote tras éxito
      return { success: true, data };
    } catch (e) {
      console.error("Análisis fallido:", e);
      const msg = e.response?.data?.detail || "Error de conexión con el servidor.";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  return {
    files, addFiles, removeFile, clearFiles,
    models, toggleModel,
    drModelType, setDrModelType,
    loading, error, setError,
    results, setResults,
    handleAnalyze
  };
};
