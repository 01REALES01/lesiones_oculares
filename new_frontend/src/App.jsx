import { useState, useEffect, useRef } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/ui/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HistoryPage from './pages/History';
import AnalysisDetail from './pages/Details';
import Demo from './pages/Demo';
import { useAnalysis } from './hooks/useAnalysis';
import { LayoutDashboard, History, Settings, HelpCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { analysisService } from './services/api';

function AppContent() {
  const { token } = useAuth();
  const [showLanding, setShowLanding] = useState(() => {
    const screen = sessionStorage.getItem('screen');
    if (screen === 'landing') return true;
    if (screen === 'demo') return false;
    if (screen === 'app') return false;
    // Nueva pestaña / sesión: mostrar landing aunque haya token guardado
    return true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDemo, setShowDemo] = useState(() => sessionStorage.getItem('screen') === 'demo');
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('activeTab') || 'dashboard';
  });
  const [resultBatch, setResultBatch] = useState(() => {
    const saved = sessionStorage.getItem('resultBatch');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = sessionStorage.getItem('currentIndex');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [view, setView] = useState(() => {
    return sessionStorage.getItem('view') || 'main'; // main | detail
  });
  const analysisState = useAnalysis();
  const { logout } = useAuth();

  // Persistencia de estado
  useEffect(() => {
    try {
      sessionStorage.setItem('resultBatch', JSON.stringify(resultBatch));
    } catch (e) {
      console.warn("sessionStorage quota exceeded. Storing resultBatch without base64 image previews.", e);
      try {
        const cleanedBatch = resultBatch.map(item => ({
          ...item,
          uploaded_image_preview: item.uploaded_image_preview?.startsWith('data:') ? null : item.uploaded_image_preview
        }));
        sessionStorage.setItem('resultBatch', JSON.stringify(cleanedBatch));
      } catch (err2) {
        console.error("Failed to store even cleaned resultBatch in sessionStorage:", err2);
      }
    }
    try {
      sessionStorage.setItem('currentIndex', currentIndex.toString());
      sessionStorage.setItem('view', view);
      sessionStorage.setItem('activeTab', activeTab);
    } catch (err3) {
      console.error("Failed to store other state in sessionStorage:", err3);
    }
  }, [resultBatch, currentIndex, view, activeTab]);

  // Validación inmediata de credenciales al entrar al dashboard
  useEffect(() => {
    if (token) {
      // Intentar obtener perfil de usuario para validar token
      analysisService.getStats().catch(err => {
        // El interceptor en api.js se encargará de hacer logout si es 401
        console.error("Token inválido o expirado al inicio:", err);
      });
    }
  }, [token]);

  if (showLanding) {
    return (
      <Landing
        onEnterApp={() => { sessionStorage.setItem('screen', 'app'); setShowLanding(false); }}
        onEnterDemo={() => { sessionStorage.setItem('screen', 'demo'); setShowLanding(false); setShowDemo(true); }}
      />
    );
  }

  if (showDemo) {
    return (
      <Demo
        onGoLanding={() => { sessionStorage.setItem('screen', 'landing'); setShowDemo(false); setShowLanding(true); }}
      />
    );
  }

  if (!token) {
    return <Login onGoLanding={() => { sessionStorage.setItem('screen', 'landing'); setShowLanding(true); }} />;
  }

  const navigateToDetail = (results, index = 0) => {
    // Si viene de un solo resultado (como Historial), lo envolvemos en un array
    const batch = Array.isArray(results) ? results : [results];
    setResultBatch(batch);
    setCurrentIndex(index);
    setView('detail');
  };

  const nextResult = () => {
    if (currentIndex < resultBatch.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevResult = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDeleteDetail = async (inference_id) => {
    try {
      await analysisService.deleteAnalysis(inference_id);
      
      const newBatch = resultBatch.filter(item => item.inference_id !== inference_id);
      
      if (newBatch.length === 0) {
        setResultBatch([]);
        setView('main');
      } else {
        setResultBatch(newBatch);
        // Ajustar el índice si era el último
        if (currentIndex >= newBatch.length) {
          setCurrentIndex(newBatch.length - 1);
        }
      }
    } catch (error) {
      console.error('Error deleting from detail:', error);
    }
  };

  const navLinks = [
    { 
      key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, 
      onClick: () => { setActiveTab('dashboard'); setView('main'); } 
    },
    { 
      key: 'history', label: 'Historial', icon: History, 
      onClick: () => { setActiveTab('history'); setView('main'); } 
    },
    { 
      key: 'settings', label: 'Configuración', icon: Settings, 
      onClick: () => {} 
    },
    { 
      key: 'help', label: 'Sugerencia Médica', icon: HelpCircle, 
      onClick: () => {} 
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-f0f4f8">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggle={() => setSidebarOpen(!sidebarOpen)} 
        links={navLinks}
        activeKey={activeTab}
        onGoLanding={() => { sessionStorage.setItem('screen', 'landing'); setShowLanding(true); }}
      />
      
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            {view === 'main' ? (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                {activeTab === 'history' ? (
                  <HistoryPage onViewDetail={navigateToDetail} />
                ) : (
                  <Dashboard
                    onViewDetail={navigateToDetail}
                    onGoHistory={() => { setActiveTab('history'); setView('main'); }}
                    analysis={analysisState}
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="detail-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <AnalysisDetail 
                  result={resultBatch[currentIndex]} 
                  batch={resultBatch}
                  currentIndex={currentIndex}
                  onNext={nextResult}
                  onPrev={prevResult}
                  onBack={() => setView('main')} 
                  onDelete={handleDeleteDetail}
                  hideImage={activeTab === 'history'}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
