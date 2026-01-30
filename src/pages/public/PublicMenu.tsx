import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { GAEventCategory } from '../../config/analytics';
import { getCompany, getCompanyBySlug, getProducts, createProductOrderRequest, createPublicPageEvent, getCompanyAppearance } from '../../services/firestore';
import { getMenuCategories } from '../../services/menu';
import { isModuleEnabled, resolveCategoryId } from '../../config/categories';
import { sanitizeText } from '../../services/validation';
import { EventType, BusinessType } from '../../types';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useDebounce } from '../../hooks/useDebounce';
import { filterProductsBySearch } from '../../utils/productSearch';
import ProductDetailModal from './components/ProductDetailModal';
import { CartModal } from './components/CartModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import '../../styles/horizontal-carousel.css';
import type { Company, MenuCategory, Product, CompanyAppearance, FulfillmentConfig } from '../../types';
import type { OrderForm } from './types';

type CartLine = {
  product: Product;
  quantity: number;
};

const numberFormatter = new Intl.NumberFormat('es-CL');

const getFulfillmentConfig = (company: Company | null): FulfillmentConfig => {
  if (!company) {
    return { enabled: false, modes: [] };
  }

  if (company.fulfillment_config) {
    return {
      enabled: company.fulfillment_config.enabled ?? false,
      modes: company.fulfillment_config.modes ?? [],
      delivery_fee: company.fulfillment_config.delivery_fee,
      minimum_order: company.fulfillment_config.minimum_order,
      delivery_time_minutes: company.fulfillment_config.delivery_time_minutes,
      preparation_time_minutes: company.fulfillment_config.preparation_time_minutes,
      title: company.fulfillment_config.title,
      description: company.fulfillment_config.description,
      note: company.fulfillment_config.note,
    };
  }

  if (company.delivery_enabled === true) {
    return {
      enabled: true,
      modes: ['DELIVERY', 'TAKEAWAY', 'DINE_IN'],
    };
  }

  return { enabled: false, modes: [] };
};

const scrollToCategory = (categoryId: string, tabsRef?: React.RefObject<HTMLDivElement>) => {
  const el = document.getElementById(`menu-cat-${categoryId}`);
  if (el) {
    // Calcular offset dinámico: header + tabs sticky + padding
    const headerHeight = 80; // Altura aproximada del header
    const tabsHeight = tabsRef?.current?.offsetHeight || 50;
    const offset = headerHeight + tabsHeight + 20; // 20px de padding extra
    
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    // Usar scrollIntoView para mejor compatibilidad mobile
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    // Ajuste fino después del scroll
    setTimeout(() => {
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }, 100);

    // Resaltar temporalmente la categoría
    el.classList.add('ring-4', 'ring-blue-400', 'ring-opacity-50');
    setTimeout(() => {
      el.classList.remove('ring-4', 'ring-blue-400', 'ring-opacity-50');
    }, 2000);
  }
};

export default function PublicMenu() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { trackEvent } = useAnalytics();
  const { handleError } = useErrorHandler();

  const [company, setCompany] = useState<Company | null>(null);
  const [appearance, setAppearance] = useState<CompanyAppearance | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ id: string; link: string } | null>(null);
  const [orderForm, setOrderForm] = useState<OrderForm>({
    client_name: '',
    client_whatsapp: '',
    client_comment: '',
    table_number: '',
    delivery_type: 'TABLE',
    delivery_address: '',
    delivery_location: '',
    delivery_notes: '',
    payment_method: undefined,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth < 1024, []);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Tema del menú basado en la configuración de apariencia
  const menuTheme = useMemo(() => {
    if (!appearance) {
      return {
        backgroundColor: '#f9fafb',
        backgroundImage: '',
        cardColor: '#ffffff',
        textColor: '#374151',
        titleColor: '#111827',
        buttonColor: '#2563eb',
        buttonTextColor: '#ffffff',
        categoryImageDefault: undefined,
      };
    }
    return {
      backgroundColor: appearance.menu_background_color || '#f9fafb',
      backgroundImage: appearance.menu_background_image || '',
      cardColor: appearance.menu_card_color || '#ffffff',
      textColor: appearance.menu_text_color || '#374151',
      titleColor: appearance.menu_title_color || '#111827',
      buttonColor: appearance.menu_button_color || '#2563eb',
      buttonTextColor: appearance.menu_button_text_color || '#ffffff',
      categoryImageDefault: appearance.menu_category_image_default,
    };
  }, [appearance]);

  const fulfillmentConfig = useMemo(() => getFulfillmentConfig(company), [company]);
  const menuQrTableCount = Math.max(0, Math.min(40, Math.floor(company?.menu_qr_table_count ?? 0)));

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      try {
        const companyData = (await getCompanyBySlug(companyId)) ?? (await getCompany(companyId));

        if (!companyData) {
          toast.error(t('menuView.companyNotFound'));
          navigate('/');
          return;
        }

        const [categoryData, productData, appearanceData] = await Promise.all([
          getMenuCategories(companyData.id),
          getProducts(companyData.id),
          getCompanyAppearance(companyData.id, BusinessType.PRODUCTS).catch(() => null),
        ]);
        
        if (appearanceData) {
          setAppearance(appearanceData);
        }

        const visibleCategories = categoryData
          .filter((c) => c.active !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const visibleProducts = productData
          .filter((p) => p.status !== 'INACTIVE')
          .map((p) => ({
            ...p,
            isAvailable: p.isAvailable ?? true,
          }));

        setCompany(companyData);
        setCategories(visibleCategories);
        setProducts(visibleProducts);

        trackEvent('MENU_VIEW', { category: GAEventCategory.NAVIGATION, company_id: companyData.id });
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [companyId, handleError, navigate, t, trackEvent]);

  const searchActive = debouncedSearchTerm.trim().length > 0;

  const baseProductsByCategory = useMemo(() => {
    return categories.reduce<Record<string, Product[]>>((acc, cat) => {
      acc[cat.id] = products
        .filter((p) => p.menuCategoryId === cat.id)
        .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0));
      return acc;
    }, {});
  }, [categories, products]);

  const filteredProductsByCategory = useMemo(() => {
    if (!searchActive) {
      return baseProductsByCategory;
    }
    const filtered: Record<string, Product[]> = {};
    categories.forEach((cat) => {
      const items = baseProductsByCategory[cat.id] || [];
      filtered[cat.id] = filterProductsBySearch(items, debouncedSearchTerm);
    });
    return filtered;
  }, [baseProductsByCategory, categories, debouncedSearchTerm, searchActive]);

  const orderedProducts = useMemo(
    () => categories.flatMap((cat) => filteredProductsByCategory[cat.id] || []),
    [categories, filteredProductsByCategory]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const ITEMS_PER_PAGE = 24;
  const totalItems = orderedProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    if (totalItems === 0) return [];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return orderedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [orderedProducts, currentPage, totalItems]);

  const displayProductsByCategory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    categories.forEach((cat) => {
      grouped[cat.id] = [];
    });
    paginatedProducts.forEach((product) => {
      if (!product.menuCategoryId) return;
      grouped[product.menuCategoryId] = grouped[product.menuCategoryId] || [];
      grouped[product.menuCategoryId].push(product);
    });
    return grouped;
  }, [categories, paginatedProducts]);

  const categoriesForNavigation = useMemo(
    () => categories.filter((cat) => (displayProductsByCategory[cat.id] || []).length > 0),
    [categories, displayProductsByCategory]
  );

  const baseTotal = useMemo(
    () =>
      cart.reduce((sum, line) => sum + (line.product.price || 0) * line.quantity, 0),
    [cart]
  );
  const deliveryFee =
    fulfillmentConfig?.delivery_fee && orderForm.delivery_type === 'DELIVERY'
      ? fulfillmentConfig.delivery_fee
      : 0;
  const totalAmount = baseTotal + deliveryFee;

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    if ((product as any).isAvailable === false || !product.price) {
      toast.error(t('menuView.productUnavailable'));
      return;
    }

    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        const updated = prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + quantity } : l
        );
        return updated;
      }
      const newCart = [...prev, { product, quantity }];
      return newCart;
    });
    toast.success(t('menuView.cartUpdated', { product: product.name, quantity }));
    
    trackEvent('MENU_ADD_TO_CART', {
      category: GAEventCategory.ENGAGEMENT,
      company_id: company?.id,
      product_id: product.id,
      quantity,
    });

    // En mobile, mostrar carrito después de agregar
    if (isMobile && !showCartModal) {
      setTimeout(() => setShowCartModal(true), 300);
    }
  }, [company?.id, isMobile, showCartModal, t, trackEvent]);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) => {
      const updated = prev
        .map((line) =>
          line.product.id === productId
            ? { ...line, quantity: Math.max(0, line.quantity + delta) }
            : line
        )
        .filter((line) => line.quantity > 0);
      
      // Feedback visual cuando se elimina un producto
      if (delta < 0 && prev.find(l => l.product.id === productId)?.quantity === 1) {
        toast.success(t('menuView.removedFromCart'));
      }
      
      return updated;
    });
  }, [t]);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const product = prev.find(l => l.product.id === productId)?.product;
      const updated = prev.filter((line) => line.product.id !== productId);
      if (product) {
        toast.success(t('menuView.removedFromCart', { product: product.name }));
      }
      return updated;
    });
  }, [t]);

  useEffect(() => {
    const firstCategoryId = categoriesForNavigation[0]?.id || null;
    if (!firstCategoryId) return;
    if (!activeCategory || !categoriesForNavigation.find((cat) => cat.id === activeCategory)) {
      setActiveCategory(firstCategoryId);
    }
  }, [activeCategory, categoriesForNavigation]);

  // Detectar categoría activa al hacer scroll
  useEffect(() => {
    if (categoriesForNavigation.length === 0) return;

    const handleScroll = () => {
      const categoryElements = categoriesForNavigation
        .map((cat) => ({
          id: cat.id,
          element: document.getElementById(`menu-cat-${cat.id}`),
        }))
        .filter((cat) => cat.element !== null);

      for (let i = categoryElements.length - 1; i >= 0; i--) {
        const cat = categoryElements[i];
        if (cat.element) {
          const rect = cat.element.getBoundingClientRect();
          const tabsHeight = tabsRef.current?.offsetHeight || 50;
          const headerHeight = 80;
          const threshold = headerHeight + tabsHeight + 20;

          if (rect.top <= threshold) {
            setActiveCategory(cat.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categoriesForNavigation]);

  const handleSubmitOrder = async () => {
    if (!company) return;

    // Validación de datos mínimos
    const clientName = sanitizeText(orderForm.client_name.trim(), 120) || 'Cliente';
    const tableNumber = sanitizeText(orderForm.table_number?.trim() || '', 50);
    const deliveryType = orderForm.delivery_type || 'TABLE';
    const deliveryAddress = orderForm.delivery_address?.trim() || '';
    const tablesConfigured = menuQrTableCount > 0;

    if (tablesConfigured && deliveryType === 'TABLE' && !tableNumber) {
      toast.error('Selecciona el número de la mesa');
      return;
    }

    if (cart.length === 0) {
      toast.error(t('menuView.cartEmpty'));
      return;
    }

    try {
      if (fulfillmentConfig?.minimum_order && baseTotal < fulfillmentConfig.minimum_order) {
        toast.error(
          t('publicPage.restaurantsLayout.fulfillment.minimumOrderError', {
            amount: fulfillmentConfig.minimum_order.toLocaleString(),
          })
        );
        return;
      }

      const needsDeliveryAddress =
        (fulfillmentConfig?.enabled && fulfillmentConfig?.modes?.includes('DELIVERY') && deliveryType === 'DELIVERY') ||
        (company.delivery_enabled && deliveryType === 'DELIVERY');

      if (needsDeliveryAddress && !deliveryAddress) {
        toast.error('Por favor ingresa la dirección de entrega');
        return;
      }

      // Persistir pedido en Firestore
      const items = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price || 0,
      }));

      const hasHiddenPrices = cart.some((item) => item.product.hide_price === true);
      const total = hasHiddenPrices ? 0 : totalAmount;

      const orderId = await createProductOrderRequest({
        company_id: company.id,
        items,
        total_estimated: total,
        client_name: clientName,
        client_whatsapp: orderForm.client_whatsapp || '',
        client_comment: orderForm.client_comment ? orderForm.client_comment.trim() : '',
        payment_method: orderForm.payment_method,
        table_number: deliveryType === 'TABLE' ? tableNumber : undefined,
        order_type: deliveryType,
        channel: 'MENU',
        status: 'REQUESTED',
      });
      const trackingLink = `https://www.pymerp.cl/${company.slug || companyId}/tracking/${orderId}`;

      // Tracking
      await createPublicPageEvent(company.id, EventType.PRODUCT_ORDER_CLICK);
      trackEvent('MENU_ORDER_SUBMITTED', {
        category: GAEventCategory.CONVERSION,
        company_id: company.id,
        total_amount: totalAmount,
        items: cart.length,
      });

      setCart([]);
      setOrderForm({
        client_name: '',
        client_whatsapp: '',
        client_comment: '',
        table_number: '',
        delivery_type: 'TABLE',
        delivery_address: '',
        delivery_location: '',
        delivery_notes: '',
        payment_method: undefined,
      });
      setShowCartModal(false);
      setOrderSuccess({ id: orderId, link: trackingLink });
      toast.success('Pedido ingresado');
    } catch (error) {
      toast.error(t('common.errorProcessingRequest'));
      handleError(error);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const mainBackgroundStyle = {
    backgroundColor: menuTheme.backgroundColor,
    backgroundImage: menuTheme.backgroundImage ? `url(${menuTheme.backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  } as React.CSSProperties;

  // Estado empty: no hay empresa o no hay categorías/productos
  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={mainBackgroundStyle}>
        <div className="text-center px-4">
          <p className="text-lg text-gray-600 mb-4">{t('menuView.companyNotFound')}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            aria-label={t('menuView.backToHome')}
          >
            {t('menuView.backToHome')}
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0 && products.length === 0) {
    return (
      <div className="min-h-screen" style={mainBackgroundStyle}>
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{company.name}</p>
              <h1 className="text-xl font-semibold text-gray-900">{t('menuView.title')}</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/${company.slug || company.id}`)}
              className="text-sm text-blue-600 hover:underline"
              aria-label={`${t('menuView.backToProfile')} - ${company.name}`}
            >
              {t('menuView.backToProfile')}
            </button>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('menuView.emptyTitle')}</h2>
            <p className="text-gray-600 mb-6">{t('menuView.emptyMessage')}</p>
            <button
              type="button"
              onClick={() => navigate(`/${company.slug || company.id}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              aria-label={`${t('menuView.backToProfile')} - ${company.name}`}
            >
              {t('menuView.backToProfile')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={mainBackgroundStyle}>
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{company?.name}</p>
            <h1 className="text-xl font-semibold text-gray-900">{t('menuView.title')}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/${company?.slug || company?.id}`)}
            className="text-sm text-blue-600 hover:underline"
            aria-label={`${t('menuView.backToProfile')} - ${company?.name || ''}`}
          >
            {t('menuView.backToProfile')}
          </button>
        </div>
        <div className="bg-white border-t border-gray-100 sticky top-20 z-20 shadow-sm">
          <div 
            ref={tabsRef}
            className="max-w-5xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categoriesForNavigation.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id, tabsRef)}
                  className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border-2 text-base sm:text-lg whitespace-nowrap transition-all duration-300 flex-shrink-0 font-semibold ${
                    isActive
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-bold shadow-md scale-105'
                      : 'border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:scale-105 active:scale-95'
                  }`}
                  aria-label={`Ver categoría ${cat.name}`}
                  aria-current={isActive ? 'true' : 'false'}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10">
        {/* Bloque Menu QR si está habilitado - Mostrar al inicio */}
        {company && isModuleEnabled(resolveCategoryId(company), 'menu-qr') && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📱</span>
                  <h3 className="text-lg font-bold text-gray-900">{t('menuView.qrTitle')}</h3>
                </div>
                <p className="text-sm text-gray-700">{t('menuView.qrDescription')}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  toast(t('menuView.qrInfo'), { duration: 4000, icon: 'ℹ️' });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 whitespace-nowrap"
                aria-label={t('menuView.qrCta')}
              >
                {t('menuView.qrCta')}
              </button>
            </div>
          </div>
        )}

        <div className="mb-10">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('publicPage.restaurantsLayout.searchPlaceholder')}
              className="w-full rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 pl-11 pr-10 text-base shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              aria-label={t('publicPage.restaurantsLayout.searchPlaceholder')}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label={t('publicPage.restaurantsLayout.clearSearch')}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Categorías en formato tarjetas tipo Uber Eats - Destacadas */}
        {categoriesForNavigation.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">Nuestras Categorías</h2>
              <p className="text-base sm:text-lg text-gray-600 font-medium hidden sm:block">
                {categoriesForNavigation.length} {categoriesForNavigation.length === 1 ? 'categoría disponible' : 'categorías disponibles'}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-7 md:gap-8">
              {categoriesForNavigation.map((cat) => {
                const catProducts = displayProductsByCategory[cat.id] || [];
                if (catProducts.length === 0) return null;
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id, tabsRef)}
                    className="group relative rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-blue-500 transform hover:-translate-y-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:scale-[0.98]"
                    style={{ backgroundColor: menuTheme.cardColor }}
                    aria-label={`Ver categoría ${cat.name}`}
                  >
                    <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:via-gray-50 group-hover:to-gray-100 transition-colors duration-300">
                      {cat.image_url ? (
                        <>
                          <img
                            src={cat.image_url}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition-all duration-500"
                            loading="lazy"
                            width="400"
                            height="400"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                      ) : menuTheme.categoryImageDefault ? (
                        <>
                          <img
                            src={menuTheme.categoryImageDefault}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition-all duration-500"
                            loading="lazy"
                            width="400"
                            height="400"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center group-hover:from-blue-100 group-hover:via-purple-100 group-hover:to-pink-100 transition-colors duration-300">
                          <span className="text-5xl sm:text-6xl md:text-7xl group-hover:scale-110 transition-transform duration-300">🍽️</span>
                        </div>
                      )}
                      {/* Badge con cantidad de productos */}
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md rounded-full px-2.5 py-1.5 shadow-lg border border-gray-200/50">
                        <span className="text-xs sm:text-sm font-extrabold text-gray-800">
                          {catProducts.length}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 sm:p-6" style={{ backgroundColor: menuTheme.cardColor }}>
                      <h3 className="font-extrabold text-base sm:text-lg md:text-xl text-center line-clamp-2 mb-2 group-hover:opacity-80 transition-colors duration-300 leading-tight" style={{ color: menuTheme.titleColor }}>
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="text-sm sm:text-base mt-2 text-center line-clamp-1" style={{ color: menuTheme.textColor, opacity: 0.8 }}>
                          {cat.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-4px] group-hover:translate-x-0" style={{ color: menuTheme.buttonColor }}>
                          Ver productos →
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Productos por categoría */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-8">
            {categoriesForNavigation.map((cat) => {
              const catProducts = displayProductsByCategory[cat.id] || [];
              if (catProducts.length === 0) return null;
              return (
                <div 
                  key={cat.id} 
                  id={`menu-cat-${cat.id}`} 
                  className="scroll-mt-24 transition-all duration-300 rounded-xl"
                >
                  {/* Header de categoría con imagen */}
                  <div className="mb-8 sm:mb-10">
                    {cat.image_url ? (
                      <div className="relative h-64 sm:h-72 md:h-80 rounded-3xl sm:rounded-[2rem] overflow-hidden mb-8 shadow-xl">
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          width="800"
                          height="200"
                          decoding="async"
                          style={{ aspectRatio: '16 / 6' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                        <div className="absolute bottom-8 sm:bottom-10 left-8 sm:left-10 right-8 sm:right-10">
                          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-3 leading-tight">{cat.name}</h2>
                          {cat.description && (
                            <p className="text-lg sm:text-xl text-white/95 font-medium">{cat.description}</p>
                          )}
                        </div>
                      </div>
                    ) : menuTheme.categoryImageDefault ? (
                      <div className="relative h-64 sm:h-72 md:h-80 rounded-3xl sm:rounded-[2rem] overflow-hidden mb-8 shadow-xl">
                        <img
                          src={menuTheme.categoryImageDefault}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          width="800"
                          height="200"
                          decoding="async"
                          style={{ aspectRatio: '16 / 6' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                        <div className="absolute bottom-8 sm:bottom-10 left-8 sm:left-10 right-8 sm:right-10">
                          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-3 leading-tight">{cat.name}</h2>
                          {cat.description && (
                            <p className="text-lg sm:text-xl text-white/95 font-medium">{cat.description}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mb-8">
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 leading-tight" style={{ color: menuTheme.titleColor }}>{cat.name}</h2>
                        {cat.description && (
                          <p className="text-lg sm:text-xl font-medium" style={{ color: menuTheme.textColor, opacity: 0.8 }}>{cat.description}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Productos en grid tipo tarjetas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    {catProducts.map((product) => (
                      <div
                        key={product.id}
                        className="rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 overflow-hidden cursor-pointer group active:scale-[0.99]"
                        style={{ backgroundColor: menuTheme.cardColor }}
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductModal(true);
                        }}
                      >
                        {/* Imagen del producto si existe - Evitar layout shift */}
                        <div className="aspect-square w-full overflow-hidden relative bg-gradient-to-br from-gray-50 to-gray-100">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-105 transition-all duration-500"
                              loading="lazy"
                              width="400"
                              height="400"
                              decoding="async"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
                              <span className="text-5xl sm:text-6xl opacity-50">🍽️</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-black/0 to-black/0 group-hover:from-black/10 group-hover:via-black/5 group-hover:to-black/0 transition-all duration-300" />
                          {/* Badge de "Ver detalles" */}
                          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md rounded-full px-3 sm:px-4 py-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shadow-lg border border-gray-200/50">
                            <span className="text-xs sm:text-sm font-semibold text-gray-900">{t('common.viewDetails')}</span>
                          </div>
                        </div>
                        <div className="p-5 sm:p-6">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-extrabold text-lg sm:text-xl mb-2 group-hover:opacity-80 transition-colors duration-300 leading-tight" style={{ color: menuTheme.titleColor }}>
                                {product.name}
                              </h3>
                              {product.description && (
                                <p className="text-sm sm:text-base line-clamp-2 mb-3 leading-relaxed opacity-90" style={{ color: menuTheme.textColor }}>
                                  {product.description}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {product.hide_price ? (
                                <span className="text-sm sm:text-base font-semibold text-gray-600">{t('menuView.priceOnRequest')}</span>
                              ) : product.price ? (
                                <p className="text-xl sm:text-2xl font-extrabold text-gray-900 whitespace-nowrap">
                                  ${numberFormatter.format(product.price)}
                                </p>
                              ) : (
                                <span className="text-sm text-gray-500">{t('common.notAvailable')}</span>
                              )}
                              {/* Badge de disponibilidad */}
                              {(product as any).isAvailable === false && (
                                <span className="text-xs sm:text-sm px-2.5 py-1 rounded-full bg-gradient-to-r from-red-100 to-red-200 text-red-700 font-semibold border border-red-300">
                                  {t('menuView.soldOut')}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Tags */}
                          {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {product.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2.5 py-1 text-xs sm:text-sm rounded-full bg-gray-100 text-gray-700 font-medium border border-gray-200"
                                >
                                  {tag}
                                </span>
                              ))}
                              {product.tags.length > 3 && (
                                <span className="px-2.5 py-1 text-xs sm:text-sm rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                                  +{product.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Botones de acción */}
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(product);
                                setShowProductModal(true);
                              }}
                              className="flex-1 px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:scale-[0.98]"
                              aria-label={`Ver detalles de ${product.name}`}
                            >
                              {t('common.viewDetails')}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 1);
                              }}
                              disabled={(product as any).isAvailable === false || !product.price}
                              className={`flex-1 px-4 py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                                (product as any).isAvailable === false || !product.price
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'hover:opacity-90 active:opacity-80 shadow-md hover:shadow-lg active:scale-[0.98]'
                              }`}
                              style={
                                (product as any).isAvailable === false || !product.price
                                  ? {}
                                  : {
                                      backgroundColor: menuTheme.buttonColor,
                                      color: menuTheme.buttonTextColor,
                                    }
                              }
                              aria-label={
                                (product as any).isAvailable === false || !product.price
                                  ? `${product.name} no disponible`
                                  : `Agregar ${product.name} al carrito`
                              }
                            >
                              {(product as any).isAvailable === false
                                ? t('menuView.soldOut')
                                : t('menuView.addToCart')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {totalItems === 0 && products.length > 0 && searchActive && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 p-6 text-center text-gray-600">
                {t('common.noResults')}
              </div>
            )}
            {totalItems > 0 && totalPages > 1 && (
              <div className="flex flex-col items-center gap-4 py-4">
                {currentPage < totalPages ? (
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    className="rounded-full px-6 py-3 text-sm font-semibold shadow-md transition bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {t('publicPage.restaurantsLayout.loadMore')}
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">{t('publicPage.restaurantsLayout.noMoreProducts')}</p>
                )}
              </div>
            )}
          </section>

          {/* Carrito Desktop - Sidebar */}
          {!isMobile && (
            <aside className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 h-fit sticky top-28">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{t('menuView.cart')}</h3>
                <span className="text-sm text-gray-500">{cart.length} {cart.length === 1 ? t('menuView.item') : t('menuView.items')}</span>
              </div>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🛒</div>
                  <p className="text-sm text-gray-500">{t('menuView.cartEmpty')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((line) => (
                    <div key={line.product.id} className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{line.product.name}</p>
                        {!line.product.hide_price && (
                          <p className="text-sm text-gray-500">
                            {line.quantity} x ${numberFormatter.format(line.product.price || 0)} = ${numberFormatter.format((line.product.price || 0) * line.quantity)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.product.id, -1)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                          aria-label={`Reducir cantidad de ${line.product.name}`}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.product.id, 1)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
                          aria-label={`Aumentar cantidad de ${line.product.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-3">
                    <span className="text-base font-semibold text-gray-900">{t('menuView.total')}</span>
                    <span className="text-xl font-bold text-gray-900">
                      ${numberFormatter.format(totalAmount)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCartModal(true)}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-md hover:shadow-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
                    aria-label={`${t('menuView.whatsappOrder')} - Total: $${numberFormatter.format(totalAmount)}`}
                  >
                    {t('menuView.whatsappOrder')}
                  </button>
                </div>
              )}
            </aside>
          )}

          {/* Carrito Mobile - Panel inferior sticky */}
          {isMobile && cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg lg:hidden">
              <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {cart.length} {cart.length === 1 ? t('menuView.item') : t('menuView.items')}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      ${numberFormatter.format(totalAmount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCartModal(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 active:bg-green-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
                    aria-label={t('menuView.viewCart')}
                  >
                    {t('menuView.viewCart')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de detalles del producto */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setSelectedProduct(null);
        }}
        onAddToCart={(product) => addToCart(product, 1)}
        isAvailable={(selectedProduct as any)?.isAvailable !== false}
        t={t}
      />

      {/* Modal/Drawer del carrito */}
      <CartModal
        isOpen={showCartModal}
        cart={cart.map(line => ({ product: line.product, quantity: line.quantity }))}
        orderForm={orderForm}
        orderChannel="MENU"
        menuQrTableCount={menuQrTableCount}
        deliveryEnabled={company?.delivery_enabled}
        fulfillmentConfig={fulfillmentConfig}
        onClose={() => setShowCartModal(false)}
        onQuantityChange={(productId, quantity) => {
          const delta = quantity - (cart.find(l => l.product.id === productId)?.quantity || 0);
          updateQuantity(productId, delta);
        }}
        onRemove={removeFromCart}
        onFormChange={(field, value) => setOrderForm(prev => ({ ...prev, [field]: value }))}
        onSubmit={handleSubmitOrder}
      />
      {orderSuccess && (
        <OrderSuccessModal
          isOpen={!!orderSuccess}
          onClose={() => setOrderSuccess(null)}
          orderCode={orderSuccess.id.slice(-6).toUpperCase()}
          trackingLink={orderSuccess.link}
        />
      )}

      {/* Padding bottom para mobile cuando hay carrito */}
      {isMobile && cart.length > 0 && <div className="h-24" />}
    </div>
  );
}
