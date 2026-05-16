import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils';
import { LogOut, ChevronLeft, ChevronRight, User, House } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, toggle, links, activeKey, onGoLanding }) => {
  const { logout } = useAuth();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : 80 }}
      className="h-screen bg-white/50 backdrop-blur-2xl border-r border-white/20 flex flex-col z-50 relative transition-all duration-300 no-print"
    >
      {/* Toggle Button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-10 bg-primary text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 bg-primary rounded-xl flex-shrink-0 shadow-lg shadow-primary/20 flex items-center justify-center text-white font-bold">
          O
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-lg text-ocular-text-main whitespace-nowrap"
            >
              OcularAI
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Links Section */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = activeKey === link.key;
          
          return (
            <button
              key={link.key}
              onClick={link.onClick}
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl transition-all group overflow-hidden",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-ocular-text-muted hover:bg-primary/10 hover:text-primary"
              )}
            >
              <Icon size={22} className="flex-shrink-0" />
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {link.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Footer / User Area */}
      <div className="p-3 border-t border-white/20 mt-auto">
        {onGoLanding && (
          <button
            onClick={onGoLanding}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/15 transition-colors group overflow-hidden mb-2"
          >
            <House size={22} className="flex-shrink-0" />
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-semibold whitespace-nowrap"
                >
                  Volver a Landing
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/30 mb-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <User size={18} />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col truncate"
              >
                <span className="text-sm font-bold text-ocular-text-main">Dr. Ocular</span>
                <span className="text-xs text-ocular-text-muted">Admin User</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 rounded-2xl text-ocular-error hover:bg-ocular-error/10 transition-colors group overflow-hidden"
        >
          <LogOut size={22} className="flex-shrink-0" />
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium whitespace-nowrap"
              >
                Cerrar Sesión
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
};
