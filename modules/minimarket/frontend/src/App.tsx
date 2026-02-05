import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_MINIMARKET_API || 'http://localhost:8088';
const POS_QUEUE_KEY = 'pymerp_minimarket_pos_queue';
const TOKEN_KEY = 'pymerp_minimarket_token';

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

type View = 'vitrina' | 'pos' | 'dashboard' | 'inventory';

type StatusMessage = { type: 'ok' | 'warn' | 'error'; text: string } | null;

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [stockById, setStockById] = useState<Record<string, StockInfo>>({});
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [view, setView] = useState<View>('vitrina');
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [posCart, setPosCart] = useState<Record<string, CartItem>>({});
  const [barcodeInput, setBarcodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'DEBIT' | 'TRANSFER'>('CASH');
  const [posMessage, setPosMessage] = useState<StatusMessage>(null);

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [authEmail, setAuthEmail] = useState('admin@minimarket.cl');
  const [authPassword, setAuthPassword] = useState('admin123');
  const [authMessage, setAuthMessage] = useState<StatusMessage>(null);

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

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/products`);
        const data: Product[] = await response.json();
        if (!active) return;
        const activeProducts = data.filter((item) => item.active);
        setAllProducts(activeProducts);
        setProducts(activeProducts.filter((item) => item.visibleWeb));

        const stockEntries = await Promise.all(
          activeProducts.map(async (product) => {
            const stockResponse = await fetch(
              `${API_BASE}/api/inventory/${product.id}/stock`
            );
            const stockData: StockInfo = await stockResponse.json();
            return [product.id, stockData] as const;
          })
        );
        if (!active) return;
        const next: Record<string, StockInfo> = {};
        for (const [id, info] of stockEntries) {
          next[id] = info;
        }
        setStockById(next);
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
  }, []);

  useEffect(() => {
    if (!token) {
      setAuthInfo(null);
      return;
    }
    const loadMe = async () => {
      try {
        const response = await apiFetch(`${API_BASE}/api/auth/me`);
        if (!response.ok) throw new Error('auth');
        const data = await response.json();
        setAuthInfo(data);
      } catch (error) {
        setAuthInfo(null);
      }
    };
    loadMe();
  }, [token]);

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

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

  const posItems = useMemo(() => Object.values(posCart), [posCart]);
  const posTotal = posItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price,
    0
  );

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

  const requiresAuth = view === 'pos' || view === 'dashboard' || view === 'inventory';
  const authBlocked = requiresAuth && !token;

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-left">
          <div className="title-block">
            <p className="kicker">Minimarket</p>
            <h1>PyM-ERP Minimarket</h1>
            <p className="subtitle">
              Stock real y disponibilidad inmediata. Un solo stock para web y tienda.
            </p>
          </div>
          <div className="auth">
            {authInfo ? (
              <div className="auth-info">
                <span>{authInfo.fullName}</span>
                <span className="badge ok">{authInfo.role}</span>
                <button
                  className="ghost"
                  onClick={() => {
                    localStorage.removeItem(TOKEN_KEY);
                    setToken(null);
                    setAuthInfo(null);
                  }}
                >
                  Salir
                </button>
              </div>
            ) : (
              <form
                className="auth-form"
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    const response = await fetch(`${API_BASE}/api/auth/login`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: authEmail, password: authPassword })
                    });
                    if (!response.ok) throw new Error('login');
                    const data = await response.json();
                    localStorage.setItem(TOKEN_KEY, data.token);
                    setToken(data.token);
                    setAuthMessage(null);
                  } catch {
                    setAuthMessage({ type: 'error', text: 'Credenciales invalidas' });
                  }
                }}
              >
                <input
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="Email"
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="Password"
                />
                <button className="ghost" type="submit">
                  Entrar
                </button>
                {authMessage && (
                  <span className={`status ${authMessage.type}`}>{authMessage.text}</span>
                )}
              </form>
            )}
          </div>
          <div className="tabs">
            <button
              className={view === 'vitrina' ? 'tab active' : 'tab'}
              onClick={() => setView('vitrina')}
            >
              Vitrina
            </button>
            <button
              className={view === 'pos' ? 'tab active' : 'tab'}
              onClick={() => setView('pos')}
            >
              POS
            </button>
            <button
              className={view === 'inventory' ? 'tab active' : 'tab'}
              onClick={() => setView('inventory')}
            >
              Inventario
            </button>
            <button
              className={view === 'dashboard' ? 'tab active' : 'tab'}
              onClick={() => setView('dashboard')}
            >
              Dashboard
            </button>
          </div>
          {authBlocked && (
            <p className="status warn">Inicia sesion para acceder a esta seccion.</p>
          )}
        </div>
        {view === 'vitrina' ? (
          <div className="summary">
            <p className="summary-title">Carrito</p>
            <p className="summary-count">{cartItems.length} items</p>
            <p className="summary-total">${cartTotal.toFixed(0)}</p>
            <button className="primary" disabled={cartItems.length === 0}>
              Confirmar pedido
            </button>
            <p className="hint">No se permite sobreventa.</p>
          </div>
        ) : view === 'pos' ? (
          <div className="summary">
            <p className="summary-title">POS activo</p>
            <p className="summary-count">{posItems.length} productos</p>
            <p className="summary-total">${posTotal.toFixed(0)}</p>
            <button
              className="primary"
              onClick={submitPosSale}
              disabled={posItems.length === 0 || !token}
            >
              Confirmar venta
            </button>
            <button className="secondary" onClick={retryQueue}>
              Reintentar cola
            </button>
            <p className="hint">Modo offline basico con cola local.</p>
          </div>
        ) : view === 'inventory' ? (
          <div className="summary">
            <p className="summary-title">Inventario</p>
            <p className="summary-count">Ingreso y ajustes</p>
            <p className="summary-total">{allProducts.length} productos</p>
            <button className="secondary" onClick={() => loadMovements()}>
              Ver movimientos
            </button>
            <p className="hint">Requiere autenticacion.</p>
          </div>
        ) : (
          <div className="summary">
            <p className="summary-title">Operacion diaria</p>
            <p className="summary-count">Indicadores clave</p>
            <p className="summary-total">
              {dashboard?.salesTodayTotal?.toFixed(0) ?? '--'} CLP
            </p>
            <button className="secondary" onClick={() => loadDashboard()}>
              Refrescar
            </button>
            <p className="hint">Vista rapida para el dueno.</p>
          </div>
        )}
      </header>

      <main className="content">
        {loading ? (
          <div className="card">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="card">No hay productos disponibles.</div>
        ) : view === 'vitrina' ? (
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
        ) : view === 'pos' ? (
          <section className="pos">
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
                        <span>${(item.quantity * item.product.price).toFixed(0)}</span>
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
                <p className="pos-total">Total: ${posTotal.toFixed(0)}</p>
                <button
                  className="primary"
                  onClick={submitPosSale}
                  disabled={posItems.length === 0 || !token}
                >
                  Confirmar venta
                </button>
              </div>
            </div>
          </section>
        ) : view === 'inventory' ? (
          <section className="inventory">
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

            <div className="card">
              <h3>Ajuste manual</h3>
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
                  {['merma', 'vencimiento', 'robo', 'ajuste'].map((reason) => (
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

            <div className="card">
              <h3>Historial de movimientos</h3>
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
              <button className="secondary" onClick={loadMovements} disabled={!token}>
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
            </div>
          </section>
        ) : (
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
