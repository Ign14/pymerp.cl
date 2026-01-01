import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../../types';
import { AppearanceTheme } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  theme: AppearanceTheme;
  quantity: number;
  onClose: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onAddToCart: () => void;
}

export function ProductDetailModal({
  product,
  theme,
  quantity,
  onClose,
  onIncrement,
  onDecrement,
  onAddToCart,
}: ProductDetailModalProps) {
  if (!product) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: theme.cardColor, color: theme.textColor }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg transition"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          <div className="w-full h-64 sm:h-96 bg-gray-100 flex items-center justify-center">
            <img
              src={product.image_url || 'https://placehold.co/600x400/EEF2FF/1F2937?text=Sin+imagen'}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8">
            <h2
              className="text-2xl sm:text-3xl font-bold mb-4"
              style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
            >
              {product.name}
            </h2>

            <div className="flex items-center justify-between mb-6">
              <span
                className="text-3xl font-bold"
                style={{ color: theme.buttonColor, fontFamily: theme.fontTitle }}
              >
                {product.hide_price ? (
                  <span className="text-base font-medium flex items-center gap-2" style={{ color: '#25D366' }}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Consulta precio por WhatsApp
                  </span>
                ) : (
                  `$${product.price.toLocaleString()}`
                )}
              </span>
              {product.weight && (
                <span className="text-lg" style={{ color: theme.subtitleColor }}>
                  {product.weight}g
                </span>
              )}
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm rounded-full border"
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: theme.titleColor,
                      borderColor: theme.subtitleColor || '#d1d5db',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mb-6">
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
              >
                Descripción
              </h3>
              <p
                className="text-base leading-relaxed whitespace-pre-wrap"
                style={{ color: theme.textColor }}
              >
                {product.description}
              </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium" style={{ color: theme.titleColor }}>
                Cantidad:
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={onDecrement}
                  disabled={quantity === 0}
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-lg hover:opacity-80 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    borderColor: theme.buttonColor,
                    color: theme.buttonColor,
                  }}
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span className="text-xl font-bold min-w-[2rem] text-center" style={{ color: theme.titleColor }}>
                  {quantity}
                </span>
                <button
                  onClick={onIncrement}
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-lg hover:opacity-80 transition"
                  style={{
                    borderColor: theme.buttonColor,
                    color: theme.buttonColor,
                  }}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={onAddToCart}
              disabled={quantity === 0}
              className="w-full py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: theme.buttonColor,
                color: theme.buttonTextColor,
                fontFamily: theme.fontButton,
              }}
            >
              {quantity === 0 ? 'Selecciona una cantidad' : `Agregar ${quantity} al carrito`}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

