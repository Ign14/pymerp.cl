import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany, updateCompany } from '../../services/firestore';
import { BusinessType } from '../../types';
import toast from 'react-hot-toast';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  getAllCategories,
  getCategoryConfig,
  type CategoryId,
  type CategoryGroup,
} from '../../config/categories';
import { Search, Check } from 'lucide-react';

// Whitelist: categorías habilitadas durante el setup.
// Oculta todas las demás para simplificar la configuración inicial.
const ENABLED_SETUP_CATEGORIES: CategoryId[] = [
  'barberias',
  'peluquerias',
  'unas',
  'masajes_spa',
  'agenda_profesionales',
  'restaurantes',
  'bares',
  'foodtruck',
  'minimarket',
  'distribuidores',
];

const SERVICE_SETUP_CATEGORIES: CategoryId[] = [
  'barberias',
  'peluquerias',
  'unas',
  'masajes_spa',
  'agenda_profesionales',
];

export default function SetupCategory() {
  const { t } = useTranslation();
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<CategoryGroup | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  useEffect(() => {
    loadCompany();
  }, []);

  const loadCompany = async () => {
    if (!firestoreUser?.company_id) {
      setLoading(false);
      return;
    }

    try {
      const company = await getCompany(firestoreUser.company_id);
      if (company?.business_type) {
        setBusinessType(company.business_type);
        if (company.category_id) {
          setSelectedCategoryId(company.category_id as CategoryId);
        }
      } else {
        // Si no hay business_type, redirigir al paso anterior
        navigate('/setup/business-type');
      }
    } catch (error) {
      handleError(error, { context: { action: 'loadCompany' } });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar categorías según businessMode
  const availableCategories = useMemo(() => {
    if (!businessType) return [];

    const allCategories = getAllCategories();
    return allCategories.filter((cat) => {
    if (businessType === BusinessType.SERVICES) {
      return SERVICE_SETUP_CATEGORIES.includes(cat.id);
    }

      // Whitelist de categorías habilitadas en el setup
      if (!ENABLED_SETUP_CATEGORIES.includes(cat.id)) {
        return false;
      }

      // Filtrar por businessModesAllowed
      const allowed = cat.businessModesAllowed;
      if (businessType === BusinessType.PRODUCTS) {
        return allowed.includes('PRODUCTS') || allowed.includes('BOTH');
      }
      return false;
    });
  }, [businessType]);

  // Obtener grupos únicos de las categorías disponibles
  const availableGroups = useMemo(() => {
    const groups = new Set<CategoryGroup>();
    availableCategories.forEach((cat) => {
      groups.add(cat.group);
    });
    return Array.from(groups).sort();
  }, [availableCategories]);

  // Filtrar categorías por grupo seleccionado y búsqueda
  const filteredCategories = useMemo(() => {
    let filtered = availableCategories;

    // Filtrar por grupo
    if (selectedGroup !== 'ALL') {
      filtered = filtered.filter((cat) => cat.group === selectedGroup);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((cat) => {
        const label = t(cat.labelKey).toLowerCase();
        const groupLabel = t(cat.groupLabelKey).toLowerCase();
        return label.includes(query) || groupLabel.includes(query);
      });
    }

    return filtered;
  }, [availableCategories, selectedGroup, searchQuery, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategoryId) {
      toast.error(t('setup.category.error.required') || 'Debes seleccionar una categoría');
      return;
    }

    setSaving(true);

    try {
      if (firestoreUser?.company_id) {
        const categoryConfig = getCategoryConfig(selectedCategoryId);
        
        // Determinar businessMode desde business_type
        const businessMode = businessType === BusinessType.SERVICES ? 'SERVICES' : 
                            businessType === BusinessType.PRODUCTS ? 'PRODUCTS' : 'BOTH';
        
        await updateCompany(firestoreUser.company_id, {
          category_id: selectedCategoryId,
          categoryGroup: categoryConfig.group,
          businessMode,
          // Guardar también el grupo en sector para compatibilidad
          sector: categoryConfig.group,
          // No marcar setup_completed aquí, se hará después de configurar redes sociales
        });
        toast.success(t('setup.category.success') || 'Categoría guardada');

        // Navegar al paso de redes sociales
        navigate('/setup/social-links');
      }
    } catch (error) {
      toast.error(t('setup.category.error.save') || 'Error al guardar');
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

  if (!businessType) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => navigate('/setup/business-type')}
            className="p-2 rounded-full border border-gray-300 bg-white text-gray-900 hover:bg-gray-100 shadow-sm"
            aria-label={t('common.back') || 'Volver'}
          >
            ←
          </button>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('setup.category.title') || 'Paso 5: Selecciona tu categoría'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              {t('setup.category.description') ||
                'Selecciona la categoría que mejor describe tu negocio. Esto nos ayuda a personalizar tu experiencia.'}
            </p>

            {/* Buscador */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('setup.category.search.placeholder') || 'Buscar categoría...'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label={t('setup.category.search.label') || 'Buscar categoría'}
                />
              </div>
            </div>

            {/* Chips de grupos */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('setup.category.filter.byGroup') || 'Filtrar por grupo:'}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGroup('ALL')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedGroup === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('setup.category.filter.all') || 'Todas'}
                </button>
                {availableGroups.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setSelectedGroup(group)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedGroup === group
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t(`categories.groups.${group}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de categorías */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                {t('setup.category.select.label') || 'Selecciona una categoría *'}
              </label>
              {filteredCategories.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {t('setup.category.noResults') || 'No se encontraron categorías con ese criterio'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((category) => {
                    const isSelected = selectedCategoryId === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(category.id)}
                        className={`relative p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        aria-pressed={isSelected}
                        aria-label={`${t(category.labelKey)} - ${t(category.groupLabelKey)}`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          {/* Icono placeholder - se puede mejorar con iconos reales */}
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                              isSelected ? 'bg-blue-100' : 'bg-gray-100'
                            }`}
                          >
                            {getCategoryIcon(category.iconPackKey, category.id)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {t(category.labelKey)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {t(category.groupLabelKey)}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {!selectedCategoryId && (
              <div className="text-sm text-red-600" role="alert">
                {t('setup.category.error.required') || 'Debes seleccionar una categoría para continuar'}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/setup/business-type')}
              className="px-6 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 shadow-sm"
            >
              {translate('common.back', 'Back')}
            </button>
            <button
              type="submit"
              disabled={saving || !selectedCategoryId}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? translate('common.saving', 'Saving...')
                : translate('setup.category.submit', 'Finish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Función helper para obtener iconos según el iconPackKey
 * Por ahora retorna emojis, pero se puede mejorar con iconos reales
 */
function getCategoryIcon(iconPackKey: string, categoryId?: CategoryId): string {
  if (categoryId === 'barberias') {
    return '✂️';
  }
  if (categoryId === 'peluquerias') {
    return '💇‍♀️';
  }
  if (categoryId === 'unas') {
    return '💅';
  }
  if (categoryId === 'masajes_spa') {
    return '💆‍♀️';
  }
  if (categoryId === 'agenda_profesionales') {
    return '💼';
  }
  const iconMap: Record<string, string> = {
    medical: '🏥',
    beauty: '💅',
    automotive: '🚗',
    retail: '🛍️',
    food: '🍽️',
    education: '📚',
    tourism: '✈️',
    pets: '🐾',
    crafts: '🎨',
    default: '🏢',
  };
  return iconMap[iconPackKey] || iconMap.default;
}
