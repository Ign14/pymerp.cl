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

  return (
    <div
      className="mb-6 rounded-lg p-4 sm:p-5 shadow"
      style={{ backgroundColor: theme.cardColor, color: theme.textColor, fontFamily: theme.fontBody }}
    >
      <h2 className="font-semibold text-base sm:text-lg mb-2" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
        Ubicación
      </h2>
      <p className="mb-3 text-sm leading-relaxed">{company.address}</p>
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
