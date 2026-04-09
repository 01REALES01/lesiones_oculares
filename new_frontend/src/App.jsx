import { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/ui/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HistoryPage from './pages/History';
import AnalysisDetail from './pages/Details';
import Demo from './pages/Demo';
import { LayoutDashboard, History, Settings, HelpCircle, Layout, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function AppContent() {
  const { token } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [view, setView] = useState('main'); // main | detail
  const [resultBatch, setResultBatch] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!token) {
    return <Login />;
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
      setCurrentIndex(0);
    }
  };

  const navLinks = [
    { 
      key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, 
      onClick: () => { setActiveTab('dashboard'); setView('main'); } 
    },
    { 
      key: 'demo', label: 'Demo DenseNet', icon: Zap, 
      onClick: () => { setActiveTab('demo'); setView('main'); } 
    },
    { 
      key: 'history', label: 'Historial Admin', icon: History, 
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
                {activeTab === 'demo' ? (
                  <Demo onBack={() => setActiveTab('dashboard')} />
                ) : activeTab === 'history' ? (
                  <HistoryPage onViewDetail={navigateToDetail} />
                ) : (
                  <Dashboard onViewDetail={navigateToDetail} />
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
