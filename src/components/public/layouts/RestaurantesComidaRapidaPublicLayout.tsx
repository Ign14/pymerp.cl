import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import AnimatedButton from '../../animations/AnimatedButton';
import { PublicLayoutShell } from '../../../pages/public/layouts/PublicLayoutShell';
import { type PublicLayoutProps, type PublicLayoutSections } from '../../../pages/public/layouts/types';
import { getProductCardLayout } from '../../../pages/public/components/cardLayouts/ProductCardLayouts';
import { type Product, BusinessType } from '../../../types';
import { isModuleEnabled, resolveCategoryId } from '../../../config/categories';
import { useDebounce } from '../../../hooks/useDebounce';
import { filterProductsBySearch } from '../../../utils/productSearch';

type CategoryOption = {
  id: string;
  name: string;
  order?: number;
};

const toRgba = (hex?: string, opacity?: number) => {
  if (!hex || opacity === 0) return 'transparent';
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    return hex;
  }
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized.padEnd(6, '0');
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const safeOpacity = opacity ?? 1;
  return `rgba(${r}, ${g}, ${b}, ${safeOpacity})`;
};

function scrollToId(elementId: string) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const headerOffset = 96;
  const elementPosition = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({
    top: elementPosition - headerOffset,
    behavior: 'smooth',
  });
}

export function RestaurantesComidaRapidaPublicLayout(props: PublicLayoutProps) {
  const {
    company,
    products = [],
    services = [],
    sections,
    contactActions,
    appearance,
    theme,
    variant,
    floatingCta,
    onOpenCart,
    onAddToCart,
    onUpdateQuantity,
    onProductClick,
    cart = [],
    cartItems = 0,
    cartTotal = 0,
    hasHiddenPrices,
    menuCategories = [],
    hideHeroLogoOnMobile,
  } = props;
  const { t, i18n } = useTranslation();

  const hasProducts = products.length > 0;
  const hasServices = services.length > 0 && sections.services;
  const [activeTab, setActiveTab] = useState<'products' | 'services'>(
    hasProducts ? 'products' : services.length > 0 ? 'services' : 'products'
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(menuCategories[0]?.id ?? null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const ITEMS_PER_PAGE = 24;
  const categoryId = resolveCategoryId(company);
  const showQrSection = isModuleEnabled(categoryId, 'menu-qr');
  const isIOS = useMemo(
    () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent || ''),
    []
  );

  const menuUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    const slug = company.slug || company.id;
    return slug ? `${baseUrl}/${slug}/menu` : '';
  }, [company.id, company.slug]);
  const logoUrl = appearance?.logo_url || (appearance as any)?.logo;
  const appearanceForLayout = appearance || {
    id: `fallback-${company.id}`,
    company_id: company.id,
    context: (company.business_type as BusinessType) || BusinessType.PRODUCTS,
  };
  const heroCardBg =
    isIOS || appearance?.menu_hero_card_opacity === undefined || appearance?.menu_hero_card_opacity === null || appearance?.menu_hero_card_opacity === 0
      ? 'rgba(0, 0, 0, 0)'
      : toRgba(appearance?.menu_hero_card_color, appearance?.menu_hero_card_opacity);
  const heroLogoCardBg =
    isIOS || appearance?.menu_hero_logo_card_opacity === undefined || appearance?.menu_hero_logo_card_opacity === null || appearance?.menu_hero_logo_card_opacity === 0
      ? 'rgba(0, 0, 0, 0)'
      : toRgba(appearance?.menu_hero_logo_card_color, appearance?.menu_hero_logo_card_opacity);
  const heroKicker = appearance?.hero_kicker;
  const heroTitle = appearance?.hero_title || company.name;
  const heroDescription =
    appearance?.hero_description || company.description || t('publicPage.restaurantsLayout.heroDescription');

  const resolvedCategories = useMemo(() => {
    const fromMenu: CategoryOption[] = [...menuCategories]
      .filter((cat) => Boolean(cat.name))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((cat) => ({ id: cat.id, name: cat.name, order: cat.order }));

    const categories: CategoryOption[] = [...fromMenu];
    const unknownCategoryIds = Array.from(
      new Set(
        products
          .map((product) => product.menuCategoryId)
          .filter((value): value is string => Boolean(value && !categories.find((cat) => cat.id === value)))
      )
    );

    unknownCategoryIds.forEach((id) => {
      categories.push({ id, name: t('publicPage.restaurantsLayout.uncategorized') });
    });

    if (products.some((product) => !product.menuCategoryId) && !categories.find((cat) => cat.id === 'uncategorized')) {
      categories.push({ id: 'uncategorized', name: t('publicPage.restaurantsLayout.uncategorized') });
    }

    if (categories.length === 0) {
      categories.push({ id: 'menu', name: t('publicPage.restaurantsLayout.allCategory') });
    }

    return categories;
  }, [menuCategories, products, t]);

  const productsByCategory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    const fallbackCategory = resolvedCategories[0]?.id ?? 'menu';

    resolvedCategories.forEach((cat) => {
      grouped[cat.id] = [];
    });

    products.forEach((product) => {
      const targetId =
        (product.menuCategoryId && grouped[product.menuCategoryId] ? product.menuCategoryId : null) ||
        (!product.menuCategoryId && grouped.uncategorized ? 'uncategorized' : null) ||
        fallbackCategory;
      grouped[targetId] = grouped[targetId] || [];
      grouped[targetId].push(product);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key] = grouped[key].sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0));
    });

    return grouped;
  }, [products, resolvedCategories]);

  // Filtrar productos por búsqueda
  const filteredProductsByCategory = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return productsByCategory;
    }

    const filtered: Record<string, Product[]> = {};
    Object.keys(productsByCategory).forEach((categoryId) => {
      const categoryProducts = productsByCategory[categoryId];
      const filteredCategoryProducts = filterProductsBySearch(categoryProducts, debouncedSearchTerm);
      if (filteredCategoryProducts.length > 0) {
        filtered[categoryId] = filteredCategoryProducts;
      }
    });

    return filtered;
  }, [productsByCategory, debouncedSearchTerm]);

  const searchActive = debouncedSearchTerm.trim().length > 0;

  const orderedProducts = useMemo(
    () =>
      resolvedCategories.flatMap((category) => {
        const categoryProducts = productsByCategory[category.id] || [];
        return categoryProducts;
      }),
    [resolvedCategories, productsByCategory]
  );

  // Aplanar productos filtrados para paginación cuando hay búsqueda
  const allFilteredProducts = useMemo(() => {
    if (!searchActive) {
      return [];
    }
    return Object.values(filteredProductsByCategory).flat();
  }, [filteredProductsByCategory, searchActive]);

  const totalItems = searchActive ? allFilteredProducts.length : orderedProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    if (totalItems === 0) {
      return [];
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const source = searchActive ? allFilteredProducts : orderedProducts;
    return source.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [totalItems, currentPage, searchActive, allFilteredProducts, orderedProducts]);

  const groupProductsByCategory = (items: Product[]) => {
    const grouped: Record<string, Product[]> = {};
    resolvedCategories.forEach((cat) => {
      grouped[cat.id] = [];
    });

    items.forEach((product) => {
      const targetId =
        (product.menuCategoryId && grouped[product.menuCategoryId] ? product.menuCategoryId : null) ||
        (!product.menuCategoryId && grouped.uncategorized ? 'uncategorized' : null) ||
        resolvedCategories[0]?.id ||
        'menu';
      grouped[targetId] = grouped[targetId] || [];
      grouped[targetId].push(product);
    });

    return grouped;
  };

  const displayProductsByCategory = useMemo(() => {
    if (paginatedProducts.length === 0) {
      return groupProductsByCategory([]);
    }
    if (searchActive) {
      return groupProductsByCategory(
        paginatedProducts.filter((product) => {
          if (!product.menuCategoryId && filteredProductsByCategory.uncategorized?.includes(product)) {
            return true;
          }
          return product.menuCategoryId
            ? filteredProductsByCategory[product.menuCategoryId]?.includes(product)
            : false;
        })
      );
    }
    return groupProductsByCategory(paginatedProducts);
  }, [paginatedProducts, searchActive, filteredProductsByCategory, resolvedCategories]);

  // Resetear página cuando cambia categoría activa o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, debouncedSearchTerm]);

  const categoriesForNavigation = useMemo(
    () => resolvedCategories.filter((category) => (displayProductsByCategory[category.id] || []).length > 0),
    [displayProductsByCategory, resolvedCategories]
  );

  useEffect(() => {
    const firstCategoryId = categoriesForNavigation[0]?.id || resolvedCategories[0]?.id;
    if (!activeCategory && firstCategoryId) {
      setActiveCategory(firstCategoryId);
    }
  }, [activeCategory, categoriesForNavigation, resolvedCategories]);

  const cardLayout = theme.cardLayout || 1;
  const useListLayout = appearance?.layout === 'LIST' || cardLayout === 2;
  const CardComponent = getProductCardLayout(cardLayout);
  const gridClasses = useListLayout
    ? 'grid grid-cols-1 gap-3 sm:gap-4'
    : 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4';
  const textColor = theme.textColor || '#0f172a';
  const subtitleColor = theme.subtitleColor || '#475569';
  const surfaceColor = theme.cardColor || '#ffffff';

  const getProductQuantity = (productId: string): number => {
    const line = cart.find((item) => item.product.id === productId);
    return line ? line.quantity : 0;
  };

  const handleAddProduct = (product: Product, quantity?: number) => {
    if (!onAddToCart || product.isAvailable === false) return;
    onAddToCart(product, quantity);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (!onUpdateQuantity) return;
    const product = products.find((item) => item.id === productId);
    if (product?.isAvailable === false && quantity > getProductQuantity(productId)) return;
    onUpdateQuantity(productId, quantity);
  };

  const handleCategoryClick = (category: CategoryOption) => {
    setActiveCategory(category.id);
    scrollToId(`menu-${category.id}`);
  };

  const categoryNavigation =
    categoriesForNavigation.length > 1 ? (
      <div className="sticky top-3 z-20">
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          {categoriesForNavigation.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryClick(category)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow'
                    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                }`}
                aria-pressed={isActive}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  const qrSection =
    showQrSection && menuUrl ? (
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              {t('publicPage.restaurantsLayout.qrKicker')}
            </p>
            <h3 className="text-xl font-bold" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
              {t('publicPage.restaurantsLayout.qrTitle')}
            </h3>
            <p className="text-sm text-slate-600" style={{ fontFamily: theme.fontBody }}>
              {t('publicPage.restaurantsLayout.qrDescription')}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <AnimatedButton
                onClick={() => window.open(menuUrl, '_blank')}
                className="px-4 py-2 text-sm font-semibold shadow-sm"
                style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
              >
                {t('publicPage.restaurantsLayout.qrView')}
              </AnimatedButton>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(menuUrl);
                  } catch {
                    // clipboard no disponible
                  }
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                {t('publicPage.restaurantsLayout.qrCopy')}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-inner">
              <QRCodeSVG value={menuUrl} size={148} />
            </div>
          </div>
        </div>
      </div>
    ) : null;

  const productsContent = (
    <div className="space-y-6">
      {/* Barra de búsqueda */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('publicPage.restaurantsLayout.searchPlaceholder')}
          className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 pl-10 pr-10 text-sm shadow-sm transition focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-0"
          style={{ fontFamily: theme.fontBody, color: textColor }}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Limpiar búsqueda"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {categoryNavigation}
      {resolvedCategories.map((category) => {
        const categoryProducts = displayProductsByCategory[category.id] || [];
        if (categoryProducts.length === 0) return null;

        return (
          <div key={category.id} id={`menu-${category.id}`} className="scroll-mt-32 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  {t('publicPage.restaurantsLayout.sectionKicker')}
                </p>
                <h3
                  className="text-lg font-bold sm:text-xl"
                  style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
                >
                  {category.name}
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {t('publicPage.restaurantsLayout.itemsCount', {
                  count: debouncedSearchTerm.trim()
                    ? filteredProductsByCategory[category.id]?.length || 0
                    : productsByCategory[category.id]?.length || 0,
                })}
              </span>
            </div>
            <div className={gridClasses}>
              {categoryProducts.map((product, index) => {
                const quantity = getProductQuantity(product.id);
                const isAvailable = product.isAvailable !== false && product.status !== 'INACTIVE';

                return (
                  <div key={product.id} className="relative h-full">
                    {!isAvailable && (
                      <div className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow">
                        {t('publicPage.restaurantsLayout.unavailable')}
                      </div>
                    )}
                    <CardComponent
                      product={product}
                      theme={theme}
                      quantity={quantity}
                      onAddToCart={handleAddProduct}
                      onUpdateQuantity={handleUpdateQuantity}
                      onProductClick={(item) => onProductClick?.(item)}
                      index={index}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* Paginación (solo cuando hay búsqueda) */}
      {totalItems > 0 && totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 py-4">
          {currentPage < totalPages ? (
            <AnimatedButton
              onClick={() => setCurrentPage((p) => p + 1)}
              className="rounded-full px-6 py-3 text-sm font-semibold shadow-md transition"
              style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
            >
              {t('publicPage.restaurantsLayout.loadMore')}
            </AnimatedButton>
          ) : (
            <p className="text-sm text-slate-500" style={{ fontFamily: theme.fontBody }}>
              {t('publicPage.restaurantsLayout.noMoreProducts')}
            </p>
          )}
        </div>
      )}
      {/* Mensaje cuando no hay productos */}
      {!hasProducts && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-600 shadow-sm sm:p-6">
          {searchActive
            ? t('common.noResults')
            : t('publicPage.restaurantsLayout.emptyMenu')}
        </div>
      )}
      {/* Mensaje cuando hay búsqueda pero no resultados */}
      {searchActive && allFilteredProducts.length === 0 && hasProducts && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-600 shadow-sm sm:p-6">
          {t('common.noResults')}
        </div>
      )}
      {qrSection}
    </div>
  );

  const servicesContent =
    hasServices && sections.services ? (
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm sm:p-5">{sections.services}</div>
    ) : null;

  const modeTabs =
    hasProducts && hasServices ? (
      <div className="flex gap-2 rounded-full bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'products'
              ? 'bg-white shadow text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('publicPage.restaurantsLayout.productsTab')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'services'
              ? 'bg-white shadow text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('publicPage.restaurantsLayout.servicesTab')}
        </button>
      </div>
    ) : null;

  const catalogSection = (
    <section
      id="menu-section"
      className="space-y-5 rounded-3xl border border-slate-200/70 p-4 shadow-sm backdrop-blur sm:p-6"
      style={{ backgroundColor: surfaceColor }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            {t('publicPage.restaurantsLayout.menuKicker')}
          </p>
          <h2
            className="text-2xl font-bold sm:text-3xl"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {t('publicPage.restaurantsLayout.menuTitle', { name: company.name })}
          </h2>
          <p className="text-sm" style={{ fontFamily: theme.fontBody, color: subtitleColor }}>
            {t('publicPage.restaurantsLayout.menuSubtitle')}
          </p>
        </div>
        {modeTabs}
      </div>

      {activeTab === 'services' ? servicesContent ?? productsContent : productsContent}
    </section>
  );

  const heroBlock = (
    <div
      className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center"
      style={{
        backgroundColor: 'transparent',
        boxShadow: 'none',
        border: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        mixBlendMode: 'normal',
      }}
    >
      <div
        className="space-y-4"
        style={{
          backgroundColor: heroCardBg,
          background: heroCardBg,
          boxShadow: 'none',
          border: 'none',
          padding: heroCardBg !== 'rgba(0, 0, 0, 0)' && heroCardBg !== 'transparent' ? '0.25rem' : 0,
          borderRadius: heroCardBg !== 'rgba(0, 0, 0, 0)' && heroCardBg !== 'transparent' ? '1.25rem' : undefined,
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          mixBlendMode: 'normal',
        }}
      >
        {heroKicker && (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {heroKicker}
          </p>
        )}
        <h1
          className="text-3xl font-bold leading-tight sm:text-4xl"
          style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
        >
          {heroTitle}
        </h1>
        <p className="max-w-2xl text-sm sm:text-base" style={{ fontFamily: theme.fontBody, color: subtitleColor }}>
          {heroDescription}
        </p>
      </div>
      {(logoUrl || appearance?.banner_url) && (
        <div
          className={`items-center justify-center ${hideHeroLogoOnMobile ? 'hidden sm:flex' : 'flex'}`}
          style={{
            backgroundColor: heroLogoCardBg,
            background: heroLogoCardBg,
            boxShadow: 'none',
            border: 'none',
            padding: heroLogoCardBg !== 'rgba(0, 0, 0, 0)' && heroLogoCardBg !== 'transparent' ? '0.5rem' : 0,
            borderRadius: heroLogoCardBg !== 'rgba(0, 0, 0, 0)' && heroLogoCardBg !== 'transparent' ? '1.25rem' : undefined,
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            mixBlendMode: 'normal',
          }}
        >
          <img
            src={logoUrl || appearance?.banner_url || ''}
            alt={company.name}
            className="max-h-56 sm:max-h-72 w-auto object-contain"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );

  const mergedSections: PublicLayoutSections = {
    ...sections,
    hero: heroBlock,
    products: catalogSection,
    services: undefined,
  };

  const formattedTotal = hasHiddenPrices
    ? t('publicPage.restaurantsLayout.cartTotalHidden')
    : t('publicPage.restaurantsLayout.cartTotal', {
        value: cartTotal.toLocaleString(i18n.language),
      });

  const cartSummary =
    cartItems > 0 && onOpenCart ? (
      <>
        <div className="fixed inset-x-4 bottom-20 z-40 sm:hidden">
          <div
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 shadow-lg backdrop-blur"
            style={{ backgroundColor: surfaceColor, color: textColor }}
          >
            <div>
              <p className="text-xs font-semibold text-slate-500">{t('publicPage.restaurantsLayout.cartLabel')}</p>
              <p className="text-sm font-bold" style={{ color: theme.titleColor }}>
                {formattedTotal}
              </p>
            </div>
            <AnimatedButton
              onClick={onOpenCart}
              className="px-4 py-2 text-sm font-semibold shadow-sm"
              style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
            >
              {t('publicPage.restaurantsLayout.cartCta', { count: cartItems })}
            </AnimatedButton>
          </div>
        </div>
        <div className="fixed right-6 top-28 z-30 hidden w-72 lg:block">
          <div
            className="rounded-2xl border border-slate-200 p-4 shadow-2xl backdrop-blur"
            style={{ backgroundColor: surfaceColor, color: textColor }}
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                {t('publicPage.restaurantsLayout.cartLabel')}
              </p>
              <p className="text-xl font-bold" style={{ color: theme.titleColor }}>
                {formattedTotal}
              </p>
              <p className="text-xs text-slate-500">
                {t('publicPage.restaurantsLayout.cartHint', { count: cartItems })}
              </p>
            </div>
            <div className="pt-3">
              <AnimatedButton
                onClick={onOpenCart}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm"
                style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
              >
                {t('publicPage.restaurantsLayout.cartCta', { count: cartItems })}
              </AnimatedButton>
            </div>
          </div>
        </div>
      </>
    ) : null;

  return (
    <>
      <PublicLayoutShell
        {...props}
        appearance={appearanceForLayout}
        variant={variant}
        sections={mergedSections}
        contactActions={contactActions}
        floatingCta={floatingCta}
      />
      {cartSummary}
    </>
  );
}
