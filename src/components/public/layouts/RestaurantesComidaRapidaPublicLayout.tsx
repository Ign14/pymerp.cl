import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AnimatedButton from '../../animations/AnimatedButton';
import { ensureButtonContrast } from '../../../utils/colorContrast';
import { PublicLayoutShell } from '../../../pages/public/layouts/PublicLayoutShell';
import { type PublicLayoutProps, type PublicLayoutSections } from '../../../pages/public/layouts/types';
import { getProductCardLayout } from '../../../pages/public/components/cardLayouts/ProductCardLayouts';
import { type Product, BusinessType } from '../../../types';
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
  const [activeCategory, setActiveCategory] = useState<string | null>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(0);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const ITEMS_PER_PAGE = 24;
  const CATEGORIES_PER_PAGE = 3;
  const isIOS = useMemo(
    () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent || ''),
    []
  );

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

    // Prepend "Todos" (all) para filtrar como en producción
    return [{ id: 'all', name: t('publicPage.restaurantsLayout.menuFilterAll') }, ...categories];
  }, [menuCategories, products, t]);

  const productsByCategory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    const fallbackCategory = resolvedCategories.find((c) => c.id !== 'all')?.id ?? 'menu';

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

    // "all" muestra todos los productos
    grouped['all'] = [...products].sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0));

    Object.keys(grouped).forEach((key) => {
      if (key !== 'all') {
        grouped[key] = grouped[key].sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0));
      }
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

    // "all" con búsqueda: todos los resultados
    const allFiltered = Object.values(filtered).flat();
    const uniqueAll = Array.from(new Map(allFiltered.map((p) => [p.id, p])).values());
    if (uniqueAll.length > 0) {
      filtered['all'] = uniqueAll;
    }

    return filtered;
  }, [productsByCategory, debouncedSearchTerm]);

  const searchActive = debouncedSearchTerm.trim().length > 0;

  const realCategories = useMemo(
    () => resolvedCategories.filter((c) => c.id !== 'all'),
    [resolvedCategories]
  );

  const orderedProducts = useMemo(
    () =>
      realCategories.flatMap((category) => {
        const categoryProducts = productsByCategory[category.id] || [];
        return categoryProducts;
      }),
    [realCategories, productsByCategory]
  );

  // Aplanar productos filtrados para paginación cuando hay búsqueda (sin duplicados)
  const allFilteredProducts = useMemo(() => {
    if (!searchActive) {
      return [];
    }
    const flat = Object.values(filteredProductsByCategory).flat();
    return Array.from(new Map(flat.map((p) => [p.id, p])).values());
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
    realCategories.forEach((cat) => {
      grouped[cat.id] = [];
    });

    items.forEach((product) => {
      const targetId =
        (product.menuCategoryId && grouped[product.menuCategoryId] ? product.menuCategoryId : null) ||
        (!product.menuCategoryId && grouped.uncategorized ? 'uncategorized' : null) ||
        realCategories[0]?.id ||
        'menu';
      grouped[targetId] = grouped[targetId] || [];
      grouped[targetId].push(product);
    });

    return grouped;
  };

  const displayProductsByCategory = useMemo(() => {
    if (searchActive) {
      if (paginatedProducts.length === 0) return groupProductsByCategory([]);
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
    return filteredProductsByCategory;
  }, [paginatedProducts, searchActive, filteredProductsByCategory, resolvedCategories]);

  // Resetear página cuando cambia categoría activa o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, debouncedSearchTerm]);

  const categoriesForNavigation = useMemo(() => {
    const withProducts = resolvedCategories.filter(
      (category) => (displayProductsByCategory[category.id] || []).length > 0
    );
    return withProducts;
  }, [displayProductsByCategory, resolvedCategories]);

  useEffect(() => {
    if (!activeCategory && categoriesForNavigation.length > 0) {
      setActiveCategory(categoriesForNavigation[0]?.id ?? 'all');
    }
  }, [activeCategory, categoriesForNavigation]);

  const cardLayout = theme.cardLayout || 1;
  const useListLayout = appearance?.layout === 'LIST' || cardLayout === 2;
  const CardComponent = getProductCardLayout(cardLayout);
  const gridClasses = useListLayout
    ? 'grid grid-cols-1 gap-3 sm:gap-4'
    : 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5';
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
    const scrollTargetId = category.id === 'all' ? realCategories[0]?.id : category.id;
    if (scrollTargetId) {
      scrollToId(`menu-${scrollTargetId}`);
    }
  };

  const borderColor =
    theme.cardColor && theme.cardColor.startsWith('#')
      ? `${theme.cardColor}50`
      : 'rgba(148, 163, 184, 0.35)';
  const navInactiveBg = theme.cardColor || theme.bgColor || '#f8fafc';
  const navActiveBg = theme.buttonColor || '#0f172a';
  const navActiveText = ensureButtonContrast(navActiveBg, theme.buttonTextColor || '#ffffff');
  const navInactiveText = ensureButtonContrast(navInactiveBg, theme.textColor || '#1e293b');

  const categoriesToRender = useMemo(() => {
    if (activeCategory === 'all') return realCategories;
    return realCategories.filter((c) => c.id === activeCategory);
  }, [activeCategory, realCategories]);

  // Paginación de categorías para desktop (columnas)
  const hasMultipleCategories = realCategories.length > 1;
  const totalCategoryPages = Math.ceil(realCategories.length / CATEGORIES_PER_PAGE);
  const startCatIdx = categoryPage * CATEGORIES_PER_PAGE;
  const endCatIdx = startCatIdx + CATEGORIES_PER_PAGE;
  const visibleCategoriesForColumns = realCategories.slice(startCatIdx, endCatIdx);

  const handlePrevCategoryPage = () => {
    setCategoryPage(prev => Math.max(0, prev - 1));
  };

  const handleNextCategoryPage = () => {
    setCategoryPage(prev => Math.min(totalCategoryPages - 1, prev + 1));
  };

  const categoryNavigation =
    categoriesForNavigation.length > 1 ? (
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {categoriesForNavigation.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => handleCategoryClick(category)}
              className="rounded-full px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: isActive ? navActiveBg : navInactiveBg,
                color: isActive ? navActiveText : navInactiveText,
              }}
              aria-pressed={isActive}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    ) : null;

  // Sección QR removida según solicitud de mejoras UI/UX
  const qrSection = null;

  const productsContent = (
    <div className="space-y-5 sm:space-y-6">
      {/* Barra de búsqueda */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('publicPage.restaurantsLayout.searchPlaceholder')}
          className="w-full rounded-xl border px-4 py-3 pl-10 pr-10 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-0"
          style={{
            fontFamily: theme.fontBody,
            color: textColor,
            borderColor,
            backgroundColor: theme.cardColor ? `${theme.cardColor}E6` : 'rgba(255,255,255,0.9)',
            ['--tw-ring-color' as string]: theme.buttonColor || '#3b82f6',
          }}
        />
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex-shrink-0 flex items-center justify-center pointer-events-none"
          style={{ color: theme.subtitleColor || '#94a3b8' }}
        >
          <svg className="w-5 h-5 min-w-[20px] min-h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition"
            style={{
              color: theme.subtitleColor || '#94a3b8',
              backgroundColor: theme.textColor ? `${theme.textColor}15` : 'rgba(0,0,0,0.05)',
            }}
            aria-label="Limpiar búsqueda"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {categoryNavigation}
      
      {/* Navegación de paginación de categorías (solo desktop cuando hay más de 3 categorías) */}
      {hasMultipleCategories && activeCategory === 'all' && totalCategoryPages > 1 && (
        <div className="hidden lg:flex items-center justify-between mb-4">
          <button
            onClick={handlePrevCategoryPage}
            disabled={categoryPage === 0}
            className="p-2 rounded-full shadow-md hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.buttonColor,
              color: theme.buttonTextColor,
            }}
            aria-label="Categorías anteriores"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalCategoryPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCategoryPage(idx)}
                className="w-2 h-2 rounded-full transition"
                style={{
                  backgroundColor: idx === categoryPage ? theme.buttonColor : `${theme.buttonColor}40`,
                }}
                aria-label={`Ir a página ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNextCategoryPage}
            disabled={categoryPage === totalCategoryPages - 1}
            className="p-2 rounded-full shadow-md hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.buttonColor,
              color: theme.buttonTextColor,
            }}
            aria-label="Siguientes categorías"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Grid de columnas por categoría (desktop) o lista (mobile) */}
      {hasMultipleCategories && activeCategory === 'all' ? (
        <div className="lg:grid lg:gap-6" style={{ 
          gridTemplateColumns: `repeat(${Math.min(visibleCategoriesForColumns.length, 3)}, 1fr)`,
          background: 'transparent',
          backgroundColor: 'transparent'
        }}>
          {/* En mobile: mostrar todas las categorías en lista vertical */}
          <div className="lg:hidden space-y-8" style={{ background: 'transparent' }}>
            {categoriesToRender.map((category) => {
              const categoryProducts = displayProductsByCategory[category.id] || [];
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category.id} id={`menu-${category.id}`} className="scroll-mt-32 space-y-3" style={{ background: 'transparent' }}>
                  <h3
                    className="text-lg sm:text-xl font-bold pb-2 border-b"
                    style={{ 
                      color: theme.titleColor, 
                      fontFamily: theme.fontTitle,
                      borderColor: `${theme.buttonColor}40`
                    }}
                  >
                    {category.name}
                  </h3>
                  <div className={gridClasses} style={{ background: 'transparent' }}>
                    {categoryProducts.map((product, index) => {
                      const quantity = getProductQuantity(product.id);
                      const isAvailable = product.isAvailable !== false && product.status !== 'INACTIVE';

                      return (
                        <div key={`${category.id}-${product.id}`} className="relative h-full">
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
          </div>
          
          {/* En desktop: mostrar categorías en columnas con paginación */}
          <div className="hidden lg:contents">
            {visibleCategoriesForColumns.map((category) => {
              const categoryProducts = displayProductsByCategory[category.id] || [];
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category.id} id={`menu-${category.id}`} className="scroll-mt-32 space-y-3" style={{ background: 'transparent' }}>
                  <h3
                    className="text-lg sm:text-xl font-bold pb-2 border-b"
                    style={{ 
                      color: theme.titleColor, 
                      fontFamily: theme.fontTitle,
                      borderColor: `${theme.buttonColor}40`
                    }}
                  >
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4" style={{ background: 'transparent' }}>
                    {categoryProducts.map((product, index) => {
                      const quantity = getProductQuantity(product.id);
                      const isAvailable = product.isAvailable !== false && product.status !== 'INACTIVE';

                      return (
                        <div key={`${category.id}-${product.id}`} className="relative h-full">
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
          </div>
        </div>
      ) : (
        // Sin categorías múltiples o categoría específica seleccionada: mantener diseño original
        categoriesToRender.map((category) => {
          const categoryProducts = displayProductsByCategory[category.id] || [];
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category.id} id={`menu-${category.id}`} className="scroll-mt-32 space-y-3" style={{ background: 'transparent' }}>
              <h3
                className="text-lg sm:text-xl font-bold"
                style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
              >
                {category.name}
              </h3>
              <div className={gridClasses} style={{ background: 'transparent' }}>
                {categoryProducts.map((product, index) => {
                  const quantity = getProductQuantity(product.id);
                  const isAvailable = product.isAvailable !== false && product.status !== 'INACTIVE';

                  return (
                    <div key={`${category.id}-${product.id}`} className="relative h-full">
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
        })
      )}
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
            <p
              className="text-sm"
              style={{
                fontFamily: theme.fontBody,
                color: theme.subtitleColor || theme.textColor || '#64748b',
              }}
            >
              {t('publicPage.restaurantsLayout.noMoreProducts')}
            </p>
          )}
        </div>
      )}
      {/* Mensaje cuando no hay productos */}
      {!hasProducts && (
        <div
          className="rounded-2xl border border-dashed p-4 text-sm shadow-sm sm:p-6"
          style={{
            borderColor,
            backgroundColor: theme.cardColor ? `${theme.cardColor}B3` : 'rgba(255,255,255,0.85)',
            color: theme.descriptionColor || theme.textColor || '#475569',
          }}
        >
          {searchActive
            ? t('common.noResults')
            : t('publicPage.restaurantsLayout.emptyMenu')}
        </div>
      )}
      {/* Mensaje cuando hay búsqueda pero no resultados */}
      {searchActive && allFilteredProducts.length === 0 && hasProducts && (
        <div
          className="rounded-2xl border border-dashed p-4 text-sm shadow-sm sm:p-6"
          style={{
            borderColor,
            backgroundColor: theme.cardColor ? `${theme.cardColor}B3` : 'rgba(255,255,255,0.85)',
            color: theme.descriptionColor || theme.textColor || '#475569',
          }}
        >
          {t('common.noResults')}
        </div>
      )}
      {qrSection}
    </div>
  );

  const servicesContent =
    hasServices && sections.services ? (
      <div
        className="rounded-2xl border p-4 shadow-sm sm:p-5"
        style={{
          borderColor,
          backgroundColor: theme.cardColor ? `${theme.cardColor}F2` : 'rgba(255,255,255,0.95)',
        }}
      >
        {sections.services}
      </div>
    ) : null;

  const modeTabs =
    hasProducts && hasServices ? (
      <div
        className="flex gap-2 rounded-full p-1"
        style={{ backgroundColor: theme.bgColor ? `${theme.bgColor}99` : 'rgba(241,245,249,0.9)' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className="flex-1 rounded-full px-4 py-2 text-sm font-semibold transition shadow-sm"
          style={{
            backgroundColor: activeTab === 'products' ? (theme.cardColor || '#ffffff') : 'transparent',
            color: activeTab === 'products' ? (theme.titleColor || theme.textColor || '#0f172a') : (theme.textColor || '#475569'),
          }}
        >
          {t('publicPage.restaurantsLayout.productsTab')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className="flex-1 rounded-full px-4 py-2 text-sm font-semibold transition shadow-sm"
          style={{
            backgroundColor: activeTab === 'services' ? (theme.cardColor || '#ffffff') : 'transparent',
            color: activeTab === 'services' ? (theme.titleColor || theme.textColor || '#0f172a') : (theme.textColor || '#475569'),
          }}
        >
          {t('publicPage.restaurantsLayout.servicesTab')}
        </button>
      </div>
    ) : null;

  const catalogSection = (
    <section
      id="menu-section"
      className="mb-8 sm:mb-10 relative z-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-5 mb-6 sm:mb-8 relative z-10">
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight"
          style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
        >
          {t('publicPage.restaurantsLayout.productsSectionTitle')}
        </h2>
        {modeTabs}
      </div>
      {activeTab === 'services' ? servicesContent ?? productsContent : productsContent}
    </section>
  );

  const heroBlock = (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
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
        className="space-y-3"
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
          <p
            className="text-xs uppercase tracking-[0.35em]"
            style={{ color: theme.subtitleColor || theme.textColor || '#64748b' }}
          >
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
          className={`relative w-full sm:w-auto sm:flex-shrink-0 items-center justify-center ${hideHeroLogoOnMobile ? 'hidden sm:flex' : 'flex'}`}
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
            className="w-full max-w-[140px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[260px] h-auto object-contain transition duration-500 ease-out"
            style={{ maxHeight: 'clamp(80px, 14vw, 260px)' }}
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
        <div className="fixed inset-x-4 bottom-20 z-40 sm:hidden safe-area-inset-bottom">
          <div
            className="flex items-center justify-between gap-3 rounded-2xl border p-3 shadow-lg backdrop-blur"
            style={{
              backgroundColor: surfaceColor,
              color: textColor,
              borderColor,
            }}
          >
            <div>
              <p
                className="text-xs font-semibold"
                style={{ color: theme.subtitleColor || theme.textColor || '#64748b' }}
              >
                {t('publicPage.restaurantsLayout.cartLabel')}
              </p>
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
            className="rounded-2xl border p-4 shadow-2xl backdrop-blur"
            style={{
              backgroundColor: surfaceColor,
              color: textColor,
              borderColor,
            }}
          >
            <div className="space-y-1">
              <p
                className="text-xs font-semibold uppercase tracking-[0.25em]"
                style={{ color: theme.subtitleColor || theme.textColor || '#64748b' }}
              >
                {t('publicPage.restaurantsLayout.cartLabel')}
              </p>
              <p className="text-xl font-bold" style={{ color: theme.titleColor }}>
                {formattedTotal}
              </p>
              <p
                className="text-xs"
                style={{ color: theme.subtitleColor || theme.textColor || '#64748b' }}
              >
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
      <div className={cartItems > 0 ? 'lg:pr-80' : ''}>
        <PublicLayoutShell
        {...props}
        appearance={appearanceForLayout}
        variant={variant}
        sections={mergedSections}
        contactActions={contactActions}
        floatingCta={floatingCta}
      />
      </div>
      {cartSummary}
    </>
  );
}
