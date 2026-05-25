import { useState, useEffect, useRef } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/ui/Sidebar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HistoryPage from './pages/History';
import AnalysisDetail from './pages/Details';
import Demo from './pages/Demo';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import { useAnalysis } from './hooks/useAnalysis';
import Suggestions from './pages/Suggestions';
import AdminSuggestions from './pages/AdminSuggestions';
import { LayoutDashboard, History, Settings, HelpCircle, Shield, User, MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { analysisService, authService } from './services/api';

function AppContent() {
    const { token, user, loadingUser, logout } = useAuth();  
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
  const [forceHideImage, setForceHideImage] = useState(false);

  const [firstLoginModalOpen, setFirstLoginModalOpen] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const analysisState = useAnalysis();

  // Reset to dashboard if reloaded while viewing recent analysis detail
  useEffect(() => {
    if (activeTab === 'dashboard' && view === 'detail') {
      setView('main');
    }
  }, []);
  useEffect(() => {
    if (!token) {
      analysisState.setResults(null);
      analysisState.clearFiles();
      setResultBatch([]);
      setCurrentIndex(0);
      setView('main');
      setActiveTab('dashboard');
    }
  }, [token]);

  useEffect(() => {
    const flag = sessionStorage.getItem('first_login_password_notice');

    if (token && user?.email && flag === 'true') {
      setFirstLoginModalOpen(true);
    }
  }, [token, user]);

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

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ocular-text-muted font-bold">
        Cargando sesión...
      </div>
    );
  }

  const navigateToDetail = (results, index = 0, options = {}) => {
    // Si viene de un solo resultado (como Historial), lo envolvemos en un array
    const batch = Array.isArray(results) ? results : [results];
    setResultBatch(batch);
    setCurrentIndex(index);
    setView('detail');
    setForceHideImage(!!options.hideImage);
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
        analysisState.setResults(null);
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

  const handleFirstLoginPasswordReset = async () => {
    if (!user?.email) return;

    setSendingResetEmail(true);

    try {
      await authService.forgotPassword(user.email);
    } catch (error) {
      console.error('Error enviando recuperación:', error);
    } finally {
      sessionStorage.removeItem('first_login_password_notice');
      setSendingResetEmail(false);
      setFirstLoginModalOpen(false);
      await logout();
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
      key: 'profile',
      label: 'Perfil',
      icon: User,
      onClick: () => { setActiveTab('profile'); setView('main'); }
    },
    {
      key: 'suggestions',
      label: 'Gestión de sugerencias',
      icon: MessageSquare,
      onClick: () => { setActiveTab('suggestions'); setView('main'); }
    },
    ...(user?.role === 'admin'
      ? [{
          key: 'admin',
          label: 'Admin',
          icon: Shield,
          onClick: () => { setActiveTab('admin'); setView('main'); }
        }]
      : []),
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
        {firstLoginModalOpen && (
          <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-[2rem] border border-white/40 bg-white/95 backdrop-blur-2xl shadow-2xl p-7 space-y-5 text-center">
              <div>
                <h3 className="text-2xl font-black text-ocular-text-main">
                  Cuenta nueva detectada
                </h3>
                <p className="text-sm text-ocular-text-muted mt-2 leading-relaxed">
                  Estás iniciando sesión por primera vez con una contraseña temporal.
                  Por seguridad, enviaremos un enlace de restablecimiento a tu correo.
                </p>
                <p className="text-sm font-bold text-primary mt-3">
                  {user?.email}
                </p>
              </div>

              <button
                type="button"
                onClick={handleFirstLoginPasswordReset}
                disabled={sendingResetEmail}
                className="w-full rounded-2xl bg-primary text-white font-black py-3 hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {sendingResetEmail ? 'Enviando correo...' : 'Enviar enlace y cerrar sesión'}
              </button>
            </div>
          </div>
        )}        
        <div className={`mx-auto p-6 md:p-10 transition-all duration-300 ${view === 'detail' ? 'max-w-[1600px] w-full' : 'max-w-7xl'}`}>
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
                ) : activeTab === 'admin' ? (
                  <AdminPanel />
                ) : activeTab === 'profile' ? (
                  <Profile />
                ) : activeTab === 'suggestions' ? (
                  user?.role === 'admin' ? <AdminSuggestions /> : <Suggestions />
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
                  hideImage={activeTab === 'history' || forceHideImage}
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
