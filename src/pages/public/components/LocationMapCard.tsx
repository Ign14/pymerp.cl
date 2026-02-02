import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Company } from '../../../types';
import { AppearanceTheme } from '../types';
import { MAP_LIBRARIES } from '../constants';

interface LocationMapCardProps {
  company: Company;
  theme: AppearanceTheme;
  googleMapsApiKey?: string;
  isCarousel?: boolean;
}

export function LocationMapCard({ company, theme, googleMapsApiKey, isCarousel = false }: LocationMapCardProps) {
  if (!company.latitude || !company.longitude) {
    return null;
  }

  const hasApiKey = Boolean(googleMapsApiKey);

  // Función para abrir Google Maps con la ubicación
  const handleOpenMaps = () => {
    const lat = company.latitude;
    const lng = company.longitude;
    
    // URL para Google Maps con coordenadas
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  if (isCarousel) {
    return (
      <div
        className="w-full h-full flex flex-col rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-lg"
        style={{ backgroundColor: theme.cardColor, color: theme.textColor, fontFamily: theme.fontBody }}
      >
        <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 sm:mb-6" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
          Ubicación
        </h2>
        <p className="mb-4 sm:mb-6 text-lg sm:text-xl md:text-2xl leading-relaxed">{company.address}</p>
        <button
          onClick={handleOpenMaps}
          className="mb-4 sm:mb-6 px-4 py-2 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg font-medium text-sm sm:text-base flex items-center justify-center gap-2"
          style={{
            backgroundColor: theme.buttonColor,
            color: theme.buttonTextColor,
            fontFamily: theme.fontButton,
          }}
          aria-label="Ver cómo llegar en Google Maps"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Ver cómo llegar
        </button>
        <div className="flex-1 min-h-0 w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
          {hasApiKey ? (
            <LoadScript
              googleMapsApiKey={googleMapsApiKey as string}
              libraries={MAP_LIBRARIES}
              loadingElement={<div className="h-full w-full bg-gray-100 animate-pulse" />}
            >
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={{ lat: company.latitude, lng: company.longitude }}
                zoom={15}
              >
                <Marker position={{ lat: company.latitude, lng: company.longitude }} />
              </GoogleMap>
            </LoadScript>
          ) : (
            <div className="h-full w-full bg-gray-100 flex items-center justify-center text-sm sm:text-base text-gray-600">
              Mapa no disponible: falta la clave de Google Maps
            </div>
          )}
        </div>
      </div>
    );
  }

  const borderColor =
    theme.titleColor && theme.titleColor.startsWith('#')
      ? `${theme.titleColor}20`
      : 'rgba(148,163,184,0.25)';
  return (
    <div
      className="mb-6 rounded-lg p-4 sm:p-5 shadow border"
      style={{
        backgroundColor: theme.cardColor,
        color: theme.textColor,
        fontFamily: theme.fontBody,
        borderColor,
      }}
    >
      <h2 className="font-semibold text-base sm:text-lg mb-2" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
        Ubicación
      </h2>
      <p className="mb-3 text-sm leading-relaxed">{company.address}</p>
      <button
        onClick={handleOpenMaps}
        className="mb-3 w-full px-4 py-2 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg font-medium text-sm flex items-center justify-center gap-2"
        style={{
          backgroundColor: theme.buttonColor,
          color: theme.buttonTextColor,
          fontFamily: theme.fontButton,
        }}
        aria-label="Ver cómo llegar en Google Maps"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Ver cómo llegar
      </button>
      <div className="h-40 sm:h-56 w-full rounded overflow-hidden">
        {hasApiKey ? (
          <LoadScript
            googleMapsApiKey={googleMapsApiKey as string}
            libraries={MAP_LIBRARIES}
            loadingElement={<div className="h-full w-full bg-gray-100 animate-pulse" />}
          >
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={{ lat: company.latitude, lng: company.longitude }}
              zoom={15}
            >
              <Marker position={{ lat: company.latitude, lng: company.longitude }} />
            </GoogleMap>
          </LoadScript>
        ) : (
          <div className="h-full w-full bg-gray-100 flex items-center justify-center text-xs text-gray-600">
            Mapa no disponible: falta la clave de Google Maps
          </div>
        )}
      </div>
    </div>
  );
}
