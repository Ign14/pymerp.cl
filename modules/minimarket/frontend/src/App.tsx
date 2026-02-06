import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  doc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { getSession, getStoredToken, clearSession } from './auth';
import { getCompanyIdBySlug } from './firestore-helpers';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SupplyHomePage from './pages/SupplyHomePage';

const API_BASE = import.meta.env.VITE_MINIMARKET_API || 'http://localhost:8088';
const POS_QUEUE_KEY = 'pymerp_minimarket_pos_queue';
const TOKEN_KEY = 'pymerp_minimarket_token';
const USE_FIRESTORE =
  typeof import.meta.env.VITE_MINIMARKET_USE_FIRESTORE === 'string'
    ? import.meta.env.VITE_MINIMARKET_USE_FIRESTORE === 'true'
    : Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const FIRESTORE_COMPANY_ID = import.meta.env.VITE_MINIMARKET_COMPANY_ID || null;
const FIRESTORE_COMPANY_SLUG = import.meta.env.VITE_MINIMARKET_COMPANY_SLUG || 'demo23';

type Product = {
  id: string;
  categoryId: string | null;
  sku?: string | null;
  barcode?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  price: number;
  cost: number;
  visibleWeb: boolean;
  active: boolean;
  lowStockThreshold: number;
  companyId?: string | null;
  price_web?: number | null;
  price_local?: number | null;
  status?: 'ACTIVE' | 'INACTIVE';
  stock?: number;
  image_url?: string;
  brand?: string | null;
  category?: string | null;
};

type StockInfo = {
  productId: string;
  stockOnHand: number;
  reserved: number;
  available: number;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type PosSaleRequest = {
  userId?: string;
  method: 'CASH' | 'DEBIT' | 'TRANSFER';
  items: { productId: string; quantity: number }[];
};

type AuthInfo = {
  userId: string;
  fullName: string;
  role: string;
};

type DashboardResponse = {
  salesTodayTotal: number;
  salesTodayCount: number;
  pendingWebOrders: number;
  pendingOrders: { id: string; customerName: string; totalAmount: number }[];
  lowStock: { productId: string; name: string; stockOnHand: number; threshold: number }[];
  recentAdjustments: { id: string; productName: string; quantity: number; reason: string }[];
};

type MovementResponse = {
  id: string;
  type: string;
  reason: string;
  quantity: number;
  createdAt: string;
};

type View = 'home' | 'web' | 'pos' | 'dashboard' | 'inventory' | 'supply' | 'supply-products' | 'supply-ingreso' | 'supply-inventario' | 'supply-documentos';

type StatusMessage = { type: 'ok' | 'warn' | 'error'; text: string } | null;

export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [companyProducts, setCompanyProducts] = useState<Product[]>([]);
  const [stockById, setStockById] = useState<Record<string, StockInfo>>({});
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [posCart, setPosCart] = useState<Record<string, CartItem>>({});
  const [barcodeInput, setBarcodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'DEBIT' | 'TRANSFER'>('CASH');
  const [posMessage, setPosMessage] = useState<StatusMessage>(null);

  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);

  const view = useMemo((): View => {
    if (pathname === '/minimarketerp' || pathname === '/minimarketerp/') return 'home';
    if (pathname === '/minimarketerp/supply' || pathname === '/minimarketerp/supply/') return 'supply';
    if (pathname.includes('supply/products')) return 'supply-products';
    if (pathname.includes('supply/ingreso')) return 'supply-ingreso';
    if (pathname.includes('supply/inventario')) return 'supply-inventario';
    if (pathname.includes('supply/documentos')) return 'supply-documentos';
    if (pathname.includes('supply')) return 'supply';
    if (pathname.includes('pos')) return 'pos';
    if (pathname.includes('web-orders')) return 'web';
    return 'home';
  }, [pathname]);

  const [orderName, setOrderName] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [orderEmail, setOrderEmail] = useState('');
  const [orderMessage, setOrderMessage] = useState<StatusMessage>(null);

  const [purchaseProduct, setPurchaseProduct] = useState('');
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [purchaseDocType, setPurchaseDocType] = useState('Factura');
  const [purchaseDocNumber, setPurchaseDocNumber] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseMessage, setPurchaseMessage] = useState<StatusMessage>(null);

  const [adjustProduct, setAdjustProduct] = useState('');
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('merma');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustMessage, setAdjustMessage] = useState<StatusMessage>(null);

  const [movementProduct, setMovementProduct] = useState('');
  const [movements, setMovements] = useState<MovementResponse[]>([]);
  const [movementMessage, setMovementMessage] = useState<StatusMessage>(null);

  const [posDiscount, setPosDiscount] = useState(0);
  const [webOrders, setWebOrders] = useState<any[]>([]);
  const [webOrdersLoading, setWebOrdersLoading] = useState(false);

  const useFirestore = USE_FIRESTORE;
  const [firestoreCompanyId, setFirestoreCompanyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (useFirestore) {
          const session = getSession();
          let companyId = session?.companyId ?? FIRESTORE_COMPANY_ID ?? null;
          if (!companyId && FIRESTORE_COMPANY_SLUG) {
            const idFromSlug = await getCompanyIdBySlug(FIRESTORE_COMPANY_SLUG);
            companyId = idFromSlug;
          }
          const productsRef = collection(db, 'products');
          const q = companyId
            ? query(productsRef, where('company_id', '==', companyId))
            : query(productsRef, orderBy('name', 'asc'));
          const snapshot = await getDocs(q);
          const data: Product[] = snapshot.docs.map((docSnap) => {
            const raw = docSnap.data() as any;
            return {
              id: docSnap.id,
              categoryId: raw.menuCategoryId ?? null,
              sku: raw.sku ?? null,
              barcode: raw.barcode ?? null,
              name: raw.name,
              description: raw.description ?? null,
              unit: raw.format || 'unidad',
              price: Number(raw.price_web ?? raw.price ?? 0),
              cost: Number(raw.price_local ?? raw.price ?? 0),
              visibleWeb: raw.status !== 'INACTIVE',
              active: raw.status !== 'INACTIVE',
              lowStockThreshold: raw.low_stock_threshold ?? 5,
              companyId: raw.company_id ?? null,
              price_web: raw.price_web ?? raw.price ?? null,
              price_local: raw.price_local ?? raw.price ?? null,
              status: raw.status ?? 'ACTIVE',
              stock: raw.stock ?? 0,
              image_url: raw.image_url ?? '',
              brand: raw.brand ?? null,
              category: raw.category ?? null,
            };
          });
          if (!active) return;
          const sorted = [...data].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
          const scopedProducts = companyId
            ? sorted
            : (FIRESTORE_COMPANY_ID ? sorted.filter((item) => item.companyId === FIRESTORE_COMPANY_ID) : sorted);
          const activeProducts = scopedProducts.filter((item) => item.active);
          setCompanyProducts(scopedProducts);
          setAllProducts(activeProducts);
          setProducts(activeProducts.filter((item) => item.visibleWeb));
          const next: Record<string, StockInfo> = {};
          activeProducts.forEach((product) => {
            const stockValue = Number(product.stock ?? 0);
            next[product.id] = {
              productId: product.id,
              stockOnHand: stockValue,
              reserved: 0,
              available: stockValue,
            };
          });
          setStockById(next);
          setFirestoreCompanyId(companyId ?? activeProducts.find((p) => p.companyId)?.companyId ?? null);
        } else {
          const response = await fetch(`${API_BASE}/api/products`);
          if (!response.ok) {
            if (active) setLoading(false);
            return;
          }
          const data: Product[] = await response.json();
          if (!active) return;
          const activeProducts = data.filter((item) => item.active);
          setCompanyProducts(data);
          setAllProducts(activeProducts);
          setProducts(activeProducts.filter((item) => item.visibleWeb));

          const next: Record<string, StockInfo> = {};
          activeProducts.forEach((product) => {
            const qty = Number(product.stock ?? 0);
            next[product.id] = {
              productId: product.id,
              stockOnHand: qty,
              reserved: 0,
              available: qty,
            };
          });
          setStockById(next);
        }
      } catch (error) {
        console.error('Error loading catalog', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [useFirestore, pathname]);

  useEffect(() => {
    const s = getSession();
    if (s) {
      setAuthInfo({ userId: s.userId, fullName: s.fullName, role: s.role });
      return;
    }
    const t = getStoredToken();
    setToken(t);
    if (!t) {
      setAuthInfo(null);
      return;
    }
    const loadMe = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/api/auth/me`);
        if (!response.ok) throw new Error('auth');
        const data = await response.json();
        setAuthInfo(data);
      } catch {
        setAuthInfo(null);
      }
    };
    loadMe();
  }, [pathname]);

  const loadDashboard = async (activeRef?: { current: boolean }) => {
    setDashboardLoading(true);
    try {
      const response = await apiFetch(`${API_BASE}/api/dashboard/summary`);
      const data: DashboardResponse = await response.json();
      if (!activeRef || activeRef.current) setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard', error);
    } finally {
      if (!activeRef || activeRef.current) setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (view !== 'dashboard') return;
    const active = { current: true };
    loadDashboard(active);
    return () => {
      active.current = false;
    };
  }, [view]);

  const loadWebOrders = async (activeRef?: { current: boolean }) => {
    if (useFirestore) {
      setWebOrdersLoading(true);
      try {
        const constraints = [];
        if (firestoreCompanyId) {
          constraints.push(where('company_id', '==', firestoreCompanyId));
        }
        constraints.push(orderBy('created_at', 'desc'));
        const snapshot = await getDocs(
          query(collection(db, 'productOrderRequests'), ...constraints)
        );
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        if (!activeRef || activeRef.current) setWebOrders(data);
      } catch {
        if (!activeRef || activeRef.current) setWebOrders([]);
      } finally {
        if (!activeRef || activeRef.current) setWebOrdersLoading(false);
      }
      return;
    }
    if (!token) return;
    setWebOrdersLoading(true);
    try {
      const response = await apiFetch(`${API_BASE}/api/web-orders`);
      if (!response.ok) throw new Error('orders');
      const data = await response.json();
      if (!activeRef || activeRef.current) setWebOrders(data);
    } catch {
      if (!activeRef || activeRef.current) setWebOrders([]);
    } finally {
      if (!activeRef || activeRef.current) setWebOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (view !== 'web') return;
    const active = { current: true };
    loadWebOrders(active);
    return () => {
      active.current = false;
    };
  }, [view, token]);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  const posItems = useMemo(() => Object.values(posCart), [posCart]);
  const getLocalPrice = (product: Product) =>
    Number(product.price_local ?? product.cost ?? product.price ?? 0);
  const posTotal = posItems.reduce(
    (sum, item) => sum + item.quantity * getLocalPrice(item.product),
    0
  );
  const posTotalWithDiscount = Math.max(0, posTotal - posDiscount);

  const updateQuantity = (product: Product, delta: number) => {
    const stock = stockById[product.id];
    const available = stock ? stock.available : 0;
    setCart((current) => {
      const existing = current[product.id];
      const nextQuantity = Math.max(0, (existing?.quantity || 0) + delta);
      if (nextQuantity > available) return current;
      if (nextQuantity === 0) {
        const { [product.id]: _omit, ...rest } = current;
        return rest;
      }
      return {
        ...current,
        [product.id]: { product, quantity: nextQuantity }
      };
    });
  };

  const updatePosQuantity = (product: Product, delta: number) => {
    const stock = stockById[product.id];
    const available = stock ? stock.available : 0;
    setPosCart((current) => {
      const existing = current[product.id];
      const nextQuantity = Math.max(0, (existing?.quantity || 0) + delta);
      if (nextQuantity > available) return current;
      if (nextQuantity === 0) {
        const { [product.id]: _omit, ...rest } = current;
        return rest;
      }
      return {
        ...current,
        [product.id]: { product, quantity: nextQuantity }
      };
    });
  };

  const applyStockDelta = async (productId: string, delta: number) => {
    const target = allProducts.find((item) => item.id === productId);
    if (!target) return;
    const nextStock = Math.max(0, Number(target.stock ?? 0) + delta);
    try {
      await updateDoc(doc(db, 'products', productId), { stock: nextStock });
      setAllProducts((current) =>
        current.map((item) =>
          item.id === productId ? { ...item, stock: nextStock } : item
        )
      );
      setProducts((current) =>
        current.map((item) =>
          item.id === productId ? { ...item, stock: nextStock } : item
        )
      );
      setStockById((current) => ({
        ...current,
        [productId]: {
          productId,
          stockOnHand: nextStock,
          reserved: 0,
          available: nextStock,
        },
      }));
    } catch (error) {
      console.error('Error updating stock', error);
    }
  };

  const canAdd = (product: Product, target: Record<string, CartItem>) => {
    const stock = stockById[product.id];
    if (!stock) return false;
    const inCart = target[product.id]?.quantity || 0;
    return stock.available > inCart;
  };

  const handleBarcode = () => {
    const value = barcodeInput.trim();
    if (!value) return;
    const product = allProducts.find(
      (p) => p.barcode === value || p.sku === value || p.name.toLowerCase() === value.toLowerCase()
    );
    if (!product) {
      setPosMessage({ type: 'error', text: 'Producto no encontrado' });
      return;
    }
    if (!canAdd(product, posCart)) {
      setPosMessage({ type: 'warn', text: 'Stock insuficiente' });
      return;
    }
    updatePosQuantity(product, 1);
    setBarcodeInput('');
    setPosMessage(null);
  };

  const submitPosSale = async () => {
    if (posItems.length === 0) return;
    if (useFirestore) {
      try {
        const itemsPayload = posItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: getLocalPrice(item.product),
        }));
        await addDoc(collection(db, 'minimarketLocalSales'), {
          company_id: firestoreCompanyId ?? null,
          method: paymentMethod,
          items: itemsPayload,
          total: posTotalWithDiscount,
          created_at: Timestamp.now(),
        });
        for (const item of posItems) {
          await applyStockDelta(item.product.id, -item.quantity);
        }
        setPosMessage({ type: 'ok', text: 'Venta registrada en Firestore.' });
        setPosCart({});
        setPosDiscount(0);
      } catch {
        setPosMessage({ type: 'error', text: 'No se pudo registrar la venta.' });
      }
      return;
    }
    const payload: PosSaleRequest = {
      method: paymentMethod,
      items: posItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    try {
      const response = await apiFetch(`${API_BASE}/api/local-sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Venta rechazada');
      }
      const data = await response.json();
      setPosMessage({ type: 'ok', text: `Venta confirmada. Comprobante: ${data.receiptUrl}` });
      setPosCart({});
      setPosDiscount(0);
    } catch (error) {
      const queue = loadQueue();
      queue.push(payload);
      saveQueue(queue);
      setPosMessage({ type: 'warn', text: 'Sin conexion. Venta guardada en cola local.' });
    }
  };

  const retryQueue = async () => {
    const queue = loadQueue();
    if (queue.length === 0) {
      setPosMessage({ type: 'warn', text: 'No hay ventas en cola.' });
      return;
    }
    const remaining: PosSaleRequest[] = [];
    for (const payload of queue) {
      try {
        const response = await apiFetch(`${API_BASE}/api/local-sales`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('fail');
      } catch {
        remaining.push(payload);
      }
    }
    saveQueue(remaining);
    setPosMessage({
      type: remaining.length === 0 ? 'ok' : 'warn',
      text: remaining.length === 0
        ? 'Cola sincronizada.'
        : `Quedaron ${remaining.length} ventas pendientes.`
    });
  };

  const submitWebOrder = async () => {
    if (cartItems.length === 0) return;
    if (!orderName || !orderPhone) {
      setOrderMessage({ type: 'warn', text: 'Nombre y telefono son obligatorios.' });
      return;
    }
    if (useFirestore) {
      try {
        const itemsPayload = cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
        }));
        const total = cartItems.reduce(
          (sum, item) => sum + item.quantity * item.product.price,
          0
        );
        const docRef = await addDoc(collection(db, 'productOrderRequests'), {
          company_id: firestoreCompanyId ?? null,
          items: itemsPayload,
          total_estimated: total,
          client_name: orderName,
          client_whatsapp: orderPhone,
          client_email: orderEmail || undefined,
          created_at: Timestamp.now(),
          status: 'REQUESTED',
        });
        setOrderMessage({ type: 'ok', text: `Pedido creado: ${docRef.id}` });
        setCart({});
      } catch {
        setOrderMessage({ type: 'error', text: 'No se pudo crear el pedido.' });
      }
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/web-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: orderName,
          customerPhone: orderPhone,
          customerEmail: orderEmail || undefined,
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity
          }))
        })
      });
      if (!response.ok) throw new Error('order');
      const data = await response.json();
      setOrderMessage({ type: 'ok', text: `Pedido creado: ${data.id}` });
      setCart({});
    } catch {
      setOrderMessage({ type: 'error', text: 'No se pudo crear el pedido.' });
    }
  };

  const submitPurchase = async () => {
    if (!purchaseProduct || purchaseQty <= 0 || !purchaseDocNumber) {
      setPurchaseMessage({ type: 'warn', text: 'Completa producto, cantidad y documento.' });
      return;
    }
    if (useFirestore) {
      try {
        await applyStockDelta(purchaseProduct, purchaseQty);
        await addDoc(collection(db, 'inventoryMovements'), {
          product_id: purchaseProduct,
          type: 'IN',
          reason: 'compra',
          quantity: purchaseQty,
          document_type: purchaseDocType,
          document_number: purchaseDocNumber,
          notes: purchaseNotes || undefined,
          created_at: Timestamp.now(),
        });
        setPurchaseMessage({ type: 'ok', text: 'Ingreso registrado.' });
      } catch {
        setPurchaseMessage({ type: 'error', text: 'No se pudo registrar el ingreso.' });
      }
      return;
    }
    try {
      const response = await apiFetch(`${API_BASE}/api/inventory/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: purchaseProduct,
          quantity: purchaseQty,
          documentType: purchaseDocType,
          documentNumber: purchaseDocNumber,
          notes: purchaseNotes || undefined
        })
      });
      if (!response.ok) throw new Error('purchase');
      setPurchaseMessage({ type: 'ok', text: 'Ingreso registrado.' });
    } catch {
      setPurchaseMessage({ type: 'error', text: 'No se pudo registrar el ingreso.' });
    }
  };

  const submitAdjustment = async () => {
    if (!adjustProduct || adjustQty === 0) {
      setAdjustMessage({ type: 'warn', text: 'Completa producto y cantidad distinta de 0.' });
      return;
    }
    if (useFirestore) {
      try {
        await applyStockDelta(adjustProduct, adjustQty);
        await addDoc(collection(db, 'inventoryMovements'), {
          product_id: adjustProduct,
          type: 'ADJUST',
          reason: adjustReason,
          quantity: adjustQty,
          notes: adjustNotes || undefined,
          created_at: Timestamp.now(),
        });
        setAdjustMessage({ type: 'ok', text: 'Ajuste registrado.' });
      } catch {
        setAdjustMessage({ type: 'error', text: 'No se pudo registrar el ajuste.' });
      }
      return;
    }
    try {
      const response = await apiFetch(`${API_BASE}/api/inventory/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustProduct,
          quantity: adjustQty,
          reason: adjustReason,
          notes: adjustNotes || undefined
        })
      });
      if (!response.ok) throw new Error('adjust');
      setAdjustMessage({ type: 'ok', text: 'Ajuste registrado.' });
    } catch {
      setAdjustMessage({ type: 'error', text: 'No se pudo registrar el ajuste.' });
    }
  };

  const loadMovements = async () => {
    if (!movementProduct) {
      setMovementMessage({ type: 'warn', text: 'Selecciona un producto.' });
      return;
    }
    if (useFirestore) {
      try {
        const snapshot = await getDocs(
          query(
            collection(db, 'inventoryMovements'),
            orderBy('created_at', 'desc')
          )
        );
        const data = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((item: any) => item.product_id === movementProduct)
          .map((item: any) => ({
            id: item.id,
            type: item.type,
            reason: item.reason,
            quantity: item.quantity,
            createdAt: item.created_at?.toDate?.().toISOString?.() ?? String(item.created_at),
          }));
        setMovements(data);
        setMovementMessage(null);
      } catch {
        setMovementMessage({ type: 'error', text: 'No se pudo cargar el historial.' });
      }
      return;
    }
    try {
      const response = await apiFetch(
        `${API_BASE}/api/inventory/${movementProduct}/movements`
      );
      if (!response.ok) throw new Error('movements');
      const data = await response.json();
      setMovements(data);
      setMovementMessage(null);
    } catch {
      setMovementMessage({ type: 'error', text: 'No se pudo cargar el historial.' });
    }
  };

  const requiresAuth = view === 'pos' || view === 'dashboard' || view === 'inventory' || view === 'web' ||
    view === 'supply' || view === 'supply-products' || view === 'supply-ingreso' || view === 'supply-inventario' || view === 'supply-documentos';
  const authBlocked = requiresAuth && !token;

  const webStatusOptions = [
    { value: 'REQUESTED', label: 'Solicitado' },
    { value: 'RECEIVED', label: 'Recibido' },
    { value: 'RESERVED', label: 'Reservado' },
    { value: 'PAID', label: 'Pagado' },
    { value: 'CANCELLED', label: 'Cancelado' },
  ] as const;

  if (pathname === '/' || pathname === '' || pathname === '/minimarketerp_login') {
    if (!getSession() && !getStoredToken()) {
      return <LoginPage />;
    }
    return <Navigate to="/minimarketerp" replace />;
  }
  if (!getSession() && !getStoredToken()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <Link
            to="/minimarketerp"
            className="brand-link"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div>
              <p className="kicker">Minimarket ERP</p>
              <h1>Operación diaria</h1>
            </div>
          </Link>
          <p className="subtitle">Inventario, ventas y pedidos web en un solo panel.</p>
        </div>
        <div className="top-actions">
          {authInfo ? (
            <div className="auth-info">
              <span>{authInfo.fullName}</span>
              <span className="badge ok">{authInfo.role}</span>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  clearSession();
                  setToken(null);
                  setAuthInfo(null);
                  navigate('/');
                }}
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="ghost"
              onClick={() => navigate('/')}
            >
              Ir a acceso
            </button>
          )}
        </div>
      </header>

      {authBlocked && (
        <div className="status warn">Inicia sesión para acceder a esta sección.</div>
      )}

      <main className="content">
        {view === 'home' && (
          <section className="home-section">
            <HomePage />
          </section>
        )}

        {view === 'web' && (
          <section className="web-orders">
            <div className="section-header">
              <div>
                <h2>Pedidos web</h2>
                <p>Productos activos web: {products.length}</p>
              </div>
              <div className="section-actions">
                <button className="secondary" onClick={() => loadWebOrders()}>
                  Refrescar
                </button>
                <button type="button" className="ghost" onClick={() => navigate('/minimarketerp')}>
                  Volver
                </button>
              </div>
            </div>

            <div className="web-grid">
              <div className="card">
                <h3>Pedidos entrantes</h3>
                {webOrdersLoading ? (
                  <p>Cargando pedidos...</p>
                ) : webOrders.length === 0 ? (
                  <p>No hay pedidos aún.</p>
                ) : (
                  <ul className="order-list">
                    {webOrders.map((order: any) => (
                      <li key={order.id} className="order-item">
                        <div>
                          <strong>{order.customerName || order.client_name}</strong>
                          <p>{order.customerPhone || order.client_whatsapp}</p>
                          <p>Total: ${order.totalAmount?.toFixed(0) ?? order.total_estimated?.toFixed?.(0) ?? '--'}</p>
                        </div>
                        <div className="order-actions">
                          <select
                            value={order.status || 'REQUESTED'}
                            onChange={async (event) => {
                              const nextStatus = event.target.value;
                              if (useFirestore) {
                                await updateDoc(doc(db, 'productOrderRequests', order.id), {
                                  status: nextStatus,
                                });
                                if (nextStatus === 'PAID') {
                                  const items = order.items || [];
                                  for (const item of items) {
                                    await applyStockDelta(item.product_id, -item.quantity);
                                  }
                                }
                                setWebOrders((current) =>
                                  current.map((item) =>
                                    item.id === order.id ? { ...item, status: nextStatus } : item
                                  )
                                );
                                return;
                              }
                              const response = await apiFetch(`${API_BASE}/api/web-orders/${order.id}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: nextStatus }),
                              });
                              if (response.ok) {
                                const updated = await response.json();
                                setWebOrders((current) =>
                                  current.map((item) => (item.id === updated.id ? updated : item))
                                );
                              }
                            }}
                          >
                            {webStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {order.items && order.items.length > 0 && (
                          <ul className="mini-list">
                            {order.items.map((item: any, idx: number) => (
                              <li key={`${order.id}-${idx}`}>
                                {item.quantity} x {item.productId || item.product_id} (${item.unitPrice?.toFixed(0) ?? item.unit_price?.toFixed(0) ?? '--'})
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card">
                <h3>Catálogo activo</h3>
                {loading ? (
                  <p>Cargando productos...</p>
                ) : products.length === 0 ? (
                  <p>No hay productos activos para web.</p>
                ) : (
                  <ul className="mini-list">
                    {products.map((product) => (
                      <li key={product.id}>
                        {product.name} · ${product.price.toFixed(0)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card">
                <h3>Simular pedido web</h3>
                <div className="grid">
                  {products.map((product) => {
                    const stock = stockById[product.id];
                    const available = stock?.available ?? 0;
                    const lowStock = stock && available > 0 && available <= product.lowStockThreshold;
                    const outOfStock = !stock || available <= 0;
                    return (
                      <article key={product.id} className="card product">
                        <div className="product-header">
                          <h3>{product.name}</h3>
                          <span className="price">${product.price.toFixed(0)}</span>
                        </div>
                        <p className="description">{product.description || 'Sin descripcion'}</p>
                        <div className="badges">
                          {outOfStock ? (
                            <span className="badge danger">No disponible</span>
                          ) : lowStock ? (
                            <span className="badge warning">Stock bajo ({available})</span>
                          ) : (
                            <span className="badge ok">Disponible ({available})</span>
                          )}
                        </div>
                        <div className="actions">
                          <button
                            className="ghost"
                            onClick={() => updateQuantity(product, -1)}
                            disabled={!cart[product.id]}
                          >
                            -
                          </button>
                          <span className="qty">{cart[product.id]?.quantity || 0}</span>
                          <button
                            className="ghost"
                            onClick={() => updateQuantity(product, 1)}
                            disabled={!canAdd(product, cart)}
                          >
                            +
                          </button>
                        </div>
                      </article>
                    );
                  })}
                  <section className="card order">
                    <h3>Confirmar pedido web</h3>
                    <div className="field">
                      <label>Nombre</label>
                      <input
                        value={orderName}
                        onChange={(event) => setOrderName(event.target.value)}
                        placeholder="Nombre"
                      />
                    </div>
                    <div className="field">
                      <label>Telefono</label>
                      <input
                        value={orderPhone}
                        onChange={(event) => setOrderPhone(event.target.value)}
                        placeholder="Telefono"
                      />
                    </div>
                    <div className="field">
                      <label>Email (opcional)</label>
                      <input
                        value={orderEmail}
                        onChange={(event) => setOrderEmail(event.target.value)}
                        placeholder="Email"
                      />
                    </div>
                    <button className="primary" onClick={submitWebOrder} disabled={cartItems.length === 0}>
                      Enviar pedido
                    </button>
                    {orderMessage && (
                      <p className={`status ${orderMessage.type}`}>{orderMessage.text}</p>
                    )}
                  </section>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === 'pos' && (
          <section className="pos">
            <div className="section-header">
              <div>
                <h2>Venta sucursal</h2>
                <p>POS con descuentos y control de stock.</p>
              </div>
              <div className="section-actions">
                <button type="button" className="ghost" onClick={() => navigate('/minimarketerp')}>
                  Volver
                </button>
              </div>
            </div>

            <div className="pos-input">
              <label>Escanear codigo</label>
              <div className="pos-row">
                <input
                  value={barcodeInput}
                  onChange={(event) => setBarcodeInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleBarcode();
                  }}
                  placeholder="Barcode / SKU / Nombre exacto"
                />
                <button className="ghost" onClick={handleBarcode}>
                  Agregar
                </button>
              </div>
              {posMessage && (
                <p className={`status ${posMessage.type}`}>{posMessage.text}</p>
              )}
            </div>

            <div className="pos-grid">
              <div className="pos-cart card">
                <h3>Venta actual</h3>
                {posItems.length === 0 ? (
                  <p>Sin productos aun.</p>
                ) : (
                  <ul className="pos-list">
                    {posItems.map((item) => (
                      <li key={item.product.id}>
                        <span>{item.product.name}</span>
                        <span>x{item.quantity}</span>
                        <span>${(item.quantity * getLocalPrice(item.product)).toFixed(0)}</span>
                        <div className="actions">
                          <button className="ghost" onClick={() => updatePosQuantity(item.product, -1)}>
                            -
                          </button>
                          <button className="ghost" onClick={() => updatePosQuantity(item.product, 1)}>
                            +
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pos-summary card">
                <h3>Pago</h3>
                <div className="pos-payments">
                  {(['CASH', 'DEBIT', 'TRANSFER'] as const).map((method) => (
                    <button
                      key={method}
                      className={paymentMethod === method ? 'tab active' : 'tab'}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method === 'CASH'
                        ? 'Efectivo'
                        : method === 'DEBIT'
                        ? 'Debito'
                        : 'Transferencia'}
                    </button>
                  ))}
                </div>
                <div className="discount-row">
                  <label>Descuento</label>
                  <input
                    type="number"
                    min={0}
                    value={posDiscount}
                    onChange={(event) => setPosDiscount(Number(event.target.value))}
                    placeholder="0"
                  />
                </div>
                <p className="pos-total">Total: ${posTotalWithDiscount.toFixed(0)}</p>
                <button
                  className="primary"
                  onClick={submitPosSale}
                  disabled={posItems.length === 0 || !token}
                >
                  Confirmar venta
                </button>
                {!useFirestore && (
                  <button className="secondary" onClick={retryQueue}>
                    Reintentar cola
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {view === 'supply' && (
          <SupplyHomePage />
        )}

        {view === 'supply-products' && (
          <section className="inventory">
            <div className="section-header">
              <div>
                <h2>Lista de productos</h2>
                <p>Productos creados en el panel (dashboard). Mismos datos que en /dashboard/products.</p>
              </div>
              <div className="section-actions">
                <button type="button" className="ghost" onClick={() => navigate('/minimarketerp/supply')}>
                  Volver
                </button>
              </div>
            </div>
            <div className="card">
              {loading ? (
                <p>Cargando productos...</p>
              ) : companyProducts.length === 0 ? (
                <p>No hay productos. Crea productos en el panel en http://localhost:4173/dashboard/products (misma cuenta/empresa).</p>
              ) : (
                <ul className="product-list supply-product-list">
                  {companyProducts.map((product) => {
                    const stock = stockById[product.id];
                    const available = stock?.available ?? product.stock ?? 0;
                    const priceLocal = Number(product.price_local ?? product.cost ?? product.price ?? 0);
                    const priceWeb = Number(product.price_web ?? product.price ?? 0);
                    return (
                      <li key={product.id} className="supply-product-item">
                        {product.image_url && (
                          <div className="supply-product-img-wrap">
                            <img src={product.image_url} alt="" className="supply-product-img" />
                          </div>
                        )}
                        <div className="supply-product-main">
                          <span className="supply-product-name">{product.name}</span>
                          {(product.brand || product.category) && (
                            <span className="supply-product-meta">
                              {[product.brand, product.category].filter(Boolean).join(' · ')}
                            </span>
                          )}
                          {product.description && (
                            <p className="supply-product-desc">{product.description}</p>
                          )}
                          <span className="supply-product-meta">
                            {product.unit || 'unidad'} · {product.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                            {product.barcode ? ` · Cód: ${product.barcode}` : ''}
                          </span>
                        </div>
                        <div className="supply-product-right">
                          <span className="supply-product-stock">Stock: {available}</span>
                          <span className="supply-product-price">Local: ${priceLocal.toFixed(0)}</span>
                          <span className="supply-product-price">Web: ${priceWeb.toFixed(0)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        )}

        {view === 'supply-ingreso' && (
          <section className="inventory">
            <div className="section-header">
              <div>
                <h2>Registrar Ingreso</h2>
                <p>Registrar ingresos de compra con documento.</p>
              </div>
              <div className="section-actions">
                <button type="button" className="ghost" onClick={() => navigate('/minimarketerp/supply')}>
                  Volver
                </button>
              </div>
            </div>
            <div className="card">
              <h3>Ingreso de compra</h3>
              <div className="field">
                <label>Producto</label>
                <select value={purchaseProduct} onChange={(e) => setPurchaseProduct(e.target.value)}>
                  <option value="">Selecciona producto</option>
                  {allProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={purchaseQty}
                  onChange={(e) => setPurchaseQty(Number(e.target.value))}
                  placeholder="Cantidad"
                />
              </div>
              <div className="field">
                <label>Tipo documento</label>
                <input
                  value={purchaseDocType}
                  onChange={(e) => setPurchaseDocType(e.target.value)}
                  placeholder="Tipo documento"
                />
              </div>
              <div className="field">
                <label>Numero documento</label>
                <input
                  value={purchaseDocNumber}
                  onChange={(e) => setPurchaseDocNumber(e.target.value)}
                  placeholder="Numero documento"
                />
              </div>
              <div className="field">
                <label>Notas</label>
                <input
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  placeholder="Notas"
                />
              </div>
              <button className="primary" onClick={submitPurchase} disabled={!token}>
                Registrar ingreso
              </button>
              {purchaseMessage && (
                <p className={`status ${purchaseMessage.type}`}>{purchaseMessage.text}</p>
              )}
            </div>
          </section>
        )}

        {view === 'supply-inventario' && (
          <section className="inventory">
            <div className="section-header">
              <div>
                <h2>Inventario (+/-)</h2>
                <p>Ajustes de inventario: merma, vencimiento, descuento.</p>
              </div>
              <div className="section-actions">
                <button type="button" className="ghost" onClick={() => navigate('/minimarketerp/supply')}>
                  Volver
                </button>
              </div>
            </div>
            <div className="card">
              <h3>Descuento de inventario</h3>
              <div className="field">
                <label>Producto</label>
                <select value={adjustProduct} onChange={(e) => setAdjustProduct(e.target.value)}>
                  <option value="">Selecciona producto</option>
                  {allProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Cantidad (+/-)</label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  placeholder="Cantidad (+/-)"
                />
              </div>
              <div className="field">
                <label>Motivo</label>
                <select value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}>
                  {['merma', 'vencimiento', 'robo', 'ajuste', 'descuento'].map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Notas</label>
                <input
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Notas"
                />
              </div>
              <button className="primary" onClick={submitAdjustment} disabled={!token}>
                Registrar ajuste
              </button>
              {adjustMessage && (
                <p className={`status ${adjustMessage.type}`}>{adjustMessage.text}</p>
              )}
            </div>
          </section>
        )}

        {view === 'supply-documentos' && (
          <section className="inventory">
            <div className="section-header">
              <div>
                <h2>Documentos</h2>
                <p>Historial de ingresos y documento exportable.</p>
              </div>
              <div className="section-actions">
                <button type="button" className="ghost" onClick={() => navigate('/minimarketerp/supply')}>
                  Volver
                </button>
              </div>
            </div>
            <div className="card">
              <h3>Historial de ingresos</h3>
              <div className="field">
                <label>Producto</label>
                <select value={movementProduct} onChange={(e) => setMovementProduct(e.target.value)}>
                  <option value="">Selecciona producto</option>
                  {allProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" className="secondary" onClick={loadMovements} disabled={!token}>
                Cargar historial
              </button>
              {movementMessage && (
                <p className={`status ${movementMessage.type}`}>{movementMessage.text}</p>
              )}
              <ul className="list">
                {movements.map((movement) => (
                  <li key={movement.id}>
                    {movement.type} {movement.reason} {movement.quantity} ({movement.createdAt})
                  </li>
                ))}
              </ul>
              <button type="button" className="ghost">Documento exportable</button>
            </div>
          </section>
        )}

        {view === 'dashboard' && (
          <section className="dashboard">
            {dashboardLoading ? (
              <div className="card">Cargando dashboard...</div>
            ) : !dashboard ? (
              <div className="card">No hay datos disponibles.</div>
            ) : (
              <div className="dashboard-grid">
                <div className="card">
                  <h3>Ventas del dia</h3>
                  <p className="dashboard-total">
                    ${dashboard.salesTodayTotal.toFixed(0)}
                  </p>
                  <p>{dashboard.salesTodayCount} ventas registradas</p>
                </div>
                <div className="card">
                  <h3>Pedidos web pendientes</h3>
                  <p>{dashboard.pendingWebOrders} pendientes</p>
                  <ul className="list">
                    {dashboard.pendingOrders.map((order) => (
                      <li key={order.id}>
                        {order.customerName} - ${order.totalAmount.toFixed(0)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <h3>Stock critico</h3>
                  <ul className="list">
                    {dashboard.lowStock.map((item) => (
                      <li key={item.productId}>
                        {item.name} ({item.stockOnHand})
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card">
                  <h3>Ajustes recientes</h3>
                  <ul className="list">
                    {dashboard.recentAdjustments.map((adjustment) => (
                      <li key={adjustment.id}>
                        {adjustment.productName} {adjustment.quantity} ({adjustment.reason})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function loadQueue(): PosSaleRequest[] {
  try {
    const raw = localStorage.getItem(POS_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PosSaleRequest[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: PosSaleRequest[]) {
  localStorage.setItem(POS_QUEUE_KEY, JSON.stringify(queue));
}

function apiFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
