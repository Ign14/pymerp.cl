import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { logError, logEvent } from '../../../utils/logger';
import { QUERY_FILTER_MODE } from './ordersConfig';

const STATUS_OPTIONS: Array<{ value: '' | OrderStatus; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'PLACED', label: 'Confirmada' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

const TABS: Array<{ key: '' | OrderStatus; label: string }> = [
  { key: '', label: 'Todos' },
  { key: 'DRAFT', label: 'Borrador' },
  { key: 'PLACED', label: 'Confirmada' },
  { key: 'IN_PROGRESS', label: 'En progreso' },
  { key: 'COMPLETED', label: 'Completada' },
  { key: 'CANCELLED', label: 'Cancelada' },
];

const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['DRAFT', 'PLACED', 'IN_PROGRESS'];

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

const escapeCsv = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const sanitizeFilenamePart = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_');

const EXPORT_MAX_ROWS = 10000;
/** Umbral para pedir confirmación al exportar todo (volumen grande) */
const EXPORT_LARGE_CONFIRM_ROWS = 500;

const getStatusLabel = (status: OrderStatus) => status;

type OrdersExportPrefs = {
  csvSeparator: ',' | ';';
  queryFilterMode?: 'local' | 'backend';
};

const getPrefsKey = (companyId: string) => `ordersExportPrefs:${companyId}`;

const readPrefs = (companyId: string): OrdersExportPrefs | null => {
  try {
    const raw = localStorage.getItem(getPrefsKey(companyId));
    if (!raw) return null;
    return JSON.parse(raw) as OrdersExportPrefs;
  } catch {
    return null;
  }
};

const writePrefs = (companyId: string, prefs: OrdersExportPrefs) => {
  try {
    localStorage.setItem(getPrefsKey(companyId), JSON.stringify(prefs));
  } catch {
    // silent
  }
};

const parseIntSafe = (value: string | null, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeStatus = (value: string | null): OrderStatus | null => {
  if (!value) return null;
  if (value === 'DRAFT' || value === 'PLACED' || value === 'IN_PROGRESS' || value === 'COMPLETED' || value === 'CANCELLED') {
    return value;
  }
  return null;
};

const normalizeDate = (value: string | null): string | null => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

export default function OrdersInboxPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { firestoreUser } = useAuth();
  const companyId = firestoreUser?.company_id;

  const [businessUnits, setBusinessUnits] = useState<BusinessUnitResponse[]>([]);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [orders, setOrders] = useState<OrderListItemResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [csvSeparator, setCsvSeparator] = useState<',' | ';'>(',');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportAllLoading, setExportAllLoading] = useState(false);
  const [exportAllProgress, setExportAllProgress] = useState<{ page: number; totalPages: number } | null>(null);
  const [exportResult, setExportResult] = useState<{ rows: number; failedPages: number; truncated: boolean } | null>(null);
  const [exportErrors, setExportErrors] = useState<Array<{ page: number; message?: string }>>([]);
  const [showExportErrors, setShowExportErrors] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ ok: number; skipped: number; action: string } | null>(null);
  const [bulkErrors, setBulkErrors] = useState<Array<{ id: string; message?: string }>>([]);
  const [showBulkErrors, setShowBulkErrors] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{ message: string; traceId?: string } | null>(null);
  const intervalIdRef = useRef<number | ReturnType<typeof setInterval> | null>(null);
  const isFetchingRef = useRef(false);
  const pollIntervalMsRef = useRef(15000);
  const fetchOrdersRef = useRef<((showSpinner: boolean) => Promise<void>) | null>(null);
  const initializedRef = useRef(false);
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchTermRef = useRef('');
  const debouncedTermRef = useRef('');
  const exportCancelRef = useRef(false);
  const inboxLoadStartRef = useRef<number | null>(null);
  const pollingStartRef = useRef<number | null>(null);
  const canFetchOrders = Boolean(companyId && selectedBusinessUnit);

  const initialParams = useMemo(() => {
    return {
      businessUnitId: searchParams.get('businessUnitId') || '',
      status: normalizeStatus(searchParams.get('status')) || '',
      from: normalizeDate(searchParams.get('from')) || '',
      to: normalizeDate(searchParams.get('to')) || '',
      q: searchParams.get('q') || '',
      page: parseIntSafe(searchParams.get('page'), 0),
      size: parseIntSafe(searchParams.get('size'), 20),
    };
  }, [searchParams]);

  useEffect(() => {
    if (initializedRef.current) return;
    setSelectedBusinessUnit(initialParams.businessUnitId);
    setStatusFilter(initialParams.status as OrderStatus | '');
    setFromDate(initialParams.from);
    setToDate(initialParams.to);
    if (initialParams.q) {
      setSearchTerm(initialParams.q);
      setDebouncedTerm(initialParams.q);
    }
    setPage(initialParams.page);
    setSize(initialParams.size);
    initializedRef.current = true;
  }, [initialParams]);

  const paginationLabel = useMemo(() => {
    if (!totalPages) return 'Página 1';
    return `Página ${page + 1} de ${totalPages}`;
  }, [page, totalPages]);

  useEffect(() => {
    if (!companyId) return;
    const prefs = readPrefs(companyId);
    if (!prefs) return;
    if (prefs.csvSeparator === ',' || prefs.csvSeparator === ';') {
      setCsvSeparator(prefs.csvSeparator);
    }
  }, [companyId]);

  const businessUnitName = useMemo(() => {
    if (!selectedBusinessUnit) return '';
    return businessUnits.find((unit) => unit.id === selectedBusinessUnit)?.name || '';
  }, [businessUnits, selectedBusinessUnit]);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.has(order.id)),
    [orders, selectedIds]
  );
  const selectedCount = selectedOrders.length;
  const visibleOrders = useMemo(() => {
    if (QUERY_FILTER_MODE === 'backend') return orders;
    if (!debouncedTerm.trim()) return orders;
    const q = debouncedTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const hay = [
        order.id,
        order.status,
        order.currency,
        String(order.total ?? ''),
        String(order.itemsCount ?? ''),
        formatDateTime(order.createdAt),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, debouncedTerm]);

  const renderHighlighted = useCallback(
    (value: string) => {
      const query = debouncedTerm.trim();
      if (!query) return value;
      const lowerValue = value.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const matchIndex = lowerValue.indexOf(lowerQuery);
      if (matchIndex === -1) return value;
      const before = value.slice(0, matchIndex);
      const match = value.slice(matchIndex, matchIndex + query.length);
      const after = value.slice(matchIndex + query.length);
      return (
        <>
          {before}
          <mark className="bg-yellow-200 text-gray-900 rounded px-0.5">{match}</mark>
          {after}
        </>
      );
    },
    [debouncedTerm]
  );
  const selectedPlacedCount = useMemo(
    () => selectedOrders.filter((order) => order.status === 'PLACED').length,
    [selectedOrders]
  );
  const selectedInProgressCount = useMemo(
    () => selectedOrders.filter((order) => order.status === 'IN_PROGRESS').length,
    [selectedOrders]
  );
  const selectedDraftCount = useMemo(
    () => selectedOrders.filter((order) => order.status === 'DRAFT').length,
    [selectedOrders]
  );
  const pageIds = useMemo(() => visibleOrders.map((order) => order.id), [visibleOrders]);
  const selectedOnPageCount = useMemo(
    () => visibleOrders.reduce((acc, order) => acc + (selectedIds.has(order.id) ? 1 : 0), 0),
    [visibleOrders, selectedIds]
  );
  const pageTotalCount = visibleOrders.length;
  const allOnPageSelected = visibleOrders.length > 0 && selectedOnPageCount === visibleOrders.length;
  const someOnPageSelected =
    selectedOnPageCount > 0 && selectedOnPageCount < visibleOrders.length;

  const statusCounts = useMemo(
    () => ({
      ALL: orders.length,
      DRAFT: orders.filter((order) => order.status === 'DRAFT').length,
      PLACED: orders.filter((order) => order.status === 'PLACED').length,
      IN_PROGRESS: orders.filter((order) => order.status === 'IN_PROGRESS').length,
      COMPLETED: orders.filter((order) => order.status === 'COMPLETED').length,
      CANCELLED: orders.filter((order) => order.status === 'CANCELLED').length,
    }),
    [orders]
  );

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

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = someOnPageSelected;
  }, [someOnPageSelected]);

  useEffect(() => {
    if (orders.length === 0) {
      if (selectedIds.size === 0) return;
      setSelectedIds(new Set());
      return;
    }
    const allowedIds = new Set(orders.map((order) => order.id));
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (allowedIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [orders]);

  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    debouncedTermRef.current = debouncedTerm;
  }, [debouncedTerm]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || target.isContentEditable) {
          return;
        }
      }

      if (event.key === '/') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.key === 'Escape') {
        if (searchTermRef.current.trim() || debouncedTermRef.current.trim()) {
          setSearchTerm('');
          setDebouncedTerm('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => {
      window.clearTimeout(timer);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!initializedRef.current) return;
    setSearchTerm('');
    setDebouncedTerm('');
  }, [selectedBusinessUnit, statusFilter, fromDate, toDate]);

  const prevDebouncedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initializedRef.current || QUERY_FILTER_MODE !== 'backend') return;
    if (prevDebouncedRef.current === null) {
      prevDebouncedRef.current = debouncedTerm;
      return;
    }
    if (prevDebouncedRef.current !== debouncedTerm) {
      prevDebouncedRef.current = debouncedTerm;
      setPage(0);
    }
  }, [debouncedTerm]);

  const clearPolling = useCallback(() => {
    if (intervalIdRef.current) {
      if (pollingStartRef.current != null) {
        const duration = Math.round(performance.now() - pollingStartRef.current);
        logEvent({ event: 'orders.inbox.polling_duration_ms', duration_ms: duration });
        pollingStartRef.current = null;
      }
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleAllOnPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [allOnPageSelected, pageIds]);

  useEffect(() => {
    if (!initializedRef.current) return;
    clearSelection();
    setBulkResult(null);
    setBulkErrors([]);
    setShowBulkErrors(false);
    setCsvSeparator(',');
    setPage(0);
  }, [selectedBusinessUnit, statusFilter, fromDate, toDate, clearSelection]);

  const pollOnce = useCallback(async () => {
    if (!canFetchOrders) return;
    if (document.visibilityState !== 'visible') return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      await fetchOrdersRef.current?.(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [canFetchOrders]);

  const startPolling = useCallback(() => {
    clearPolling();
    if (!canFetchOrders) return;
    if (document.visibilityState !== 'visible') return;
    pollingStartRef.current = pollingStartRef.current ?? performance.now();
    intervalIdRef.current = window.setInterval(() => {
      void pollOnce();
    }, pollIntervalMsRef.current);
  }, [clearPolling, canFetchOrders, pollOnce]);

  const fetchOrders = useCallback(
    async (showSpinner: boolean) => {
      if (!companyId || !selectedBusinessUnit) return;
      if (showSpinner) {
        setLoading(true);
        inboxLoadStartRef.current = inboxLoadStartRef.current ?? performance.now();
      }
      setErrorBanner(null);

      const from = fromDate ? toIsoStart(fromDate) : null;
      const to = toDate ? toIsoEnd(toDate) : null;

      const trimmedQuery = QUERY_FILTER_MODE === 'backend' ? debouncedTerm.trim() || null : null;
      try {
        const data = await listOrders(companyId, {
          businessUnitId: selectedBusinessUnit,
          status: statusFilter,
          from,
          to,
          page,
          size,
          ...(trimmedQuery ? { q: trimmedQuery } : {}),
        });
        setOrders(data.content);
        setTotalPages(data.totalPages);

        if (showSpinner && inboxLoadStartRef.current != null) {
          const duration = Math.round(performance.now() - inboxLoadStartRef.current);
          logEvent({ event: 'orders.inbox.load_duration_ms', duration_ms: duration });
          inboxLoadStartRef.current = null;
        }

        const hasActiveOrders = data.content.some((order) =>
          ACTIVE_ORDER_STATUSES.includes(order.status)
        );
        const nextInterval = hasActiveOrders ? 5000 : 15000;
        if (pollIntervalMsRef.current !== nextInterval) {
          pollIntervalMsRef.current = nextInterval;
          startPolling();
        }
      } catch (err: unknown) {
        const apiError = err as ApiErrorPayload;
        logError('OrdersInbox.fetchOrders', err);
        setErrorBanner({ message: apiError.message, traceId: apiError.traceId });
        if (showSpinner) {
          inboxLoadStartRef.current = null;
          setOrders([]);
        }
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [companyId, selectedBusinessUnit, statusFilter, fromDate, toDate, page, size, debouncedTerm, startPolling]
  );

  useEffect(() => {
    fetchOrdersRef.current = fetchOrders;
  }, [fetchOrders]);

  useEffect(() => {
    void fetchOrders(true);
  }, [fetchOrders]);

  const searchString = searchParams.toString();

  const syncUrl = useCallback(() => {
    if (!initializedRef.current) return;
    const nextParams = new URLSearchParams();
    if (selectedBusinessUnit) nextParams.set('businessUnitId', selectedBusinessUnit);
    if (statusFilter) nextParams.set('status', statusFilter);
    if (fromDate) nextParams.set('from', fromDate);
    if (toDate) nextParams.set('to', toDate);
    if (debouncedTerm.trim()) {
      nextParams.set('q', debouncedTerm.trim());
    }
    nextParams.set('page', String(page));
    nextParams.set('size', String(size));

    const nextString = nextParams.toString();
    if (nextString !== searchString) {
      setSearchParams(nextParams);
    }
  }, [selectedBusinessUnit, statusFilter, fromDate, toDate, page, size, debouncedTerm, searchString, setSearchParams]);

  useEffect(() => {
    syncUrl();
  }, [syncUrl]);

  const runBulk = useCallback(
    async (action: 'start' | 'complete' | 'cancel') => {
      if (!companyId) return;
      clearPolling();
      setBulkLoading(true);
      setBulkResult(null);
      setBulkErrors([]);
      setShowBulkErrors(false);

      const eligible =
        action === 'start'
          ? selectedOrders.filter((order) => order.status === 'PLACED')
          : action === 'complete'
          ? selectedOrders.filter((order) => order.status === 'IN_PROGRESS')
          : selectedOrders.filter((order) => order.status === 'DRAFT');

      const skipped = selectedOrders.length - eligible.length;

      if (eligible.length === 0) {
        clearSelection();
        startPolling();
        setBulkLoading(false);
        return;
      }

      logEvent({
        event: 'orders.inbox.bulk_selections_count',
        selected_count: selectedOrders.length,
        eligible_count: eligible.length,
      });

      try {
        const results = await Promise.allSettled(
          eligible.map((order) => {
            if (action === 'start') return startOrder(companyId, order.id);
            if (action === 'complete') return completeOrder(companyId, order.id);
            return cancelOrder(companyId, order.id);
          })
        );

        const ok = results.filter((result) => result.status === 'fulfilled').length;
        const failed = results.filter((result) => result.status === 'rejected').length;
        const failedItems = results
          .map((result, index) => {
            if (result.status !== 'rejected') return null;
            const error = result.reason as ApiErrorPayload | Error | undefined;
            if (error) logError('OrdersInbox.runBulk', error);
            const message =
              error && typeof error === 'object' && 'message' in error
                ? String((error as ApiErrorPayload).message)
                : undefined;
            return { id: eligible[index].id, message };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);
        const actionLabel =
          action === 'start' ? 'iniciaron' : action === 'complete' ? 'completaron' : 'cancelaron';
        if (eligible.length > 0) {
          setBulkResult({ ok, skipped, action: actionLabel });
        }
        if (failed > 0) {
          setBulkErrors(failedItems);
        }

        await fetchOrders(false);
      } finally {
        clearSelection();
        startPolling();
        setBulkLoading(false);
      }
    },
    [clearPolling, selectedOrders, fetchOrders, startPolling, companyId, clearSelection]
  );

  const exportRows = useCallback((rows: OrderListItemResponse[]) => {
    if (rows.length === 0) return;

    const hasCustomerName = rows.some((order) => Boolean(order.customerName));
    const hasDeliveryType = rows.some((order) => Boolean(order.deliveryType));
    const includeBusinessUnit = Boolean(selectedBusinessUnit);
    const header = [
      'id',
      'status',
      'createdAt',
      'total',
      'currency',
      'itemsCount',
      ...(includeBusinessUnit ? ['businessUnitId'] : []),
      'statusLabel',
      ...(includeBusinessUnit ? ['businessUnitName'] : []),
      ...(hasCustomerName ? ['customerName'] : []),
      ...(hasDeliveryType ? ['deliveryType'] : []),
    ];

    const csvRows = [
      header.join(csvSeparator),
      ...rows.map((order) => {
        const row = [
          escapeCsv(order.id),
          escapeCsv(order.status),
          escapeCsv(formatDateTime(order.createdAt)),
          escapeCsv(order.total),
          escapeCsv(order.currency),
          escapeCsv(order.itemsCount),
          ...(includeBusinessUnit ? [escapeCsv(selectedBusinessUnit)] : []),
          escapeCsv(getStatusLabel(order.status)),
          ...(includeBusinessUnit ? [escapeCsv(businessUnitName)] : []),
          ...(hasCustomerName ? [escapeCsv(order.customerName ?? '')] : []),
          ...(hasDeliveryType ? [escapeCsv(order.deliveryType ?? '')] : []),
        ];
        return row.join(csvSeparator);
      }),
    ];

    const csv = csvRows.join('\n');
    const csvWithBom = `\ufeff${csv}`;
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    const suffixParts: string[] = [];
    if (selectedBusinessUnit) suffixParts.push(`bu-${sanitizeFilenamePart(selectedBusinessUnit)}`);
    if (statusFilter) suffixParts.push(`status-${sanitizeFilenamePart(statusFilter)}`);
    if (fromDate) suffixParts.push(`from-${sanitizeFilenamePart(fromDate)}`);
    if (toDate) suffixParts.push(`to-${sanitizeFilenamePart(toDate)}`);
    const trimmedQuery = debouncedTerm.trim();
    if (trimmedQuery) {
      const shortened = trimmedQuery.slice(0, 20);
      const qPrefix = QUERY_FILTER_MODE === 'local' ? 'q-local' : 'q';
      suffixParts.push(`${qPrefix}-${sanitizeFilenamePart(shortened)}`);
    }
    suffixParts.push(`page-${page + 1}`);
    suffixParts.push(`size-${size}`);
    const suffix = suffixParts.join('__');
    const filename = suffix ? `orders-${dateStamp}__${suffix}.csv` : `orders-${dateStamp}.csv`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [
    selectedBusinessUnit,
    businessUnitName,
    statusFilter,
    fromDate,
    toDate,
    debouncedTerm,
    page,
    size,
    csvSeparator,
  ]);

  const handleExportCsv = useCallback(() => {
    const mode = selectedCount > 0 ? 'selection' : 'page';
    logEvent({ event: 'orders.export.mode', mode });
    const rows = selectedCount > 0 ? selectedOrders : visibleOrders;
    exportRows(rows);
  }, [selectedCount, selectedOrders, visibleOrders, exportRows]);

  const fetchAllOrdersForExport = useCallback(async () => {
    if (!companyId || !selectedBusinessUnit) {
      return { rows: [] as OrderListItemResponse[], truncated: false, errors: [] as Array<{ page: number; message?: string }> };
    }

    const from = fromDate ? toIsoStart(fromDate) : null;
    const to = toDate ? toIsoEnd(toDate) : null;
    const trimmedQuery = debouncedTerm.trim();
    let pageIndex = 0;
    let allRows: OrderListItemResponse[] = [];
    let totalPages = 1;
    let truncated = false;
    const errors: Array<{ page: number; message?: string }> = [];

    exportCancelRef.current = false;

    do {
      if (exportCancelRef.current) throw new Error('EXPORT_CANCELLED');
      let response: { content: OrderListItemResponse[]; totalPages: number } | null = null;
      try {
        const params = {
          businessUnitId: selectedBusinessUnit,
          status: statusFilter,
          from,
          to,
          page: pageIndex,
          size,
          ...(QUERY_FILTER_MODE === 'backend' && trimmedQuery ? { q: trimmedQuery } : {}),
        };
        response = await listOrders(companyId, params);
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'EXPORT_CANCELLED') throw err;
        const message =
          err && typeof err === 'object' && 'message' in err ? String((err as ApiErrorPayload).message) : undefined;
        errors.push({ page: pageIndex + 1, message });
        if (!totalPages || totalPages <= pageIndex + 1) {
          break;
        }
        pageIndex += 1;
        continue;
      }

      allRows = allRows.concat(response.content);
      totalPages = response.totalPages;
      setExportAllProgress({ page: pageIndex + 1, totalPages });

      if (allRows.length >= EXPORT_MAX_ROWS) {
        allRows = allRows.slice(0, EXPORT_MAX_ROWS);
        truncated = true;
        break;
      }

      pageIndex += 1;
      await new Promise((resolve) => setTimeout(resolve, 0));
    } while (pageIndex < totalPages);

    return { rows: allRows, truncated, errors };
  }, [companyId, selectedBusinessUnit, statusFilter, fromDate, toDate, size, debouncedTerm]);

  const handleExportCsvAll = useCallback(async () => {
    if (exportAllLoading) return;
    if (selectedCount > 0) {
      logEvent({ event: 'orders.export.mode', mode: 'selection' });
      exportRows(selectedOrders);
      return;
    }
    if (!companyId || !selectedBusinessUnit) return;
    // Confirmación reforzada para exportar volúmenes grandes (todas las órdenes)
    if (
      totalPages > 1 ||
      (totalPages === 1 && orders.length >= EXPORT_LARGE_CONFIRM_ROWS)
    ) {
      const confirmed = window.confirm(
        `Se exportarán todas las órdenes que coincidan con los filtros (puede ser un volumen grande, máx. ${EXPORT_MAX_ROWS} filas). ¿Continuar?`
      );
      if (!confirmed) return;
    }
    logEvent({ event: 'orders.export.mode', mode: 'all' });
    clearPolling();
    setExportAllLoading(true);
    setErrorBanner(null);
    setExportResult(null);
    setExportErrors([]);
    setShowExportErrors(false);
    try {
      const result = await fetchAllOrdersForExport();
      if (result.truncated) {
        logEvent({ event: 'orders.export.truncated', rows: result.rows.length, limit: EXPORT_MAX_ROWS });
        logError('OrdersInbox.exportAll', new Error(`Export truncated at ${EXPORT_MAX_ROWS} rows`));
      }
      if (result.errors.length > 0) {
        result.errors.forEach((e) =>
          logError('OrdersInbox.exportAll.failedPage', new Error(`Page ${e.page}: ${e.message ?? 'unknown'}`))
        );
      }
      if (result.rows.length > 0) {
        exportRows(result.rows);
      }
      setExportResult({
        rows: result.rows.length,
        failedPages: result.errors.length,
        truncated: result.truncated,
      });
      if (result.errors.length > 0) {
        setExportErrors(result.errors);
      }
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'EXPORT_CANCELLED') {
          logEvent({ event: 'orders.export.cancelled' });
          logError('OrdersInbox.exportAll', new Error('Export cancelled by user'));
          setExportResult(null);
          setExportErrors([]);
          setShowExportErrors(false);
        } else {
          const apiError = err as ApiErrorPayload;
          logError('OrdersInbox.exportAll', err);
          setErrorBanner({ message: apiError.message, traceId: apiError.traceId });
        }
    } finally {
      setExportAllProgress(null);
      startPolling();
      setExportAllLoading(false);
    }
  }, [
    selectedCount,
    selectedOrders,
    exportRows,
    companyId,
    selectedBusinessUnit,
    fetchAllOrdersForExport,
    clearPolling,
    startPolling,
    exportAllLoading,
    totalPages,
    orders.length,
  ]);

  useEffect(() => {
    if (!canFetchOrders) {
      clearPolling();
      return;
    }
    startPolling();
    return clearPolling;
  }, [canFetchOrders, startPolling, clearPolling]);

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

  const handleOrderAction = useCallback(
    async (orderId: string, action: 'place' | 'cancel' | 'start' | 'complete') => {
      if (!companyId) return;
      clearPolling();
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
      } catch (err: unknown) {
        const apiError = err as ApiErrorPayload;
        logError('OrdersInbox.handleOrderAction', err);
        setErrorBanner({ message: apiError.message, traceId: apiError.traceId });
      } finally {
        setRowLoading((prev) => ({ ...prev, [orderId]: false }));
        startPolling();
      }
    },
    [companyId, clearPolling, fetchOrders, startPolling]
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
              <label htmlFor="orders-filter-business-unit" className="block text-xs font-medium text-gray-500 mb-1">Unidad de negocio</label>
              <select
                id="orders-filter-business-unit"
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
              <label htmlFor="orders-filter-status" className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
              <select
                id="orders-filter-status"
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
              <label htmlFor="orders-filter-from" className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <input
                id="orders-filter-from"
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
              <label htmlFor="orders-filter-to" className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <input
                id="orders-filter-to"
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

        <div className="flex flex-wrap gap-2 mb-4">
          {TABS.map((tab) => {
            const count =
              tab.key === ''
                ? statusCounts.ALL
                : statusCounts[tab.key as keyof typeof statusCounts];
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key || 'ALL'}
                type="button"
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                }`}
                aria-pressed={isActive}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(0);
                }}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <label htmlFor="orders-search" className="sr-only">Buscar en esta página</label>
            <input
              id="orders-search"
              type="text"
              ref={searchInputRef}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              placeholder={QUERY_FILTER_MODE === 'backend' ? 'Buscar en todas las órdenes…' : 'Buscar en esta página…'}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          {searchTerm && (
            <button
              type="button"
              className="px-3 py-2 rounded-md border border-gray-200 text-sm text-gray-600"
              onClick={() => setSearchTerm('')}
              aria-label="Limpiar búsqueda"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {(selectedCount > 0 || pageTotalCount > 0) && (
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-700 font-medium">
                {selectedCount} seleccionadas
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {selectedCount > 0 && (
                  <>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50"
                      disabled={bulkLoading || selectedPlacedCount === 0}
                      aria-disabled={bulkLoading || selectedPlacedCount === 0}
                      title={selectedPlacedCount === 0 ? 'Selecciona al menos una orden en estado Confirmada' : undefined}
                      onClick={() => runBulk('start')}
                    >
                      Iniciar seleccionadas
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50"
                      disabled={bulkLoading || selectedInProgressCount === 0}
                      aria-disabled={bulkLoading || selectedInProgressCount === 0}
                      title={selectedInProgressCount === 0 ? 'Selecciona al menos una orden en progreso' : undefined}
                      onClick={() => runBulk('complete')}
                    >
                      Completar seleccionadas
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-xs font-semibold disabled:opacity-50"
                      disabled={bulkLoading || selectedDraftCount === 0}
                      aria-disabled={bulkLoading || selectedDraftCount === 0}
                      title={selectedDraftCount === 0 ? 'Selecciona al menos una orden en estado Borrador' : undefined}
                      onClick={() => runBulk('cancel')}
                    >
                      Cancelar seleccionadas
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-50"
                      disabled={bulkLoading}
                      onClick={clearSelection}
                    >
                      Limpiar selección
                    </button>
                    {bulkResult && (
                      <span className="text-xs text-gray-500">
                        Se {bulkResult.action} {bulkResult.ok}, se omitieron {bulkResult.skipped} por estado
                      </span>
                    )}
                    {bulkErrors.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-500">Fallaron {bulkErrors.length}</span>
                        <button
                          type="button"
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                          onClick={() => setShowBulkErrors((prev) => !prev)}
                        >
                          {showBulkErrors ? 'Ocultar detalles' : 'Ver detalles'}
                        </button>
                      </div>
                    )}
                  </>
                )}
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-50"
                  disabled={
                    bulkLoading ||
                    exportAllLoading ||
                    (selectedCount === 0 && visibleOrders.length === 0)
                  }
                  aria-disabled={
                    bulkLoading ||
                    exportAllLoading ||
                    (selectedCount === 0 && visibleOrders.length === 0)
                  }
                  title={
                    selectedCount === 0 && visibleOrders.length === 0
                      ? 'No hay filas para exportar'
                      : undefined
                  }
                  onClick={handleExportCsv}
                >
                  Exportar CSV
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-50"
                  disabled={bulkLoading || exportAllLoading}
                  aria-disabled={bulkLoading || exportAllLoading}
                  onClick={() => void handleExportCsvAll()}
                >
                  {exportAllLoading ? 'Exportando…' : 'Exportar CSV (todo)'}
                </button>
                {exportAllProgress && (
                  <span className="text-xs text-gray-500">
                    Exportando página {exportAllProgress.page} / {exportAllProgress.totalPages}…
                  </span>
                )}
                {exportResult && (
                  <span className="text-xs text-gray-500" role="status" aria-live="polite">
                    {exportResult.rows === 0
                      ? 'No se exportaron filas.'
                      : `Exportadas ${exportResult.rows} filas${exportResult.truncated ? ` · Se truncó por límite (${EXPORT_MAX_ROWS})` : ''}${exportResult.failedPages > 0 ? ` · Fallaron ${exportResult.failedPages} páginas` : ''}`}
                  </span>
                )}
                {exportErrors.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                    onClick={() => setShowExportErrors((prev) => !prev)}
                  >
                    {showExportErrors ? 'Ocultar detalles' : 'Ver detalles'}
                  </button>
                )}
                {showExportErrors && exportErrors.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <ul className="list-disc list-inside space-y-1">
                      {exportErrors.slice(0, 5).map((item) => (
                        <li key={`page-${item.page}`}>
                          página {item.page}
                          {item.message ? ` — ${item.message}` : ''}
                        </li>
                      ))}
                    </ul>
                    {exportErrors.length > 5 && (
                      <div className="text-xs text-gray-500 mt-1">
                        +{exportErrors.length - 5} más
                      </div>
                    )}
                  </div>
                )}
                {exportAllLoading && (
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => {
                      exportCancelRef.current = true;
                    }}
                  >
                    Cancelar exportación
                  </button>
                )}
                {debouncedTerm.trim() && QUERY_FILTER_MODE === 'local' && (
                  <span className="text-xs text-gray-500" data-testid="search-local-warning">
                    La búsqueda por texto se aplica solo a la vista actual
                  </span>
                )}
                <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={csvSeparator === ';'}
                    onChange={(event) => {
                      const next = event.target.checked ? ';' : ',';
                      setCsvSeparator(next);
                      if (companyId) {
                        writePrefs(companyId, {
                          csvSeparator: next,
                          queryFilterMode: QUERY_FILTER_MODE,
                        });
                      }
                    }}
                  />
                  Separador ; (Excel)
                </label>
              </div>
              <div className="text-xs text-gray-500">
                En esta página: {selectedOnPageCount} / {pageTotalCount}
              </div>
              {showBulkErrors && bulkErrors.length > 0 && (
                <div className="text-xs text-gray-600">
                  <ul className="list-disc list-inside space-y-1">
                    {bulkErrors.slice(0, 5).map((item) => (
                      <li key={item.id}>
                        {item.id}
                        {item.message ? ` — ${item.message}` : ''}
                      </li>
                    ))}
                  </ul>
                  {bulkErrors.length > 5 && (
                    <div className="text-xs text-gray-500 mt-1">
                      +{bulkErrors.length - 5} más
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-3 w-12">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={allOnPageSelected}
                        onChange={toggleAllOnPage}
                        aria-label="Seleccionar todo (página actual)"
                        disabled={orders.length === 0}
                      />
                    </th>
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
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        {canFetchOrders
                          ? 'No hay órdenes que coincidan con los filtros.'
                          : 'Selecciona una unidad de negocio.'}
                      </td>
                    </tr>
                  ) : visibleOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No hay órdenes que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    visibleOrders.map((order) => (
                      <tr key={order.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={selectedIds.has(order.id)}
                            onChange={() => toggleRow(order.id)}
                            aria-label={`Seleccionar orden ${order.id}`}
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {renderHighlighted(formatDateTime(order.createdAt))}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            {renderHighlighted(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          {renderHighlighted(formatCurrency(order.total, order.currency))}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {renderHighlighted(order.currency)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {renderHighlighted(String(order.itemsCount))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {order.status === 'DRAFT' && (
                              <>
                                <button
                                  type="button"
                                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold disabled:opacity-60"
                                  disabled={rowLoading[order.id]}
                                  aria-disabled={rowLoading[order.id]}
                                  onClick={() => handleOrderAction(order.id, 'place')}
                                >
                                  {rowLoading[order.id] ? 'Procesando...' : 'Confirmar'}
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-700 disabled:opacity-60"
                                  disabled={rowLoading[order.id]}
                                  aria-disabled={rowLoading[order.id]}
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
                                aria-disabled={rowLoading[order.id]}
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
                                aria-disabled={rowLoading[order.id]}
                                onClick={() => handleOrderAction(order.id, 'complete')}
                              >
                                {rowLoading[order.id] ? 'Procesando...' : 'Completar'}
                              </button>
                            )}
                            <button
                              type="button"
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                              onClick={() => {
                                const query = searchParams.toString();
                                const returnTo = `/dashboard/orders${query ? `?${query}` : ''}`;
                                navigate(
                                  `/dashboard/orders/${order.id}?returnTo=${encodeURIComponent(returnTo)}`
                                );
                              }}
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
              aria-disabled={page <= 0}
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            >
              Anterior
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-md border border-gray-200 text-sm disabled:opacity-50"
              disabled={page + 1 >= totalPages}
              aria-disabled={page + 1 >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Siguiente
            </button>
            <label htmlFor="orders-page-size" className="sr-only">Filas por página</label>
            <select
              id="orders-page-size"
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
