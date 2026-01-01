import { Product, CartItem } from '../../../types';
import { AppearanceTheme } from '../types';
import { getProductCardLayout } from './cardLayouts/ProductCardLayouts';

interface ProductsSectionProps {
  products: Product[];
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
  theme,
  layout,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onOpenCart,
  onProductClick,
}: ProductsSectionProps) {
  if (products.length === 0) {
    return null;
  }

  const cardLayout = theme.cardLayout || 1;
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const getProductQuantity = (productId: string): number => {
    const item = cart.find((cartItem) => cartItem.product.id === productId);
    return item ? item.quantity : 0;
  };

  // Layout 3 es carrusel fullscreen - se maneja en PublicPage
  // No se renderiza aquí cuando es layout 3

  const CardComponent = getProductCardLayout(cardLayout);
  
  // Layout 2 es lista, necesita grid diferente
  const useListLayout = layout === 'LIST' || cardLayout === 2;
  const gridClasses = useListLayout 
    ? 'grid grid-cols-1 gap-3 sm:gap-4'
    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4';

  return (
    <div className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
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
      <div className={gridClasses}>
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
            />
          );
        })}
      </div>
    </div>
  );
}
