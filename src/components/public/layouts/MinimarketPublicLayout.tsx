import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import AnimatedButton from '../../animations/AnimatedButton';
import { PublicLayoutShell } from '../../../pages/public/layouts/PublicLayoutShell';
import { type PublicLayoutProps, type PublicLayoutSections } from '../../../pages/public/layouts/types';
import { BusinessType, type Product } from '../../../types';
import { isModuleEnabled, resolveCategoryId } from '../../../config/categories';
import { useDebounce } from '../../../hooks/useDebounce';

type SortOption = 'relevance' | 'priceAsc' | 'priceDesc';

type FulfillmentConfig = {
  title?: string;
  description?: string;
  modes?: Array<'DELIVERY' | 'PICKUP'>;
  note?: string;
};

const sanitizeCategoryLabel = (label: string) => {
  return label
    .replace(/^\s*etiquetas?\s*:?\s*/i, '')
    .replace(/#\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

function getProductQuantity(cart: PublicLayoutProps['cart'] | undefined, productId: string): number {
  if (!cart) return 0;
  const line = cart.find((item) => item.product.id === productId);
  return line ? line.quantity : 0;
}

function getFulfillmentConfig(company: PublicLayoutProps['company']): FulfillmentConfig {
  const fallback = (company as any)?.info ?? {};
  const raw =
    (company as any)?.fulfillment_config ??
    (company as any)?.fulfillment ??
    (company as any)?.delivery_config ??
    fallback?.fulfillment ??
    fallback?.delivery;

  if (!raw || typeof raw !== 'object') {
    return {};
  }

  return {
    title: raw.title ?? raw.heading ?? raw.name,
    description: raw.description ?? raw.body ?? raw.subtitle,
    modes: raw.modes ?? raw.options ?? raw.methods,
    note: raw.note ?? raw.remark,
  };
}

function buildSearchText(product: Product): string {
  const tags = (product.tags || []).join(' ');
  return `${product.name} ${product.description || ''} ${tags}`.toLowerCase();
}

export function MinimarketPublicLayout(props: PublicLayoutProps) {
  const {
    company,
    products = [],
    sections,
    contactActions,
    appearance,
    theme,
    variant,
    floatingCta,
    onWhatsAppClick,
    onOpenCart,
    onAddToCart,
    onUpdateQuantity,
    onProductClick,
    cart = [],
    cartItems = 0,
    cartTotal = 0,
    hasHiddenPrices,
    menuCategories = [],
  } = props;
  const { t, i18n } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastAddedProduct, setLastAddedProduct] = useState<string | null>(null);

  // Debounce search term para mejor performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const categoryId = resolveCategoryId(company);
  const inventoryEnabled = isModuleEnabled(categoryId, 'inventory');
  const fulfillmentConfig = getFulfillmentConfig(company);
  const hideHeroForDistributors = categoryId === 'distribuidores';

  // Items por página para paginación
  const ITEMS_PER_PAGE = 24;

  const categoryFilters = useMemo(() => {
    const categories =
      menuCategories
        .filter((cat) => cat.active !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((cat) => ({ id: cat.id, name: cat.name })) || [];

    if (categories.length === 0) {
      return [{ id: 'all', name: t('publicPage.minimarketLayout.allCategory') }];
    }

    return [{ id: 'all', name: t('publicPage.minimarketLayout.allCategory') }, ...categories];
  }, [menuCategories, t]);

  const tagFilters = useMemo(() => {
    const tags = new Set<string>();
    products.forEach((product) => {
      product.tags?.forEach((tag) => {
        if (tag) tags.add(tag);
      });
    });
    return Array.from(tags);
  }, [products]);

  const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.menuCategoryId === selectedCategory;
      const matchesTags =
        activeTags.length === 0 ||
        (product.tags || []).some((tag) => tag && activeTags.includes(tag));
      const matchesSearch =
        normalizedSearch.length === 0 || buildSearchText(product).includes(normalizedSearch);

      return matchesCategory && matchesTags && matchesSearch;
    });
  }, [products, selectedCategory, activeTags, normalizedSearch]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, activeTags, normalizedSearch]);

  const sortedProducts = useMemo(() => {
    const relevanceScore = (product: Product) => {
      let score = 0;
      if (typeof product.menuOrder === 'number') {
        score += Math.max(0, 100 - product.menuOrder);
      }
      if (normalizedSearch) {
        const text = buildSearchText(product);
        if (text.includes(normalizedSearch)) score += 30;
        if (product.tags?.some((tag) => tag?.toLowerCase() === normalizedSearch)) score += 10;
      }
      if (product.isAvailable === false || product.status === 'INACTIVE') score -= 25;
      if (inventoryEnabled && typeof product.stock === 'number') {
        if (product.stock <= 0) score -= 30;
        else if (product.stock <= 3) score -= 5;
      }
      return score;
    };

    if (sortBy === 'priceAsc') {
      return [...filteredProducts].sort((a, b) => (a.price || 0) - (b.price || 0));
    }
    if (sortBy === 'priceDesc') {
      return [...filteredProducts].sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    return [...filteredProducts].sort((a, b) => relevanceScore(b) - relevanceScore(a));
  }, [filteredProducts, sortBy, normalizedSearch, inventoryEnabled]);

  // Paginación
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  const handleAddProduct = useCallback((product: Product, quantity = 1) => {
    if (!onAddToCart || product.isAvailable === false) {
      if (isProductOutOfStock(product)) {
        toast.error(t('publicPage.minimarketLayout.errorOutOfStock', { name: product.name }));
      } else {
        toast.error(t('publicPage.minimarketLayout.errorUnavailable', { name: product.name }));
      }
      return;
    }

    // Validar stock si está habilitado
    if (inventoryEnabled && typeof product.stock === 'number') {
      const currentQuantity = getProductQuantity(cart, product.id);
      if (product.stock < currentQuantity + quantity) {
        toast.error(t('publicPage.minimarketLayout.errorInsufficientStock', { 
          name: product.name, 
          stock: product.stock 
        }));
        return;
      }
    }

    onAddToCart(product, quantity);
    setLastAddedProduct(product.id);
    
    // Feedback visual con toast
    toast.success(t('publicPage.minimarketLayout.addedToCart', { 
      name: product.name, 
      quantity 
    }), {
      duration: 2000,
      icon: '🛒',
    });

    // Resetear highlight después de 1 segundo
    setTimeout(() => setLastAddedProduct(null), 1000);
  }, [onAddToCart, inventoryEnabled, cart, t]);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    if (!onUpdateQuantity) return;
    const product = products.find((item) => item.id === productId);
    
    if (product?.isAvailable === false && quantity > getProductQuantity(cart, productId)) {
      toast.error(t('publicPage.minimarketLayout.errorUnavailable', { name: product.name }));
      return;
    }

    // Validar stock si está habilitado
    if (inventoryEnabled && product && typeof product.stock === 'number' && quantity > product.stock) {
      toast.error(t('publicPage.minimarketLayout.errorInsufficientStock', { 
        name: product.name, 
        stock: product.stock 
      }));
      return;
    }

    onUpdateQuantity(productId, quantity);
    
    if (quantity === 0) {
      toast.success(t('publicPage.minimarketLayout.removedFromCart', { name: product?.name || '' }), {
        duration: 1500,
      });
    }
  }, [onUpdateQuantity, products, cart, inventoryEnabled, t]);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  const isProductOutOfStock = (product: Product) =>
    inventoryEnabled && typeof product.stock === 'number' && product.stock <= 0;

  const isProductLowStock = (product: Product) =>
    inventoryEnabled && typeof product.stock === 'number' && product.stock > 0 && product.stock <= 3;

  const fulfillmentTitle = fulfillmentConfig.title || t('publicPage.minimarketLayout.fulfillmentTitle');
  const fulfillmentDescription =
    fulfillmentConfig.description ||
    (company.delivery_enabled
      ? t('publicPage.minimarketLayout.deliveryAndPickup')
      : t('publicPage.minimarketLayout.pickupOnly', { address: company.address || t('publicPage.minimarketLayout.pickupAddressFallback') }));
  const fulfillmentModes =
    fulfillmentConfig.modes && fulfillmentConfig.modes.length > 0
      ? fulfillmentConfig.modes
      : company.delivery_enabled
      ? (['DELIVERY', 'PICKUP'] as Array<'DELIVERY' | 'PICKUP'>)
      : (['PICKUP'] as Array<'DELIVERY' | 'PICKUP'>);

  const formattedTotal = hasHiddenPrices
    ? t('publicPage.restaurantsLayout.cartTotalHidden')
    : t('publicPage.restaurantsLayout.cartTotal', {
        value: cartTotal.toLocaleString(i18n.language),
      });

  const canSendOrder = cartItems > 0 && (onOpenCart || onWhatsAppClick);

  const floatingOrderCta =
    cartItems >= 0 && (onOpenCart || onWhatsAppClick) ? (
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500">
            {cartItems > 0
              ? t('publicPage.minimarketLayout.cartHint', { count: cartItems })
              : t('publicPage.minimarketLayout.sendOrderDisabled')}
          </p>
          <p className="truncate text-sm font-bold text-slate-900">{formattedTotal}</p>
          <p className="text-[11px] text-slate-500">{t('publicPage.minimarketLayout.validationReminder')}</p>
        </div>
        <AnimatedButton
          onClick={() => {
            if (!canSendOrder) return;
            if (onOpenCart) {
              onOpenCart();
            } else {
              onWhatsAppClick?.();
            }
          }}
          disabled={!canSendOrder}
          className="rounded-full px-4 py-2 text-sm font-semibold shadow-sm"
          style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
          ariaLabel={t('publicPage.minimarketLayout.sendOrder')}
        >
          🛒 {t('publicPage.minimarketLayout.sendOrder')}
        </AnimatedButton>
      </div>
    ) : (
      floatingCta
    );

  const desktopOrderSummary =
    cartItems > 0 && (onOpenCart || onWhatsAppClick) ? (
      <div className="fixed right-6 top-28 z-30 hidden w-80 lg:block">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-2xl backdrop-blur">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              {t('publicPage.restaurantsLayout.cartLabel')}
            </p>
            <p className="text-xl font-bold" style={{ color: theme.titleColor }}>
              {formattedTotal}
            </p>
            <p className="text-xs text-slate-500">
              {t('publicPage.minimarketLayout.cartHint', { count: cartItems })}
            </p>
            <p className="text-[11px] text-slate-500">
              {t('publicPage.minimarketLayout.validationReminder')}
            </p>
          </div>
          <div className="pt-3">
            <AnimatedButton
              onClick={() => {
                if (!canSendOrder) return;
                if (onOpenCart) {
                  onOpenCart();
                } else {
                  onWhatsAppClick?.();
                }
              }}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
              style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
              disabled={!canSendOrder}
            >
              {t('publicPage.minimarketLayout.sendOrder')}
            </AnimatedButton>
          </div>
        </div>
      </div>
    ) : null;

  const heroBlock = hideHeroForDistributors ? null : (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
            {t('publicPage.minimarketLayout.heroKicker')}
          </p>
          <h1
            className="text-3xl font-bold leading-tight sm:text-4xl"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {company.name}
          </h1>
          <p className="max-w-2xl text-sm text-slate-700 sm:text-base" style={{ fontFamily: theme.fontBody }}>
            {company.description || t('publicPage.minimarketLayout.heroDescription')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {fulfillmentModes.map((mode) => (
              <span
                key={mode}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
              >
                {t(`publicPage.minimarketLayout.deliveryModes.${mode}`)}
              </span>
            ))}
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              {company.business_type === BusinessType.PRODUCTS || company.businessMode === 'BOTH'
                ? t('publicPage.restaurantsLayout.fastOrder')
                : t('publicPage.restaurantsLayout.consultations')}
            </span>
          </div>
        </div>
        {appearance?.banner_url && (
          <div className="relative h-40 w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white/70 shadow-lg">
            <img
              src={appearance.banner_url}
              alt={company.name}
              className="h-full w-full object-cover transition duration-500 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/0 to-black/0" />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm backdrop-blur">
        <label className="sr-only" htmlFor="minimarket-search">
          {t('common.search')}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              id="minimarket-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('publicPage.minimarketLayout.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              style={{ fontFamily: theme.fontBody }}
              aria-label={t('common.search')}
              aria-describedby="search-results-count"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
              🔎
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span id="search-results-count" className="rounded-full bg-slate-100 px-3 py-2 font-semibold" role="status" aria-live="polite">
              {t('publicPage.minimarketLayout.resultsCount', { count: filteredProducts.length })}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-2 font-semibold text-amber-700">
              {t('publicPage.minimarketLayout.deliveryNote')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const filtersBar = (
    <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((category) => {
            const isActive = selectedCategory === category.id;
            const displayName = sanitizeCategoryLabel(category.name);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-slate-900 text-white shadow' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
              >
                {displayName || category.name}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-products" className="text-xs font-semibold text-slate-600">
            {t('publicPage.minimarketLayout.orderBy')}
          </label>
          <select
            id="sort-products"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none"
          >
            <option value="relevance">{t('publicPage.minimarketLayout.orderOptions.relevance')}</option>
            <option value="priceAsc">{t('publicPage.minimarketLayout.orderOptions.priceLow')}</option>
            <option value="priceDesc">{t('publicPage.minimarketLayout.orderOptions.priceHigh')}</option>
          </select>
        </div>
      </div>
      {tagFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {t('publicPage.minimarketLayout.filterTags')}
          </span>
          {tagFilters.map((tag) => {
            const isActive = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isActive ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const fulfillmentBanner = (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
            {t('publicPage.minimarketLayout.deliveryTitle')}
          </p>
          <h3 className="text-lg font-bold text-emerald-900" style={{ fontFamily: theme.fontTitle }}>
            {fulfillmentTitle}
          </h3>
          <p className="text-sm text-emerald-800" style={{ fontFamily: theme.fontBody }}>
            {fulfillmentDescription}
          </p>
          {fulfillmentConfig.note && (
            <p className="text-xs text-emerald-700">{fulfillmentConfig.note}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {fulfillmentModes.map((mode) => (
            <span
              key={mode}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100"
            >
              {t(`publicPage.minimarketLayout.deliveryModes.${mode}`)}
            </span>
          ))}
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100">
            🚚 {company.address ? company.address : t('publicPage.minimarketLayout.addressPending')}
          </span>
        </div>
      </div>
    </div>
  );

  const productCards = (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {paginatedProducts.map((product) => {
        const quantity = getProductQuantity(cart, product.id);
        const priceLabel = product.hide_price
          ? t('publicPage.barberLayout.priceOnRequest')
          : `$${product.price.toLocaleString(i18n.language)}`;
        const outOfStock = isProductOutOfStock(product);
        const lowStock = isProductLowStock(product);
        const isUnavailable = product.isAvailable === false || product.status === 'INACTIVE' || outOfStock;

        return (
          <article
            key={product.id}
            className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
              lastAddedProduct === product.id ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
            }`}
          >
            {product.image_url && (
              <button type="button" onClick={() => onProductClick?.(product)} className="relative h-40 w-full overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Badge de stock solo si inventory está habilitado y hay información relevante */}
                {inventoryEnabled && (
                  <>
                    {isUnavailable && (
                      <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow" role="status" aria-label={t('publicPage.minimarketLayout.stockOut')}>
                        {t('publicPage.restaurantsLayout.unavailable')}
                      </span>
                    )}
                    {lowStock && !isUnavailable && (
                      <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 shadow" role="status" aria-label={t('publicPage.minimarketLayout.stockLow', { stock: product.stock })}>
                        {t('publicPage.minimarketLayout.stockLow', { stock: product.stock })}
                      </span>
                    )}
                  </>
                )}
              </button>
            )}
            <div className="flex flex-1 flex-col space-y-3 p-4" style={{ color: theme.textColor }}>
              <div className="space-y-1">
                <h3
                  className="line-clamp-2 text-lg font-semibold leading-tight"
                  style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
                >
                  {product.name}
                </h3>
                <p className="line-clamp-2 text-sm text-slate-600" style={{ fontFamily: theme.fontBody }}>
                  {product.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.tags?.slice(0, 3).map(
                    (tag) =>
                      tag && (
                        <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                          #{tag}
                        </span>
                      )
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {t('publicPage.minimarketLayout.priceFrom')}
                  </p>
                  <p className="text-xl font-bold" style={{ color: theme.titleColor }}>
                    {priceLabel}
                  </p>
                  {/* Mostrar stock solo si está habilitado y es relevante (agotado o bajo stock) */}
                  {inventoryEnabled && typeof product.stock === 'number' && (outOfStock || lowStock) && (
                    <p className={`text-xs font-semibold ${outOfStock ? 'text-red-600' : 'text-amber-600'}`}>
                      {outOfStock
                        ? t('publicPage.minimarketLayout.stockOut')
                        : t('publicPage.minimarketLayout.stockLow', { stock: product.stock })}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {quantity > 0 ? (
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-semibold shadow-inner">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(product.id, Math.max(0, quantity - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-800 shadow-sm transition hover:bg-slate-100"
                        aria-label={t('publicPage.minimarketLayout.decreaseQuantity', { name: product.name })}
                      >
                        −
                      </button>
                      <span className="min-w-[2ch] text-center">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newQuantity = quantity + 1;
                          // Validar stock antes de incrementar
                          if (inventoryEnabled && typeof product.stock === 'number' && newQuantity > product.stock) {
                            toast.error(t('publicPage.minimarketLayout.errorInsufficientStock', { 
                              name: product.name, 
                              stock: product.stock 
                            }));
                            return;
                          }
                          handleUpdateQuantity(product.id, newQuantity);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isUnavailable || (inventoryEnabled && typeof product.stock === 'number' && quantity >= product.stock)}
                        aria-label={t('publicPage.minimarketLayout.increaseQuantity', { name: product.name })}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <AnimatedButton
                      onClick={() => handleAddProduct(product)}
                      disabled={isUnavailable}
                      className="rounded-full px-4 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        backgroundColor: theme.buttonColor,
                        color: theme.buttonTextColor,
                        fontFamily: theme.fontButton,
                      }}
                      ariaLabel={t('publicPage.minimarketLayout.quickAdd')}
                    >
                      {t('publicPage.minimarketLayout.quickAdd')}
                    </AnimatedButton>
                  )}
                  <button
                    type="button"
                    onClick={() => onProductClick?.(product)}
                    className="text-xs font-semibold text-slate-600 underline-offset-2 transition hover:text-slate-900 hover:underline"
                  >
                    {t('publicPage.minimarketLayout.viewDetails')}
                  </button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            aria-label={t('common.previous')}
          >
            {t('common.previous')}
          </button>
          <span className="px-4 py-2 text-sm font-semibold text-slate-700">
            {t('publicPage.minimarketLayout.pageInfo', { current: currentPage, total: totalPages })}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            aria-label={t('common.next')}
          >
            {t('common.next')}
          </button>
        </div>
      )}
    </>
  );

  const productsSection = (
    <section className="space-y-5 rounded-3xl border border-slate-200/70 bg-white/70 p-4 shadow-sm backdrop-blur sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            {t('publicPage.minimarketLayout.productsKicker')}
          </p>
          <h2
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {t('publicPage.minimarketLayout.productsTitle', { name: company.name })}
          </h2>
          <p className="text-sm text-slate-600" style={{ fontFamily: theme.fontBody }}>
            {t('publicPage.minimarketLayout.productsSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold text-slate-700">
          <span className="rounded-full bg-slate-100 px-3 py-1">
            {t('publicPage.minimarketLayout.resultsCount', { count: sortedProducts.length })}
          </span>
          {cartItems > 0 && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 ring-1 ring-emerald-200">
              {t('publicPage.minimarketLayout.cartHint', { count: cartItems })}
            </span>
          )}
        </div>
      </div>

      {filtersBar}
      {fulfillmentBanner}

      {sortedProducts.length > 0 ? (
        productCards
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center shadow-sm" role="status" aria-live="polite">
          <div className="text-4xl mb-3" aria-hidden="true">🔍</div>
          <p className="text-base font-semibold text-slate-800 mb-2">
            {t('publicPage.minimarketLayout.emptyTitle')}
          </p>
          <p className="text-sm text-slate-600 mb-4">{t('publicPage.minimarketLayout.emptySubtitle')}</p>
          {(searchTerm || selectedCategory !== 'all' || activeTags.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setActiveTags([]);
              }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline mb-4"
            >
              {t('publicPage.minimarketLayout.clearFilters')}
            </button>
          )}
          {onWhatsAppClick && (
            <div className="mt-3 flex justify-center">
              <AnimatedButton
                onClick={onWhatsAppClick}
                className="rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm"
                style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
              >
                {t('publicPage.minimarketLayout.sendOrder')}
              </AnimatedButton>
            </div>
          )}
        </div>
      )}
    </section>
  );

  const mergedSections: PublicLayoutSections = {
    ...sections,
    hero: heroBlock || undefined,
    products: productsSection,
    services: undefined,
  };

  return (
    <>
      <PublicLayoutShell
        {...props}
        variant={variant}
        sections={mergedSections}
        contactActions={contactActions}
        floatingCta={floatingOrderCta || floatingCta}
      />
      {desktopOrderSummary}
    </>
  );
}
