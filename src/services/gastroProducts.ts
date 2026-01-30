export type ProductKind = 'SIMPLE' | 'CONFIGURABLE' | 'COMBO';

export interface ProductSummaryResponse {
  id: string;
  skuInternal?: string | null;
  name: string;
  description?: string | null;
  productKind: ProductKind;
  taxCategory?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VariantResponse {
  id: string;
  name: string;
  skuInternal?: string | null;
  active: boolean;
}

export interface ModifierStepResponse {
  id: string;
  modifierGroupId: string;
  variantId?: string | null;
  stepOrder: number;
  minSelection: number;
  maxSelection: number;
  required: boolean;
}

export interface ModifierGroupResponse {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModifierItemResponse {
  id: string;
  name: string;
  priceDelta: number;
  active: boolean;
}

export interface ProductEditResponse {
  product: ProductSummaryResponse;
  variants: VariantResponse[];
  steps: ModifierStepResponse[];
  modifierGroups: ModifierGroupResponse[];
  modifierItems: ModifierItemResponse[];
}

export interface ProductBaseRequest {
  skuInternal?: string | null;
  name: string;
  description?: string | null;
  productKind: ProductKind;
  taxCategory?: string | null;
  isActive?: boolean;
}

export interface ModifierStepUpsertRequest {
  id?: string | null;
  modifierGroupId: string;
  stepOrder: number;
  minSelection: number;
  maxSelection: number;
  isRequired?: boolean;
}

export interface ModifierStepBulkRequest {
  variantId?: string | null;
  steps: ModifierStepUpsertRequest[];
}

export interface ApiErrorPayload {
  message: string;
  traceId?: string;
  details?: Array<{ field?: string; issue?: string }>;
  status?: number;
}

// Publication (MVP3) types
export interface CatalogResponse {
  id: string;
  businessUnitId: string;
  salesChannelId: string;
  orderModeId: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VariantPriceItemResponse {
  variantId: string;
  variantName: string;
  price: number;
  currency: string;
}

export interface CatalogProductStateResponse {
  catalogProductId: string;
  catalogId: string;
  catalogName: string;
  businessUnitId: string;
  basePrice: number | null;
  currency: string;
  sortOrder: number;
  available: boolean;
  variantPrices: VariantPriceItemResponse[];
}

export interface CatalogProductUpsertRequest {
  basePrice: number | null;
  currency: string;
  sortOrder?: number;
  available?: boolean;
}

export interface CatalogProductResponse {
  id: string;
  catalogId: string;
  productId: string;
  basePrice: number | null;
  currency: string;
  sortOrder: number;
  available: boolean;
}

export interface VariantPriceItemRequest {
  variantId: string;
  price: number;
  currency: string;
}

export interface VariantPriceBulkRequest {
  catalogId: string;
  productId: string;
  variantPrices: VariantPriceItemRequest[];
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

export const getProductEdit = async (id: string, companyId: string): Promise<ProductEditResponse> => {
  const response = await fetch(`/gastro/products/${id}/edit`, {
    method: 'GET',
    headers: buildHeaders(companyId),
  });
  return handleJson<ProductEditResponse>(response);
};

export const updateProductBase = async (
  id: string,
  payload: ProductBaseRequest,
  companyId: string
): Promise<ProductSummaryResponse> => {
  const response = await fetch(`/gastro/products/${id}`, {
    method: 'PUT',
    headers: buildHeaders(companyId),
    body: JSON.stringify(payload),
  });
  return handleJson<ProductSummaryResponse>(response);
};

export const createProduct = async (
  payload: ProductBaseRequest & { modifierSteps?: ModifierStepUpsertRequest[] },
  companyId: string
): Promise<ProductSummaryResponse> => {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: buildHeaders(companyId),
    body: JSON.stringify(payload),
  });
  return handleJson<ProductSummaryResponse>(response);
};

export const saveProductSteps = async (
  productId: string,
  payload: ModifierStepBulkRequest,
  companyId: string
): Promise<ModifierStepResponse[]> => {
  const response = await fetch(`/gastro/products/${productId}/steps`, {
    method: 'PUT',
    headers: buildHeaders(companyId),
    body: JSON.stringify(payload),
  });
  return handleJson<ModifierStepResponse[]>(response);
};

export const searchModifierGroups = async (
  query: string,
  companyId: string
): Promise<ModifierGroupResponse[]> => {
  const params = new URLSearchParams();
  if (query) {
    params.set('query', query);
  }
  const response = await fetch(`/gastro/modifier-groups?${params.toString()}`, {
    method: 'GET',
    headers: buildHeaders(companyId),
  });
  return handleJson<ModifierGroupResponse[]>(response);
};

export const getModifierGroupItems = async (
  groupId: string,
  companyId: string
): Promise<ModifierItemResponse[]> => {
  const response = await fetch(`/gastro/modifier-groups/${groupId}/items`, {
    method: 'GET',
    headers: buildHeaders(companyId),
  });
  return handleJson<ModifierItemResponse[]>(response);
};

// Publication (MVP3) API
export const listCatalogs = async (
  companyId: string,
  businessUnitId?: string | null
): Promise<CatalogResponse[]> => {
  const params = new URLSearchParams();
  if (businessUnitId) {
    params.set('businessUnitId', businessUnitId);
  }
  const qs = params.toString();
  const url = `/gastro/catalogs${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(companyId),
  });
  return handleJson<CatalogResponse[]>(response);
};

export const getCatalogProductState = async (
  productId: string,
  companyId: string
): Promise<CatalogProductStateResponse[]> => {
  const response = await fetch(
    `/gastro/catalog-products?productId=${encodeURIComponent(productId)}`,
    {
      method: 'GET',
      headers: buildHeaders(companyId),
    }
  );
  return handleJson<CatalogProductStateResponse[]>(response);
};

export const upsertCatalogProductPrice = async (
  catalogId: string,
  productId: string,
  payload: CatalogProductUpsertRequest,
  companyId: string
): Promise<CatalogProductResponse> => {
  const response = await fetch(
    `/gastro/catalog-products/${catalogId}/product/${productId}`,
    {
      method: 'PUT',
      headers: buildHeaders(companyId),
      body: JSON.stringify({
        basePrice: payload.basePrice,
        currency: payload.currency,
        sortOrder: payload.sortOrder ?? 0,
        available: payload.available ?? true,
      }),
    }
  );
  return handleJson<CatalogProductResponse>(response);
};

export const setCatalogProductAvailability = async (
  catalogProductId: string,
  isAvailable: boolean,
  companyId: string
): Promise<CatalogProductResponse> => {
  const response = await fetch(
    `/gastro/catalog-products/${catalogProductId}/availability`,
    {
      method: 'PATCH',
      headers: buildHeaders(companyId),
      body: JSON.stringify({ isAvailable }),
    }
  );
  return handleJson<CatalogProductResponse>(response);
};

export const upsertVariantPrices = async (
  payload: VariantPriceBulkRequest,
  companyId: string
): Promise<void> => {
  const response = await fetch('/gastro/variant-prices', {
    method: 'PUT',
    headers: buildHeaders(companyId),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
};
