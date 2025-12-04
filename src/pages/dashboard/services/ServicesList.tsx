import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getServices, deleteService } from '../../../services/firestore';
import toast from 'react-hot-toast';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

export default function ServicesList() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    if (!firestoreUser?.company_id) return;

    try {
      const data = await getServices(firestoreUser.company_id);
      setServices(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      await deleteService(serviceId);
      toast.success('Servicio eliminado');
      await loadServices();
    } catch (error) {
      toast.error('Error al eliminar');
      handleError(error);
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
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
              aria-label="Volver"
            >
              ←
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
          </div>
          <Link
            to="/dashboard/services/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Nuevo servicio
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition">
              <button
                type="button"
                onClick={() => setPreviewUrl(service.image_url || '')}
                className="w-full h-48 bg-gray-100 flex items-center justify-center group relative"
              >
                <img
                  src={service.image_url || 'https://placehold.co/600x400/EEF2FF/1F2937?text=Sin+imagen'}
                  alt={service.name}
                  className="max-h-full max-w-full object-contain"
                />
                <span className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition flex items-center justify-center text-white text-lg opacity-0 group-hover:opacity-100">
                  🔍
                </span>
              </button>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{service.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-blue-600">${service.price.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">{service.estimated_duration_minutes} min</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/dashboard/services/edit/${service.id}`}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm text-center hover:bg-blue-700"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded badge-light ${
                    service.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {service.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {services.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No hay servicios creados. <Link to="/dashboard/services/new" className="text-blue-600 hover:underline">Crear uno</Link>
            </div>
          )}
        </div>
      </div>
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-3xl w-full">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-10 right-0 text-white text-2xl"
              aria-label="Cerrar"
            >
              ×
            </button>
            <div className="bg-white rounded-lg overflow-hidden shadow-lg max-h-[80vh] flex items-center justify-center">
              <img src={previewUrl} alt="Vista previa" className="max-h-[80vh] max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
