import { useEffect, useState } from 'react';
import { Shield, UserPlus, RefreshCw, Users, AlertCircle } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { adminService } from '../services/api';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState(null);

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
                      <td className="py-3 px-2 font-bold text-ocular-text-main">
                        {u.nombre || 'Sin nombre'}
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
                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                          u.activo_app === false
                            ? 'bg-red-100 text-red-600'
                            : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {u.activo_app === false ? 'Inactivo' : 'Activo'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-500">
                        {u.ultimo_login
                          ? new Date(u.ultimo_login).toLocaleString()
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
    </div>
  );
}