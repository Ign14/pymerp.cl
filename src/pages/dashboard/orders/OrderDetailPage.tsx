import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  type ApiErrorPayload,
  type OrderDetailResponse,
  type OrderStatus,
  type OrderListItemResponse,
  type OrderTimelineEventResponse,
  cancelOrder,
  completeOrder,
  getOrderDetail,
  listOrders,
  placeOrder,
  startOrder,
} from '../../../services/gastroOrders';
import { logError, logEvent } from '../../../utils/logger';

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString() : '-');

/** For prev/next nav: DRAFT, PLACED, IN_PROGRESS */
const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['DRAFT', 'PLACED', 'IN_PROGRESS'];
const isActiveStatus = (status: OrderStatus) => ACTIVE_ORDER_STATUSES.includes(status);

/** For polling: only PLACED and IN_PROGRESS (tab visible, no DRAFT) */
const POLLING_ORDER_STATUSES: OrderStatus[] = ['PLACED', 'IN_PROGRESS'];
const isPollingStatus = (status: OrderStatus) => POLLING_ORDER_STATUSES.includes(status);

const TIMELINE_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Borrador',
  PLACED: 'Confirmada',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

function buildTimelineEvents(order: OrderDetailResponse): OrderTimelineEventResponse[] {
  if (order.events && order.events.length > 0) {
    return [...order.events].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );
  }
  if (order.events && order.events.length === 0) {
    return [];
  }
  const created = { status: 'DRAFT' as OrderStatus, at: order.createdAt, by: 'Sistema', comment: null as string | null };
  if (order.status === 'DRAFT') {
    return [created];
  }
  const current = {
    status: order.status,
    at: order.updatedAt,
    by: 'Sistema',
    comment: null as string | null,
  };
  return [current, created];
}

const TIMELINE_ICONS: Record<OrderStatus, string> = {
  DRAFT: '📝',
  PLACED: '✅',
  IN_PROGRESS: '🔄',
  COMPLETED: '✔️',
  CANCELLED: '❌',
};

function OrderTimeline({ order }: { order: OrderDetailResponse }) {
  const events = useMemo(() => buildTimelineEvents(order), [order]);
  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-500" data-testid="timeline-empty">
        No hay eventos adicionales.
      </p>
    );
  }
  return (
    <div className="relative" data-testid="order-timeline">
      <div
        className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"
        aria-hidden
      />
      <ul className="space-y-0">
        {events.map((evt, index) => (
          <li key={`${evt.status}-${evt.at}-${index}`} className="relative flex gap-4 pb-6 last:pb-0">
            <div
              className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm"
              aria-hidden
            >
              {TIMELINE_ICONS[evt.status] ?? '•'}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-gray-900">
                {TIMELINE_STATUS_LABELS[evt.status] ?? evt.status}
              </p>
              <p className="text-xs text-gray-500">{formatDateTime(evt.at)}</p>
              {evt.by && (
                <p className="text-xs text-gray-600 mt-1">
                  {evt.by === 'Sistema' ? 'Sistema' : evt.by}
                </p>
              )}
              {evt.comment && (
                <p className="text-xs text-gray-600 mt-1 italic">{evt.comment}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6" data-testid="order-detail-skeleton">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="h-10 bg-gray-200 rounded w-48" />
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="h-6 bg-gray-200 rounded w-36" />
          <div className="h-6 bg-gray-200 rounded w-36" />
          <div className="h-10 bg-gray-200 rounded w-28" />
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <div className="h-10 bg-gray-200 rounded w-28" />
          <div className="h-10 bg-gray-200 rounded w-24" />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const findNextActiveId = (orders: OrderListItemResponse[], currentId: string) => {
  const currentIndex = orders.findIndex((order) => order.id === currentId);
  if (currentIndex === -1) return null;

  for (let i = currentIndex + 1; i < orders.length; i += 1) {
    if (isActiveStatus(orders[i].status)) return orders[i].id;
  }
  for (let i = currentIndex - 1; i >= 0; i -= 1) {
    if (isActiveStatus(orders[i].status)) return orders[i].id;
  }
  return null;
};

const parseReturnToParams = (returnTo: string) => {
  try {
    const [rawPath, rawQuery = ''] = returnTo.split('?');
    if (!rawPath.includes('/dashboard/orders')) return null;
    const params = new URLSearchParams(rawQuery);
    const businessUnitId = params.get('businessUnitId') || '';
    const status = params.get('status') as OrderStatus | null;
    const from = params.get('from');
    const to = params.get('to');
    const page = Number.parseInt(params.get('page') || '0', 10);
    const size = Number.parseInt(params.get('size') || '20', 10);
    return {
      businessUnitId,
      status: status || '',
      from: from || null,
      to: to || null,
      page: Number.isNaN(page) ? 0 : page,
      size: Number.isNaN(size) ? 20 : size,
    };
  } catch {
    return null;
  }
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { firestoreUser } = useAuth();
  const companyId = firestoreUser?.company_id;

  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{ message: string; traceId?: string } | null>(null);
  const [updatedNotice, setUpdatedNotice] = useState(false);
  const [navItems, setNavItems] = useState<OrderListItemResponse[]>([]);
  const [navLoading, setNavLoading] = useState(false);
  const intervalIdRef = useRef<number | ReturnType<typeof setInterval> | null>(null);
  const lastPollAtRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const initialFetchRef = useRef<string | null>(null);
  const detailReadyAtRef = useRef<number | null>(null);

  const isPollingOrder = useMemo(
    () => Boolean(order && isPollingStatus(order.status)),
    [order]
  );

  const totals = useMemo(() => {
    if (!order) return null;
    return {
      subtotal: formatCurrency(order.subtotal, order.currency),
      total: formatCurrency(order.total, order.currency),
    };
  }, [order]);

  const orderRef = useRef<OrderDetailResponse | null>(null);
  orderRef.current = order;

  const refetchDetail = useCallback(
    async (showSpinner: boolean): Promise<OrderDetailResponse | null> => {
      if (!companyId || !id) return null;
      if (showSpinner) setLoading(true);
      setErrorBanner(null);
      setNotFound(false);
      const previousOrder = orderRef.current;
      try {
        const data = await getOrderDetail(companyId, id);
        if (!mountedRef.current) return null;
        if (!previousOrder) detailReadyAtRef.current = performance.now();
        setOrder(data);
        if (
          !showSpinner &&
          previousOrder &&
          (previousOrder.updatedAt !== data.updatedAt || previousOrder.status !== data.status)
        ) {
          setUpdatedNotice(true);
          setTimeout(() => {
            if (mountedRef.current) setUpdatedNotice(false);
          }, 4000);
        }
        return data;
      } catch (err) {
        const payload = err as ApiErrorPayload;
        logError('OrderDetail.refetchDetail', err);
        if (mountedRef.current) {
          if (payload.status === 404) {
            setNotFound(true);
            setOrder(null);
          } else {
            setErrorBanner({ message: payload.message, traceId: payload.traceId });
          }
        }
        return null;
      } finally {
        if (showSpinner && mountedRef.current) setLoading(false);
      }
    },
    [companyId, id]
  );

  useEffect(() => {
    if (!id || !companyId) return;
    if (initialFetchRef.current === id) return;
    initialFetchRef.current = id;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorBanner(null);
      setNotFound(false);
      try {
        const data = await getOrderDetail(companyId, id);
        if (!cancelled && mountedRef.current) {
          detailReadyAtRef.current = performance.now();
          setOrder(data);
        }
      } catch (err) {
        const payload = err as ApiErrorPayload;
        if (!cancelled && mountedRef.current) {
          if (payload.status === 404) {
            setNotFound(true);
            setOrder(null);
          } else {
            setErrorBanner({ message: payload.message, traceId: payload.traceId });
          }
        }
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      initialFetchRef.current = null;
    };
  }, [companyId, id]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const clearPolling = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  const pollOnce = useCallback(async () => {
    if (!companyId || !id) return;
    if (!isPollingOrder) return;
    if (saving) return;
    if (document.visibilityState !== 'visible') return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    lastPollAtRef.current = Date.now();
    try {
      await refetchDetail(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [companyId, id, isPollingOrder, saving, refetchDetail]);

  const startPolling = useCallback(() => {
    clearPolling();
    if (!companyId || !id) return;
    if (!isPollingOrder) return;
    if (saving) return;
    if (document.visibilityState !== 'visible') return;
    intervalIdRef.current = window.setInterval(() => {
      void pollOnce();
    }, 5000);
  }, [clearPolling, companyId, id, isPollingOrder, saving, pollOnce]);

  useEffect(() => {
    if (!companyId || !id || !isPollingOrder || saving) {
      clearPolling();
      return;
    }
    startPolling();
    return clearPolling;
  }, [companyId, id, isPollingOrder, saving, startPolling, clearPolling]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void pollOnce();
        startPolling();
      } else {
        clearPolling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pollOnce, startPolling, clearPolling]);

  const actionConfirmMessages: Record<string, string> = useMemo(
    () => ({
      place: '¿Confirmar pedido?',
      cancel: '¿Cancelar este pedido?',
      start: '¿Iniciar preparación del pedido?',
      complete: '¿Marcar pedido como completado?',
    }),
    []
  );

  const handleBack = useCallback(() => {
    const returnToParam = searchParams.get('returnTo');
    if (returnToParam) {
      try {
        navigate(decodeURIComponent(returnToParam));
        return;
      } catch {
        navigate('/dashboard/orders');
        return;
      }
    }
    navigate('/dashboard/orders');
  }, [navigate, searchParams]);

  const handleAction = useCallback(
    async (action: 'place' | 'cancel' | 'start' | 'complete') => {
      if (!companyId || !id) return;
      const msg = actionConfirmMessages[action];
      if (msg && !window.confirm(msg)) return;

      clearPolling();
      setSaving(true);
      setErrorBanner(null);

      const revalidated = await refetchDetail(false);
      const currentStatus = revalidated?.status ?? orderRef.current?.status;
      const allowed: Record<string, OrderStatus[]> = {
        place: ['DRAFT'],
        cancel: ['DRAFT'],
        start: ['PLACED'],
        complete: ['IN_PROGRESS'],
      };
      if (!currentStatus || !allowed[action].includes(currentStatus)) {
        logEvent({ event: 'orders.detail.action_failed_invalid_state', action, current_status: currentStatus ?? 'unknown' });
        setErrorBanner({
          message: 'La orden ha cambiado. Vista actualizada. La acción no es válida para el estado actual.',
        });
        setSaving(false);
        return;
      }

      if (detailReadyAtRef.current != null) {
        const duration = Math.round(performance.now() - detailReadyAtRef.current);
        logEvent({ event: 'orders.detail.action_time_ms', action, duration_ms: duration });
      }

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
        const updated = await refetchDetail(false);
        const returnToParam = searchParams.get('returnTo');
        if (updated && returnToParam && navItems.length > 0 && !isActiveStatus(updated.status)) {
          const nextActiveId = findNextActiveId(navItems, updated.id);
          if (nextActiveId) {
            navigate(`/dashboard/orders/${nextActiveId}?returnTo=${encodeURIComponent(returnToParam)}`);
          } else {
            handleBack();
          }
        }
      } catch (err) {
        const payload = err as ApiErrorPayload;
        logError('OrderDetail.handleAction', err);
        await refetchDetail(false);
        setErrorBanner({ message: payload.message, traceId: payload.traceId });
      } finally {
        setSaving(false);
      }
    },
    [
      companyId,
      id,
      actionConfirmMessages,
      clearPolling,
      refetchDetail,
      searchParams,
      navItems,
      navigate,
      handleBack,
    ]
  );

  const banner = errorBanner ? (
    <div
      className="mb-4 border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-md"
      role="alert"
      aria-live="polite"
    >
      <p className="text-sm font-semibold">{errorBanner.message}</p>
      {errorBanner.traceId && (
        <p className="text-xs mt-1 text-red-500" data-testid="error-trace-id">traceId: {errorBanner.traceId}</p>
      )}
    </div>
  ) : null;

  const returnTo = searchParams.get('returnTo');

  useEffect(() => {
    if (!companyId || !returnTo) {
      setNavItems([]);
      return;
    }

    const decoded = (() => {
      try {
        return decodeURIComponent(returnTo);
      } catch {
        return null;
      }
    })();

    if (!decoded) {
      setNavItems([]);
      return;
    }

    const parsed = parseReturnToParams(decoded);
    if (!parsed || !parsed.businessUnitId) {
      setNavItems([]);
      return;
    }

    setNavLoading(true);
    listOrders(companyId, {
      businessUnitId: parsed.businessUnitId,
      status: (parsed.status || undefined) as OrderStatus | '' | null | undefined,
      from: parsed.from,
      to: parsed.to,
      page: parsed.page,
      size: parsed.size,
    })
      .then((data) => {
        setNavItems(data.content);
      })
      .catch(() => {
        setNavItems([]);
      })
      .finally(() => {
        setNavLoading(false);
      });
  }, [companyId, returnTo]);

  const navIds = useMemo(() => navItems.map((item) => item.id), [navItems]);
  const navIndex = navIds.findIndex((itemId) => itemId === id);
  const prevId = navIndex > 0 ? navIds[navIndex - 1] : null;
  const nextId = navIndex >= 0 && navIndex < navIds.length - 1 ? navIds[navIndex + 1] : null;

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
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {returnTo && (
              <span className="text-xs text-gray-400">
                {navLoading ? 'Cargando navegación…' : ''}
              </span>
            )}
            {returnTo && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700 disabled:opacity-50"
                  onClick={() => {
                    if (!prevId) return;
                    navigate(`/dashboard/orders/${prevId}?returnTo=${encodeURIComponent(returnTo)}`);
                  }}
                  disabled={!prevId}
                  aria-disabled={!prevId}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700 disabled:opacity-50"
                  onClick={() => {
                    if (!nextId) return;
                    navigate(`/dashboard/orders/${nextId}?returnTo=${encodeURIComponent(returnTo)}`);
                  }}
                  disabled={!nextId}
                  aria-disabled={!nextId}
                >
                  Siguiente
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Volver al inbox
            </button>
          </div>
        </div>

        {banner}

        {updatedNotice && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-md text-sm"
          >
            La orden se actualizó.
          </div>
        )}

        {loading ? (
          <OrderDetailSkeleton />
        ) : notFound ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-gray-500">
            <p className="font-medium">No se encontró el pedido.</p>
            <p className="text-sm mt-2">El ID puede ser incorrecto o el pedido ya no existe.</p>
            <button
              type="button"
              onClick={handleBack}
              className="mt-4 px-4 py-2 rounded-md border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              Volver al inbox
            </button>
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
                    {TIMELINE_STATUS_LABELS[order.status] ?? order.status}
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
                      aria-disabled={saving}
                    >
                      {saving ? 'Confirmando...' : 'Confirmar'}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md border border-red-200 text-red-600 text-sm font-semibold disabled:opacity-50"
                      onClick={() => handleAction('cancel')}
                      disabled={saving}
                      aria-disabled={saving}
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
                    aria-disabled={saving}
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
                    aria-disabled={saving}
                  >
                    {saving ? 'Completando...' : 'Completar'}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de la orden</h2>
              <OrderTimeline order={order} />
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
