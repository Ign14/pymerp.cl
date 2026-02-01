import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { ProductKind } from '../../../../services/gastroProducts';
import {
  getCatalogProductState,
  listCatalogs,
  setCatalogProductAvailability,
  upsertCatalogProductPrice,
  upsertVariantPrices,
  type ApiErrorPayload,
  type CatalogProductStateResponse,
  type CatalogResponse,
  type CatalogProductUpsertRequest,
  type VariantPriceItemRequest,
  type VariantResponse,
} from '../../../../services/gastroProducts';

const DEFAULT_CURRENCY = 'CLP';

export interface PublicationPanelProps {
  productId: string;
  productKind: ProductKind;
  variants: VariantResponse[];
  companyId: string;
  onError?: (message: string, traceId?: string) => void;
}

interface RowState {
  catalog: CatalogResponse;
  state: CatalogProductStateResponse | null;
  basePrice: string;
  currency: string;
  available: boolean;
  variantPrices: Record<string, string>;
  saving: boolean;
  error: string | null;
}

function parseDecimal(value: string): number | null {
  if (value === '' || value == null) return null;
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function isValidPrice(n: number | null): boolean {
  return n != null && n > 0;
}

function isValidCurrency(s: string): boolean {
  return /^[A-Z]{3}$/.test(s.trim());
}

export default function PublicationPanel({
  productId,
  productKind,
  variants,
  companyId,
  onError,
}: PublicationPanelProps) {
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<{ message: string; traceId?: string } | null>(null);
  const [rows, setRows] = useState<RowState[]>([]);

  const load = useCallback(async () => {
    if (!companyId || !productId) return;
    setLoading(true);
    setErrorBanner(null);
    try {
      const [catalogList, productStates] = await Promise.all([
        listCatalogs(companyId),
        getCatalogProductState(productId, companyId),
      ]);
      const byId: Record<string, CatalogProductStateResponse> = {};
      productStates.forEach((s) => {
        byId[s.catalogId] = s;
      });
      const nextRows: RowState[] = catalogList
        .filter((c) => c.active)
        .map((catalog) => {
          const state = byId[catalog.id] ?? null;
          const variantPrices: Record<string, string> = {};
          if (state?.variantPrices) {
            state.variantPrices.forEach((vp) => {
              variantPrices[vp.variantId] = String(vp.price);
            });
          }
          variants.forEach((v) => {
            if (variantPrices[v.id] === undefined) variantPrices[v.id] = '';
          });
          return {
            catalog,
            state,
            basePrice: state?.basePrice != null ? String(state.basePrice) : '',
            currency: state?.currency ?? DEFAULT_CURRENCY,
            available: state?.available ?? false,
            variantPrices,
            saving: false,
            error: null,
          };
        });
      setRows(nextRows);
    } catch (err) {
      const payload = err as ApiErrorPayload;
      setErrorBanner({
        message: payload.message || 'Error al cargar catálogos y publicación',
        traceId: payload.traceId,
      });
      onError?.(payload.message, payload.traceId);
    } finally {
      setLoading(false);
    }
  }, [companyId, productId, variants, onError]);

  useEffect(() => {
    load();
  }, [load]);

  const updateRow = useCallback((catalogId: string, patch: Partial<RowState>) => {
    setRows((prev) =>
      prev.map((r) =>
        r.catalog.id === catalogId ? { ...r, ...patch } : r
      )
    );
  }, []);

  const validateRow = useCallback(
    (row: RowState): string | null => {
      const hasVariantPrices = variants.length > 0 && variants.some((v) => {
        const p = parseDecimal(row.variantPrices[v.id]);
        return p != null && p > 0;
      });
      if (productKind === 'SIMPLE' || productKind === 'COMBO') {
        const base = parseDecimal(row.basePrice);
        if (!isValidPrice(base)) return 'Falta precio para publicar';
        if (!isValidCurrency(row.currency)) return 'Moneda requerida (ISO 4217)';
        return null;
      }
      if (productKind === 'CONFIGURABLE') {
        if (hasVariantPrices) {
          if (row.basePrice.trim() !== '') return 'Si hay precios por variante, el precio base debe estar vacío';
          if (!isValidCurrency(row.currency)) return 'Moneda requerida (ISO 4217)';
          const allSet = variants.every((v) => {
            const p = parseDecimal(row.variantPrices[v.id]);
            return p != null && p > 0;
          });
          if (!allSet && variants.length > 0) return 'Falta precio para alguna variante';
          return null;
        }
        const base = parseDecimal(row.basePrice);
        if (!isValidPrice(base)) return 'Falta precio para publicar';
        if (!isValidCurrency(row.currency)) return 'Moneda requerida (ISO 4217)';
        return null;
      }
      return null;
    },
    [productKind, variants]
  );

  const handleSaveRow = useCallback(
    async (row: RowState) => {
      if (!companyId || !productId) return;
      const validation = validateRow(row);
      if (validation) {
        updateRow(row.catalog.id, { error: validation });
        return;
      }
      updateRow(row.catalog.id, { saving: true, error: null });
      setErrorBanner(null);
      try {
        const hasVariantPrices =
          productKind === 'CONFIGURABLE' &&
          variants.some((v) => {
            const p = parseDecimal(row.variantPrices[v.id]);
            return p != null && p > 0;
          });

        if (hasVariantPrices && variants.length > 0) {
          const items: VariantPriceItemRequest[] = variants
            .map((v) => {
              const p = parseDecimal(row.variantPrices[v.id]);
              if (p == null || p <= 0) return null;
              return {
                variantId: v.id,
                price: p,
                currency: row.currency.trim(),
              };
            })
            .filter((x): x is VariantPriceItemRequest => x != null);
          if (items.length > 0) {
            await upsertVariantPrices(
              {
                catalogId: row.catalog.id,
                productId,
                variantPrices: items,
              },
              companyId
            );
          }
        }

        const payload: CatalogProductUpsertRequest = {
          basePrice: hasVariantPrices ? null : (parseDecimal(row.basePrice) ?? null),
          currency: row.currency.trim(),
          sortOrder: 0,
          available: row.available,
        };
        if (payload.basePrice === undefined && !hasVariantPrices) {
          payload.basePrice = parseDecimal(row.basePrice);
        }
        await upsertCatalogProductPrice(
          row.catalog.id,
          productId,
          payload,
          companyId
        );
        toast.success('Publicación guardada');
        await load();
      } catch (err) {
        const payload = err as ApiErrorPayload;
        setErrorBanner({
          message: payload.message || 'Error al guardar',
          traceId: payload.traceId,
        });
        updateRow(row.catalog.id, {
          saving: false,
          error: payload.message || 'Error al guardar',
        });
        onError?.(payload.message, payload.traceId);
      } finally {
        updateRow(row.catalog.id, { saving: false });
      }
    },
    [
      companyId,
      productId,
      productKind,
      variants,
      validateRow,
      updateRow,
      load,
      onError,
    ]
  );

  const handleToggleAvailability = useCallback(
    async (row: RowState, nextAvailable: boolean) => {
      if (!row.state?.catalogProductId) return;
      if (!companyId) return;
      updateRow(row.catalog.id, { saving: true, error: null });
      setErrorBanner(null);
      try {
        await setCatalogProductAvailability(
          row.state.catalogProductId,
          nextAvailable,
          companyId
        );
        updateRow(row.catalog.id, { available: nextAvailable });
        toast.success(nextAvailable ? 'Disponible' : 'No disponible');
        await load();
      } catch (err) {
        const payload = err as ApiErrorPayload;
        setErrorBanner({
          message: payload.message || 'Error al actualizar disponibilidad',
          traceId: payload.traceId,
        });
        onError?.(payload.message, payload.traceId);
      } finally {
        updateRow(row.catalog.id, { saving: false });
      }
    },
    [companyId, updateRow, load, onError]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 w-48 rounded bg-gray-200" />
        <div className="animate-pulse h-32 w-full rounded bg-gray-100" />
        <div className="animate-pulse h-32 w-full rounded bg-gray-100" />
      </div>
    );
  }

  const isConfigurableWithVariants = productKind === 'CONFIGURABLE' && variants.length > 0;

  return (
    <div className="space-y-6">
      {errorBanner && (
        <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm font-semibold">{errorBanner.message}</p>
          {errorBanner.traceId && (
            <p className="text-xs mt-1 text-red-500">traceId: {errorBanner.traceId}</p>
          )}
        </div>
      )}

      <p className="text-sm text-gray-500">
        Publicado = producto en el catálogo (upsert). Disponible = visible para venta (is_available). Al publicar exige precio válido según política.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Catálogo
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Publicado
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Disponible
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Precio base
              </th>
              {isConfigurableWithVariants && (
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Precio por variante
                </th>
              )}
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row) => {
              const hasVariantPrices =
                productKind === 'CONFIGURABLE' &&
                variants.some((v) => {
                  const p = parseDecimal(row.variantPrices[v.id]);
                  return p != null && p > 0;
                });
              const statusOk =
                row.state != null &&
                (hasVariantPrices
                  ? row.basePrice.trim() === '' && isValidCurrency(row.currency)
                  : isValidPrice(parseDecimal(row.basePrice)) && isValidCurrency(row.currency));
              return (
                <tr key={row.catalog.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium text-gray-900">{row.catalog.name}</span>
                    <span className="text-gray-500 block text-xs">
                      Business unit: {row.catalog.businessUnitId.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {row.state ? (
                      <span className="text-gray-900">Sí</span>
                    ) : (
                      <span className="text-gray-500">No publicado</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.state ? (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={row.available}
                          disabled={row.saving}
                          onChange={(e) =>
                            handleToggleAvailability(row, e.target.checked)
                          }
                          className="rounded border-gray-300"
                          aria-label="Disponible para venta"
                        />
                        <span className="text-sm">
                          {row.available ? 'Sí' : 'No disponible'}
                        </span>
                      </label>
                    ) : (
                      <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
                        <input
                          type="checkbox"
                          checked={false}
                          disabled
                          readOnly
                          className="rounded border-gray-300"
                          aria-label="Disponible (requiere publicar antes)"
                        />
                        <span className="text-sm text-gray-400">—</span>
                      </label>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.basePrice}
                      disabled={hasVariantPrices}
                      placeholder={hasVariantPrices ? '—' : '0.00'}
                      onChange={(e) =>
                        updateRow(row.catalog.id, { basePrice: e.target.value })
                      }
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                    />
                    <span className="ml-1 text-xs text-gray-500">{row.currency}</span>
                  </td>
                  {isConfigurableWithVariants && (
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {variants.map((v) => (
                          <div key={v.id} className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-24 truncate">
                              {v.name}
                            </span>
                            <input
                              type="text"
                              value={row.variantPrices[v.id] ?? ''}
                              onChange={(e) =>
                                updateRow(row.catalog.id, {
                                  variantPrices: {
                                    ...row.variantPrices,
                                    [v.id]: e.target.value,
                                  },
                                })
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {statusOk ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        ok
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        pendiente precio
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.error && (
                      <p className="text-xs text-red-600 mb-1">{row.error}</p>
                    )}
                    <button
                      type="button"
                      disabled={row.saving}
                      onClick={() => handleSaveRow(row)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {row.saving
                        ? 'Guardando…'
                        : row.state
                          ? 'Guardar publicación'
                          : 'Publicar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="border border-gray-200 rounded-md p-4 text-sm text-gray-500">
          No hay catálogos activos. Crea un catálogo desde la configuración para publicar productos.
        </div>
      )}
    </div>
  );
}
