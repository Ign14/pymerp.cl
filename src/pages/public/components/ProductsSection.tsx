import { useState } from 'react';
import { Product, CartItem, MenuCategory } from '../../../types';
import { AppearanceTheme } from '../types';
import { getProductCardLayout } from './cardLayouts/ProductCardLayouts';

interface ProductsSectionProps {
  products: Product[];
  categories?: MenuCategory[];
  theme: AppearanceTheme;
  layout?: 'GRID' | 'LIST';
  cart: CartItem[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onOpenCart: () => void;
  onProductClick: (product: Product) => void;
}

export function ProductsSection({
  products,
  categories = [],
  theme,
  layout,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onOpenCart,
  onProductClick,
}: ProductsSectionProps) {
  const [categoryPage, setCategoryPage] = useState(0);
  
  if (products.length === 0) {
    return null;
  }

  const cardLayout = theme.cardLayout || 1;
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getProductQuantity = (productId: string): number => {
    const item = cart.find((cartItem) => cartItem.product.id === productId);
    return item ? item.quantity : 0;
  };

  const CardComponent = getProductCardLayout(cardLayout);
  const useListLayout = layout === 'LIST' || cardLayout === 2;
  const imagePosition = (theme as any).productListImagePosition || 'left';

  // Agrupar productos por categoría
  const hasMultipleCategories = categories.length > 1;
  
  const groupedProducts = categories.length > 0
    ? categories.map(category => ({
        category,
        products: products.filter(p => p.menuCategoryId === category.id)
      })).filter(group => group.products.length > 0)
    : [{ category: null, products }];

  // Configuración de paginación para categorías (desktop)
  const categoriesPerPage = 3;
  const totalPages = Math.ceil(groupedProducts.length / categoriesPerPage);
  const startIdx = categoryPage * categoriesPerPage;
  const endIdx = startIdx + categoriesPerPage;
  const visibleGroups = groupedProducts.slice(startIdx, endIdx);

  const handlePrevPage = () => {
    setCategoryPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCategoryPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  // Renderizar categorías en columnas (desktop) o lista (mobile)
  const renderCategoryColumn = (group: { category: MenuCategory | null; products: Product[] }) => {
    const gridClasses = useListLayout 
      ? 'grid grid-cols-1 gap-3 sm:gap-4'
      : 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4';

    return (
      <div key={group.category?.id || 'uncategorized'} className="flex flex-col">
        {group.category && (
          <h3 
            className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 pb-2 border-b"
            style={{ 
              color: theme.titleColor, 
              fontFamily: theme.fontTitle,
              borderColor: `${theme.buttonColor}40`
            }}
          >
            {group.category.name}
          </h3>
        )}
        <div className={gridClasses}>
          {group.products.map((product, index) => {
            const quantity = getProductQuantity(product.id);
            
            return (
              <CardComponent
                key={product.id}
                product={product}
                theme={theme}
                quantity={quantity}
                onAddToCart={onAddToCart}
                onUpdateQuantity={onUpdateQuantity}
                onProductClick={onProductClick}
                index={index}
                imagePosition={imagePosition}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mb-10">
      {/* Header con título y botón de carrito */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
          Productos
        </h2>
        <button
          onClick={onOpenCart}
          style={{ 
            backgroundColor: theme.buttonColor,
            color: theme.buttonTextColor,
            fontFamily: theme.fontButton 
          }}
          className="px-4 py-2 rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg relative w-full sm:w-auto font-medium text-sm flex items-center justify-center gap-2"
          aria-label={`Ver carrito con ${totalCartItems} artículos`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Carrito ({totalCartItems})</span>
          {totalCartItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
              {totalCartItems}
            </span>
          )}
        </button>
      </div>

      {/* Layout por categorías en columnas (desktop) o lista (mobile) */}
      {hasMultipleCategories ? (
        <div className="relative">
          {/* Botones de navegación (solo visible en desktop y cuando hay más de 3 categorías) */}
          {totalPages > 1 && (
            <div className="hidden lg:flex items-center justify-between mb-4">
              <button
                onClick={handlePrevPage}
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
                {Array.from({ length: totalPages }).map((_, idx) => (
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
                onClick={handleNextPage}
                disabled={categoryPage === totalPages - 1}
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
          <div className="lg:grid lg:gap-6" style={{ 
            gridTemplateColumns: `repeat(${Math.min(visibleGroups.length, 3)}, 1fr)` 
          }}>
            {/* En mobile: mostrar todas las categorías en lista vertical */}
            <div className="lg:hidden space-y-8">
              {groupedProducts.map((group) => renderCategoryColumn(group))}
            </div>
            
            {/* En desktop: mostrar categorías en columnas con paginación */}
            <div className="hidden lg:contents">
              {visibleGroups.map((group) => renderCategoryColumn(group))}
            </div>
          </div>
        </div>
      ) : (
        // Sin categorías o solo una: mantener diseño original
        <div className={useListLayout 
          ? 'grid grid-cols-1 gap-3 sm:gap-4'
          : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'
        }>
          {products.map((product, index) => {
            const quantity = getProductQuantity(product.id);
            
            return (
              <CardComponent
                key={product.id}
                product={product}
                theme={theme}
                quantity={quantity}
                onAddToCart={onAddToCart}
                onUpdateQuantity={onUpdateQuantity}
                onProductClick={onProductClick}
                index={index}
                imagePosition={imagePosition}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
