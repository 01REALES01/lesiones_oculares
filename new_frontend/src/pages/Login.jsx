import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ScanEye, LogIn, AlertCircle, Eye, EyeOff, Loader2, X, ArrowLeft } from 'lucide-react';
import TechEyeScene from '../components/landing/EyeScene';

export default function Login({ onGoLanding }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [shakeUsername, setShakeUsername] = useState(0);
  const [shakePassword, setShakePassword] = useState(0);

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
    setError(null);
    setUsernameError(false);
    setPasswordError(false);
    
    let hasError = false;
    if (!username.trim()) {
      setUsernameError(true);
      setShakeUsername(prev => prev + 1);
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError(true);
      setShakePassword(prev => prev + 1);
      hasError = true;
    }

    if (hasError) {
      setError("Por favor, complete todos los campos requeridos.");
      return;
    }

    setLoading(true);
    
    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.22),_transparent_45%),linear-gradient(180deg,_#f8fbff_0%,_#eef5fb_50%,_#f8fbff_100%)]">
      {/* Same particles as the landing page */}
      <div className="pointer-events-none fixed inset-0 z-[1] isolate" aria-hidden>
        <TechEyeScene />
      </div>

      {/* Ambient light orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/15 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary-dark/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      <div className="absolute top-10 right-1/4 w-64 h-64 bg-sky-300/10 rounded-full blur-[80px]" />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="backdrop-blur-2xl bg-white/65 border border-white/50 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,255,255,0.6)_inset] rounded-[2rem] p-8 md:p-10">
          {/* Header */}
          <div className="flex flex-col items-center mb-10 text-center">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-18 h-18 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30 mb-6 p-4"
            >
              <ScanEye size={40} />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-black text-slate-900 tracking-tight"
            >
              OcularAI
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-slate-500 mt-2 font-medium"
            >
              Plataforma de Análisis de Retinografías
            </motion.p>
          </div>

          {/* Expired session notice */}
          <AnimatePresence>
            {expiredNotice && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-2xl text-sm font-medium mb-6 relative overflow-hidden"
              >
                <AlertCircle className="shrink-0 mt-0.5 text-amber-600" size={18} />
                <div className="flex-1 pr-6">
                  <p className="font-bold text-amber-800">Sesión Expirada</p>
                  <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">{expiredNotice}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setExpiredNotice(null)} 
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 hover:text-amber-700 transition-colors shrink-0 outline-none"
                  aria-label="Cerrar"
                >
                  <X size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-widest">Correo electrónico</label>
              <motion.div
                key={`username-shake-${shakeUsername}`}
                animate={shakeUsername > 0 ? { x: [0, -6, 6, -6, 6, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameError) setUsernameError(false);
                  }}
                  className={`w-full px-5 py-3.5 rounded-xl bg-white/70 border transition-all outline-none text-slate-800 text-sm placeholder:text-slate-400 shadow-sm ${
                    usernameError
                      ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                      : 'border-slate-200/60 focus:border-primary focus:ring-4 focus:ring-primary/10'
                  }`}
                  placeholder="correo@ejemplo.com"
                />
              </motion.div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 ml-1 uppercase tracking-widest">Contraseña</label>
              <motion.div
                key={`password-shake-${shakePassword}`}
                animate={shakePassword > 0 ? { x: [0, -6, 6, -6, 6, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(false);
                  }}
                  className={`w-full px-5 py-3.5 rounded-xl bg-white/70 border transition-all outline-none text-slate-800 text-sm placeholder:text-slate-400 shadow-sm pr-12 ${
                    passwordError
                      ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                      : 'border-slate-200/60 focus:border-primary focus:ring-4 focus:ring-primary/10'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </motion.div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-4 bg-ocular-error/10 text-ocular-error rounded-xl text-sm font-medium border border-ocular-error/20"
                >
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
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

          {/* Footer */}
          <div className="mt-8 text-center border-t border-slate-200/40 pt-6 space-y-3">
            <button
              onClick={onGoLanding}
              className="text-xs font-bold text-primary hover:text-primary-dark transition-all hover:-translate-y-0.5 uppercase tracking-widest flex items-center justify-center gap-2 mx-auto group"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
              Volver a la página principal
            </button>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
              OcularAI Research Groups &copy;
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
