import { useEffect, useState } from 'react';
import {
  MessageSquare,
  RefreshCw,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Bug,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { adminService } from '../services/api';

const estadoLabels = {
  pendiente: 'Pendiente',
  revisada: 'Revisada',
  resuelta: 'Resuelta',
};

const tipoLabels = {
  sugerencia: 'Sugerencia',
  problema: 'Problema',
  mejora: 'Mejora',
  otro: 'Otro',
};

const estadoStyles = {
  pendiente: {
    icon: AlertTriangle,
    style: { backgroundColor: '#fef3c7', color: '#b45309' },
  },
  revisada: {
    icon: Clock,
    style: { backgroundColor: '#e0f2fe', color: '#0369a1' },
  },
  resuelta: {
    icon: CheckCircle2,
    style: { backgroundColor: '#d1fae5', color: '#047857' },
  },
};

const tipoStyles = {
  sugerencia: {
    icon: Lightbulb,
    style: { backgroundColor: '#ffedd5', color: '#c2410c' },
  },
  problema: {
    icon: Bug,
    style: { backgroundColor: '#fee2e2', color: '#b91c1c' },
  },
  mejora: {
    icon: Sparkles,
    style: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  },
  otro: {
    icon: HelpCircle,
    style: { backgroundColor: '#f1f5f9', color: '#475569' },
  },
};

export default function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [activeFilter, setActiveFilter] = useState('todas');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [suggestionToDelete, setSuggestionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadSuggestions = async () => {
    setLoading(true);

    try {
      const data = await adminService.getSuggestions();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando sugerencias:', error);
      setNotice({
        type: 'error',
        text: 'No se pudieron cargar las sugerencias.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const getSuggestionId = (item) => item._id || item.id;

  const updateStatus = async (item, estado) => {
    try {
      await adminService.updateSuggestionStatus(getSuggestionId(item), estado);

      setNotice({
        type: 'success',
        text: 'Estado actualizado correctamente.',
      });

      await loadSuggestions();
    } catch (error) {
      console.error('Error actualizando sugerencia:', error);
      setNotice({
        type: 'error',
        text: 'No se pudo actualizar el estado.',
      });
    }
  };

    const openDeleteModal = (item) => {
    setSuggestionToDelete(item);
    setDeleteModalOpen(true);
    };

    const confirmDeleteSuggestion = async () => {
    if (!suggestionToDelete) return;

    setDeleting(true);

    try {
        await adminService.deleteSuggestion(getSuggestionId(suggestionToDelete));

        setNotice({
        type: 'success',
        text: 'Sugerencia eliminada.',
        });

        setDeleteModalOpen(false);
        setSuggestionToDelete(null);

        await loadSuggestions();
    } catch (error) {
        console.error('Error eliminando sugerencia:', error);
        setNotice({
        type: 'error',
        text: 'No se pudo eliminar la sugerencia.',
        });
    } finally {
        setDeleting(false);
    }
    };

    const filterOptions = [
    { key: 'todas', label: 'Todas' },
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'revisada', label: 'Revisadas' },
    { key: 'resuelta', label: 'Resueltas' },
    ];

    const filteredSuggestions =
    activeFilter === 'todas'
        ? suggestions
        : suggestions.filter((item) => (item.estado || 'pendiente') === activeFilter);

  return (
    <>
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ocular-text-main flex items-center gap-3">
            <MessageSquare className="text-primary" />
            Sugerencias recibidas
          </h1>

          <p className="text-ocular-text-muted mt-1">
            Revisa los comentarios, reportes y propuestas enviadas por los usuarios.
          </p>
        </div>

        <button
          onClick={loadSuggestions}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-bold text-slate-600 hover:text-primary transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refrescar
        </button>
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

        <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => {
            const count =
            option.key === 'todas'
                ? suggestions.length
                : suggestions.filter((item) => (item.estado || 'pendiente') === option.key).length;

            return (
            <button
                key={option.key}
                type="button"
                onClick={() => setActiveFilter(option.key)}
                className={`rounded-2xl px-4 py-2 text-xs font-black uppercase transition-all ${
                activeFilter === option.key
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white text-slate-500 border border-slate-200 hover:text-primary'
                }`}
            >
                {option.label} ({count})
            </button>
            );
        })}
        </div>

      <GlassCard className="p-6 border border-slate-200 shadow-md shadow-slate-200/60">
        {loading ? (
          <div className="py-16 text-center text-ocular-text-muted font-bold">
            Cargando sugerencias...
          </div>
       ) : filteredSuggestions.length === 0 ? (
          <div className="py-16 text-center text-ocular-text-muted">
            <AlertCircle className="mx-auto mb-3 opacity-40" />
            No hay sugerencias registradas.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSuggestions.map((item, index) => {
              const TipoIcon = tipoStyles[item.tipo || 'sugerencia']?.icon || Lightbulb;
              const EstadoIcon = estadoStyles[item.estado || 'pendiente']?.icon || AlertTriangle;

              return (
                <div
                  key={getSuggestionId(item) || index}
                  className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                        <span
                            style={tipoStyles[item.tipo || 'sugerencia']?.style}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase"
                        >
                            <TipoIcon size={13} />
                            {tipoLabels[item.tipo || 'sugerencia']}
                        </span>

                        <span
                            style={estadoStyles[item.estado || 'pendiente']?.style}
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase"
                        >
                            <EstadoIcon size={13} />
                            {estadoLabels[item.estado || 'pendiente']}
                        </span>
                        </div>
                      <p className="text-slate-800 font-semibold leading-relaxed">
                        {item.mensaje}
                      </p>

                      <div className="text-xs text-slate-500 font-medium">
                        Enviado por{' '}
                        <span className="font-bold text-slate-700">
                          {item.usuario_nombre || 'Usuario'}
                        </span>{' '}
                        ({item.usuario_email || 'sin correo'})
                        {' · '}
                        {item.fecha ? new Date(`${item.fecha}Z`).toLocaleString() : 'Sin fecha'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={item.estado || 'pendiente'}
                        onChange={(e) => updateStatus(item, e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-primary"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="revisada">Revisada</option>
                        <option value="resuelta">Resuelta</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => openDeleteModal(item)}
                        className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                        title="Eliminar sugerencia"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
        
    </div>
    {deleteModalOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-[2rem] border border-white/40 bg-white/95 backdrop-blur-2xl shadow-2xl p-7 space-y-5 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                <Trash2 size={30} />
            </div>

            <div>
                <h3 className="text-2xl font-black text-ocular-text-main">
                Eliminar sugerencia
                </h3>

                <p className="text-sm text-ocular-text-muted mt-2 leading-relaxed">
                Esta acción eliminará permanentemente la sugerencia seleccionada.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                type="button"
                onClick={() => {
                    setDeleteModalOpen(false);
                    setSuggestionToDelete(null);
                }}
                className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-ocular-text-main font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                Cancelar
                </button>
                <button
                type="button"
                onClick={confirmDeleteSuggestion}
                disabled={deleting}
                style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                }}
                className="px-5 py-3 rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                >
                {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
            </div>
            </div>
        </div>
        )}
    </>
  );
}