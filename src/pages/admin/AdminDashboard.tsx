import { useEffect, useState } from 'react';
import {
  getAccessRequests,
  updateAccessRequest,
  getUserByEmail,
  updateUser,
  getCompany,
  updateCompany,
  getActiveEntrepreneurUsers,
  getAllUsers,
  deleteUser,
} from '../../services/firestore';
import { sendUserCreationEmail } from '../../services/email';
import { resetUserPassword, deleteUserAccount } from '../../services/admin';
import { generateSlug } from '../../utils/slug';
import { generateRandomPassword } from '../../utils/password';
import { AccessRequestStatus, UserStatus } from '../../types';
import toast from 'react-hot-toast';
import MetricsDashboard from '../../components/MetricsDashboard';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export default function AdminDashboard() {
  const { handleError } = useErrorHandler();
  const [activeTab, setActiveTab] = useState<'requests' | 'profiles' | 'metrics'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<{ user: any; company: any | null }[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [planLoadingId, setPlanLoadingId] = useState<string | null>(null);
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);

  useEffect(() => {
    loadRequests();
    loadProfiles();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await getAccessRequests();
      setRequests(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      const users = await getActiveEntrepreneurUsers();
      const companies = await Promise.all(
        users.map((u) => (u.company_id ? getCompany(u.company_id) : Promise.resolve(null)))
      );
      const merged = users.map((user, idx) => ({
        user,
        company: companies[idx],
      }));
      setProfiles(merged);
    } catch (error) {
      handleError(error, { customMessage: 'Error cargando perfiles' });
      toast.error('No se pudieron cargar los perfiles');
    } finally {
      setProfilesLoading(false);
    }
  };

  const handlePlanChange = async (profile: { user: any; company: any | null }, plan: 'BASIC' | 'STANDARD' | 'PRO') => {
    if (!profile.company?.id) {
      toast.error('No se encontró la compañía de este usuario');
      return;
    }
    setPlanLoadingId(profile.user.id);
    try {
      await updateCompany(profile.company.id, { subscription_plan: plan });
      setProfiles((prev) =>
        prev.map((item) =>
          item.user.id === profile.user.id
            ? { ...item, company: item.company ? { ...item.company, subscription_plan: plan } : item.company }
            : item
        )
      );
      toast.success('Suscripción actualizada');
    } catch (error) {
      handleError(error, { customMessage: 'Error actualizando suscripción' });
      toast.error('No se pudo actualizar la suscripción');
    } finally {
      setPlanLoadingId(null);
    }
  };

  const handleCleanDuplicates = async () => {
    setCleaningDuplicates(true);
    try {
      const users = await getAllUsers();
      const byEmail = users.reduce<Record<string, any[]>>((acc, user) => {
        const key = user.email?.toLowerCase?.();
        if (!key) return acc;
        acc[key] = acc[key] || [];
        acc[key].push(user);
        return acc;
      }, {});

      let deleted = 0;
      for (const email of Object.keys(byEmail)) {
        const list = byEmail[email];
        if (list.length <= 1) continue;

        // Prefer active / force password change, otherwise any
        const sorted = [...list].sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });
        const preferred = sorted.filter(
          (u) => u.status === UserStatus.ACTIVE || u.status === UserStatus.FORCE_PASSWORD_CHANGE
        );
        const keep = preferred[0] || sorted[0];

        for (const user of list) {
          if (user.id === keep.id) continue;
          // Consider duplicates with status INACTIVE as rechazados / ejemplos para borrar.
          await deleteUser(user.id);
          deleted += 1;
        }
      }

      toast.success(`Duplicados limpios. Eliminados: ${deleted}`);
      await loadProfiles();
    } catch (error) {
      handleError(error, { customMessage: 'Error limpiando duplicados' });
      toast.error('No se pudieron limpiar los duplicados');
    } finally {
      setCleaningDuplicates(false);
    }
  };

  const handleResendPassword = async (request: any) => {
    if (actionLoadingId) return;
    setActionLoadingId(request.id);
    try {
      const firestoreUser = await getUserByEmail(request.email);
      if (!firestoreUser) {
        toast.error('No se encontró el usuario en Firestore');
        return;
      }

      const newPassword = generateRandomPassword();
      await resetUserPassword(request.email, newPassword);
      await updateUser(firestoreUser.id, { status: UserStatus.FORCE_PASSWORD_CHANGE });

      const loginUrl = 'https://www.pymerp.cl/login';
      await sendUserCreationEmail(request.email, newPassword, loginUrl);

      toast.success('Contraseña regenerada y correo reenviado');
      await updateAccessRequest(request.id, {
        last_password_reset: new Date(),
      });
    } catch (error: any) {
      handleError('Error reenviando contraseña:', error);
      toast.error(error.message || 'Error al reenviar contraseña');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteAccount = async (request: any) => {
    if (actionLoadingId) return;
    setActionLoadingId(request.id);
    try {
      const firestoreUser = await getUserByEmail(request.email);

      await deleteUserAccount({
        email: request.email,
        companyId: firestoreUser?.company_id,
        userId: firestoreUser?.id,
      });

      await updateAccessRequest(request.id, {
        status: AccessRequestStatus.REJECTED,
        processed_at: new Date(),
      });

      toast.success('Cuenta eliminada');
      await loadRequests();
    } catch (error: any) {
      handleError('Error eliminando cuenta:', error);
      toast.error(error.message || 'Error al eliminar cuenta');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEditCompanyName = async (request: any) => {
    const newName = prompt('Nuevo nombre de la empresa (afectará el slug público)', request.business_name);
    if (!newName) return;
    setActionLoadingId(request.id);
    try {
      // Buscar usuario y compañía
      const firestoreUser = await getUserByEmail(request.email);
      if (!firestoreUser?.company_id) {
        toast.error('No se encontró la compañía para este usuario');
        return;
      }

      const newSlug = generateSlug(newName);
      await updateCompany(firestoreUser.company_id, { name: newName, slug: newSlug });
      toast.success('Nombre y slug actualizados');
    } catch (error: any) {
      handleError('Error editando nombre/slug:', error);
      toast.error(error.message || 'Error al editar nombre/slug');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleBlock = async (request: any) => {
    setActionLoadingId(request.id);
    try {
      const firestoreUser = await getUserByEmail(request.email);
      if (!firestoreUser?.company_id) {
        toast.error('No se encontró la compañía para este usuario');
        return;
      }

      // Flip setup_completed to act as block flag
      const companyId = firestoreUser.company_id;
      const companyData = await getCompany(companyId);
      const blocked = companyData?.setup_completed === false && companyData?.status === 'BLOCKED';

      await updateCompany(companyId, {
        status: blocked ? 'ACTIVE' : 'BLOCKED',
        setup_completed: blocked ? true : false,
      });
      toast.success(blocked ? 'Servicio reactivado' : 'Servicio bloqueado temporalmente');
    } catch (error: any) {
      handleError('Error bloqueando/activando compañía:', error);
      toast.error(error.message || 'Error al bloquear/activar');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Panel de Administración</h1>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-t-md border border-b-0 ${activeTab === 'requests' ? 'bg-white text-gray-900 shadow' : 'bg-gray-200 text-gray-700'}`}
          >
            Solicitudes de acceso
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`px-4 py-2 rounded-t-md border border-b-0 ${activeTab === 'profiles' ? 'bg-white text-gray-900 shadow' : 'bg-gray-300 text-gray-800'}`}
          >
            Perfiles
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-t-md border border-b-0 ${activeTab === 'metrics' ? 'bg-white text-gray-900 shadow' : 'bg-gray-200 text-gray-700'}`}
          >
            Métricas
          </button>
          <div className="flex-1 flex items-center justify-end">
            <button
              onClick={handleCleanDuplicates}
              disabled={cleaningDuplicates}
              className="px-4 py-2 bg-gray-800 text-white rounded-md shadow hover:bg-gray-900 disabled:opacity-60"
            >
              {cleaningDuplicates ? 'Limpiando...' : 'Eliminar duplicados'}
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          {activeTab === 'requests' && (
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-xl font-semibold mb-4">Solicitudes de Acceso</h2>
              
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mb-2">
                        <h3 className="font-semibold break-words">{request.business_name}</h3>
                        <span
                          className={`mt-1 sm:mt-0 inline-block px-2 py-1 text-xs rounded badge-light ${
                            request.status === AccessRequestStatus.PENDING
                              ? 'bg-yellow-100 text-yellow-800'
                              : request.status === AccessRequestStatus.APPROVED
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 break-words">
                        <strong>Nombre:</strong> {request.full_name}
                      </p>
                      <p className="text-sm text-gray-600 break-words">
                        <strong>Email:</strong> {request.email}
                      </p>
                    <p className="text-sm text-gray-600 break-words">
                      <strong>WhatsApp:</strong> {request.whatsapp}
                    </p>
                    {request.plan && (
                      <p className="text-sm text-gray-600 break-words">
                        <strong>Plan solicitado:</strong> {request.plan}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                      <div className="flex flex-col gap-2 sm:items-end w-full sm:w-auto">
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleResendPassword(request)}
                        disabled={actionLoadingId === request.id}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 w-full sm:w-auto"
                      >
                        Recuperación de contraseña
                      </button>
                        <button
                          onClick={() => handleDeleteAccount(request)}
                          disabled={actionLoadingId === request.id}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 w-full sm:w-auto"
                        >
                          Eliminar cuenta
                        </button>
                        <button
                          onClick={() => handleEditCompanyName(request)}
                          disabled={actionLoadingId === request.id}
                          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50 w-full sm:w-auto"
                        >
                          Editar nombre/slug
                        </button>
                        <button
                          onClick={() => handleToggleBlock(request)}
                          disabled={actionLoadingId === request.id}
                          className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50 w-full sm:w-auto"
                        >
                          Bloqueo temporal
                        </button>
                        {request.last_password_reset && (
                          <p className="text-xs text-gray-600">
                            Última recuperación: {new Date(request.last_password_reset).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {requests.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No hay solicitudes</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profiles' && (
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-xl font-semibold mb-4">Perfiles</h2>
              {profilesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {profiles.map((profile) => (
                    <div
                      key={profile.user.id}
                      className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold break-words">
                            {profile.company?.name || 'Empresa sin nombre'}
                          </h3>
                          <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                            {profile.user.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 break-words">
                          <strong>Email:</strong> {profile.user.email}
                        </p>
                        {profile.company?.slug && (
                          <p className="text-sm text-gray-600 break-words">
                            <strong>Slug:</strong> {profile.company.slug}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 break-words">
                          <strong>Plan:</strong>{' '}
                          {profile.company?.subscription_plan || 'Sin definir'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <span className="text-sm font-medium text-gray-700">Suscripción:</span>
                        <div className="flex flex-wrap gap-2">
                          {(['BASIC', 'STANDARD', 'PRO'] as const).map((plan) => (
                            <button
                              key={plan}
                              onClick={() => handlePlanChange(profile, plan)}
                              disabled={planLoadingId === profile.user.id}
                              className={`px-3 py-1 rounded-md border text-sm ${
                                profile.company?.subscription_plan === plan
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-50'
                              } ${planLoadingId === profile.user.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {plan === 'BASIC' ? 'Basic' : plan === 'STANDARD' ? 'Standard' : 'Pro'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {profiles.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No hay perfiles activos</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="px-4 py-5 sm:p-6">
              <MetricsDashboard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
