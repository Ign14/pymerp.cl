import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { advanceProductOrderStatus, getCompany, getProducts, getProductOrderRequests, updateProductOrderRequest } from '../../services/firestore';
import type { Product, ProductOrderRequest } from '../../types';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';

type OrderStatus = NonNullable<ProductOrderRequest['status']>;

const STATUS_LABELS: Record<OrderStatus, string> = {
  REQUESTED: 'Solicitado',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En preparación',
  DELIVERED: 'Entregado',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus | null>> = {
  REQUESTED: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'DELIVERED',
  DELIVERED: 'PAID',
  PAID: null,
  CANCELLED: null,
};

// Colores de estado con buen contraste en light/dark.
// En dark usamos fondos translúcidos y texto claro (evita "texto oscuro sobre tarjeta oscura").
const STATUS_COLORS: Record<OrderStatus, string> = {
  REQUESTED: 'bg-blue-100 text-black dark:bg-blue-500/20 dark:text-black',
  CONFIRMED: 'bg-indigo-100 text-black dark:bg-indigo-500/20 dark:text-black',
  PREPARING: 'bg-amber-100 text-black dark:bg-amber-500/20 dark:text-black',
  DELIVERED: 'bg-emerald-100 text-black dark:bg-emerald-500/20 dark:text-black',
  PAID: 'bg-green-100 text-black dark:bg-green-500/20 dark:text-black',
  CANCELLED: 'bg-red-100 text-black dark:bg-red-500/20 dark:text-black',
};

const normalizePhone = (phone?: string | null) => (phone || '').replace(/[^0-9]/g, '');

const ORDER_TYPE_LABELS: Record<NonNullable<ProductOrderRequest['order_type']>, string> = {
  TABLE: 'Consumo en local',
  PICKUP: 'Retiro en local',
  DELIVERY: 'Delivery',
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char] ?? char;
  });

const formatDateTime = (value?: number | string | Date | null) =>
  value ? new Date(value).toLocaleString() : '-';

const buildComandaHtml = (order: ProductOrderRequest, productsMap: Record<string, Product>) => {
  const orderCode = order.id.slice(-6).toUpperCase();
  const orderTypeLabel = order.order_type ? ORDER_TYPE_LABELS[order.order_type] : 'Retiro en local';
  const createdAt = formatDateTime(order.created_at);
  const printedAt = new Date().toLocaleString();
  const itemsHtml = order.items
    .map((item) => {
      const productName = productsMap[item.product_id]?.name || item.product_id;
      const price = item.unit_price ? `$${item.unit_price.toLocaleString()}` : '';
      return `<tr>
        <td style="padding:4px 0; vertical-align:top;">${item.quantity}x</td>
        <td style="padding:4px 8px 4px 0; vertical-align:top;">${escapeHtml(productName)}</td>
        <td style="padding:4px 0; text-align:right; vertical-align:top;">${escapeHtml(price)}</td>
      </tr>`;
    })
    .join('');

  const clientName = order.client_name ? escapeHtml(order.client_name) : 'Sin nombre';
  const clientPhone = order.client_whatsapp ? escapeHtml(order.client_whatsapp) : '';
  const clientComment = order.client_comment ? escapeHtml(order.client_comment) : '';
  const total = order.total_estimated ? `$${order.total_estimated.toLocaleString()}` : '';

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Comanda ${orderCode}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 16px;
        color: #000;
        font-family: "Courier New", Courier, monospace;
        font-size: 12px;
      }
      .receipt {
        width: 280px;
        margin: 0 auto;
      }
      .title {
        font-size: 16px;
        text-align: center;
        font-weight: 700;
        letter-spacing: 1px;
      }
      .muted { color: #333; }
      .divider {
        border: 0;
        border-top: 1px dashed #000;
        margin: 8px 0;
      }
      table { width: 100%; border-collapse: collapse; }
      .totals {
        display: flex;
        justify-content: space-between;
        font-weight: 700;
        margin-top: 6px;
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="title">COMANDA</div>
      <div class="muted" style="text-align:center;">Pedido #${orderCode}</div>
      <hr class="divider" />
      <div>Creado: ${escapeHtml(createdAt)}</div>
      <div>Impreso: ${escapeHtml(printedAt)}</div>
      <div>Mesa: ${escapeHtml(order.table_number || 'N/D')}</div>
      <div>Tipo: ${escapeHtml(orderTypeLabel)}</div>
      <div>Canal: ${escapeHtml(order.channel || 'WHATSAPP')}</div>
      <hr class="divider" />
      <div><strong>Cliente</strong></div>
      <div>${clientName}</div>
      ${clientPhone ? `<div>Tel: ${clientPhone}</div>` : ''}
      ${clientComment ? `<div>Nota: ${clientComment}</div>` : ''}
      <hr class="divider" />
      <div><strong>Detalle</strong></div>
      <table>
        <tbody>
          ${itemsHtml || '<tr><td colspan="3">Sin productos</td></tr>'}
        </tbody>
      </table>
      ${total ? `<div class="totals"><span>Total</span><span>${escapeHtml(total)}</span></div>` : ''}
      <hr class="divider" />
      <div style="text-align:center;">Gracias por tu compra</div>
    </div>
  </body>
</html>`;
};

const buildOrderStatusWhatsAppUrl = (
  order: ProductOrderRequest,
  productsMap: Record<string, Product>,
  trackingLink: string
) => {
  if (!order.client_whatsapp) return null;
  const phone = normalizePhone(order.client_whatsapp);
  if (!phone) return null;

  const orderCode = order.id.slice(-6).toUpperCase();
  const orderType = order.order_type ? ORDER_TYPE_LABELS[order.order_type] : 'Retiro en local';
  const itemsList = order.items
    .map((item) => {
      const productName = productsMap[item.product_id]?.name || item.product_id;
      return `${item.quantity}x ${productName}`;
    })
    .join(', ');

  let message = `Hola ${order.client_name || 'cliente'}, tu pedido #${orderCode} está confirmado ✅.`;
  message += `\nTipo: ${orderType}.`;
  if (order.order_type === 'TABLE' && order.table_number) {
    message += `\nMesa: ${order.table_number}.`;
  }
  if (itemsList) {
    message += `\nResumen: ${itemsList}.`;
  }
  if (order.total_estimated) {
    message += `\nTotal estimado: $${order.total_estimated.toLocaleString()}.`;
  }
  message += `\n\nRevisa el estado de tu pedido aquí:\n${trackingLink}`;
  message += '\n\nTu pedido comenzará a prepararse cuando confirmes que los datos se encuentran en orden.';

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

export default function OrdersPage() {
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ProductOrderRequest[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});
  const [companySlug, setCompanySlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handlePrintOrder = (order: ProductOrderRequest) => {
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión');
      return;
    }
    printWindow.document.write(buildComandaHtml(order, productsMap));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  useEffect(() => {
    if (firestoreUser?.company_id) {
      loadData();
    }
  }, [firestoreUser?.company_id]);

  const loadData = async () => {
    if (!firestoreUser?.company_id) return;
    try {
      setLoading(true);
      const [ordersData, products, company] = await Promise.all([
        getProductOrderRequests(firestoreUser.company_id),
        getProducts(firestoreUser.company_id),
        getCompany(firestoreUser.company_id),
      ]);
      setOrders(ordersData);
      setCompanySlug(company?.slug || null);
      setProductsMap(
        products.reduce<Record<string, Product>>((acc, product) => {
          acc[product.id] = product;
          return acc;
        }, {})
      );
    } catch (error) {
      handleError(error);
      toast.error('No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((o) => (o.status || 'REQUESTED') === statusFilter);
  }, [orders, statusFilter]);

  const handleStatusChange = async (orderId: string, next: OrderStatus | null) => {
    if (!next) return;
    try {
      setUpdatingId(orderId);
      const targetOrder = orders.find((order) => order.id === orderId);
      const currentStatus = targetOrder?.status || 'REQUESTED';
      if (currentStatus !== next) {
        await advanceProductOrderStatus(orderId, currentStatus, next);
      } else {
        await updateProductOrderRequest(orderId, { status: next });
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: next,
                status_history: [
                  ...(o.status_history || []),
                  { from: currentStatus || null, to: next, created_at: new Date() },
                ],
              }
            : o
        )
      );

      if (targetOrder && next === 'CONFIRMED' && companySlug) {
        const trackingLink = `https://www.pymerp.cl/${companySlug}/tracking/${orderId}`;
        const whatsappUrl = buildOrderStatusWhatsAppUrl({ ...targetOrder, status: next }, productsMap, trackingLink);
        if (whatsappUrl) {
          const shouldSend = window.confirm('¿Enviar WhatsApp al cliente con el link de seguimiento?');
          if (shouldSend) {
            window.open(whatsappUrl, '_blank');
          }
        }
      }
      toast.success(`Estado cambiado a ${STATUS_LABELS[next] || next}`);
    } catch (error) {
      handleError(error);
      toast.error('No se pudo actualizar el estado');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 text-black">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-black">Pedidos</p>
          <h1 className="text-2xl font-bold text-black">Gestión de pedidos</h1>
          <p className="text-sm text-black">
            Incluye pedidos ingresados desde el menú y los capturados por WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-md border border-slate-200 bg-white text-black text-sm font-semibold hover:bg-slate-50"
          >
            Volver al dashboard
          </button>
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            Recargar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['ALL', 'REQUESTED', 'CONFIRMED', 'PREPARING', 'DELIVERED', 'PAID', 'CANCELLED'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              statusFilter === status
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                : 'bg-white text-black border-slate-200'
            }`}
          >
            {status === 'ALL' ? 'Todos' : STATUS_LABELS[status] || status}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-black">
          No hay pedidos en esta categoría.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = order.status || 'REQUESTED';
            const nextStatus = NEXT_STATUS[status] || null;
            return (
              <div
                key={order.id}
                className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col gap-3 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-black">
                      Creado: {order.created_at ? new Date(order.created_at).toLocaleString() : '-'}
                    </p>
                    <p className="text-lg font-semibold text-black">Pedido #{order.id.slice(-6)}</p>
                    <p className="text-sm text-black">
                      Mesa: {order.table_number || 'N/D'} • Tipo: {order.order_type || 'TABLE'} • Canal:{' '}
                      {order.channel || 'WHATSAPP'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintOrder(order)}
                      className="px-3 py-2 rounded-md bg-slate-100 text-slate-900 text-xs font-semibold hover:bg-slate-200"
                    >
                      Imprimir
                    </button>
                    <button
                      type="button"
                      disabled={!companySlug}
                      onClick={() => {
                        if (!companySlug) return;
                        const trackingLink = `https://www.pymerp.cl/${companySlug}/tracking/${order.id}`;
                        window.open(trackingLink, '_blank');
                      }}
                      className="px-3 py-2 rounded-md border border-slate-200 bg-white text-black text-xs font-semibold hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Ver tracking
                    </button>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        STATUS_COLORS[status] || 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100'
                      }`}
                    >
                      {STATUS_LABELS[status] || status}
                    </span>
                    {nextStatus && (
                      <button
                        type="button"
                        disabled={updatingId === order.id}
                        onClick={() => handleStatusChange(order.id, nextStatus)}
                        className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Avanzar a {STATUS_LABELS[nextStatus] || nextStatus}
                      </button>
                    )}
                    {status !== 'CANCELLED' && status !== 'PAID' && (
                      <button
                        type="button"
                        disabled={updatingId === order.id}
                        onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                        className="px-3 py-2 rounded-md bg-red-50 text-red-800 text-xs font-semibold border border-red-200 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-red-500/15 dark:text-red-100 dark:border-red-500/30 dark:hover:bg-red-500/20"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="space-y-1">
                    <p className="font-semibold text-black">Cliente</p>
                    <p className="text-black">{order.client_name || 'Sin nombre'}</p>
                    {order.client_whatsapp && <p className="text-black">📱 {order.client_whatsapp}</p>}
                    {order.client_comment && <p className="text-black">📝 {order.client_comment}</p>}
                  </div>
                  <div className="space-y-1 flex-1 min-w-[240px]">
                    <p className="font-semibold text-black">Productos</p>
                    <ul className="list-disc list-inside text-black space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.quantity}x {productsMap[item.product_id]?.name || item.product_id}{' '}
                          {item.unit_price ? <span className="text-black">- ${item.unit_price.toLocaleString()}</span> : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {!order.total_estimated ? null : (
                    <div className="space-y-1">
                      <p className="font-semibold text-black">Total estimado</p>
                      <p className="text-lg font-bold text-black">${order.total_estimated.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
