import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import LogoutCorner from '../../../components/LogoutCorner';
import { createDeliveryRoute, getDeliveryRoutes } from '../../../services/distributors';
import type { DeliveryRoute } from '../../../types';

export default function DeliveryRoutesPage() {
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRouteModal, setShowNewRouteModal] = useState(false);
  const [newRoute, setNewRoute] = useState({
    name: '',
    driver: '',
    vehicle: '',
    notes: '',
  });

  useEffect(() => {
    if (firestoreUser?.company_id) {
      loadRoutes();
    }
  }, [firestoreUser?.company_id]);

  const loadRoutes = async () => {
    if (!firestoreUser?.company_id) return;
    try {
      setLoading(true);
      const data = await getDeliveryRoutes(firestoreUser.company_id);
      setRoutes(data);
    } catch (error) {
      handleError(error);
      toast.error('No se pudieron cargar las rutas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async () => {
    if (!newRoute.name.trim()) {
      toast.error('Ingresa un nombre para la ruta');
      return;
    }

    try {
      if (!firestoreUser?.company_id) {
        toast.error('No se encontro la empresa asociada');
        return;
      }
      await createDeliveryRoute({
        company_id: firestoreUser.company_id,
        name: newRoute.name.trim(),
        driver: newRoute.driver.trim() || undefined,
        vehicle: newRoute.vehicle.trim() || undefined,
        notes: newRoute.notes.trim() || undefined,
        orders: [],
        status: 'PLANNED',
      });
      toast.success('Ruta creada exitosamente');
      setNewRoute({ name: '', driver: '', vehicle: '', notes: '' });
      setShowNewRouteModal(false);
      loadRoutes();
    } catch (error) {
      handleError(error);
      toast.error('No se pudo crear la ruta');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LogoutCorner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Distribuidores</p>
            <h1 className="text-3xl font-bold text-slate-900">Rutas de Reparto</h1>
            <p className="text-sm text-slate-600 mt-1">
              Gestiona las rutas de entrega y asigna pedidos a repartidores
            </p>
          </div>
          <button
            onClick={() => setShowNewRouteModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg hover:shadow-xl transition-all"
          >
            + Nueva Ruta
          </button>
        </div>

        {routes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay rutas creadas</h3>
            <p className="text-gray-600 mb-6">Crea tu primera ruta de reparto para comenzar a organizar las entregas</p>
            <button
              onClick={() => setShowNewRouteModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Crear Primera Ruta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((route) => (
              <div key={route.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{route.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    route.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
                    route.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                    route.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {route.status === 'PLANNED' ? 'Planificada' :
                     route.status === 'IN_PROGRESS' ? 'En Curso' :
                     route.status === 'COMPLETED' ? 'Completada' : 'Cancelada'}
                  </span>
                </div>
                {route.driver && (
                  <p className="text-sm text-gray-600 mb-2">👤 Repartidor: {route.driver}</p>
                )}
                {route.vehicle && (
                  <p className="text-sm text-gray-600 mb-2">🚗 Vehículo: {route.vehicle}</p>
                )}
                <p className="text-sm text-gray-600 mb-4">📦 Pedidos: {(route.orders ?? []).length}</p>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium text-sm">
                    Ver Detalles
                  </button>
                  <button className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 font-medium text-sm">
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showNewRouteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Nueva Ruta de Reparto</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la ruta *</label>
                  <input
                    type="text"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Ruta Norte - Mañana"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repartidor</label>
                  <input
                    type="text"
                    value={newRoute.driver}
                    onChange={(e) => setNewRoute({ ...newRoute, driver: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre del repartidor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo</label>
                  <input
                    type="text"
                    value={newRoute.vehicle}
                    onChange={(e) => setNewRoute({ ...newRoute, vehicle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Camioneta ABC-123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={newRoute.notes}
                    onChange={(e) => setNewRoute({ ...newRoute, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Notas adicionales sobre la ruta"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewRouteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateRoute}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Crear Ruta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
