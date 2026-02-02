import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany, updateCompany } from '../../services/firestore';
import { BusinessType } from '../../types';
import toast from 'react-hot-toast';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useAnalytics } from '../../hooks/useAnalytics';
import { getAllCategories, getCategoryConfig, type DashboardModule } from '../../config/categories';
import { useTranslation } from 'react-i18next';

export default function SetupBusinessType() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const { trackNamedEvent } = useAnalytics();
  const { t } = useTranslation();
  const [businessType, setBusinessType] = useState<BusinessType | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const moduleLabels: Record<DashboardModule, string> = {
    appointments: 'Citas',
    'appointments-lite': 'Citas (lite)',
    patients: 'Pacientes',
    'patients-lite': 'Pacientes (lite)',
    catalog: 'Catálogo',
    orders: 'Pedidos',
    'work-orders': 'Órdenes de trabajo',
    'work-orders-lite': 'Órdenes de trabajo (lite)',
    inventory: 'Inventario',
    professionals: 'Profesionales',
    schedule: 'Agenda',
    reports: 'Reportes',
    notifications: 'Notificaciones',
    'menu-categories': 'Categorías de menú',
    'menu-qr': 'Menú QR',
    'clinic-resources': 'Recursos clínicos',
    events: 'Eventos',
    'event-reservations': 'Reservas de eventos',
    properties: 'Propiedades',
    'property-bookings': 'Reservas de propiedades',
    'delivery-routes': 'Rutas de reparto',
    collections: 'Cobranza',
    geolocation: 'Geolocalización',
  };

  const filteredCategories = useMemo(() => {
    if (!businessType) return [];
    const mode = businessType === BusinessType.SERVICES ? 'SERVICES' : 'PRODUCTS';
    return getAllCategories().filter(
      (category) =>
        category.businessModesAllowed.includes(mode) ||
        category.businessModesAllowed.includes('BOTH')
    );
  }, [businessType]);

  const categoriesByGroup = useMemo(() => {
    const grouped = new Map<string, typeof filteredCategories>();
    filteredCategories.forEach((category) => {
      const groupLabel = t(category.groupLabelKey, { defaultValue: category.group });
      const existing = grouped.get(groupLabel) || [];
      grouped.set(groupLabel, [...existing, category]);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0], 'es'));
  }, [filteredCategories, t]);

  const selectedCategoryConfig = useMemo(() => {
    if (!categoryId) return null;
    return getCategoryConfig(categoryId);
  }, [categoryId]);

  useEffect(() => {
    loadCompany();
  }, []);

  useEffect(() => {
    if (!categoryId || filteredCategories.length === 0) return;
    if (!filteredCategories.some((category) => category.id === categoryId)) {
      setCategoryId('');
    }
  }, [businessType, filteredCategories, categoryId]);

  const loadCompany = async () => {
    if (!firestoreUser?.company_id) {
      setLoading(false);
      return;
    }

    try {
      const company = await getCompany(firestoreUser.company_id);
      if (company?.business_type) {
        setBusinessType(company.business_type);
      }
      const existingCategory = company?.category_id || company?.categoryId;
      if (existingCategory) {
        setCategoryId(existingCategory);
      }
    } catch (error) {
      handleError(error, { context: { action: 'loadCompany' } });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessType) {
      toast.error('Debes seleccionar un tipo de negocio');
      return;
    }

    if (!categoryId) {
      toast.error('Debes seleccionar una subcategoría');
      return;
    }

    setSaving(true);

    try {
      if (firestoreUser?.company_id) {
        const selectedCategory = getCategoryConfig(categoryId);
        await updateCompany(firestoreUser.company_id, {
          business_type: businessType,
          businessMode: businessType,
          category_id: categoryId,
          categoryId: categoryId,
          categoryGroup: selectedCategory.group,
          setup_completed: true,
        });
        toast.success('Configuración completada');

        trackNamedEvent('companies.setupCompleted', {
          company_id: firestoreUser.company_id,
          business_type: businessType,
          category_id: categoryId,
        });
        
        if (businessType === BusinessType.SERVICES) {
          navigate('/dashboard/services');
        } else {
          navigate('/dashboard/products');
        }
      }
    } catch (error) {
      toast.error('Error al guardar');
      handleError(error);
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
            aria-label="Volver"
          >
            ←
          </button>
          <h2 className="text-3xl font-bold text-gray-900">Paso 4: Tipo de negocio</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Tipo de negocio *
            </label>
            <div className="space-y-4">
              <label
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                  businessType === BusinessType.SERVICES
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="businessType"
                  value={BusinessType.SERVICES}
                  checked={businessType === BusinessType.SERVICES}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">Servicios</div>
                  <div className={`text-sm ${businessType === BusinessType.SERVICES ? 'text-blue-900' : 'text-gray-600'}`}>
                    Ofreces servicios que se agendan por horarios
                  </div>
                </div>
              </label>
              
              <label
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                  businessType === BusinessType.PRODUCTS
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="businessType"
                  value={BusinessType.PRODUCTS}
                  checked={businessType === BusinessType.PRODUCTS}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">Productos</div>
                  <div className={`text-sm ${businessType === BusinessType.PRODUCTS ? 'text-blue-900' : 'text-gray-600'}`}>
                    Vendes productos físicos o digitales
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcategoría elegible *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={!businessType}
              >
                <option value="">
                  {businessType ? 'Selecciona una subcategoría' : 'Selecciona primero el tipo de negocio'}
                </option>
                {categoriesByGroup.map(([groupLabel, categories]) => (
                  <optgroup key={groupLabel} label={groupLabel}>
                    {categories
                      .slice()
                      .sort((a, b) =>
                        t(a.labelKey, { defaultValue: a.id }).localeCompare(
                          t(b.labelKey, { defaultValue: b.id }),
                          'es',
                          { sensitivity: 'base' }
                        )
                      )
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {t(category.labelKey, { defaultValue: category.id })}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Esta subcategoría define los módulos de gestión disponibles para tu negocio.
              </p>
            </div>

            {selectedCategoryConfig && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm font-semibold text-gray-800 mb-2">Módulos de gestión activados</div>
                <div className="flex flex-wrap gap-2">
                  {selectedCategoryConfig.dashboardModules.map((module) => (
                    <span
                      key={module}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800"
                    >
                      {moduleLabels[module] || module}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/setup/company-info')}
              className="px-6 py-2 bg-gray-200 text-blue-900 rounded-md hover:bg-gray-300"
            >
              Anterior
            </button>
            <button
              type="submit"
              disabled={saving || !businessType || !categoryId}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Finalizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
