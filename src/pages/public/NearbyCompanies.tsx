import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from '@react-google-maps/api';
import { distanceBetween } from 'geofire-common';
import { motion } from 'framer-motion';
import { env } from '../../config/env';
import SEO from '../../components/SEO';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import { getPublicCompanies } from '../../services/firestore';
import type { PublicCompany } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { getAllCategories, getCategoryConfig, resolveCategoryId } from '../../config/categories';
import { useTranslation } from 'react-i18next';

const mapLibraries: ('places')[] = ['places'];

type FilterState = {
  categoryId: string;
  commune: string;
  searchQuery: string;
};

// Radios disponibles para búsqueda
const RADIUS_OPTIONS = [5, 10, 20, 50, 100, 200] as const; // en km

const mapContainerStyle = { width: '100%', height: '100%' } as const;

const defaultCenter = { lat: -33.4489, lng: -70.6693 }; // Santiago

function companyToLatLng(company: PublicCompany | null | undefined) {
  if (!company?.location?.latitude || !company.location.longitude) return null;
  return { lat: company.location.latitude, lng: company.location.longitude };
}

const normalizeExternalUrl = (value?: string | null) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const getCompanyPublicLink = (company: PublicCompany) => {
  if (company.externalWebsiteEnabled === true) {
    const normalized = normalizeExternalUrl(company.externalWebsiteUrl as string | null | undefined);
    if (normalized) {
      try {
        const parsed = new URL(normalized);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          return parsed.toString();
        }
      } catch {
        // Fallback to internal URL
      }
    }
  }
  return `/${company.publicSlug || company.slug || company.id}`;
};

export default function NearbyCompaniesPage() {
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const { t } = useTranslation();
  const mapsKey = env.googleMapsApiKey;

  const [filters, setFilters] = useState<FilterState>({ categoryId: '', commune: '', searchQuery: '' });
  const [companies, setCompanies] = useState<PublicCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<PublicCompany | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(11);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  
  // Estado para búsqueda por radio (separado del mapa)
  const [searchRadius, setSearchRadius] = useState<number | null>(null); // km, null = sin búsqueda por radio
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null); // Centro de la última búsqueda
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showList, setShowList] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: mapsKey, libraries: mapLibraries });

  // Detectar ubicación del usuario al cargar
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización');
      return;
    }

    // Intentar obtener ubicación guardada en localStorage
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        if (parsed.lat && parsed.lng) {
          setUserLocation(parsed);
          setMapCenter(parsed);
          setMapZoom(13);
        }
      } catch {
        // Ignorar error de parsing
      }
    }
  }, []);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización');
      return;
    }

    setIsRequestingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setMapCenter(location);
        setMapZoom(13);
        setIsRequestingLocation(false);
        localStorage.setItem('userLocation', JSON.stringify(location));
      },
      (error) => {
        setIsRequestingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Permiso de ubicación denegado');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Ubicación no disponible');
            break;
          case error.TIMEOUT:
            setLocationError('Tiempo de espera agotado');
            break;
          default:
            setLocationError('Error al obtener ubicación');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  // Función para realizar búsqueda con radio
  const performRadiusSearch = useCallback(async (center: { lat: number; lng: number }, radiusKm: number) => {
    setLoading(true);
    try {
      console.log('[NearbyCompanies] Búsqueda por radio:', radiusKm, 'km desde', center);
      const bounds = {
        center: [center.lat, center.lng] as [number, number],
        radiusInM: radiusKm * 1000,
      };

      const data = await getPublicCompanies({
        categoryId: filters.categoryId || undefined,
        comuna: filters.commune || undefined,
        bounds,
      });

      console.log('[NearbyCompanies] Empresas encontradas en radio:', data.length, data);
      setCompanies(data as unknown as PublicCompany[]);
      setSearchCenter(center);
      setSearchRadius(radiusKm);
    } catch (error) {
      console.error('[NearbyCompanies] Error en búsqueda por radio:', error);
      handleError(error, { customMessage: t('common.errorLoadingCompanies'), showToast: true });
    } finally {
      setLoading(false);
    }
  }, [filters.categoryId, filters.commune, handleError, t]);

  // Cargar todas las empresas al inicio (sin filtro de radio)
  useEffect(() => {
    const loadAll = async () => {
      if (searchRadius !== null) return; // Si hay búsqueda por radio activa, no cargar todas

      setLoading(true);
      try {
        console.log('[NearbyCompanies] Cargando empresas públicas...');
        const data = await getPublicCompanies({
          categoryId: filters.categoryId || undefined,
          comuna: filters.commune || undefined,
        });

        console.log('[NearbyCompanies] Empresas recibidas:', data.length, data);
        
        const withPositions = data.filter((company) =>
          Boolean(company.location?.latitude && company.location.longitude)
        );
        console.log('[NearbyCompanies] Empresas con ubicación:', withPositions.length, withPositions);
        
        if (withPositions.length > 0 && !selectedCompany) {
          setMapCenter({
            lat: withPositions[0].location!.latitude,
            lng: withPositions[0].location!.longitude,
          });
        }
        setCompanies(data as unknown as PublicCompany[]);
        console.log('[NearbyCompanies] Estado actualizado, companies.length:', data.length);
      } catch (error) {
        console.error('[NearbyCompanies] Error al cargar empresas:', error);
        handleError(error, { customMessage: t('common.errorLoadingCompanies'), showToast: true });
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [filters.categoryId, filters.commune, selectedCompany, searchRadius, handleError, t]);

  // Calcular nivel de zoom apropiado basado en radio en km
  const getZoomForRadius = (radiusKm: number): number => {
    // Valores de zoom aproximados para diferentes radios
    // Basado en la fórmula: zoom ≈ log2(156543.03392 * cos(lat) / (radius_m / 256))
    // Para latitud ~-33 (Santiago), simplificamos con valores empíricos
    if (radiusKm <= 5) return 13;
    if (radiusKm <= 10) return 12;
    if (radiusKm <= 20) return 11;
    if (radiusKm <= 50) return 10;
    if (radiusKm <= 100) return 9;
    if (radiusKm <= 200) return 8;
    return 7; // Para radios mayores
  };

  // Cuando cambia el radio, buscar desde el centro actual del mapa y ajustar zoom
  const handleRadiusChange = (radiusKm: number | null) => {
    if (radiusKm === null) {
      // Limpiar búsqueda por radio
      setSearchRadius(null);
      setSearchCenter(null);
      // Recargar todas las empresas
      return;
    }

    // Calcular zoom apropiado para el radio seleccionado
    const targetZoom = getZoomForRadius(radiusKm);
    
    // Actualizar zoom del mapa si hay instancia
    if (mapInstance) {
      mapInstance.setZoom(targetZoom);
      setMapZoom(targetZoom);
    } else {
      // Si no hay instancia aún, actualizar estado para cuando se cargue
      setMapZoom(targetZoom);
    }

    // Buscar desde el centro actual del mapa
    performRadiusSearch(mapCenter, radiusKm);
  };

  // Calcular distancia desde ubicación del usuario o centro de búsqueda
  const getDistanceFromReference = (company: PublicCompany): number | null => {
    const reference = searchCenter || userLocation;
    if (!reference || !company.location?.latitude || !company.location.longitude) {
      return null;
    }
    return distanceBetween(
      [reference.lat, reference.lng],
      [company.location.latitude, company.location.longitude]
    ) * 1000; // Convertir a metros
  };

  const filteredCompanies = useMemo(() => {
    let filtered = [...companies];

    // Filtrar por búsqueda de texto (nombre, descripción, comuna, sector/industria)
    const query = filters.searchQuery.trim().toLowerCase();
    if (query) {
      const matchesQuery = (company: PublicCompany) => {
        const name = (company.name ?? '').toLowerCase();
        const shortDesc = (company.shortDescription ?? '').toLowerCase();
        const desc = (company.description ?? '').toLowerCase();
        const comuna = (company.comuna ?? '').toLowerCase();
        const sector = (company.sector ?? '').toLowerCase();
        const industry = (company.industry ?? '').toLowerCase();
        return (
          name.includes(query) ||
          shortDesc.includes(query) ||
          desc.includes(query) ||
          comuna.includes(query) ||
          sector.includes(query) ||
          industry.includes(query)
        );
      };
      filtered = filtered.filter(matchesQuery);
    }

    // Ordenar: primero por distancia (si hay referencia), luego por nombre
    filtered.sort((a, b) => {
      const distA = getDistanceFromReference(a);
      const distB = getDistanceFromReference(b);

      if (distA !== null && distB !== null) {
        return distA - distB;
      } else if (distA !== null) {
        return -1;
      } else if (distB !== null) {
        return 1;
      } else {
        return (a.name ?? '').localeCompare(b.name ?? '', 'es', { sensitivity: 'base' });
      }
    });

    return filtered;
  }, [companies, filters.searchQuery, searchCenter, userLocation]);

  const communes = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((company) => company.comuna && set.add(company.comuna));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [companies]);

  const categories = useMemo(() => getAllCategories().sort((a, b) => a.labelKey.localeCompare(b.labelKey)), []);
  
  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      zoomControl: false, // Deshabilitar controles por defecto, usaremos badges personalizados
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      fullscreenControlOptions: window.google?.maps?.ControlPosition
        ? { position: window.google.maps.ControlPosition.RIGHT_TOP }
        : undefined,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#0b1221' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#e2e8f0' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1221' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
        { featureType: 'water', stylers: [{ color: '#0ea5e9' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
      ],
    }),
    []
  );

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleZoomIn = () => {
    if (mapInstance) {
      const currentZoom = mapInstance.getZoom() || 11;
      mapInstance.setZoom(Math.min(currentZoom + 1, 20));
      setMapZoom(mapInstance.getZoom() || 11);
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      const currentZoom = mapInstance.getZoom() || 11;
      mapInstance.setZoom(Math.max(currentZoom - 1, 3));
      setMapZoom(mapInstance.getZoom() || 11);
    }
  };

  const getGoogleMapsDirectionsUrl = (company: PublicCompany): string | null => {
    const location = companyToLatLng(company);
    if (!location) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
  };

  const renderMarker = (company: PublicCompany) => {
    const position = companyToLatLng(company);
    if (!position) return null;
    const categoryId = resolveCategoryId({ categoryId: company.categoryId || undefined, category_id: company.categoryId || undefined });
    const theme = getCategoryConfig(categoryId).defaultTheme;
    const icon = window.google?.maps
      ? {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: theme.primaryColor,
          fillOpacity: 0.9,
          strokeColor: '#0f172a',
          strokeOpacity: 0.8,
          strokeWeight: 1,
          scale: 8,
        }
      : undefined;
    return (
      <Marker
        key={company.id}
        position={position}
        onClick={() => setSelectedCompany(company)}
        icon={icon}
        title={company.name}
      />
    );
  };

  if (loadError && mapsKey) {
    return (
      <>
        <SEO
          title={t('nearby.mapError') + ' | PyM-ERP'}
          description={t('nearby.mapErrorDescription')}
          canonical="/pymes-cercanas"
        />
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6" role="alert">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold">{t('nearby.mapError')}</h1>
            <p className="text-slate-200">{t('nearby.mapErrorDescription')}</p>
            <button 
              onClick={() => navigate(-1)} 
              className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
              aria-label={t('nearby.back')}
            >
              {t('nearby.back')}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (loading && companies.length === 0) {
    return (
      <>
        <SEO
          title={t('nearby.title') + ' | PyM-ERP'}
          description={t('nearby.subtitle')}
          canonical="/pymes-cercanas"
        />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6" role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-3 text-white">
            <LoadingSpinner />
            <p className="text-sm text-slate-200">{t('nearby.loading')}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title={t('nearby.title') + ' | PyM-ERP'}
        description={t('nearby.title') + ' - ' + t('nearby.subtitle') + '. Encuentra pymes y emprendimientos en el mapa, filtra por categoría y comuna y visita sus fichas públicas.'}
        keywords="pymes cercanas, negocios locales, mapa de empresas, emprendimientos, búsqueda de negocios"
        canonical="/pymes-cercanas"
        ogType="website"
        ogImage="/og-nearby.jpg"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: t('nearby.title'),
          description: t('nearby.subtitle'),
          url: `${env.publicBaseUrl}/pymes-cercanas`,
        }}
      />
      <div className="min-h-screen bg-slate-950 text-white">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-xl border-b border-gray-700/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-18">
              <button
                className="flex items-center relative"
                aria-label="Ir a inicio de PyM-ERP"
                onClick={() => navigate('/')}
              >
                <div className="relative">
                  <img
                    alt="PyM-ERP Logo"
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain relative z-10"
                    src="/logoapp.png"
                  />
                </div>
              </button>
              <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
                <button
                  className="relative px-4 py-2 text-white font-medium rounded-lg bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-200 text-sm lg:text-base flex items-center space-x-2"
                  aria-label="Ver PYMEs cercanas"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                  </svg>
                  <span className="hidden lg:inline">PYMEs Cercanas</span>
                </button>
                <button
                  className="px-4 py-2 text-gray-100 font-medium hover:text-white transition-colors duration-200 text-sm lg:text-base"
                  onClick={() => navigate('/')}
                >
                  Volver al inicio
                </button>
                <button
                  className="px-4 py-2 text-gray-100 font-medium hover:text-white transition-colors duration-200 text-sm lg:text-base"
                  onClick={() => navigate('/login')}
                >
                  Iniciar Sesión
                </button>
                <button
                  className="px-5 lg:px-6 py-2 bg-white text-gray-900 rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 text-sm lg:text-base"
                  onClick={() => navigate('/request-access')}
                >
                  Regístrate gratis
                </button>
              </div>
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-700/50 active:bg-gray-600/50 transition-colors duration-200"
                aria-label="Abrir menú de navegación"
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-nav"
                type="button"
                onClick={() => setMobileNavOpen((prev) => !prev)}
              >
                <svg className="w-6 h-6 text-gray-100" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
          </div>
          <div
            id="mobile-nav"
            className="md:hidden overflow-hidden bg-gray-800/95 backdrop-blur-xl border-t border-gray-700/50 shadow-lg transition-all duration-300"
            style={{ height: mobileNavOpen ? 'auto' : '0px', opacity: mobileNavOpen ? 1 : 0 }}
          >
            <div className="px-4 py-4 space-y-2">
              <button className="block w-full text-center px-4 py-2.5 text-white font-medium bg-red-600 hover:bg-red-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                </svg>
                <span>PYMEs Cercanas</span>
              </button>
              <button
                className="block w-full text-center px-4 py-2.5 text-gray-100 font-medium border border-gray-600 rounded-lg hover:bg-gray-700/50 hover:border-gray-500 hover:text-white transition-all duration-200 active:scale-[0.98] bg-gray-800 shadow-sm"
                onClick={() => navigate('/')}
              >
                Volver al inicio
              </button>
              <button
                className="block w-full text-center px-4 py-2.5 text-gray-100 font-medium border border-gray-600 rounded-lg hover:bg-gray-700/50 hover:border-gray-500 hover:text-white transition-all duration-200 active:scale-[0.98] bg-gray-800 shadow-sm"
                onClick={() => navigate('/login')}
              >
                Iniciar Sesión
              </button>
              <button
                className="block w-full text-center px-4 py-2.5 bg-white text-gray-900 rounded-lg font-medium shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 active:scale-[0.98]"
                onClick={() => navigate('/request-access')}
              >
                Regístrate gratis
              </button>
            </div>
          </div>
        </nav>

        <div className="fixed inset-0 pt-16">
          <div className="relative h-full w-full">
            <div className="absolute inset-0">
                {mapsKey ? (
                  isLoaded ? (
                    <>
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={mapZoom}
                        onLoad={(map) => {
                          setMapInstance(map);
                          setMapZoom(map.getZoom() || 11);
                        }}
                        onZoomChanged={() => {
                          if (mapInstance) {
                            setMapZoom(mapInstance.getZoom() || 11);
                          }
                        }}
                        onDragEnd={() => {
                          if (mapInstance) {
                            const center = mapInstance.getCenter();
                            if (center) {
                              setMapCenter({ lat: center.lat(), lng: center.lng() });
                            }
                          }
                        }}
                        options={mapOptions}
                      >
                        {filteredCompanies.map(renderMarker)}
                        {/* Marcador de ubicación del usuario */}
                        {userLocation && (
                          <Marker
                            position={userLocation}
                            icon={{
                              path: window.google?.maps?.SymbolPath.CIRCLE,
                              fillColor: '#3b82f6',
                              fillOpacity: 0.8,
                              strokeColor: '#ffffff',
                              strokeOpacity: 1,
                              strokeWeight: 2,
                              scale: 10,
                            }}
                            title="Mi ubicación"
                            zIndex={1000}
                          />
                        )}
                        {selectedCompany && companyToLatLng(selectedCompany) && (() => {
                          const categoryId = resolveCategoryId({ category_id: selectedCompany.categoryId, categoryId: selectedCompany.categoryId });
                          const config = getCategoryConfig(categoryId);
                          const theme = config.defaultTheme;
                          
                          return (
                            <InfoWindow
                              position={companyToLatLng(selectedCompany)!}
                              onCloseClick={() => setSelectedCompany(null)}
                              options={{
                                maxWidth: 300,
                                minWidth: 260,
                              }}
                            >
                              <div
                                className="relative text-slate-900 bg-slate-200/60 backdrop-blur-md rounded-2xl border border-slate-200/70 shadow-md"
                                style={{ width: '260px', maxWidth: '300px', boxSizing: 'border-box' }}
                              >
                                <button
                                  type="button"
                                  onClick={() => setSelectedCompany(null)}
                                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 text-slate-700 hover:text-slate-900 hover:bg-white shadow-sm flex items-center justify-center"
                                  aria-label="Cerrar"
                                >
                                  ✕
                                </button>
                                <div className="flex flex-col items-center text-center px-3 py-4">
                                  {selectedCompany.categoryId && (
                                    <span
                                      className="px-2.5 py-1 rounded-full text-[9px] font-semibold text-white mb-2 shadow-sm"
                                      style={{
                                        backgroundColor: theme.primaryColor,
                                        color: '#ffffff',
                                      }}
                                      title={t(config.labelKey) || config.labelKey}
                                    >
                                      {t(config.labelKey) || config.labelKey}
                                    </span>
                                  )}
                                  <h3 className="text-sm font-bold text-slate-900 leading-tight mb-2 line-clamp-2">
                                    {selectedCompany.name}
                                  </h3>
                                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-white mb-2.5">
                                    <svg className="w-3 h-3 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="font-medium">{selectedCompany.comuna || selectedCompany.region || 'Ubicación no informada'}</span>
                                    {(() => {
                                      const distance = getDistanceFromReference(selectedCompany);
                                      if (distance !== null) {
                                        const km = distance / 1000;
                                        return (
                                          <span className="text-[9px] text-blue-600 font-semibold">
                                            • {km < 1 ? `${Math.round(distance)}m` : `${km.toFixed(1)}km`}
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                  {selectedCompany.shortDescription && (
                                    <p className="text-[10px] text-white line-clamp-2 mb-3 leading-relaxed max-w-full">
                                      {selectedCompany.shortDescription}
                                    </p>
                                  )}
                                  <div className="flex flex-col gap-2 w-full">
                                    {getGoogleMapsDirectionsUrl(selectedCompany) && (
                                      <a
                                        href={getGoogleMapsDirectionsUrl(selectedCompany)!}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full px-3 py-2 bg-blue-600 text-white text-[10px] font-semibold rounded-lg hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 text-center transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                                      >
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                        </svg>
                                        <span className="whitespace-nowrap">Cómo llegar</span>
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => window.open(getCompanyPublicLink(selectedCompany), '_blank', 'noopener,noreferrer')}
                                      className="w-full px-3 py-2 text-white text-[10px] font-semibold rounded-lg hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                                      style={{
                                        backgroundColor: theme.primaryColor,
                                        color: '#ffffff',
                                      }}
                                    >
                                      <span className="whitespace-nowrap">Ver Sitio Web</span>
                                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </InfoWindow>
                          );
                        })()}
                      </GoogleMap>
                      
                      {/* Controles de zoom personalizados (badges) */}
                      <div className="absolute top-[4.5rem] right-4 flex flex-col gap-2 z-10">
                        <button
                          type="button"
                          onClick={handleZoomIn}
                          className="bg-white/90 hover:bg-white text-slate-900 rounded-full p-2 shadow-lg transition-colors"
                          aria-label="Acercar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={handleZoomOut}
                          className="bg-white/90 hover:bg-white text-slate-900 rounded-full p-2 shadow-lg transition-colors"
                          aria-label="Alejar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3 text-white">
                        <LoadingSpinner />
                        <p className="text-sm text-slate-200">Cargando mapa</p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="h-full flex items-center justify-center text-center px-6">
                    <div>
                      <p className="text-lg font-semibold">Agrega tu clave de Google Maps</p>
                      <p className="text-slate-300 text-sm">Define VITE_GOOGLE_MAPS_API_KEY para ver el mapa.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Botones flotantes */}
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 flex flex-col sm:flex-row gap-3 px-4">
          <button
            type="button"
            onClick={() => setShowList(true)}
            className="px-5 py-3 rounded-full bg-indigo-600 text-white text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl hover:bg-indigo-700 transition-all"
          >
            Mostrar lista de emprendimientos
          </button>
        </div>

        {/* Panel de lista */}
        <div className={`fixed inset-0 z-40 ${showList ? 'block' : 'hidden'}`}>
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowList(false)}
            role="presentation"
          />
          <aside className="absolute right-0 top-16 bottom-0 w-full md:w-[420px] bg-slate-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl overflow-y-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-300">{t('nearby.subtitle')}</p>
                <h2 className="text-lg font-bold">Emprendimientos</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowList(false)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                aria-label="Cerrar lista"
              >
                ✕
              </button>
            </div>
            <div className="p-4 pb-28 space-y-3">
              {filteredCompanies.length > 0 && (
                <p className="text-xs text-slate-300">
                  {t(filteredCompanies.length === 1 ? 'common.companiesFound' : 'common.companiesFoundPlural', { count: filteredCompanies.length })}
                  {filters.searchQuery && ` para "${filters.searchQuery}"`}
                  {searchRadius !== null && ` en un radio de ${searchRadius} km`}
                </p>
              )}
              <div className="grid gap-3 pb-6">
                {filteredCompanies.length === 0 ? (
                  <div className="border border-white/10 rounded-xl p-6 bg-slate-900 text-center">
                    <p className="text-lg font-semibold">No hay PYMEs con estos filtros</p>
                    <p className="text-slate-300 text-sm mt-2">
                      {filters.searchQuery
                        ? `No se encontraron resultados para "${filters.searchQuery}".`
                        : 'Ajusta los filtros para ver resultados.'}
                    </p>
                    {(filters.categoryId || filters.commune || filters.searchQuery || searchRadius !== null) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilters({ categoryId: '', commune: '', searchQuery: '' });
                          setSearchRadius(null);
                          setSearchCenter(null);
                        }}
                        className="mt-3 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                ) : (
                  filteredCompanies.map((company, idx) => {
                    const categoryId = resolveCategoryId({ category_id: company.categoryId, categoryId: company.categoryId });
                    const config = getCategoryConfig(categoryId);
                    const theme = config.defaultTheme;
                    const location = companyToLatLng(company);
                    const hasPhoto = company.photos && Array.isArray(company.photos) && company.photos.length > 0;
                    const mainPhoto = hasPhoto && company.photos ? company.photos[0] : null;

                    return (
                      <motion.article
                        key={company.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border border-white/10 rounded-xl bg-slate-900/80 hover:border-cyan-400 focus-within:border-cyan-400 transition-all hover:shadow-lg hover:shadow-cyan-500/10 overflow-hidden"
                      >
                        {mainPhoto && (
                          <div className="w-full h-40 bg-slate-800">
                            <img
                              src={mainPhoto}
                              alt={company.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="p-5 flex flex-col items-center text-center">
                          {company.categoryId && (
                            <span
                              className="text-xs px-3 py-1 rounded-full font-medium text-white mb-3"
                              style={{
                                backgroundColor: theme.primaryColor,
                                color: '#ffffff',
                              }}
                              title={t(config.labelKey) || config.labelKey}
                            >
                              {t(config.labelKey) || config.labelKey}
                            </span>
                          )}
                          <h3 className="font-bold text-xl text-white mb-2 leading-tight">
                            {company.name}
                          </h3>
                          <div className="flex items-center justify-center gap-1.5 text-sm text-slate-300 mb-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{company.comuna || company.region || 'Ubicación no informada'}</span>
                            {(() => {
                              const distance = getDistanceFromReference(company);
                              if (distance !== null) {
                                const km = distance / 1000;
                                return (
                                  <span className="text-xs text-blue-400 font-semibold">
                                    • {km < 1 ? `${Math.round(distance)}m` : `${km.toFixed(1)}km`}
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          {company.shortDescription && (
                            <p className="text-sm text-slate-200 line-clamp-2 mb-4 leading-relaxed max-w-md">
                              {company.shortDescription}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                            {location && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCompany(company);
                                    setMapCenter(location);
                                    setMapZoom(15);
                                  }}
                                  className="px-4 py-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors border border-cyan-400/30 rounded-lg hover:border-cyan-400 hover:bg-cyan-400/10"
                                >
                                  Ver en mapa
                                </button>
                                {getGoogleMapsDirectionsUrl(company) && (
                                  <a
                                    href={getGoogleMapsDirectionsUrl(company)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors border border-blue-400/30 rounded-lg hover:border-blue-400 hover:bg-blue-400/10 flex items-center gap-1.5"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    Cómo llegar
                                  </a>
                                )}
                              </>
                            )}
                            <a
                              href={getCompanyPublicLink(company)}
                              className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                              style={{
                                backgroundColor: theme.primaryColor,
                                color: '#ffffff',
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Ver Sitio Web
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Drawer de filtros */}
        <footer
          className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
            showFilters ? 'translate-y-0' : 'translate-y-[calc(100%-64px)]'
          }`}
        >
          <div className="bg-slate-950/95 border-t border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-center py-3">
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className="flex items-center gap-2 text-sm font-semibold text-white border border-white/30 rounded-full px-4 py-2 hover:border-white/60 hover:bg-white/10 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Filtros
                  <span className="text-xs text-slate-400">{showFilters ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <div className="pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label htmlFor="search-query" className="block text-sm text-slate-200 mb-1">Buscar</label>
                    <div className="relative">
                      <input
                        id="search-query"
                        name="searchQuery"
                        type="text"
                        placeholder="Nombre, descripción, comuna..."
                        className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 pl-10 text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                        value={filters.searchQuery}
                        onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                      />
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {filters.searchQuery && (
                        <button
                          type="button"
                          onClick={() => handleFilterChange('searchQuery', '')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                          aria-label="Limpiar búsqueda"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="filter-category" className="block text-sm text-slate-200 mb-1">Categoría</label>
                    <select
                      id="filter-category"
                      name="categoryId"
                      className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none text-sm"
                      value={filters.categoryId}
                      onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                    >
                      <option value="">Todas</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{t(cat.labelKey) || cat.labelKey}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="filter-commune" className="block text-sm text-slate-200 mb-1">Comuna</label>
                    <select
                      id="filter-commune"
                      name="commune"
                      className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none text-sm"
                      value={filters.commune}
                      onChange={(e) => handleFilterChange('commune', e.target.value)}
                    >
                      <option value="">Todas</option>
                      {communes.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <label className="block text-sm text-slate-200 mb-2">Buscar PYMEs en un radio (desde el centro del mapa)</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleRadiusChange(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        searchRadius === null
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      }`}
                    >
                      Sin límite
                    </button>
                    {RADIUS_OPTIONS.map((radius) => (
                      <button
                        key={radius}
                        type="button"
                        onClick={() => handleRadiusChange(radius)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          searchRadius === radius
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                        }`}
                      >
                        {radius} km
                      </button>
                    ))}
                  </div>
                  {searchRadius !== null && (
                    <p className="text-xs text-slate-400 mt-2">
                      Buscando en un radio de {searchRadius} km desde el centro del mapa
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-slate-200">Mi ubicación</label>
                    {userLocation && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserLocation(null);
                          localStorage.removeItem('userLocation');
                        }}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  {!userLocation ? (
                    <button
                      type="button"
                      onClick={requestUserLocation}
                      disabled={isRequestingLocation}
                      className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isRequestingLocation ? (
                        <>
                          <LoadingSpinner />
                          <span>Obteniendo ubicación...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Usar mi ubicación</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="px-3 py-2 rounded-lg bg-slate-800 border border-green-500/30 text-sm text-green-400">
                      ✓ Ubicación activa
                    </div>
                  )}
                  {locationError && (
                    <p className="text-xs text-red-400 mt-1">{locationError}</p>
                  )}
                </div>

                {(filters.categoryId || filters.commune || filters.searchQuery || searchRadius !== null) && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFilters({ categoryId: '', commune: '', searchQuery: '' });
                        setSearchRadius(null);
                        setSearchCenter(null);
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
