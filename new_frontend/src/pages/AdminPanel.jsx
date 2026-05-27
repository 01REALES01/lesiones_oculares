import { useEffect, useState } from 'react';
import {
  Shield,
  UserPlus,
  RefreshCw,
  Users,
  AlertCircle,
  Activity,
  TrendingUp,
  Clock,
  UserCheck,
  UserX,
  Cpu,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';
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
  const [adminTab, setAdminTab] = useState('users');
  const [showPassword, setShowPassword] = useState(false);
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
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <Shield className="text-primary" />
          Panel de Administración
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
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

        <div className="flex flex-wrap gap-2">
        <button
            type="button"
            onClick={() => setAdminTab('users')}
            className={`rounded-2xl px-4 py-2 text-xs font-black uppercase transition-all ${
            adminTab === 'users'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/20 hover:text-primary dark:hover:text-primary'
            }`}
        >
            Gestión de usuarios
        </button>

        <button
            type="button"
            onClick={() => setAdminTab('metrics')}
            className={`rounded-2xl px-4 py-2 text-xs font-black uppercase transition-all ${
            adminTab === 'metrics'
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/20 hover:text-primary dark:hover:text-primary'
            }`}
        >
            Métricas
        </button>
        </div>

        {adminTab === 'metrics' && stats && (
        <>
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
                value={
                stats.latest_analysis
                    ? new Date(`${stats.latest_analysis}Z`).toLocaleString()
                    : '—'
                }
                wide
            />

            <AdminInsightCard
                icon={Cpu}
                title="Modelo más usado"
                value={stats.most_used_model?.[0] || 'Sin datos'}
                subtitle={`${stats.most_used_model?.[1] || 0} análisis`}
            />

            <AdminInsightCard
                icon={Zap}
                title="Modelo más rápido"
                value={stats.fastest_model?.[0] || 'Sin datos'}
                subtitle={`${stats.fastest_model?.[1] || 0} ms promedio`}
            />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SimpleBarChart
                title="Uso por modelo"
                data={stats.model_usage || []}
            />

            <SimpleBarChart
                title="Latencia promedio por modelo"
                data={stats.model_latency || []}
                suffix=" ms"
            />
            </div>
        </>
        )}
        
      {adminTab === 'users' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <GlassCard className="xl:col-span-1 p-6 border border-slate-200 dark:border-white/10 shadow-md shadow-slate-200/60 dark:shadow-[0_10px_35px_-10px_rgba(0,0,0,0.5)] bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="font-black text-xl text-ocular-text-main">Crear usuario</h2>
              <p className="text-xs text-ocular-text-muted font-semibold">
                Se registrará en la base de datos ROBLE
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Nombre
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Nombre completo"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/20 bg-white/70 dark:bg-slate-900/60 px-4 py-3 text-sm outline-none focus:border-primary dark:focus:border-primary text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Correo
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                type="email"
                placeholder="usuario@correo.com"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/20 bg-white/70 dark:bg-slate-900/60 px-4 py-3 text-sm outline-none focus:border-primary dark:focus:border-primary text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Contraseña temporal
              </label>
              <div className="relative mt-1">
                <input
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Ej: Prueba123!"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/20 bg-white/70 dark:bg-slate-900/60 px-4 py-3 pr-12 text-sm outline-none focus:border-primary dark:focus:border-primary text-slate-800 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Rol
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/20 bg-white/70 dark:bg-slate-900/60 px-4 py-3 text-sm outline-none focus:border-primary dark:focus:border-primary text-slate-800 dark:text-slate-200"
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

        <GlassCard className="xl:col-span-2 p-6 border border-slate-200 dark:border-white/10 shadow-md shadow-slate-200/60 dark:shadow-[0_10px_35px_-10px_rgba(0,0,0,0.5)] bg-white/80 dark:bg-slate-800/80">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-100 text-primary flex items-center justify-center">
                <Users size={22} />
              </div>
              <div>
                <h2 className="font-black text-xl text-slate-800 dark:text-white">Usuarios registrados</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  Lista tomada desde la base de datos
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
                  <tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                    <th className="py-3 px-2">Nombre</th>
                    <th className="py-3 px-2">Correo</th>
                    <th className="py-3 px-2">Rol</th>
                    <th className="py-3 px-2">Estado</th>
                    <th className="py-3 px-2">Último login</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u._id || u.email || idx} className="border-b border-slate-100 dark:border-white/5">
                        <td className="py-3 px-2">
                        <button
                            type="button"
                            onClick={() => openEditUserName(u)}
                            className="font-bold text-slate-800 dark:text-white hover:text-primary dark:hover:text-primary hover:underline transition-colors text-left"
                            title="Editar nombre"
                        >
                            {u.nombre || 'Sin nombre'}
                        </button>
                        </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300">
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
                      <td className="py-3 px-2 text-slate-500 dark:text-slate-400">
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
      )}
        {editModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
            <div className="w-full max-w-md rounded-[2rem] border border-white/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-7 space-y-5">
            <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                Editar nombre
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Actualiza el nombre visible del usuario en OcularAI.
                </p>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                Nombre
                </label>
                <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-800 px-4 py-3 text-sm outline-none focus:border-primary dark:focus:border-primary text-slate-800 dark:text-slate-200"
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
                className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
    <GlassCard className={`p-5 border border-slate-200 dark:border-white/10 shadow-md shadow-slate-200/60 dark:shadow-[0_10px_35px_-10px_rgba(0,0,0,0.5)] bg-white/80 dark:bg-slate-800/80 ${wide ? 'xl:col-span-2' : ''}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Icon size={22} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
            {label}
          </p>
          <p className="text-2xl font-black text-slate-800 dark:text-white">
            {value ?? '—'}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

function AdminInsightCard({ icon: Icon, title, value, subtitle }) {
  return (
    <GlassCard className="p-5 border border-slate-200 dark:border-white/10 shadow-md shadow-slate-200/60 dark:shadow-[0_10px_35px_-10px_rgba(0,0,0,0.5)] bg-white/80 dark:bg-slate-800/80">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon size={22} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <h3 className="text-lg font-black text-slate-800 dark:text-white truncate">
            {value}
          </h3>

          <p className="text-sm text-primary font-bold mt-1">
            {subtitle}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

function SimpleBarChart({ title, data, suffix = '' }) {
  const maxValue = Math.max(...data.map(item => Number(item.value) || 0), 1);

  return (
    <GlassCard className="p-6 border border-slate-200 dark:border-white/10 shadow-md shadow-slate-200/60 dark:shadow-[0_10px_35px_-10px_rgba(0,0,0,0.5)] bg-white/80 dark:bg-slate-800/80">
      <h3 className="text-lg font-black text-slate-800 dark:text-white mb-5">
        {title}
      </h3>

      <div className="space-y-4">
        {data.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
            No hay datos disponibles.
          </p>
        ) : (
          data.map((item, index) => {
            const value = Number(item.value) || 0;
            const width = Math.max((value / maxValue) * 100, value > 0 ? 8 : 0);

            return (
              <div key={`${item.name}-${index}`} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300 truncate">
                    {item.name}
                  </span>

                  <span className="text-primary whitespace-nowrap">
                    {value}{suffix}
                  </span>
                </div>

                <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden border border-slate-200 dark:border-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-sky-400 transition-all duration-700 shadow-sm"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </GlassCard>
  );
}

