import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import { env } from '../../config/env';

type AccessUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
  createdAt: string;
};

type StatusMessage = { type: 'ok' | 'error'; text: string } | null;

export default function MinimarketAccess() {
  const navigate = useNavigate();
  const apiBase = env.minimarketApiUrl;
  const adminEmail = env.minimarketAdminEmail;
  const adminPassword = env.minimarketAdminPassword;

  const [token, setToken] = useState<string | null>(null);
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<StatusMessage>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '' });

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  useEffect(() => {
    const load = async () => {
      try {
        const authResponse = await fetch(`${apiBase}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: adminEmail, password: adminPassword }),
        });
        if (!authResponse.ok) {
          throw new Error('auth');
        }
        const authData = await authResponse.json();
        setToken(authData.token);
      } catch {
        setMessage({
          type: 'error',
          text: 'No se pudo autenticar con la app Minimarket. Revisa las credenciales del admin.',
        });
        setLoading(false);
      }
    };
    load();
  }, [apiBase, adminEmail, adminPassword]);

  useEffect(() => {
    if (!token) return;
    const loadUsers = async () => {
      try {
        const response = await fetch(`${apiBase}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('load');
        const data = await response.json();
        setUsers(data);
      } catch {
        setMessage({ type: 'error', text: 'No se pudo cargar la lista de accesos.' });
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [apiBase, token]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ email: '', password: '' });
  };

  const handleEdit = (user: AccessUser) => {
    setEditingId(user.id);
    setForm({ email: user.email, password: '' });
  };

  const handleDelete = async (userId: string) => {
    if (!token) return;
    if (!confirm('¿Eliminar este acceso?')) return;
    try {
      const response = await fetch(`${apiBase}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('delete');
      toast.success('Acceso eliminado');
      setUsers((current) => current.filter((user) => user.id !== userId));
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (!form.email.trim()) return;
    if (!isEditing && !form.password.trim()) return;

    setSaving(true);
    try {
      const payload: { email: string; password?: string } = { email: form.email.trim() };
      if (form.password.trim()) payload.password = form.password;
      const response = await fetch(
        isEditing ? `${apiBase}/api/users/${editingId}` : `${apiBase}/api/users`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error('save');
      const saved = await response.json();
      setUsers((current) => {
        if (isEditing) {
          return current.map((user) => (user.id === saved.id ? saved : user));
        }
        return [saved, ...current];
      });
      toast.success(isEditing ? 'Acceso actualizado' : 'Acceso creado');
      resetForm();
    } catch {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
            aria-label="Volver"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de accesos Minimarket</h1>
            <p className="text-sm text-gray-600">Crea y administra cuentas para la app.</p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-md px-4 py-3 text-sm ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                required={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
              {isEditing && (
                <p className="text-xs text-gray-500 mt-1">Deja en blanco para mantener la contraseña.</p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="divide-y">
            {users.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">No hay accesos creados.</div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-500">Rol: {user.role} • Estado: {user.active ? 'Activo' : 'Inactivo'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(user)}
                      className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(user.id)}
                      className="px-3 py-2 bg-red-50 text-red-700 rounded-md text-sm hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
