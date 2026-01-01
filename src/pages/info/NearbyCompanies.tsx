import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCompaniesWithCommune } from '../../services/firestore';
import type { Company } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { env } from '../../config/env';
import SEO from '../../components/SEO';
import { chileLocations, findCommuneByName } from '../../utils/chileLocations';

interface FilterState {
  country: string;
  region: string;
  province: string;
  commune: string;
  sector: string;
  showAll: boolean;
}

export default function NearbyCompanies() {
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const mapsKey = env.googleMapsApiKey;

  const [filters, setFilters] = useState<FilterState>({
    country: 'chile',
    region: '',
    province: '',
    commune: '',
    sector: '',
    showAll: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCompaniesWithCommune();
        setCompanies(data);
      } catch (error) {
        handleError(error, { customMessage: 'Error cargando empresas', showToast: false });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Obtener sectores únicos de las empresas
  const sectors = useMemo(() => {
    const sectorSet = new Set<string>();
    companies.forEach((company) => {
      if (company.sector && company.sector.trim()) {
        sectorSet.add(company.sector.trim());
      }
      if (company.industry && company.industry.trim()) {
        sectorSet.add(company.industry.trim());
      }
    });
    return Array.from(sectorSet).sort();
  }, [companies]);

  // Obtener regiones disponibles basadas en las comunas de las empresas
  const availableRegions = useMemo(() => {
    const regionSet = new Set<string>();
    companies.forEach((company) => {
      if (company.commune) {
        const location = findCommuneByName(company.commune);
        if (location) {
          regionSet.add(location.region);
        }
      }
    });
    return Array.from(regionSet).sort();
  }, [companies]);

  // Obtener provincias disponibles basadas en filtros
  const availableProvinces = useMemo(() => {
    if (!filters.region) return [];
    const region = chileLocations.find((r) => r.name === filters.region);
    if (!region || !region.children) return [];
    
    const provinceSet = new Set<string>();
    companies.forEach((company) => {
      if (company.commune) {
        const location = findCommuneByName(company.commune);
        if (location && location.region === filters.region) {
          provinceSet.add(location.province);
        }
      }
    });
    
    return region.children
      .filter((province) => provinceSet.has(province.name))
      .map((province) => province.name)
      .sort();
  }, [filters.region, companies]);

  // Obtener comunas disponibles basadas en filtros
  const availableCommunes = useMemo(() => {
    if (!filters.province) return [];
    const region = chileLocations.find((r) => r.name === filters.region);
    if (!region || !region.children) return [];
    const province = region.children.find((p) => p.name === filters.province);
    if (!province || !province.children) return [];
    
    const communeSet = new Set<string>();
    companies.forEach((company) => {
      if (company.commune) {
        const location = findCommuneByName(company.commune);
        if (location && location.region === filters.region && location.province === filters.province) {
          communeSet.add(location.commune);
        }
      }
    });
    
    return province.children
      .filter((commune) => communeSet.has(commune.name))
      .map((commune) => commune.name)
      .sort();
  }, [filters.region, filters.province, companies]);

  // Normalizar texto para comparación (quitar acentos, espacios extra, convertir a minúsculas)
  const normalizeForComparison = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Filtrar empresas según los filtros activos con lógica mejorada
  const filteredCompanies = useMemo(() => {
    let filtered = companies;

    // Si showAll está activo, mostrar todas
    if (filters.showAll) {
      // Aplicar solo filtro de sector si está seleccionado (búsqueda flexible)
      if (filters.sector) {
        const sectorNormalized = normalizeForComparison(filters.sector);
        filtered = filtered.filter((company) => {
          const companySector = company.sector ? normalizeForComparison(company.sector) : '';
          const companyIndustry = company.industry ? normalizeForComparison(company.industry) : '';
          return (
            companySector === sectorNormalized ||
            companyIndustry === sectorNormalized ||
            companySector.includes(sectorNormalized) ||
            companyIndustry.includes(sectorNormalized) ||
            sectorNormalized.includes(companySector) ||
            sectorNormalized.includes(companyIndustry)
          );
        });
      }
      return filtered;
    }

    // Filtrar por ubicación jerárquica con lógica mejorada
    if (filters.commune) {
      // Filtro más específico: comuna exacta
      filtered = filtered.filter((company) => {
        if (!company.commune) return false;
        const location = findCommuneByName(company.commune);
        if (!location) return false;
        // Comparación normalizada para mayor flexibilidad
        return normalizeForComparison(location.commune) === normalizeForComparison(filters.commune);
      });
    } else if (filters.province) {
      // Filtro por provincia
      filtered = filtered.filter((company) => {
        if (!company.commune) return false;
        const location = findCommuneByName(company.commune);
        if (!location) return false;
        return normalizeForComparison(location.province) === normalizeForComparison(filters.province);
      });
    } else if (filters.region) {
      // Filtro por región
      filtered = filtered.filter((company) => {
        if (!company.commune) return false;
        const location = findCommuneByName(company.commune);
        if (!location) return false;
        return normalizeForComparison(location.region) === normalizeForComparison(filters.region);
      });
    }

    // Filtrar por sector si está seleccionado (búsqueda flexible)
    if (filters.sector) {
      const sectorNormalized = normalizeForComparison(filters.sector);
      filtered = filtered.filter((company) => {
        const companySector = company.sector ? normalizeForComparison(company.sector) : '';
        const companyIndustry = company.industry ? normalizeForComparison(company.industry) : '';
        return (
          companySector === sectorNormalized ||
          companyIndustry === sectorNormalized ||
          companySector.includes(sectorNormalized) ||
          companyIndustry.includes(sectorNormalized) ||
          sectorNormalized.includes(companySector) ||
          sectorNormalized.includes(companyIndustry)
        );
      });
    }

    return filtered;
  }, [companies, filters]);

  const handleFilterChange = (key: keyof FilterState, value: string | boolean) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      
      // Resetear filtros dependientes cuando cambia un nivel superior
      if (key === 'region') {
        newFilters.province = '';
        newFilters.commune = '';
      } else if (key === 'province') {
        newFilters.commune = '';
      } else if (key === 'showAll') {
        // Si se activa showAll, limpiar filtros de ubicación
        if (value === true) {
          newFilters.region = '';
          newFilters.province = '';
          newFilters.commune = '';
        }
      }
      
      return newFilters;
    });
  };

  const resetFilters = () => {
    setFilters({
      country: 'chile',
      region: '',
      province: '',
      commune: '',
      sector: '',
      showAll: false,
    });
  };

  if (loading) {
    return (
      <>
        <SEO
          title="PYMEs Cercanas | PyM-ERP"
          description="Encuentra PYMEs y emprendimientos cerca de ti. Explora negocios locales en tu región, provincia o comuna."
          canonical="/pymes-cercanas"
        />
        <div className="flex items-center justify-center min-h-screen bg-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Cargando PYMEs...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="PYMEs Cercanas | PyM-ERP"
        description="Encuentra PYMEs y emprendimientos cerca de ti. Explora negocios locales en tu región, provincia o comuna."
        canonical="/pymes-cercanas"
      />
      <div className="min-h-screen bg-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-2 rounded-full border border-gray-600 hover:bg-gray-700 text-gray-300 transition-colors"
                aria-label="Volver"
              >
                ←
              </button>
              <h1 className="text-3xl md:text-4xl font-bold text-white">PYMEs Cercanas</h1>
            </div>
            <p className="text-gray-300 text-lg max-w-3xl">
              Explora y encuentra PYMEs y emprendimientos cerca de ti. Filtra por ubicación o sector para descubrir negocios locales.
            </p>
          </motion.div>

          {/* Filtros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-700 rounded-xl shadow-lg border border-gray-600 p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Filtros de Búsqueda</h2>
              {(filters.region || filters.province || filters.commune || filters.sector || filters.showAll) && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* País */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  País
                </label>
                <select
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-600 border-2 border-gray-500 text-white rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-colors"
                  disabled
                >
                  <option value="chile">Chile</option>
                </select>
              </div>

              {/* Región */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Región {filters.showAll && <span className="text-gray-400 text-xs">(deshabilitado)</span>}
                </label>
                <select
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                  disabled={filters.showAll}
                  className={`w-full px-4 py-2.5 bg-gray-600 border-2 rounded-lg focus:ring-2 outline-none transition-colors text-white ${
                    filters.showAll
                      ? 'border-gray-500 bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'border-gray-500 focus:border-cyan-400 focus:ring-cyan-400/20'
                  }`}
                >
                  <option value="">Todas las regiones</option>
                  {availableRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* Provincia */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Provincia {(!filters.region || filters.showAll) && <span className="text-gray-400 text-xs">(deshabilitado)</span>}
                </label>
                <select
                  value={filters.province}
                  onChange={(e) => handleFilterChange('province', e.target.value)}
                  disabled={!filters.region || filters.showAll}
                  className={`w-full px-4 py-2.5 bg-gray-600 border-2 rounded-lg focus:ring-2 outline-none transition-colors text-white ${
                    !filters.region || filters.showAll
                      ? 'border-gray-500 bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'border-gray-500 focus:border-cyan-400 focus:ring-cyan-400/20'
                  }`}
                >
                  <option value="">Todas las provincias</option>
                  {availableProvinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comuna */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Comuna {(!filters.province || filters.showAll) && <span className="text-gray-400 text-xs">(deshabilitado)</span>}
                </label>
                <select
                  value={filters.commune}
                  onChange={(e) => handleFilterChange('commune', e.target.value)}
                  disabled={!filters.province || filters.showAll}
                  className={`w-full px-4 py-2.5 bg-gray-600 border-2 rounded-lg focus:ring-2 outline-none transition-colors text-white ${
                    !filters.province || filters.showAll
                      ? 'border-gray-500 bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'border-gray-500 focus:border-cyan-400 focus:ring-cyan-400/20'
                  }`}
                >
                  <option value="">Todas las comunas</option>
                  {availableCommunes.map((commune) => (
                    <option key={commune} value={commune}>
                      {commune}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sector/Categoría */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Sector / Categoría
                </label>
                <select
                  value={filters.sector}
                  onChange={(e) => handleFilterChange('sector', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-600 border-2 border-gray-500 text-white rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-colors"
                >
                  <option value="">Todos los sectores</option>
                  {sectors.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mostrar Todas */}
              <div className="flex items-end">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-500 rounded-lg hover:border-cyan-400 cursor-pointer transition-colors w-full bg-gray-600/50">
                  <input
                    type="checkbox"
                    checked={filters.showAll}
                    onChange={(e) => handleFilterChange('showAll', e.target.checked)}
                    className="w-5 h-5 text-cyan-400 border-gray-500 rounded focus:ring-cyan-400 bg-gray-600"
                  />
                  <div>
                    <div className="font-semibold text-white">Mostrar todas las PYMEs</div>
                    <div className="text-xs text-gray-300">Ignora filtros de ubicación</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Resultados */}
            <div className="mt-4 pt-4 border-t border-gray-600">
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-white">{filteredCompanies.length}</span> PYME{filteredCompanies.length !== 1 ? 's' : ''} encontrada{filteredCompanies.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>

          {/* Lista de PYMEs */}
          {filteredCompanies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-700 rounded-xl shadow-lg border border-gray-600 p-12 text-center"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">No se encontraron PYMEs</h3>
              <p className="text-gray-300 mb-6">
                Intenta ajustar los filtros o selecciona "Mostrar todas las PYMEs" para ver todos los negocios disponibles.
              </p>
              <button
                onClick={() => handleFilterChange('showAll', true)}
                className="px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors"
              >
                Mostrar todas las PYMEs
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredCompanies.map((company, index) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="bg-gray-700 rounded-xl shadow-md border border-gray-600 p-6 hover:shadow-lg hover:border-cyan-400 transition-all cursor-pointer"
                  onClick={() => setSelectedCompany(company)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center text-2xl">
                      {company.business_type === 'PRODUCTS' ? '🛍️' : '💼'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white mb-1 truncate">
                        {company.name || 'Sin nombre'}
                      </h3>
                      {company.commune && (
                        <p className="text-sm text-gray-300 flex items-center gap-1">
                          <span>📍</span>
                          <span>{company.commune}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {(company.sector || company.industry) && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-semibold rounded-full">
                        {company.sector || company.industry}
                      </span>
                    </div>
                  )}

                  {company.description && (
                    <p className="text-sm text-gray-300 line-clamp-2 mb-4">
                      {company.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                    <a
                      href={`/${company.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm"
                    >
                      Ver página →
                    </a>
                    {company.whatsapp && (
                      <a
                        href={`https://wa.me/${company.whatsapp.replace(/\D/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:text-green-300 text-xl"
                        aria-label="Contactar por WhatsApp"
                      >
                        💬
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Modal de Detalle */}
        {selectedCompany && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-700 rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-gray-600"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-600">
                <h3 className="text-xl font-bold text-white">{selectedCompany.name}</h3>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-gray-300 hover:text-white text-2xl font-bold"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
              <div className="overflow-y-auto p-6">
                <div className="space-y-4">
                  {selectedCompany.commune && (
                    <div>
                      <span className="text-sm font-semibold text-cyan-300">📍 Ubicación:</span>
                      <p className="text-white">{selectedCompany.commune}</p>
                      {selectedCompany.address && (
                        <p className="text-sm text-gray-300">{selectedCompany.address}</p>
                      )}
                    </div>
                  )}

                  {(selectedCompany.sector || selectedCompany.industry) && (
                    <div>
                      <span className="text-sm font-semibold text-cyan-300">🏷️ Sector:</span>
                      <p className="text-white">{selectedCompany.sector || selectedCompany.industry}</p>
                    </div>
                  )}

                  {selectedCompany.description && (
                    <div>
                      <span className="text-sm font-semibold text-cyan-300">📝 Descripción:</span>
                      <p className="text-gray-200">{selectedCompany.description}</p>
                    </div>
                  )}

                  {selectedCompany.latitude && selectedCompany.longitude && mapsKey && (
                    <div>
                      <span className="text-sm font-semibold text-cyan-300 mb-2 block">🗺️ Mapa:</span>
                      <img
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${selectedCompany.latitude},${selectedCompany.longitude}&zoom=14&size=600x300&markers=color:red|${selectedCompany.latitude},${selectedCompany.longitude}&key=${mapsKey}`}
                        alt="Mapa de ubicación"
                        className="w-full rounded-lg border border-gray-600"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <a
                      href={`/${selectedCompany.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-6 py-3 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors text-center"
                    >
                      Ver Página Pública
                    </a>
                    {selectedCompany.whatsapp && (
                      <a
                        href={`https://wa.me/${selectedCompany.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}
