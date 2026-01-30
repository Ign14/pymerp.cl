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

export interface OrderDetailResponse {
  id: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  total: number;
  currency: string;
  items: OrderDetailItemResponse[];
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

const buildHeaders = (companyId: string) => ({
  'Content-Type': 'application/json',
  'X-Company-Id': companyId,
});

const parseApiError = async (response: Response): Promise<ApiErrorPayload> => {
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (payload && typeof payload === 'object') {
    return {
      message: payload.message || 'Error en el servidor',
      traceId: payload.traceId,
      details: payload.details,
      status: response.status,
    };
  }
  return { message: 'Error en el servidor', status: response.status };
};

const handleJson = async <T>(response: Response): Promise<T> => {
  if (response.ok) {
    return response.json();
  }
  throw await parseApiError(response);
};

export const listBusinessUnits = async (companyId: string): Promise<BusinessUnitResponse[]> => {
  const response = await fetch('/api/business-units', {
    method: 'GET',
    headers: buildHeaders(companyId),
  });
  return handleJson<BusinessUnitResponse[]>(response);
};

export const listOrders = async (
  companyId: string,
  params: {
    businessUnitId: string;
    status?: OrderStatus | '' | null;
    from?: string | null;
    to?: string | null;
    page?: number;
    size?: number;
  }
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

  const response = await fetch(`/gastro/orders?${qs.toString()}`, {
    method: 'GET',
    headers: buildHeaders(companyId),
  });
  return handleJson<PageResponse<OrderListItemResponse>>(response);
};

export const getOrderDetail = async (companyId: string, id: string): Promise<OrderDetailResponse> => {
  const response = await fetch(`/gastro/orders/${id}`, {
    method: 'GET',
    headers: buildHeaders(companyId),
  });
  return handleJson<OrderDetailResponse>(response);
};

export const placeOrder = async (companyId: string, id: string): Promise<OrderPlaceResponse> => {
  const response = await fetch(`/gastro/orders/${id}/place`, {
    method: 'POST',
    headers: buildHeaders(companyId),
  });
  return handleJson<OrderPlaceResponse>(response);
};

export const cancelOrder = async (companyId: string, id: string): Promise<OrderCancelResponse> => {
  const response = await fetch(`/gastro/orders/${id}/cancel`, {
    method: 'POST',
    headers: buildHeaders(companyId),
  });
  return handleJson<OrderCancelResponse>(response);
};

export const startOrder = async (companyId: string, id: string): Promise<OrderStartResponse> => {
  const response = await fetch(`/gastro/orders/${id}/start`, {
    method: 'POST',
    headers: buildHeaders(companyId),
  });
  return handleJson<OrderStartResponse>(response);
};

export const completeOrder = async (companyId: string, id: string): Promise<OrderCompleteResponse> => {
  const response = await fetch(`/gastro/orders/${id}/complete`, {
    method: 'POST',
    headers: buildHeaders(companyId),
  });
  return handleJson<OrderCompleteResponse>(response);
};
