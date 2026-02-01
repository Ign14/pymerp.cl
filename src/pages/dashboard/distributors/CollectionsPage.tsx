import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import LogoutCorner from '../../../components/LogoutCorner';
import { getCollections, updateCollection } from '../../../services/distributors';
import type { PaymentCollection } from '../../../types';

export default function CollectionsPage() {
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();
  const [collections, setCollections] = useState<PaymentCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentCollection['status']>('ALL');
  const [totalPending, setTotalPending] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    if (firestoreUser?.company_id) {
      loadCollections();
    }
  }, [firestoreUser?.company_id]);

  const loadCollections = async () => {
    if (!firestoreUser?.company_id) return;
    try {
      setLoading(true);
      const data = await getCollections(firestoreUser.company_id);
      setCollections(data);
      
      // Calcular totales
      const pending = data.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + (c.amount ?? 0), 0);
      const paid = data.filter(c => c.status === 'PAID').reduce((sum, c) => sum + (c.amount ?? 0), 0);
      setTotalPending(pending);
      setTotalPaid(paid);
    } catch (error) {
      handleError(error);
      toast.error('No se pudieron cargar las cobranzas');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (_collectionId: string) => {
    try {
      await updateCollection(_collectionId, { status: 'PAID', paid_date: new Date() });
      toast.success('Cobranza marcada como pagada');
      loadCollections();
    } catch (error) {
      handleError(error);
      toast.error('No se pudo actualizar la cobranza');
    }
  };

  const filteredCollections = collections.filter(c => 
    statusFilter === 'ALL' || c.status === statusFilter
  );

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LogoutCorner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Distribuidores</p>
          <h1 className="text-3xl font-bold text-slate-900">Cobranza</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestiona los pagos pendientes y realizados de tus pedidos
          </p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Pendiente</p>
            <p className="text-3xl font-bold text-amber-600">${totalPending.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Pagado</p>
            <p className="text-3xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-sm text-gray-600 mb-1">Total Cobranzas</p>
            <p className="text-3xl font-bold text-gray-900">{collections.length}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'PAID' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pagadas
            </button>
            <button
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'OVERDUE' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vencidas
            </button>
          </div>
        </div>

        {/* Lista de cobranzas */}
        {filteredCollections.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay cobranzas registradas</h3>
            <p className="text-gray-600">Las cobranzas se generan automáticamente cuando se crean pedidos</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método de pago</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCollections.map((collection) => (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{collection.client_name}</div>
                        <div className="text-sm text-gray-500">{collection.client_whatsapp}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">${(collection.amount ?? 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        collection.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        collection.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        collection.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {collection.status === 'PENDING' ? 'Pendiente' :
                         collection.status === 'PAID' ? 'Pagada' :
                         collection.status === 'OVERDUE' ? 'Vencida' : 'Cancelada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {collection.due_date ? new Date(collection.due_date).toLocaleDateString('es-CL') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {collection.payment_method || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {collection.status === 'PENDING' && (
                        <button
                          onClick={() => handleMarkAsPaid(collection.id)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Marcar como pagada
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
