import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Fingerprint, LogIn, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

export default function Login({ onGoLanding }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expiredNotice, setExpiredNotice] = useState(() => {
    const expired = sessionStorage.getItem('session_expired');
    if (expired === 'true') {
      sessionStorage.removeItem('session_expired');
      return 'Su sesión ha expirado por inactividad o credenciales inválidas. Por favor, inicie sesión de nuevo.';
    }
    return null;
  });
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
    // Si tiene éxito, el token en el contexto provocará el cambio de vista en App.jsx
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 -left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-primary-dark/10 rounded-full blur-3xl animate-pulse delay-700" />

      <GlassCard className="w-full max-w-md p-8 md:p-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30 mb-6"
          >
            <Fingerprint size={36} />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-ocular-text-main tracking-tight">OcularAI</h1>
          <p className="text-ocular-text-muted mt-2">Plataforma de Análisis de Retinografías</p>
        </div>

        <AnimatePresence>
          {expiredNotice && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-2xl text-sm font-semibold mb-6"
            >
              <AlertCircle className="shrink-0 mt-0.5 text-amber-600" size={18} />
              <div className="flex-1">
                <p className="font-bold text-amber-800">Sesión Expirada</p>
                <p className="text-xs text-amber-700/90 mt-0.5">{expiredNotice}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setExpiredNotice(null)} 
                className="text-amber-500 hover:text-amber-700 text-xs font-bold uppercase shrink-0"
              >
                Cerrar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ocular-text-muted ml-1">CORREO ELECTRÓNICO</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-ocular-text-main"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-ocular-text-muted ml-1">CONTRASEÑA</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-white/40 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-ocular-text-main"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ocular-text-muted hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 p-4 bg-ocular-error/10 text-ocular-error rounded-2xl text-sm font-medium"
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-premium bg-primary text-white hover:bg-primary-dark shadow-primary/30 py-4"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/20 pt-6 space-y-4">
          <button
            onClick={onGoLanding}
            className="text-xs font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
          >
            Volver a la página principal
          </button>
          <p className="text-xs text-ocular-text-muted uppercase tracking-widest font-semibold opacity-50">
            OcularAI Research Groups &copy;
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
