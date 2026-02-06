import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMinimarketAccessAccounts,
  createMinimarketAccessAccount,
  updateMinimarketAccessAccount,
  deleteMinimarketAccessAccount,
  getMinimarketAccessAccountByEmail,
} from '../../services/firestore';
import { hashForMinimarketAccess } from '../../utils/password';
import type { MinimarketAccessAccount, MinimarketAccessRole, MinimarketAccessStatus } from '../../types';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

type FormState = {
  email: string;
  password: string;
  role: MinimarketAccessRole;
  status: MinimarketAccessStatus;
};

const emptyForm: FormState = {
  email: '',
  password: '',
  role: 'STAFF',
  status: 'ACTIVE',
};

export default function AccessAccountsPage() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [list, setList] = useState<MinimarketAccessAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [firstPassword, setFirstPassword] = useState('');
  const [firstPasswordConfirm, setFirstPasswordConfirm] = useState('');

  const companyId = firestoreUser?.company_id ?? '';
  const currentEmail = (firestoreUser?.email ?? '').trim().toLowerCase();
  const needsFirstAccount =
    !loading &&
    !!companyId &&
    !!currentEmail &&
    list.length >= 0 &&
    !list.some((a) => a.email.toLowerCase() === currentEmail);

  useEffect(() => {
    if (!companyId) return;
    let active = true;
    const load = async () => {
      try {
        const data = await getMinimarketAccessAccounts(companyId);
        if (active) setList(data);
      } catch (e) {
        if (active) handleError(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [companyId, handleError]);

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => a.email.toLowerCase().includes(q));
  }, [list, search]);

  const isEditing = Boolean(editingId);
  const emailError = useMemo(() => {
    if (!form.email.trim()) return 'Correo requerido';
    if (!EMAIL_REGEX.test(form.email)) return 'Correo no válido';
    return null;
  }, [form.email]);
  const passwordError = useMemo(() => {
    if (isEditing && !form.password.trim()) return null;
    if (form.password.length > 0 && form.password.length < MIN_PASSWORD_LENGTH) {
      return `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`;
    }
    return null;
  }, [isEditing, form.password]);
  const canSave = !emailError && !passwordError && form.email.trim() && (isEditing || form.password.length >= MIN_PASSWORD_LENGTH);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setPanelOpen(true);
  };

  const openEdit = (row: MinimarketAccessAccount) => {
    setEditingId(row.id);
    setForm({
      email: row.email,
      password: '',
      role: row.role,
      status: row.status,
    });
    setResetPasswordId(null);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setResetPasswordId(null);
    setResetPassword('');
  };

  const handleActivateFirstAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !currentEmail) return;
    if (firstPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
      return;
    }
    if (firstPassword !== firstPasswordConfirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    try {
      const existing = await getMinimarketAccessAccountByEmail(companyId, currentEmail);
      if (existing) {
        toast.error('Ya existe una cuenta con ese correo.');
        setSaving(false);
        return;
      }
      const passwordHash = await hashForMinimarketAccess(firstPassword);
      await createMinimarketAccessAccount(companyId, {
        email: currentEmail,
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
      });
      const data = await getMinimarketAccessAccounts(companyId);
      setList(data);
      setFirstPassword('');
      setFirstPasswordConfirm('');
      toast.success('Cuenta Admin activada. Ya puedes ingresar a la app Minimarket con tu correo y esta contraseña.');
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!companyId || !canSave) return;
    setSaving(true);
    try {
      const emailNorm = form.email.trim().toLowerCase();
      if (!isEditing) {
        const existing = await getMinimarketAccessAccountByEmail(companyId, emailNorm);
        if (existing) {
          toast.error('Ya existe una cuenta con ese correo.');
          setSaving(false);
          return;
        }
      }
      if (isEditing) {
        const updates: Parameters<typeof updateMinimarketAccessAccount>[1] = {
          email: emailNorm,
          role: form.role,
          status: form.status,
        };
        if (form.password.trim()) {
          updates.passwordHash = await hashForMinimarketAccess(form.password);
        }
        await updateMinimarketAccessAccount(editingId!, updates);
        setList((prev) =>
          prev.map((a) =>
            a.id === editingId
              ? {
                  ...a,
                  email: emailNorm,
                  role: form.role,
                  status: form.status,
                  updatedAt: new Date(),
                }
              : a
          )
        );
        toast.success('Cuenta actualizada');
      } else {
        const passwordHash = await hashForMinimarketAccess(form.password);
        const id = await createMinimarketAccessAccount(companyId, {
          email: emailNorm,
          passwordHash,
          role: form.role,
          status: form.status,
        });
        setList((prev) => [
          {
            id,
            companyId,
            email: emailNorm,
            role: form.role,
            status: form.status,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...prev,
        ]);
        toast.success('Cuenta creada');
      }
      closePanel();
    } catch (e) {
      handleError(e);
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`¿Eliminar la cuenta ${email}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteMinimarketAccessAccount(id);
      setList((prev) => prev.filter((a) => a.id !== id));
      if (editingId === id) closePanel();
      toast.success('Cuenta eliminada');
    } catch (e) {
      handleError(e);
      toast.error('No se pudo eliminar');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordId || resetPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
      return;
    }
    setSaving(true);
    try {
      const passwordHash = await hashForMinimarketAccess(resetPassword);
      await updateMinimarketAccessAccount(resetPasswordId, { passwordHash });
      setResetPasswordId(null);
      setResetPassword('');
      toast.success('Contraseña restablecida');
    } catch (e) {
      handleError(e);
      toast.error('No se pudo restablecer la contraseña');
    } finally {
      setSaving(false);
    }
  };

  if (!companyId) {
    return null;
  }

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
              aria-label="Volver"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cuentas de acceso</h1>
              <p className="text-sm text-gray-600">Gestiona las cuentas para la app Minimarket (operadores).</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition-all duration-200 font-medium"
          >
            Nueva cuenta
          </button>
        </div>

        {needsFirstAccount && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-amber-900 mb-2">Activar primera cuenta Admin</h2>
            <p className="text-sm text-amber-800 mb-4">
              Crea la cuenta con la que ingresas al panel (tu correo actual). Será Admin en la app Minimarket.
            </p>
            <form onSubmit={handleActivateFirstAdmin} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo (tu cuenta actual)</label>
                <input
                  type="email"
                  readOnly
                  value={currentEmail}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña (mín. 8 caracteres) *</label>
                <input
                  type="password"
                  value={firstPassword}
                  onChange={(e) => setFirstPassword(e.target.value)}
                  placeholder="Ej: Pymerp.cl1234"
                  minLength={MIN_PASSWORD_LENGTH}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña *</label>
                <input
                  type="password"
                  value={firstPasswordConfirm}
                  onChange={(e) => setFirstPasswordConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  minLength={MIN_PASSWORD_LENGTH}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  autoComplete="new-password"
                />
              </div>
              <button
                type="submit"
                disabled={saving || firstPassword.length < MIN_PASSWORD_LENGTH || firstPassword !== firstPasswordConfirm}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'Creando...' : 'Crear cuenta Admin'}
              </button>
            </form>
          </div>
        )}

        <div className="mb-4">
          <input
            type="search"
            placeholder="Buscar por correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-xl text-sm"
            aria-label="Buscar por correo"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              {list.length === 0
                ? 'No hay cuentas. Crea una para que operadores accedan a la app Minimarket.'
                : 'No hay resultados para la búsqueda.'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredList.map((row) => (
                <li
                  key={row.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50/50 transition-colors duration-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">{row.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          row.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {row.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="text-xs text-gray-500">Rol: {row.role}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResetPasswordId(row.id);
                        setResetPassword('');
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors duration-200"
                    >
                      Restablecer contraseña
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id, row.email)}
                      className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Panel lateral / modal crear-editar */}
        {panelOpen && (
          <div
            className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-account-form-title"
          >
            <div
              className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-md max-h-[90vh] overflow-y-auto animate-[scaleIn_0.25s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h2 id="access-account-form-title" className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Editar cuenta' : 'Nueva cuenta'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="operador@empresa.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="email"
                  />
                  {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña {isEditing ? '(dejar en blanco para no cambiar)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={isEditing ? '••••••••' : 'Mínimo 8 caracteres'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete={isEditing ? 'new-password' : 'off'}
                  />
                  {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as MinimarketAccessRole }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="STAFF">STAFF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as MinimarketAccessStatus }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={closePanel}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 font-medium"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal restablecer contraseña */}
        {resetPasswordId && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
          >
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 w-full max-w-sm p-6">
              <h3 id="reset-password-title" className="text-lg font-semibold text-gray-900 mb-4">
                Restablecer contraseña
              </h3>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm mb-4"
                autoComplete="new-password"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setResetPasswordId(null);
                    setResetPassword('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetPassword.length < MIN_PASSWORD_LENGTH || saving}
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 font-medium"
                >
                  {saving ? 'Guardando...' : 'Restablecer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
