import { useState } from 'react';
import { User, Mail, Shield, Calendar, KeyRound } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export default function Profile() {
  const { user, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    setSending(true);
    setNotice(null);

    try {
      await authService.forgotPassword(user.email);

      setNotice({
        type: 'success',
        message: 'Te enviamos un enlace para cambiar tu contraseña. Revisa tu correo e inicia sesión nuevamente.',
      });

      setTimeout(async () => {
        await logout();
      }, 1800);
    } catch (error) {
      setNotice({
        type: 'error',
        message: 'No se pudo enviar el correo de recuperación.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-ocular-text-main flex items-center gap-3">
          <User className="text-primary" />
          Mi Perfil
        </h1>
        <p className="text-ocular-text-muted mt-1">
          Consulta la información asociada a tu cuenta en OcularAI.
        </p>
      </div>

      {notice && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
          notice.type === 'success'
            ? 'border-ocular-success/30 bg-ocular-success/10 text-ocular-success'
            : 'border-ocular-error/30 bg-ocular-error/10 text-ocular-error'
        }`}>
          {notice.message}
        </div>
      )}

      <GlassCard className="p-6 border border-slate-200 shadow-md shadow-slate-200/60 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ProfileField icon={User} label="Nombre" value={user?.name || 'No registrado'} />
          <ProfileField icon={Mail} label="Correo" value={user?.email || 'No registrado'} />
          <ProfileField
            icon={Shield}
            label="Rol"
            value={user?.role === 'admin' ? 'Administrador' : 'Médico'}
          />
          <ProfileField
            icon={Calendar}
            label="Fecha de creación"
            value={user?.fecha_creacion ? new Date(`${user.fecha_creacion}Z`).toLocaleString() : 'No disponible'}
          />
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
          Si deseas modificar tu información personal, contacta con el administrador de la plataforma.
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-white font-black hover:bg-primary-dark transition-all disabled:opacity-50"
          >
            <KeyRound size={18} />
            {sending ? 'Enviando enlace...' : 'Cambiar contraseña'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

function ProfileField({ icon: Icon, label, value }) {
  return (
    <div>
      <label className="text-xs font-bold text-ocular-text-muted uppercase">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-100/70 px-4 py-3 text-sm text-slate-600">
        <Icon size={18} className="text-primary" />
        <span className="font-semibold">{value}</span>
      </div>
    </div>
  );
}