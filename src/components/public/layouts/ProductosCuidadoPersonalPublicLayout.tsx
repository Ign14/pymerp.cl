import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import AnimatedButton from '../../animations/AnimatedButton';
import { PublicLayoutShell } from '../../../pages/public/layouts/PublicLayoutShell';
import { type PublicLayoutProps, type PublicLayoutSections } from '../../../pages/public/layouts/types';
import { type Product } from '../../../types';
import { useDebounce } from '../../../hooks/useDebounce';

type VariantSummary = {
  label: string;
  priceLabel?: string;
};

function buildSearchIndex(product: Product): string {
  const parts = [product.name, product.description || '', (product.tags || []).join(' ')];
  const variantNames = Array.isArray((product as any)?.variants)
    ? ((product as any).variants as any[])
        .map((variant) => {
          if (typeof variant === 'string') return variant;
          if (variant && typeof variant === 'object' && 'name' in variant) return (variant as any).name;
          return null;
        })
        .filter(Boolean)
    : [];
  return [...parts, ...variantNames].join(' ').toLowerCase();
}

function getCartQuantity(cart: PublicLayoutProps['cart'] | undefined, productId: string): number {
  if (!cart) return 0;
  const item = cart.find((line) => line.product.id === productId);
  return item ? item.quantity : 0;
}

function normalizeVariants(product: Product): VariantSummary[] {
  const rawVariants = (product as any)?.variants;
  if (Array.isArray(rawVariants)) {
    return rawVariants
      .map((variant) => {
        if (typeof variant === 'string') {
          return { label: variant };
        }
        if (variant && typeof variant === 'object') {
          const name = (variant as any).name || (variant as any).label || (variant as any).title;
          const priceValue = (variant as any).price ?? (variant as any).amount;
          const priceLabel =
            typeof priceValue === 'number'
              ? `$${priceValue.toLocaleString('es-CL')}`
              : typeof priceValue === 'string'
              ? priceValue
              : undefined;
          return name ? { label: String(name), priceLabel } : null;
        }
        return null;
      })
      .filter(Boolean) as VariantSummary[];
  }

  return (product.tags || []).slice(0, 3).map((tag) => ({ label: tag }));
}

function ProductCard({
  product,
  theme,
  onAddToCart,
  onUpdateQuantity,
  onProductClick,
  onWhatsAppClick,
  cart,
  hasHiddenPrices,
  lastAddedProductId,
}: {
  product: Product;
  theme: PublicLayoutProps['theme'];
  onAddToCart?: (product: Product, quantity?: number) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onProductClick?: (product: Product) => void;
  onWhatsAppClick?: () => void;
  cart?: PublicLayoutProps['cart'];
  hasHiddenPrices?: boolean;
  lastAddedProductId?: string | null;
}) {
  const { t, i18n } = useTranslation();
  const variants = normalizeVariants(product);
  const quantity = getCartQuantity(cart, product.id);
  const canAdd = product.isAvailable !== false && product.status !== 'INACTIVE';

  const handleAdd = () => {
    if (!canAdd) {
      toast.error(t('publicPage.personalCareLayout.productUnavailable', { name: product.name }));
      return;
    }
    if (product.hide_price) {
      onWhatsAppClick?.();
      return;
    }
    onAddToCart?.(product, 1);
  };

  const handleIncrease = () => {
    if (!onUpdateQuantity || !canAdd) return;
    onUpdateQuantity(product.id, quantity + 1);
  };

  const handleDecrease = () => {
    if (!onUpdateQuantity) return;
    const nextQty = Math.max(quantity - 1, 0);
    onUpdateQuantity(product.id, nextQty);
  };

  const priceLabel =
    product.hide_price || hasHiddenPrices
      ? t('publicPage.personalCareLayout.consultCta')
      : product.price
      ? `$${product.price.toLocaleString(i18n.language)}`
      : t('common.notAvailable');

  const isHighlighted = lastAddedProductId === product.id;

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border transition-all ${
        isHighlighted 
          ? 'border-emerald-400 bg-emerald-50/50 shadow-lg scale-[1.02]' 
          : 'border-slate-200 bg-white/80 shadow-sm hover:-translate-y-1 hover:shadow-lg'
      }`}
      style={{ backgroundColor: theme.cardColor }}
      onClick={() => onProductClick?.(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onProductClick?.(product);
        }
      }}
      aria-label={`${product.name} - ${priceLabel}`}
    >
      <div className="relative h-40 overflow-hidden bg-slate-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">📦</div>
        )}
        {product.hide_price && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            {t('publicPage.personalCareLayout.consultCta')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-500">
              {t('publicPage.personalCareLayout.whatsappCheckout')}
            </p>
            <h3
              className="line-clamp-2 text-lg font-semibold leading-tight text-slate-900"
              style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
            >
              {product.name}
            </h3>
            {product.description && (
              <p className="line-clamp-2 text-sm text-slate-600" style={{ color: theme.textColor }}>
                {product.description}
              </p>
            )}
          </div>
          <span className="rounded-lg bg-slate-900/5 px-3 py-1 text-sm font-semibold text-slate-900" style={{ color: theme.buttonColor }}>
            {priceLabel}
          </span>
        </div>

        {variants.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-500">
              {t('publicPage.personalCareLayout.variantsLabel')}
            </p>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <span
                  key={variant.label}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100"
                >
                  {variant.label}
                  {variant.priceLabel && <span className="text-[11px] font-medium text-emerald-600">{variant.priceLabel}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {product.tags && product.tags.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-slate-500">
              {t('publicPage.personalCareLayout.benefitsLabel')}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.tags.slice(0, 3).map((tag) => (
                <span 
                  key={tag} 
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 truncate max-w-full"
                  title={tag}
                >
                  {tag}
                </span>
              ))}
              {product.tags.length > 3 && (
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                  +{product.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <div onClick={(e) => e.stopPropagation()} className="flex-1">
          <AnimatedButton
            onClick={handleAdd}
            className="w-full rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
            style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
            disabled={!canAdd}
            ariaLabel={`${product.hide_price ? t('publicPage.personalCareLayout.consultCta') : t('publicPage.personalCareLayout.addCta')} ${product.name}`}
          >
            {product.hide_price ? t('publicPage.personalCareLayout.consultCta') : t('publicPage.personalCareLayout.addCta')}
          </AnimatedButton>
          </div>

          {quantity > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handleDecrease}
                className="h-8 w-8 rounded-full bg-slate-100 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                aria-label={t('publicPage.minimarketLayout.decreaseQuantity', { name: product.name })}
              >
                -
              </button>
              <span className="min-w-[1.5rem] text-center text-sm font-semibold text-slate-900">{quantity}</span>
              <button
                type="button"
                onClick={handleIncrease}
                className="h-8 w-8 rounded-full bg-slate-900 text-sm font-bold text-white transition hover:bg-slate-800"
                aria-label={t('publicPage.minimarketLayout.increaseQuantity', { name: product.name })}
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductosCuidadoPersonalPublicLayout(props: PublicLayoutProps) {
  const {
    company,
    products = [],
    sections,
    contactActions,
    theme,
    variant,
    floatingCta,
    onAddToCart,
    onUpdateQuantity,
    onProductClick,
    onOpenCart,
    onWhatsAppClick,
    cart = [],
    cartItems = 0,
    hasHiddenPrices,
    menuCategories = [],
  } = props;
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastAddedProduct, setLastAddedProduct] = useState<string | null>(null);

  // Debounce search term para mejor performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Wrapper para onAddToCart con feedback visual
  const handleAddToCartWithFeedback = (product: Product, quantity?: number) => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
      setLastAddedProduct(product.id);
      toast.success(t('publicPage.personalCareLayout.addedToCart', { name: product.name }), {
        duration: 2000,
        icon: '🛒',
      });
      setTimeout(() => setLastAddedProduct(null), 1000);
    }
  };

  // Persistencia ligera del carrito en sessionStorage
  useEffect(() => {
    if (cart && cart.length > 0 && company?.id) {
      try {
        const cartData = {
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          timestamp: Date.now(),
        };
        sessionStorage.setItem(`cart_${company.id}`, JSON.stringify(cartData));
      } catch (error) {
        console.warn('Error saving cart to sessionStorage:', error);
      }
    }
  }, [cart, company?.id]);

  // Restaurar carrito desde sessionStorage al montar (solo si no hay carrito actual)
  useEffect(() => {
    if (cart.length === 0 && company?.id && onAddToCart) {
      try {
        const savedCart = sessionStorage.getItem(`cart_${company.id}`);
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          // Solo restaurar si tiene menos de 1 hora
          if (Date.now() - cartData.timestamp < 3600000) {
            // Restaurar productos del carrito guardado
            // Nota: Esto requiere que los productos estén cargados
            // Por ahora solo guardamos, la restauración completa requeriría más lógica
          }
        }
      } catch (error) {
        console.warn('Error restoring cart from sessionStorage:', error);
      }
    }
  }, [cart.length, company?.id, onAddToCart]);

  const availableProducts = useMemo(
    () => products.filter((product) => product.status !== 'INACTIVE'),
    [products]
  );

  const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();

  const categoryFilters = useMemo(() => {
    const ordered = menuCategories
      .filter((cat) => cat.active !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return [{ id: 'all', name: t('publicPage.personalCareLayout.allCategory') }, ...ordered.map((cat) => ({ id: cat.id, name: cat.name }))];
  }, [menuCategories, t]);

  const filteredProducts = useMemo(() => {
    return availableProducts.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || product.menuCategoryId === selectedCategory;
      const matchesSearch =
        normalizedSearch.length === 0 || buildSearchIndex(product).includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [availableProducts, normalizedSearch, selectedCategory]);

  const recommendedProducts = useMemo(() => {
    if (!availableProducts || availableProducts.length === 0) {
      return [];
    }

    try {
      const highlighted = availableProducts.filter((product) => {
        if (product.isAvailable === false || product.status === 'INACTIVE') {
          return false;
        }
        const tags = (product.tags || []).map((tag) => tag.toLowerCase());
        const hasHighlightTag = tags.some((tag) =>
          ['recomendado', 'destacado', 'premium', 'best', 'top', 'featured', 'popular'].includes(tag)
        );
        const hasVariants = normalizeVariants(product).length > 0;
        return hasHighlightTag || hasVariants;
      });

      const sorted = highlighted.sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0));
      // Solo retornar si hay al menos 3 productos recomendados
      return sorted.length >= 3 ? sorted.slice(0, 4) : [];
    } catch (error) {
      console.warn('Error calculating recommended products:', error);
      return [];
    }
  }, [availableProducts]);

  const resultsLabel = filteredProducts.length === 1
    ? t('publicPage.personalCareLayout.resultsLabel', { count: filteredProducts.length })
    : t('publicPage.personalCareLayout.resultsLabel_plural', { count: filteredProducts.length });

  const hero = (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.25em] text-rose-500">
          {t('publicPage.personalCareLayout.heroKicker')}
        </p>
        <h1
          className="text-3xl font-bold text-slate-900 sm:text-4xl"
          style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
        >
          {t('publicPage.personalCareLayout.heroTitle', { name: company.name })}
        </h1>
        <p className="text-base text-slate-700 sm:text-lg" style={{ color: theme.textColor }}>
          {t('publicPage.personalCareLayout.heroSubtitle')}
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="relative w-full">
            <label htmlFor="product-search" className="sr-only">
              {t('publicPage.personalCareLayout.searchPlaceholder')}
            </label>
            <input
              id="product-search"
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('publicPage.personalCareLayout.searchPlaceholder')}
              className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 pr-10 text-sm shadow-inner focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100 transition-all"
              aria-label={t('publicPage.personalCareLayout.searchPlaceholder')}
              aria-describedby="search-hint"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">🔍</span>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                aria-label={t('common.clearSearch')}
              >
                ×
              </button>
            )}
          </div>
          {searchTerm && (
            <p id="search-hint" className="text-xs text-slate-500 mt-1">
              {t('publicPage.personalCareLayout.searching')}
            </p>
          )}

          <div className="flex items-center gap-3">
            <div className="hidden text-xs font-semibold uppercase text-slate-500 sm:block">
              {t('publicPage.personalCareLayout.cartLabel')}
            </div>
            <button
              type="button"
              onClick={() => (onOpenCart ? onOpenCart() : onWhatsAppClick?.())}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
            >
              <span aria-hidden>🛒</span>
              {t('publicPage.personalCareLayout.cartCta')}
              <span className="ml-1 rounded-full bg-white/20 px-2 py-1 text-xs font-bold">{cartItems}</span>
            </button>
          </div>
        </div>

        {categoryFilters.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-500">
              {t('publicPage.personalCareLayout.categoriesLabel')}
            </span>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('publicPage.personalCareLayout.categoriesLabel')}>
              {categoryFilters.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  role="tab"
                  aria-selected={selectedCategory === category.id}
                  aria-controls={`category-${category.id}`}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    selectedCategory === category.id
                      ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm focus-visible:outline-rose-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-rose-200 focus-visible:outline-slate-400'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 text-xs font-semibold text-slate-700 ring-1 ring-slate-100">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-900 shadow-inner">
            ✅ {t('publicPage.personalCareLayout.checkoutNote')}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-900 shadow-inner">
            💬 {t('publicPage.personalCareLayout.whatsappCheckoutHint')}
          </span>
        </div>
      </div>
    </div>
  );

  // Solo mostrar sección recomendados si hay al menos 3 productos
  const recommendedSection =
    recommendedProducts.length >= 3 ? (
      <section className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm" aria-labelledby="recommended-title">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-600">
              {t('publicPage.personalCareLayout.recommendedTitle')}
            </p>
            <h2 id="recommended-title" className="text-sm font-semibold text-emerald-800">
              {t('publicPage.personalCareLayout.recommendedSubtitle')}
            </h2>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            {recommendedProducts.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recommendedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              theme={theme}
              onAddToCart={handleAddToCartWithFeedback}
              lastAddedProductId={lastAddedProduct}
              onUpdateQuantity={onUpdateQuantity}
              onProductClick={onProductClick}
              onWhatsAppClick={onWhatsAppClick}
              cart={cart}
              hasHiddenPrices={hasHiddenPrices}
            />
          ))}
        </div>
      </section>
    ) : null;

  const productsSection = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            {t('publicPage.personalCareLayout.filtersTitle')}
          </p>
          <h2
            className="text-2xl font-bold text-slate-900"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {t('publicPage.personalCareLayout.whatsappCheckout')}
          </h2>
          <p className="text-sm text-slate-600">{resultsLabel}</p>
        </div>
        {hasHiddenPrices && (
          <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            {t('publicPage.personalCareLayout.consultCta')}
          </span>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center">
          <p className="text-lg font-semibold text-slate-800">{t('publicPage.personalCareLayout.emptyStateTitle')}</p>
          <p className="text-sm text-slate-600">{t('publicPage.personalCareLayout.emptyStateSubtitle')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              theme={theme}
              onAddToCart={handleAddToCartWithFeedback}
              lastAddedProductId={lastAddedProduct}
              onUpdateQuantity={onUpdateQuantity}
              onProductClick={onProductClick}
              onWhatsAppClick={onWhatsAppClick}
              cart={cart}
              hasHiddenPrices={hasHiddenPrices}
            />
          ))}
        </div>
      )}
    </div>
  );

  const mergedSections: PublicLayoutSections = {
    hero,
    highlight: recommendedSection ?? sections.highlight,
    services: sections.services,
    team: sections.team,
    products: productsSection,
    properties: sections.properties,
    schedule: sections.schedule,
    reviews: sections.reviews,
    faqs: sections.faqs,
    missionVision: sections.missionVision,
    hours: sections.hours,
    location: sections.location,
    media: sections.media,
    contact: sections.contact,
  };

  return (
    <PublicLayoutShell
      {...props}
      sections={mergedSections}
      contactActions={contactActions}
      floatingCta={floatingCta}
      variant={variant}
    />
  );
}
