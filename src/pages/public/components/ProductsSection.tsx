import AnimatedCard from '../../../components/animations/AnimatedCard';
import AnimatedButton from '../../../components/animations/AnimatedButton';
import { Product } from '../../../types';
import { AppearanceTheme } from '../types';

interface ProductsSectionProps {
  products: Product[];
  theme: AppearanceTheme;
  layout?: 'GRID' | 'LIST';
  cartCount: number;
  onAddToCart: (product: Product) => void;
  onPreview: (url?: string | null) => void;
  onOpenCart: () => void;
}

export function ProductsSection({
  products,
  theme,
  layout,
  cartCount,
  onAddToCart,
  onPreview,
  onOpenCart,
}: ProductsSectionProps) {
  if (products.length === 0) {
    return null;
  }

  const useListLayout = layout === 'LIST';

  return (
    <div className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
          Productos
        </h2>
        <button
          onClick={onOpenCart}
          style={{ backgroundColor: theme.buttonColor }}
          className="px-4 py-2 text-white rounded-md hover:opacity-90 relative w-full sm:w-auto"
        >
          Carrito ({cartCount})
        </button>
      </div>
      <div
        className={`grid gap-4 sm:gap-6 ${
          useListLayout ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
        }`}
      >
        {products.map((product, idx) => (
          <AnimatedCard
            key={product.id}
            delay={idx * 0.1}
            className={`rounded-lg shadow overflow-hidden ${useListLayout ? 'flex' : ''}`}
            style={{ backgroundColor: theme.cardColor, color: theme.textColor, fontFamily: theme.fontBody }}
          >
            <button
              type="button"
              onClick={() =>
                onPreview(product.image_url || 'https://placehold.co/600x400/EEF2FF/1F2937?text=Sin+imagen')
              }
              className={`${
                useListLayout ? 'w-40 sm:w-52 h-40 sm:h-52' : 'w-full h-48 sm:h-56'
              } bg-gray-100 flex items-center justify-center group relative`}
              aria-label={`Ver imagen grande de ${product.name}`}
            >
              <img
                src={product.image_url || 'https://placehold.co/600x400/EEF2FF/1F2937?text=Sin+imagen'}
                alt={
                  product.image_url
                    ? `Imagen del producto ${product.name}`
                    : `Imagen no disponible para ${product.name}`
                }
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition flex items-center justify-center text-white text-lg opacity-0 group-hover:opacity-100">
                🔍
              </span>
            </button>
            <div className="p-4 flex-1 flex flex-col">
              <h3
                className="font-semibold text-base sm:text-lg mb-2"
                style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
              >
                {product.name}
              </h3>
              <p className="text-sm mb-4 line-clamp-3" style={{ color: theme.textColor }}>
                {product.description}
              </p>
              <div className="flex justify-between items-center mb-4">
                <span
                  className="text-lg sm:text-xl font-bold"
                  style={{ color: theme.buttonColor, fontFamily: theme.fontTitle }}
                >
                  ${product.price.toLocaleString()}
                </span>
                {product.weight && (
                  <span className="text-sm" style={{ color: theme.subtitleColor }}>
                    {product.weight}g
                  </span>
                )}
              </div>
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {product.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs rounded border"
                      style={{
                        backgroundColor: '#ffffffcc',
                        color: theme.titleColor,
                        borderColor: theme.subtitleColor || '#d1d5db',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <AnimatedButton
                onClick={() => onAddToCart(product)}
                style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
                className="w-full py-2 rounded-md hover:opacity-90 mt-auto"
              >
                Agregar
              </AnimatedButton>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}
