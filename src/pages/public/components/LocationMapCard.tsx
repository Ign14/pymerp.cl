import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { Company } from '../../../types';
import { AppearanceTheme } from '../types';
import { MAP_LIBRARIES } from '../constants';

interface LocationMapCardProps {
  company: Company;
  theme: AppearanceTheme;
  googleMapsApiKey?: string;
}

export function LocationMapCard({ company, theme, googleMapsApiKey }: LocationMapCardProps) {
  if (!company.latitude || !company.longitude) {
    return null;
  }

  const hasApiKey = Boolean(googleMapsApiKey);

  return (
    <div
      className="mb-8 rounded-lg p-5 sm:p-6 shadow"
      style={{ backgroundColor: theme.cardColor, color: theme.textColor, fontFamily: theme.fontBody }}
    >
      <h2 className="font-semibold text-lg sm:text-xl mb-3" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
        Ubicación
      </h2>
      <p className="mb-4 text-sm sm:text-base">{company.address}</p>
      <div className="h-48 sm:h-64 w-full rounded overflow-hidden">
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
          <div className="h-full w-full bg-gray-100 flex items-center justify-center text-sm text-gray-600">
            Mapa no disponible: falta la clave de Google Maps
          </div>
        )}
      </div>
    </div>
  );
}
