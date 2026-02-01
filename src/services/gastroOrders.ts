import { auth } from '../config/firebase';

export type OrderStatus = 'DRAFT' | 'PLACED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ApiErrorPayload {
  message: string;
  traceId?: string;
  details?: Array<{ field?: string; issue?: string }>;
  status?: number;
}

export interface BusinessUnitResponse {
  id: string;
  name: string;
  type: string;
  timezone: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderListItemResponse {
  id: string;
  status: OrderStatus;
  createdAt: string;
  total: number;
  currency: string;
  itemsCount: number;
  /** Optional fields when returned by API (e.g. for export) */
  customerName?: string | null;
  deliveryType?: string | null;
}

export interface OrderDetailModifierResponse {
  id: string;
  modifierGroupId: string;
  modifierItemId: string;
  modifierGroupName: string;
  modifierItemName: string;
  priceDeltaSnapshot: number;
  quantity: number;
}

export interface OrderDetailItemResponse {
  id: string;
  productId: string;
  variantId?: string | null;
  productNameSnapshot: string;
  variantNameSnapshot?: string | null;
  unitPriceSnapshot: number;
  modifiersTotalSnapshot: number;
  quantity: number;
  subtotalSnapshot: number;
  modifiers: OrderDetailModifierResponse[];
}

/** Optional timeline event from backend; if absent, UI derives from status + createdAt/updatedAt */
export interface OrderTimelineEventResponse {
  status: OrderStatus;
  at: string;
  by?: string | null;
  comment?: string | null;
}

export interface OrderDetailResponse {
  id: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  total: number;
  currency: string;
  items: OrderDetailItemResponse[];
  /** Optional; when present, used for timeline instead of derived events */
  events?: OrderTimelineEventResponse[] | null;
}

export interface OrderPlaceResponse {
  id: string;
  status: OrderStatus;
  total: number;
  currency: string;
  updatedAt: string;
}

export interface OrderCancelResponse {
  id: string;
  status: OrderStatus;
  updatedAt: string;
}

export interface OrderStartResponse {
  id: string;
  status: OrderStatus;
  updatedAt: string;
}

export interface OrderCompleteResponse {
  id: string;
  status: OrderStatus;
  updatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const buildHeaders = async (companyId: string) => {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  return {
    'Content-Type': 'application/json',
    'X-Company-Id': companyId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const API_BASE_URL = (() => {
  const fromEnv = (import.meta as any).env?.VITE_GASTRO_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.replace(/\/+$/, '');
  return '';
})();

const withBaseUrl = (path: string) => `${API_BASE_URL}${path}`;

const parseApiError = (payload: unknown, status: number): ApiErrorPayload => {
  if (payload && typeof payload === 'object' && payload !== null && 'message' in payload) {
    const p = payload as Record<string, unknown>;
    return {
      message: typeof p.message === 'string' ? p.message : 'Error en el servidor',
      traceId: typeof p.traceId === 'string' ? p.traceId : undefined,
      details: Array.isArray(p.details) ? (p.details as ApiErrorPayload['details']) : undefined,
      status,
    };
  }
  return { message: 'Error en el servidor', status };
};

const handleJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!response.ok) {
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }
    throw parseApiError(payload, response.status);
  }
  try {
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    throw {
      message: 'Respuesta inválida del servidor (no JSON). ¿Sesión expirada?',
      status: response.status,
    } satisfies ApiErrorPayload;
  }
};

export const listBusinessUnits = async (companyId: string): Promise<BusinessUnitResponse[]> => {
  const response = await fetch(withBaseUrl('/api/business-units'), {
    method: 'GET',
    headers: await buildHeaders(companyId),
  });
  return handleJson<BusinessUnitResponse[]>(response);
};

export interface ListOrdersParams {
  businessUnitId: string;
  status?: OrderStatus | '' | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  size?: number;
  /** Only used when QUERY_FILTER_MODE is 'backend' */
  q?: string | null;
}

export const listOrders = async (
  companyId: string,
  params: ListOrdersParams
): Promise<PageResponse<OrderListItemResponse>> => {
  const qs = new URLSearchParams();
  qs.set('businessUnitId', params.businessUnitId);
  if (params.status) {
    qs.set('status', params.status);
  }
  if (params.from) {
    qs.set('from', params.from);
  }
  if (params.to) {
    qs.set('to', params.to);
  }
  if (params.page !== undefined) {
    qs.set('page', String(params.page));
  }
  if (params.size !== undefined) {
    qs.set('size', String(params.size));
  }
  if (params.q != null && params.q !== '') {
    qs.set('q', params.q);
  }

  const response = await fetch(withBaseUrl(`/gastro/orders?${qs.toString()}`), {
    method: 'GET',
    headers: await buildHeaders(companyId),
  });
  return handleJson<PageResponse<OrderListItemResponse>>(response);
};

export const getOrderDetail = async (companyId: string, id: string): Promise<OrderDetailResponse> => {
  const response = await fetch(withBaseUrl(`/gastro/orders/${id}`), {
    method: 'GET',
    headers: await buildHeaders(companyId),
  });
  return handleJson<OrderDetailResponse>(response);
};

export const placeOrder = async (companyId: string, id: string): Promise<OrderPlaceResponse> => {
  const response = await fetch(withBaseUrl(`/gastro/orders/${id}/place`), {
    method: 'POST',
    headers: await buildHeaders(companyId),
  });
  return handleJson<OrderPlaceResponse>(response);
};

export const cancelOrder = async (companyId: string, id: string): Promise<OrderCancelResponse> => {
  const response = await fetch(withBaseUrl(`/gastro/orders/${id}/cancel`), {
    method: 'POST',
    headers: await buildHeaders(companyId),
  });
  return handleJson<OrderCancelResponse>(response);
};

export const startOrder = async (companyId: string, id: string): Promise<OrderStartResponse> => {
  const response = await fetch(withBaseUrl(`/gastro/orders/${id}/start`), {
    method: 'POST',
    headers: await buildHeaders(companyId),
  });
  return handleJson<OrderStartResponse>(response);
};

export const completeOrder = async (companyId: string, id: string): Promise<OrderCompleteResponse> => {
  const response = await fetch(withBaseUrl(`/gastro/orders/${id}/complete`), {
    method: 'POST',
    headers: await buildHeaders(companyId),
  });
  return handleJson<OrderCompleteResponse>(response);
};
