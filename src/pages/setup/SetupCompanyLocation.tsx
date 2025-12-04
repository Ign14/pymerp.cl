import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCompany, updateCompany } from '../../services/firestore';
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import toast from 'react-hot-toast';
import { env } from '../../config/env';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const libraries: ("places")[] = ["places"];

export default function SetupCompanyLocation() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [formData, setFormData] = useState({
    address: '',
    latitude: 0,
    longitude: 0,
    commune: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const googleMapsApiKey = env.googleMapsApiKey;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    libraries,
  });

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
      if (company) {
        setFormData({
          address: company.address || '',
          latitude: company.latitude || -33.4489,
          longitude: company.longitude || -70.6693,
          commune: company.commune || '',
        });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        setFormData({
          address: place.formatted_address || '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          commune: formData.commune,
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (firestoreUser?.company_id) {
        await updateCompany(firestoreUser.company_id, {
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          commune: formData.commune,
        });
        toast.success('Ubicación guardada');
        navigate('/setup/company-info');
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

  if (!googleMapsApiKey) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Paso 2: Ubicación</h2>
          <div className="bg-white shadow rounded-lg p-6 space-y-4 border border-yellow-200">
            <p className="text-yellow-800 font-medium">
              Falta la clave de Google Maps (VITE_GOOGLE_MAPS_API_KEY). Agrégala en tu archivo de entorno para continuar.
            </p>
          </div>
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/setup/company-basic')}
              className="px-6 py-2 bg-gray-200 text-blue-900 rounded-md hover:bg-gray-300"
            >
              Anterior
            </button>
          </div>
        </div>
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
          <h2 className="text-3xl font-bold text-gray-900">Paso 2: Ubicación</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección *
            </label>
            {isLoaded ? (
              <Autocomplete
                onLoad={setAutocomplete}
                onPlaceChanged={onPlaceChanged}
              >
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-500"
                value={formData.address}
                placeholder="Cargando Google Maps..."
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comuna / Ciudad
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={formData.commune}
              onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
              placeholder="Ej: Las Condes, Providencia, Ñuñoa"
            />
          </div>

          <div className="h-64 w-full relative">
            {!isLoaded && !loadError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            )}
            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-700 border border-red-200 rounded-md text-sm text-center px-4">
                Error cargando Google Maps. Revisa tu clave de API o la conexión.
              </div>
            )}
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={{ lat: formData.latitude, lng: formData.longitude }}
                zoom={15}
                onClick={(e) => {
                  if (e.latLng) {
                    setFormData({
                      ...formData,
                      latitude: e.latLng.lat(),
                      longitude: e.latLng.lng(),
                    });
                  }
                }}
              >
                <Marker
                  position={{ lat: formData.latitude, lng: formData.longitude }}
                />
              </GoogleMap>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/setup/company-basic')}
              className="px-6 py-2 bg-gray-200 text-blue-900 rounded-md hover:bg-gray-300"
            >
              Anterior
            </button>
            <button
              type="submit"
              disabled={saving || !isLoaded}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Siguiente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
