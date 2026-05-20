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
      className="h-screen bg-slate-900/80 backdrop-blur-3xl border-r border-white/10 flex flex-col z-50 relative transition-all duration-300 no-print shadow-2xl"
    >
      {/* Toggle Button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-10 bg-primary text-white p-1 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform"
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
              className="font-bold text-lg text-white whitespace-nowrap"
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
                "flex items-center gap-3 p-3 rounded-2xl transition-all group overflow-hidden active:scale-95",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-200 font-semibold hover:bg-white/10 hover:text-white"
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
      <div className="p-3 border-t border-white/10 mt-auto">
        {onGoLanding && (
          <button
            onClick={onGoLanding}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors group overflow-hidden mb-2 active:scale-95"
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

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 mb-2 overflow-hidden border border-white/5">
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
                <span className="text-sm font-bold text-white">Dr. Rodmoli</span>
                <span className="text-xs text-slate-400">Admin User</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 rounded-2xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors group overflow-hidden active:scale-95"
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
