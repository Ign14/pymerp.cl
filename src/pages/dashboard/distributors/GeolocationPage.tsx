import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import LogoutCorner from '../../../components/LogoutCorner';
import { env } from '../../../config/env';
import { getDeliveryLocations } from '../../../services/distributors';
import type { DeliveryLocation } from '../../../types';

export default function GeolocationPage() {
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (firestoreUser?.company_id) {
      loadLocations();
    }
  }, [firestoreUser?.company_id]);

  useEffect(() => {
    // Cargar Google Maps API
    if (env.googleMapsApiKey && !mapLoaded) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${env.googleMapsApiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    }
  }, [mapLoaded]);

  const loadLocations = async () => {
    if (!firestoreUser?.company_id) return;
    try {
      setLoading(true);
      const data = await getDeliveryLocations(firestoreUser.company_id);
      setLocations(data);
    } catch (error) {
      handleError(error);
      toast.error('No se pudieron cargar las ubicaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const googleMaps = (window as any)?.google?.maps;
    if (!googleMaps) return;

    if (!mapInstanceRef.current) {
      const initial = locations[0];
      const center = initial
        ? { lat: initial.latitude, lng: initial.longitude }
        : { lat: -33.4489, lng: -70.6693 };
      mapInstanceRef.current = new googleMaps.Map(mapRef.current, {
        center,
        zoom: initial ? 12 : 10,
      });
    }
  }, [mapLoaded, locations]);

  useEffect(() => {
    const googleMaps = (window as any)?.google?.maps;
    if (!mapInstanceRef.current || !googleMaps) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    locations.forEach((location) => {
      const marker = new googleMaps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: mapInstanceRef.current,
        title: location.client_name,
      });
      marker.addListener('click', () => setSelectedLocation(location));
      markersRef.current.push(marker);
    });
  }, [locations]);

  useEffect(() => {
    if (!selectedLocation || !mapInstanceRef.current) return;
    mapInstanceRef.current.panTo({
      lat: selectedLocation.latitude,
      lng: selectedLocation.longitude,
    });
  }, [selectedLocation]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LogoutCorner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Distribuidores</p>
          <h1 className="text-3xl font-bold text-slate-900">Geolocalización</h1>
          <p className="text-sm text-slate-600 mt-1">
            Visualiza las ubicaciones de entrega de tus pedidos en el mapa
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de ubicaciones */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ubicaciones de Entrega</h2>
              {locations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📍</div>
                  <p className="text-gray-600 text-sm">No hay ubicaciones registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      onClick={() => setSelectedLocation(location)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedLocation?.id === location.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{location.client_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{location.address}</p>
                          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                            location.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            location.status === 'IN_ROUTE' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {location.status === 'PENDING' ? 'Pendiente' :
                             location.status === 'IN_ROUTE' ? 'En Ruta' : 'Entregado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mapa */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: '600px' }}>
              {!env.googleMapsApiKey ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="text-gray-600">Google Maps API Key no configurada</p>
                  </div>
                </div>
              ) : !mapLoaded ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner />
                </div>
              ) : (
                <div ref={mapRef} id="map" style={{ width: '100%', height: '100%' }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
