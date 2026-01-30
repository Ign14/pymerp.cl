import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import {
  type ApiErrorPayload,
  type BusinessUnitResponse,
  type OrderListItemResponse,
  type OrderStatus,
  listBusinessUnits,
  listOrders,
  placeOrder,
  cancelOrder,
  startOrder,
  completeOrder,
} from '../../../services/gastroOrders';

const STATUS_OPTIONS: Array<{ value: '' | OrderStatus; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PLACED', label: 'Placed' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : '-');

const toIsoStart = (date: string) => new Date(`${date}T00:00:00`).toISOString();
const toIsoEnd = (date: string) => new Date(`${date}T23:59:59`).toISOString();

export default function OrdersInboxPage() {
  const navigate = useNavigate();
  const { firestoreUser } = useAuth();
  const companyId = firestoreUser?.company_id;

  const [businessUnits, setBusinessUnits] = useState<BusinessUnitResponse[]>([]);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [orders, setOrders] = useState<OrderListItemResponse[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  const [errorBanner, setErrorBanner] = useState<{ message: string; traceId?: string } | null>(null);

  const canFetchOrders = Boolean(companyId && selectedBusinessUnit);

  const paginationLabel = useMemo(() => {
    if (!totalPages) return 'Página 1';
    return `Página ${page + 1} de ${totalPages}`;
  }, [page, totalPages]);

  useEffect(() => {
    if (!companyId) return;
    let isMounted = true;
    setLoading(true);
    listBusinessUnits(companyId)
      .then((data) => {
        if (!isMounted) return;
        setBusinessUnits(data);
        if (!selectedBusinessUnit && data.length > 0) {
          setSelectedBusinessUnit(data[0].id);
        }
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
  }, [companyId, selectedBusinessUnit]);

  const fetchOrders = useCallback(
    async (showSpinner: boolean) => {
      if (!companyId || !selectedBusinessUnit) return;
      if (showSpinner) setLoading(true);
      setErrorBanner(null);

      const from = fromDate ? toIsoStart(fromDate) : null;
      const to = toDate ? toIsoEnd(toDate) : null;

      try {
        const data = await listOrders(companyId, {
          businessUnitId: selectedBusinessUnit,
          status: statusFilter,
          from,
          to,
          page,
          size,
        });
        setOrders(data.content);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        const apiError = err as ApiErrorPayload;
        setErrorBanner({ message: apiError.message, traceId: apiError.traceId });
        setOrders([]);
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [companyId, selectedBusinessUnit, statusFilter, fromDate, toDate, page, size]
  );

  useEffect(() => {
    void fetchOrders(true);
  }, [fetchOrders]);

  const handleOrderAction = async (orderId: string, action: 'place' | 'cancel' | 'start' | 'complete') => {
    if (!companyId) return;
    setRowLoading((prev) => ({ ...prev, [orderId]: true }));
    setErrorBanner(null);
    try {
      if (action === 'place') {
        await placeOrder(companyId, orderId);
      } else if (action === 'cancel') {
        await cancelOrder(companyId, orderId);
      } else if (action === 'start') {
        await startOrder(companyId, orderId);
      } else {
        await completeOrder(companyId, orderId);
      }
      await fetchOrders(false);
    } catch (err: any) {
      const apiError = err as ApiErrorPayload;
      setErrorBanner({ message: apiError.message, traceId: apiError.traceId });
    } finally {
      setRowLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const banner = errorBanner ? (
    <div className="mb-4 border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-md">
      <p className="text-sm font-semibold">{errorBanner.message}</p>
      {errorBanner.traceId && (
        <p className="text-xs mt-1 text-red-500">traceId: {errorBanner.traceId}</p>
      )}
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
            <p className="text-sm text-gray-500">Inbox de órdenes gastro</p>
          </div>
        </div>

        {banner}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Business unit</label>
              <select
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={selectedBusinessUnit}
                onChange={(event) => {
                  setSelectedBusinessUnit(event.target.value);
                  setPage(0);
                }}
              >
                {businessUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
              <select
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as OrderStatus | '');
                  setPage(0);
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <input
                type="date"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3">Fecha</th>
                    <th className="text-left px-4 py-3">Estado</th>
                    <th className="text-right px-4 py-3">Total</th>
                    <th className="text-left px-4 py-3">Moneda</th>
                    <th className="text-right px-4 py-3">Items</th>
                    <th className="text-right px-4 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        {canFetchOrders ? 'Sin pedidos para los filtros actuales.' : 'Selecciona una business unit.'}
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-gray-700">{formatDateTime(order.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          {formatCurrency(order.total, order.currency)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{order.currency}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{order.itemsCount}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {order.status === 'DRAFT' && (
                              <>
                                <button
                                  type="button"
                                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold disabled:opacity-60"
                                  disabled={rowLoading[order.id]}
                                  onClick={() => handleOrderAction(order.id, 'place')}
                                >
                                  {rowLoading[order.id] ? 'Procesando...' : 'Confirmar'}
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-700 disabled:opacity-60"
                                  disabled={rowLoading[order.id]}
                                  onClick={() => handleOrderAction(order.id, 'cancel')}
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                            {order.status === 'PLACED' && (
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60"
                                disabled={rowLoading[order.id]}
                                onClick={() => handleOrderAction(order.id, 'start')}
                              >
                                {rowLoading[order.id] ? 'Procesando...' : 'Iniciar'}
                              </button>
                            )}
                            {order.status === 'IN_PROGRESS' && (
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60"
                                disabled={rowLoading[order.id]}
                                onClick={() => handleOrderAction(order.id, 'complete')}
                              >
                                {rowLoading[order.id] ? 'Procesando...' : 'Completar'}
                              </button>
                            )}
                            <button
                              type="button"
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                              onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                            >
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="text-sm text-gray-500">{paginationLabel}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-md border border-gray-200 text-sm disabled:opacity-50"
              disabled={page <= 0}
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            >
              Anterior
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-md border border-gray-200 text-sm disabled:opacity-50"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Siguiente
            </button>
            <select
              className="rounded-md border border-gray-200 px-2 py-1 text-sm"
              value={size}
              onChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
            >
              {[10, 20, 50].map((option) => (
                <option key={option} value={option}>
                  {option} / pág.
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
