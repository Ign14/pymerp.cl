import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import {
  type ApiErrorPayload,
  type OrderDetailResponse,
  cancelOrder,
  completeOrder,
  getOrderDetail,
  placeOrder,
  startOrder,
} from '../../../services/gastroOrders';

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : '-');

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { firestoreUser } = useAuth();
  const companyId = firestoreUser?.company_id;

  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{ message: string; traceId?: string } | null>(null);

  const totals = useMemo(() => {
    if (!order) return null;
    return {
      subtotal: formatCurrency(order.subtotal, order.currency),
      total: formatCurrency(order.total, order.currency),
    };
  }, [order]);

  useEffect(() => {
    if (!companyId || !id) return;
    let isMounted = true;
    setLoading(true);
    setErrorBanner(null);
    getOrderDetail(companyId, id)
      .then((data) => {
        if (!isMounted) return;
        setOrder(data);
      })
      .catch((err: ApiErrorPayload) => {
        if (!isMounted) return;
        setErrorBanner({ message: err.message, traceId: err.traceId });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [companyId, id]);

  const refetchDetail = async () => {
    if (!companyId || !id) return;
    const data = await getOrderDetail(companyId, id);
    setOrder(data);
  };

  const handleAction = async (action: 'place' | 'cancel' | 'start' | 'complete') => {
    if (!companyId || !id) return;
    setSaving(true);
    setErrorBanner(null);
    try {
      if (action === 'place') {
        await placeOrder(companyId, id);
      } else if (action === 'cancel') {
        await cancelOrder(companyId, id);
      } else if (action === 'start') {
        await startOrder(companyId, id);
      } else {
        await completeOrder(companyId, id);
      }
      await refetchDetail();
    } catch (err) {
      const payload = err as ApiErrorPayload;
      setErrorBanner({ message: payload.message, traceId: payload.traceId });
    } finally {
      setSaving(false);
    }
  };

  const banner = errorBanner ? (
    <div className="mb-4 border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-md">
      <p className="text-sm font-semibold">{errorBanner.message}</p>
      {errorBanner.traceId && <p className="text-xs mt-1 text-red-500">traceId: {errorBanner.traceId}</p>}
    </div>
  ) : null;

  if (!companyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-500">No hay compañía activa.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle de pedido</h1>
            <p className="text-sm text-gray-500">Snapshots y acciones</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/orders')}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Volver al inbox
          </button>
        </div>

        {banner}

        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : !order ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-500">
            No se encontró el pedido.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">ID</p>
                  <p className="text-sm font-semibold text-gray-900 break-all">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {order.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Creado</p>
                  <p className="text-sm text-gray-900">{formatDateTime(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actualizado</p>
                  <p className="text-sm text-gray-900">{formatDateTime(order.updatedAt)}</p>
                </div>
                {totals && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="text-sm font-semibold text-gray-900">{totals.subtotal}</p>
                    <p className="text-sm text-gray-500 mt-2">Total</p>
                    <p className="text-lg font-bold text-gray-900">{totals.total}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                {order.status === 'DRAFT' && (
                  <>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
                      onClick={() => handleAction('place')}
                      disabled={saving}
                    >
                      {saving ? 'Confirmando...' : 'Confirmar'}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md border border-red-200 text-red-600 text-sm font-semibold disabled:opacity-50"
                      onClick={() => handleAction('cancel')}
                      disabled={saving}
                    >
                      {saving ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  </>
                )}
                {order.status === 'PLACED' && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
                    onClick={() => handleAction('start')}
                    disabled={saving}
                  >
                    {saving ? 'Iniciando...' : 'Iniciar'}
                  </button>
                )}
                {order.status === 'IN_PROGRESS' && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
                    onClick={() => handleAction('complete')}
                    disabled={saving}
                  >
                    {saving ? 'Completando...' : 'Completar'}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.productNameSnapshot}</p>
                        {item.variantNameSnapshot && (
                          <p className="text-xs text-gray-500">Variante: {item.variantNameSnapshot}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Unitario</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.unitPriceSnapshot, order.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Modificadores</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.modifiersTotalSnapshot, order.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Cantidad</p>
                        <p className="text-sm font-semibold text-gray-900">{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Subtotal</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(item.subtotalSnapshot, order.currency)}
                        </p>
                      </div>
                    </div>

                    {item.modifiers.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Modificadores</p>
                        <ul className="mt-2 space-y-2">
                          {item.modifiers.map((modifier) => (
                            <li key={modifier.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm text-gray-800">
                                  {modifier.modifierGroupName}: {modifier.modifierItemName}
                                </p>
                                <p className="text-xs text-gray-500">Cantidad: {modifier.quantity}</p>
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                {formatCurrency(modifier.priceDeltaSnapshot, order.currency)}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
