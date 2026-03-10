import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowLeft, LogIn, AlertCircle, Fingerprint } from "lucide-react";

const API = "/api";

export default function Login({ onLoginSuccess, onBack }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [focused, setFocused] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        try {
            const res = await fetch(`${API}/token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || "Error de autenticación");
            }

            const data = await res.json();
            localStorage.setItem("token", data.access_token);
            onLoginSuccess();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Animated Background */}
            <div className="login-bg">
                <div className="login-gradient-1" />
                <div className="login-gradient-2" />
                <div className="login-gradient-3" />
                {/* Grid Pattern */}
                <div className="login-grid-pattern" />
            </div>

            {/* Back Button */}
            {onBack && (
                <motion.button
                    className="login-back"
                    onClick={onBack}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <ArrowLeft size={18} />
                    <span>Volver</span>
                </motion.button>
            )}

            {/* Login Card */}
            <motion.div
                className="login-card-premium"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Logo & Header */}
                <div className="login-brand">
                    <motion.div
                        className="login-logo-premium"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                        <Fingerprint size={32} strokeWidth={1.5} />
                    </motion.div>
                    <h1 className="login-title">RetinaAI</h1>
                    <p className="login-subtitle">Acceso Seguro a la Plataforma</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form-premium">
                    {/* Username */}
                    <div className={`input-group-premium ${focused === 'user' ? 'focused' : ''} ${username ? 'filled' : ''}`}>
                        <label htmlFor="username">Usuario</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onFocus={() => setFocused('user')}
                            onBlur={() => setFocused(null)}
                            required
                            autoComplete="username"
                            placeholder="Ingrese su usuario"
                        />
                        <div className="input-line" />
                    </div>

                    {/* Password */}
                    <div className={`input-group-premium ${focused === 'pass' ? 'focused' : ''} ${password ? 'filled' : ''}`}>
                        <label htmlFor="password">Contraseña</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocused('pass')}
                                onBlur={() => setFocused(null)}
                                required
                                autoComplete="current-password"
                                placeholder="Contraseña"
                            />
                            <button
                                type="button"
                                className="toggle-pass"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <div className="input-line" />
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                className="login-error-premium"
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                            >
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <motion.button
                        type="submit"
                        className="login-submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {loading ? (
                            <div className="login-spinner" />
                        ) : (
                            <>
                                <LogIn size={18} />
                                <span>Iniciar Sesión</span>
                            </>
                        )}
                    </motion.button>
                </form>

                {/* Footer */}
                <div className="login-footer-premium">
                    <div className="login-divider">
                        <span>RetinaAI Research Group</span>
                    </div>
                    <p className="login-legal">
                        Sistema protegido. Acceso exclusivo para personal autorizado.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
