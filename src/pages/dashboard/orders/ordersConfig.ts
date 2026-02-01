type OrdersQueryFilterMode = 'local' | 'backend';

const rawMode = (import.meta.env.VITE_ORDERS_QUERY_FILTER_MODE || '').toString().toLowerCase();

export const QUERY_FILTER_MODE: OrdersQueryFilterMode =
  rawMode === 'backend' ? 'backend' : 'local';
