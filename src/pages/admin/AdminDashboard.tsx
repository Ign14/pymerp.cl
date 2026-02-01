import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompany, getAllUsers, getServices, getProducts, updateUser } from '../../services/firestore';
import { BusinessType, UserStatus } from '../../types';
import toast from 'react-hot-toast';
import MetricsDashboard from '../../components/MetricsDashboard';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { deleteUserAccount } from '../../services/admin';
import { SUBSCRIPTION_PLAN_LABELS } from '../../utils/constants';
import { signOutAuth } from '../../services/auth';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [activeTab, setActiveTab] = useState<'profiles' | 'metrics'>('profiles');
  const [profiles, setProfiles] = useState<
    { user: any; company: any | null; services: number; products: number }[]
  >([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [businessTypeFilter, setBusinessTypeFilter] = useState<BusinessType | 'ALL'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'BASIC' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'>('ALL');
  const [withCompanyOnly, setWithCompanyOnly] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const users = await getAllUsers();
      const filtered = users.filter((u) => u.status === UserStatus.ACTIVE || u.status === UserStatus.FORCE_PASSWORD_CHANGE);

      const companies = await Promise.all(
        filtered.map((u) => (u.company_id ? getCompany(u.company_id) : Promise.resolve(null)))
      );

      const counts = await Promise.all(
        companies.map(async (company) => {
          if (!company?.id) return { services: 0, products: 0 };
          const [services, products] = await Promise.all([
            getServices(company.id).catch(() => []),
            getProducts(company.id).catch(() => []),
          ]);
          return {
            services: services.filter((s: any) => s.status === 'ACTIVE').length,
            products: products.filter((p: any) => p.status === 'ACTIVE').length,
          };
        })
      );

      const merged = filtered.map((user, idx) => ({
        user,
        company: companies[idx],
        services: counts[idx]?.services ?? 0,
        products: counts[idx]?.products ?? 0,
      }));

      setProfiles(merged);
    } catch (error) {
      handleError(error, { customMessage: 'Error cargando perfiles' });
      toast.error('No se pudieron cargar los perfiles');
    } finally {
      setProfilesLoading(false);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      setActionLoading(userId);
      await updateUser(userId, { status: UserStatus.INACTIVE });
      setProfiles((prev) =>
        prev.map((p) => (p.user.id === userId ? { ...p, user: { ...p.user, status: UserStatus.INACTIVE } } : p))
      );
      toast.success('Cuenta bloqueada');
    } catch (error) {
      handleError(error, { customMessage: 'No se pudo bloquear la cuenta' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (profile: { user: any; company: any | null }) => {
    try {
      setActionLoading(profile.user.id);
      await deleteUserAccount({
        email: profile.user.email,
        companyId: profile.company?.id,
        userId: profile.user.id,
      });
      setProfiles((prev) => prev.filter((p) => p.user.id !== profile.user.id));
      toast.success('Cuenta eliminada');
    } catch (error) {
      handleError(error, { customMessage: 'No se pudo eliminar la cuenta' });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProfiles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return profiles.filter((p) => {
      const matchesType = businessTypeFilter === 'ALL' || p.company?.business_type === businessTypeFilter;
      const matchesStatus = statusFilter === 'ALL' || p.user?.status === statusFilter;
      const matchesPlan =
        planFilter === 'ALL' ||
        (p.company?.subscription_plan || '').toUpperCase() === planFilter;
      const matchesCompany = !withCompanyOnly || Boolean(p.company?.id);
      if (!matchesType || !matchesStatus || !matchesPlan || !matchesCompany) return false;
      if (!normalizedSearch) return true;
      const haystack = [
        p.company?.name,
        p.company?.slug,
        p.company?.subscription_plan,
        p.user?.email,
        p.company?.commune,
        p.company?.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [profiles, businessTypeFilter, searchTerm, statusFilter, planFilter, withCompanyOnly]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Panel de Administración</h1>
        <div className="mb-4 flex items-center justify-end">
          <button
            type="button"
            onClick={async () => {
              await signOutAuth();
              navigate('/login');
            }}
            className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
          >
            Cerrar sesión
          </button>
        </div>

        <div className="flex gap-2 mb-4">
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
            <div className="text-sm text-gray-500">Cuentas activas visibles</div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          {activeTab === 'profiles' && (
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold">Perfiles</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por empresa, email, slug o plan..."
                      className="w-64 max-w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800"
                        aria-label="Limpiar búsqueda"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <label className="text-sm text-gray-600">Tipo:</label>
                  <select
                    value={businessTypeFilter}
                    onChange={(e) => setBusinessTypeFilter(e.target.value as BusinessType | 'ALL')}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ALL">Todos</option>
                    <option value={BusinessType.SERVICES}>Servicios</option>
                    <option value={BusinessType.PRODUCTS}>Productos</option>
                  </select>
                  <label className="text-sm text-gray-600">Estado:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'ALL')}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ALL">Todos</option>
                    <option value={UserStatus.ACTIVE}>Activa</option>
                    <option value={UserStatus.FORCE_PASSWORD_CHANGE}>Pendiente</option>
                    <option value={UserStatus.INACTIVE}>Bloqueada</option>
                  </select>
                  <label className="text-sm text-gray-600">Plan:</label>
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value as typeof planFilter)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ALL">Todos</option>
                    <option value="BASIC">Basic</option>
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="BUSINESS">Business</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={withCompanyOnly}
                      onChange={(e) => setWithCompanyOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Solo con empresa
                  </label>
                  <label className="text-sm text-gray-600">Ordenar:</label>
                  <select
                    value={sortDirection}
                    onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="asc">A → Z</option>
                    <option value="desc">Z → A</option>
                  </select>
                </div>
              </div>
              {profilesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProfiles
                    .slice()
                    .sort((a, b) => {
                      const nameA = (a.company?.name || '').toLowerCase();
                      const nameB = (b.company?.name || '').toLowerCase();
                      return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                    })
                    .map((profile) => (
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
                            {profile.company?.business_type && (
                              <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                                {profile.company.business_type === BusinessType.SERVICES ? 'Servicios' : 'Productos'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 break-words">
                            <strong>Email:</strong> {profile.user.email}
                          </p>
                          {profile.company?.slug && (
                            <p className="text-sm text-gray-600 break-words">
                              <strong>Slug:</strong> {profile.company.slug}
                            </p>
                          )}
                          {profile.company?.subscription_plan && (
                            <p className="text-sm text-gray-600 break-words">
                              <strong>Plan:</strong> {SUBSCRIPTION_PLAN_LABELS[profile.company.subscription_plan as keyof typeof SUBSCRIPTION_PLAN_LABELS] || profile.company.subscription_plan}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 break-words">
                            <strong>Creado:</strong> {new Date(profile.user.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-sm text-gray-800 flex flex-col gap-2 min-w-[180px]">
                          <div className="flex items-center justify-between">
                            <span>Servicios activos:</span>
                            <span className="font-semibold">{profile.services}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Productos activos:</span>
                            <span className="font-semibold">{profile.products}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Avance productivo: {profile.services + profile.products > 0 ? 'En progreso' : 'Pendiente'}
                          </div>
                          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="text-xs font-semibold text-gray-700 mb-1">Gestión de planes</div>
                            <div className="text-xs text-gray-600">
                              Plan actual:{' '}
                              <span className="font-semibold">
                                {SUBSCRIPTION_PLAN_LABELS[
                                  profile.company?.subscription_plan as keyof typeof SUBSCRIPTION_PLAN_LABELS
                                ] || profile.company?.subscription_plan || 'Sin plan'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-2 mt-3">
                              <button
                                type="button"
                                onClick={() => navigate('/costos')}
                                className="px-3 py-2 rounded text-xs font-medium border border-gray-300 bg-white hover:bg-gray-100 transition-colors"
                              >
                                Ver costos
                              </button>
                              {profile.company?.id && (
                                <button
                                  onClick={() => navigate(`/admin/subscriptions/${profile.company.id}`)}
                                  className="px-3 py-2 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700 transition-colors"
                                >
                                  Gestionar plan
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 mt-3">
                            <button
                              type="button"
                              disabled={actionLoading === profile.user.id}
                              onClick={() => handleBlockUser(profile.user.id)}
                              className="px-3 py-2 text-xs rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-50"
                            >
                              {actionLoading === profile.user.id && profile.user.status !== UserStatus.INACTIVE
                                ? 'Bloqueando...'
                                : profile.user.status === UserStatus.INACTIVE
                                  ? 'Bloqueada'
                                  : 'Bloquear cuenta'}
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === profile.user.id}
                              onClick={() => handleDeleteUser(profile)}
                              className="px-3 py-2 text-xs rounded bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50"
                            >
                              {actionLoading === profile.user.id ? 'Eliminando...' : 'Eliminar cuenta'}
                            </button>
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
