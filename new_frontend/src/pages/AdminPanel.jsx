import { useEffect, useState } from 'react';
import { Shield, UserPlus, RefreshCw, Users, AlertCircle, Activity, TrendingUp, Clock, UserCheck, UserX} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { adminService } from '../services/api';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await adminService.getUsers();
      setUsers(data);
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setNotice({
        type: 'error',
        message: 'No se pudieron cargar los usuarios.',
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setNotice(null);

    try {
      await adminService.createUser(form);

      setNotice({
        type: 'success',
        message: 'Usuario creado correctamente.',
      });

      setForm({
        name: '',
        email: '',
        password: '',
        role: 'user',
      });

      await loadUsers();
    } catch (error) {
      console.error('Error creando usuario:', error);

      const detail = error.response?.data?.detail;

      setNotice({
        type: 'error',
        message: typeof detail === 'string'
          ? detail
          : 'No se pudo crear el usuario.',
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleUserStatus = async (user) => {
  try {
    await adminService.updateUser(user.email, {
      activo_app: !(user.activo_app !== false),
    });

    setNotice({
      type: 'success',
      message: 'Estado del usuario actualizado.',
    });

    await loadUsers();
  } catch (error) {
    console.error('Error actualizando estado:', error);
    setNotice({
      type: 'error',
      message: 'No se pudo actualizar el estado del usuario.',
    });
  }
};

    const openEditUserName = (user) => {
  setEditingUser(user);
  setEditName(user.nombre || '');
  setEditModalOpen(true);
};

    const saveEditedUserName = async () => {
    if (!editingUser || !editName.trim()) return;

    setSavingEdit(true);

    try {
        await adminService.updateUser(editingUser.email, {
        nombre: editName.trim(),
        });

        setNotice({
        type: 'success',
        message: 'Nombre actualizado correctamente.',
        });

        setEditModalOpen(false);
        setEditingUser(null);
        setEditName('');

        await loadUsers();
    } catch (error) {
        console.error('Error actualizando nombre:', error);
        setNotice({
        type: 'error',
        message: 'No se pudo actualizar el nombre.',
        });
    } finally {
        setSavingEdit(false);
    }
    };
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-ocular-text-main flex items-center gap-3">
          <Shield className="text-primary" />
          Panel de Administración
        </h1>
        <p className="text-ocular-text-muted mt-1">
          Gestión de usuarios registrados en OcularAI mediante ROBLE.
        </p>
      </div>

      {notice && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            notice.type === 'success'
              ? 'border-ocular-success/30 bg-ocular-success/10 text-ocular-success'
              : 'border-ocular-error/30 bg-ocular-error/10 text-ocular-error'
          }`}
        >
          {notice.message}
        </div>
      )}

        {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <AdminStatCard
            icon={Users}
            label="Usuarios totales"
            value={stats.total_users}
            />
            <AdminStatCard
            icon={UserCheck}
            label="Usuarios activos"
            value={stats.active_users}
            />
            <AdminStatCard
            icon={UserX}
            label="Deshabilitados"
            value={stats.inactive_users}
            />
            <AdminStatCard
            icon={Activity}
            label="Análisis globales"
            value={stats.total_analyses}
            />
            <AdminStatCard
            icon={TrendingUp}
            label="Confianza promedio"
            value={`${stats.avg_confidence}%`}
            />
            <AdminStatCard
            icon={AlertCircle}
            label="% RD detectada"
            value={`${stats.rd_detected_percent}%`}
            />
            <AdminStatCard
            icon={Clock}
            label="Último análisis"
            value={stats.latest_analysis ? new Date(`${stats.latest_analysis}Z`).toLocaleString() : '—'}
            wide
            />
        </div>
        )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <GlassCard className="xl:col-span-1 p-6 border border-slate-200 shadow-md shadow-slate-200/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="font-black text-xl text-ocular-text-main">Crear usuario</h2>
              <p className="text-xs text-ocular-text-muted font-semibold">
                Se registrará en ROBLE y en usuarios_app.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-ocular-text-muted uppercase">
                Nombre
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Nombre completo"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-ocular-text-muted uppercase">
                Correo
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                type="email"
                placeholder="usuario@correo.com"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-ocular-text-muted uppercase">
                Contraseña temporal
              </label>
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                type="password"
                placeholder="Ej: Prueba123!"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <p className="text-[10px] text-ocular-text-muted mt-1">
                Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-ocular-text-muted uppercase">
                Rol
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="user">Médico / Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-2xl bg-primary text-white font-black py-3 hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {creating ? 'Creando...' : 'Crear usuario'}
            </button>
          </form>
        </GlassCard>

        <GlassCard className="xl:col-span-2 p-6 border border-slate-200 shadow-md shadow-slate-200/60">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-100 text-primary flex items-center justify-center">
                <Users size={22} />
              </div>
              <div>
                <h2 className="font-black text-xl text-ocular-text-main">Usuarios registrados</h2>
                <p className="text-xs text-ocular-text-muted font-semibold">
                  Lista tomada desde usuarios_app.
                </p>
              </div>
            </div>

            <button
              onClick={loadUsers}
              disabled={loadingUsers}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-bold text-slate-600 hover:text-primary transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} />
              Refrescar
            </button>
          </div>

          {loadingUsers ? (
            <div className="py-16 text-center text-ocular-text-muted font-bold">
              Cargando usuarios...
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-ocular-text-muted">
              <AlertCircle className="mx-auto mb-3 opacity-40" />
              No hay usuarios registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-ocular-text-muted border-b border-slate-200">
                    <th className="py-3 px-2">Nombre</th>
                    <th className="py-3 px-2">Correo</th>
                    <th className="py-3 px-2">Rol</th>
                    <th className="py-3 px-2">Estado</th>
                    <th className="py-3 px-2">Último login</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u._id || u.email || idx} className="border-b border-slate-100">
                        <td className="py-3 px-2">
                        <button
                            type="button"
                            onClick={() => openEditUserName(u)}
                            className="font-bold text-ocular-text-main hover:text-primary hover:underline transition-colors text-left"
                            title="Editar nombre"
                        >
                            {u.nombre || 'Sin nombre'}
                        </button>
                        </td>
                      <td className="py-3 px-2 text-slate-600">
                        {u.email}
                      </td>
                      <td className="py-3 px-2">
                        <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold uppercase">
                          {u.rol || 'user'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <button
                        type="button"
                        onClick={() => toggleUserStatus(u)}
                        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all ${
                            u.activo_app === false ? 'bg-red-300' : 'bg-emerald-400'
                        }`}
                        title={u.activo_app === false ? 'Activar usuario' : 'Deshabilitar usuario'}
                        >
                        <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all ${
                            u.activo_app === false ? 'translate-x-1' : 'translate-x-8'
                            }`}
                        />
                        </button>
                      </td>
                      <td className="py-3 px-2 text-slate-500">
                        {u.ultimo_login
                        ? new Date(`${u.ultimo_login}Z`).toLocaleString()
                        : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
        {editModalOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-[2rem] border border-white/40 bg-white/95 backdrop-blur-2xl shadow-2xl p-7 space-y-5">
            <div>
                <h3 className="text-2xl font-black text-ocular-text-main">
                Editar nombre
                </h3>
                <p className="text-sm text-ocular-text-muted mt-1">
                Actualiza el nombre visible del usuario en OcularAI.
                </p>
            </div>

            <div>
                <label className="text-xs font-bold text-ocular-text-muted uppercase">
                Nombre
                </label>
                <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                placeholder="Nombre completo"
                />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                type="button"
                onClick={() => {
                    setEditModalOpen(false);
                    setEditingUser(null);
                    setEditName('');
                }}
                className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-ocular-text-main font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                Cancelar
                </button>

                <button
                type="button"
                onClick={saveEditedUserName}
                disabled={savingEdit || !editName.trim()}
                className="px-5 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                {savingEdit ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
}

function AdminStatCard({ icon: Icon, label, value, wide = false }) {
  return (
    <GlassCard className={`p-5 border border-slate-200 shadow-md shadow-slate-200/60 ${wide ? 'xl:col-span-2' : ''}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon size={22} />
        </div>
        <div>
          <p className="text-xs font-bold text-ocular-text-muted uppercase">
            {label}
          </p>
          <p className="text-2xl font-black text-ocular-text-main">
            {value ?? '—'}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}