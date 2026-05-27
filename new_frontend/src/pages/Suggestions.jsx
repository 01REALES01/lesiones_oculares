import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { suggestionService } from '../services/api';

export default function Suggestions() {
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [tipo, setTipo] = useState('sugerencia');

  const handleSubmit = async () => {
    if (!mensaje.trim()) return;

    setLoading(true);
    setNotice(null);

    try {
      await suggestionService.create({ mensaje, tipo });

      setMensaje('');
      setSuccessModalOpen(true);

    } catch (error) {
      console.error(error);

      setNotice({
        type: 'error',
        text: 'No se pudo enviar la sugerencia.',
      });
    } finally {
      setLoading(false);
      setTipo('sugerencia');
    }
  };

  return (
    <>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-ocular-text-main flex items-center gap-3">
          <MessageSquare className="text-primary" />
          Sugerencias y Feedback
        </h1>

        <p className="text-ocular-text-muted mt-1">
          Comparte ideas, mejoras o comentarios sobre la plataforma.
        </p>
      </div>

      {notice && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
          notice.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
            : 'border-red-500/30 bg-red-500/10 text-red-700'
        }`}>
          {notice.text}
        </div>
      )}

    <GlassCard className="p-6 border border-slate-200 shadow-md shadow-slate-200/60 max-w-4xl">
    <div className="space-y-4 w-full">
        <div>
        <label className="text-xs font-bold text-ocular-text-muted uppercase">
            Tipo de comentario
        </label>

        <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
            <option value="sugerencia">Sugerencia</option>
            <option value="problema">Reportar problema</option>
            <option value="mejora">Idea de mejora</option>
            <option value="otro">Otro</option>
        </select>
        </div>

        <div>
        <label className="text-xs font-bold text-ocular-text-muted uppercase">
            Tu sugerencia
        </label>

        <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={6}
            placeholder="Escribe aquí tu comentario o sugerencia..."
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none"
        />
        </div>

        <button
        onClick={handleSubmit}
        disabled={loading || !mensaje.trim()}
        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-white font-black hover:bg-primary-dark transition-all disabled:opacity-50"
        >
        <Send size={18} />
        {loading ? 'Enviando...' : 'Enviar sugerencia'}
        </button>
    </div>
    </GlassCard>

    
    </div>
    {successModalOpen && (
    <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[2rem] border border-white/40 bg-white/95 backdrop-blur-2xl shadow-2xl p-8 text-center space-y-5">
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center text-3xl font-black animate-bounce">
            ✓
            </div>
        </div>

        <div>
            <h3 className="text-2xl font-black text-ocular-text-main">
            ¡Gracias por tu aporte!
            </h3>
            <p className="text-sm text-ocular-text-muted mt-2">
            Tu comentario fue enviado correctamente y será revisado por el equipo administrador.
            </p>
        </div>

        <button
            type="button"
            onClick={() => setSuccessModalOpen(false)}
            className="w-full rounded-2xl bg-primary text-white font-black py-3 hover:bg-primary-dark transition-all"
        >
            Entendido
        </button>
        </div>
    </div>
    )}
    </>
  );
}