import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import { getCompanyBySlug, getProductOrderRequestById } from '../../services/firestore';
import type { Company, ProductOrderRequest } from '../../types';

const STATUS_STEPS: Array<{
  key: NonNullable<ProductOrderRequest['status']>;
  label: string;
  emoji: string;
}> = [
  { key: 'REQUESTED', label: 'Pedido recibido', emoji: '🧾' },
  { key: 'CONFIRMED', label: 'Pedido confirmado', emoji: '✅' },
  { key: 'PREPARING', label: 'En preparación', emoji: '🍳' },
  { key: 'DELIVERED', label: 'En camino / Listo para retiro', emoji: '🛵' },
  { key: 'PAID', label: 'Entregado / Retirado', emoji: '🎉' },
];

const STATUS_LABELS: Record<NonNullable<ProductOrderRequest['status']>, string> = {
  REQUESTED: 'Pedido recibido',
  CONFIRMED: 'Pedido confirmado',
  PREPARING: 'En preparación',
  READY: 'Listo para retiro',
  DELIVERED: 'En camino / Listo para retiro',
  PAID: 'Entregado / Retirado',
  CANCELLED: 'Cancelado',
};

const STATUS_BADGES: Record<NonNullable<ProductOrderRequest['status']>, string> = {
  REQUESTED: 'bg-blue-100 text-blue-800 border border-blue-200',
  CONFIRMED: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  PREPARING: 'bg-amber-100 text-amber-800 border border-amber-200',
  READY: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  PAID: 'bg-green-100 text-green-800 border border-green-200',
  CANCELLED: 'bg-rose-100 text-rose-800 border border-rose-200',
};

const formatDateTime = (value?: Date | number | string | null) =>
  value ? new Date(value).toLocaleString() : '-';

export default function OrderTrackingPage() {
  const { slug, pedidoId } = useParams<{ slug: string; pedidoId: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [order, setOrder] = useState<ProductOrderRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentStatus = (order?.status || 'REQUESTED') as NonNullable<ProductOrderRequest['status']>;

  const statusHistory = useMemo(() => {
    if (!order) {
      return [] as Array<{
        from?: NonNullable<ProductOrderRequest['status']> | null;
        to: NonNullable<ProductOrderRequest['status']>;
        created_at: Date;
      }>;
    }
    if (order.status_history && order.status_history.length > 0) {
      return [...order.status_history].sort(
        (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      );
    }
    return [
      {
        from: null,
        to: currentStatus,
        created_at: order.created_at,
      },
    ];
  }, [order, currentStatus]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | null = null;

    const load = async () => {
      if (!slug || !pedidoId) return;
      try {
        setLoading(true);
        const [companyData, orderData] = await Promise.all([
          getCompanyBySlug(slug),
          getProductOrderRequestById(pedidoId),
        ]);

        if (!companyData) {
          throw new Error('No encontramos esta empresa');
        }
        if (!orderData || orderData.company_id !== companyData.id) {
          throw new Error('No encontramos este pedido');
        }

        if (isMounted) {
          setCompany(companyData);
          setOrder(orderData);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'No pudimos cargar el pedido');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    intervalId = window.setInterval(load, 12000);

    return () => {
      isMounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [slug, pedidoId]);

  if (loading) return <LoadingSpinner fullScreen />;

  if (error || !company || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full rounded-2xl sm:rounded-3xl border border-blue-200 bg-white/95 backdrop-blur-sm p-6 sm:p-8 text-center shadow-lg shadow-blue-100/50">
          <div className="text-4xl sm:text-5xl mb-4">📦</div>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] text-blue-500 font-semibold">Tracking</p>
          <h1 className="mt-3 text-xl sm:text-2xl font-bold text-slate-900">Pedido no disponible</h1>
          <p className="mt-3 text-sm sm:text-base text-slate-900 leading-relaxed">{error || 'No encontramos este pedido.'}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3 text-sm sm:text-base font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const orderCode = order.id.slice(-6).toUpperCase();
  const currentStepIndex = STATUS_STEPS.findIndex((step) => step.key === currentStatus);
  const lastHistory = statusHistory[statusHistory.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-3 sm:px-4 py-6 sm:py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
        {/* Header Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-blue-100 bg-white/95 backdrop-blur-sm p-4 sm:p-6 shadow-lg shadow-blue-100/50">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Seguimiento</p>
              <h1 className="mt-2 text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 truncate">{company.name}</h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-900">
                Pedido <span className="font-semibold text-blue-600">#{orderCode}</span>
              </p>
              <p className="mt-1 text-[10px] sm:text-xs text-slate-900 break-all">{order.id}</p>
            </div>
            <div className={`rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold whitespace-nowrap ${STATUS_BADGES[currentStatus]}`}>
              {STATUS_LABELS[currentStatus]}
            </div>
          </div>

          <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-xl sm:rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 sm:px-5 py-3 sm:py-4">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-blue-500">Estado actual</p>
              <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 text-base sm:text-lg font-semibold">
                <span className="text-xl sm:text-2xl flex-shrink-0">{STATUS_STEPS[Math.max(currentStepIndex, 0)]?.emoji || '📦'}</span>
                <span className="text-slate-900 truncate">{STATUS_LABELS[currentStatus]}</span>
                <span className="relative flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center flex-shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full border-2 border-blue-400/40"></span>
                  <span className="absolute inline-flex h-full w-full animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></span>
                </span>
              </div>
            </div>
            <div className="rounded-xl sm:rounded-2xl border border-blue-100 bg-gradient-to-br from-slate-50 to-blue-50/30 px-4 sm:px-5 py-3 sm:py-4">
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-blue-500">Actualización</p>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-900 font-medium">Último cambio:</p>
              <p className="mt-1 text-xs sm:text-sm text-slate-900 font-semibold">{formatDateTime(lastHistory?.created_at)}</p>
              <p className="mt-2 text-[10px] sm:text-xs text-blue-600">Se actualiza automáticamente cada 12 segundos.</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="rounded-2xl sm:rounded-3xl border border-blue-100 bg-white/95 backdrop-blur-sm p-4 sm:p-6 shadow-lg shadow-blue-100/50">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-blue-500 mb-4 sm:mb-6">Progreso del pedido</p>
          <div className="mt-4 sm:mt-6 grid grid-cols-5 gap-2 sm:gap-4 md:gap-6">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = currentStepIndex >= index && currentStatus !== 'CANCELLED';
              const isActive = currentStepIndex === index && currentStatus !== 'CANCELLED';
              return (
                <div key={step.key} className="relative flex flex-col items-center text-center">
                  {index < STATUS_STEPS.length - 1 && (
                    <span
                      className={`absolute left-1/2 top-4 sm:top-6 h-0.5 sm:h-1 w-full -translate-y-1/2 rounded-full transition-colors duration-300 ${
                        isCompleted ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                  <div
                    className={`relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl text-base sm:text-xl shadow-md transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200' 
                        : 'bg-white text-blue-600 border-2 border-blue-200'
                    } ${isActive ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                  >
                    {step.emoji}
                    {isActive && (
                      <span className="absolute -right-1 -top-1 sm:-right-2 sm:-top-2 inline-flex h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-blue-300 border-t-transparent bg-white"></span>
                    )}
                  </div>
                  <p className={`mt-2 sm:mt-3 text-[10px] sm:text-xs font-semibold leading-tight px-1 ${
                    isCompleted ? 'text-blue-600' : 'text-slate-900'
                  }`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
          {currentStatus === 'CANCELLED' && (
            <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border-2 border-rose-300 bg-gradient-to-r from-rose-50 to-pink-50 px-4 py-3 text-xs sm:text-sm text-rose-800 font-medium">
              ⚠️ Este pedido fue cancelado. Si tienes dudas, contacta al negocio.
            </div>
          )}
        </div>

        {/* History */}
        <div className="rounded-2xl sm:rounded-3xl border border-blue-100 bg-white/95 backdrop-blur-sm p-4 sm:p-6 shadow-lg shadow-blue-100/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Historial completo</p>
            <span className="text-[10px] sm:text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">{statusHistory.length} {statusHistory.length === 1 ? 'cambio' : 'cambios'}</span>
          </div>
          <div className="mt-4 sm:mt-5 space-y-2 sm:space-y-3">
            {statusHistory.map((entry, index) => (
              <div
                key={`${entry.to}-${index}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-blue-100 bg-gradient-to-r from-slate-50 to-blue-50/30 px-3 sm:px-4 py-2.5 sm:py-3 transition-all hover:shadow-md hover:border-blue-200"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className="text-base sm:text-lg flex-shrink-0">{STATUS_STEPS.find((step) => step.key === entry.to)?.emoji || '📦'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{STATUS_LABELS[entry.to as NonNullable<ProductOrderRequest['status']>] || entry.to}</p>
                    {entry.from && (
                      <p className="text-[10px] sm:text-xs text-slate-900 mt-0.5">Desde {STATUS_LABELS[entry.from as NonNullable<ProductOrderRequest['status']>] || entry.from}</p>
                    )}
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-blue-600 font-medium whitespace-nowrap sm:ml-2">{formatDateTime(entry.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
