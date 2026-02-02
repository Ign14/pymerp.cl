import { Product } from '../../../../types';
import { AppearanceTheme } from '../../types';
import AnimatedButton from '../../../../components/animations/AnimatedButton';
import AnimatedCard from '../../../../components/animations/AnimatedCard';
import { ensureButtonContrast } from '../../../../utils/colorContrast';

interface ProductCardProps {
  product: Product;
  theme: AppearanceTheme;
  quantity: number;
  onAddToCart: (product: Product, quantity?: number) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onProductClick: (product: Product) => void;
  index: number;
  imagePosition?: 'left' | 'right'; // Para Layout2
}

// Layout 1: Grid Clásico (actual)
export function Layout1ProductCard({ product, theme, quantity, onAddToCart, onUpdateQuantity, onProductClick, index }: ProductCardProps) {
  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 0) {
      onUpdateQuantity(product.id, quantity - 1);
    }
  };

  return (
    <div onClick={() => onProductClick(product)} className="cursor-pointer group h-full">
      <AnimatedCard
        delay={index * 0.1}
        className="rounded-lg sm:rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-xl hover:scale-[1.02] transition-all border border-gray-200/50 h-full"
        style={{ backgroundColor: theme.cardColor, color: theme.textColor, fontFamily: theme.fontBody }}
      >
        <div
          className="w-full aspect-square min-h-[7rem] max-h-[180px] sm:max-h-[220px] md:max-h-[240px] flex items-center justify-center relative overflow-hidden flex-shrink-0"
          style={{ backgroundColor: theme.cardColor + '20' }}
        >
          <img
            src={product.image_url || 'https://placehold.co/400x400/EEF2FF/1F2937?text=Sin+imagen'}
            alt={product.image_url ? `Imagen del producto ${product.name}` : `Imagen no disponible para ${product.name}`}
            className="w-full h-full max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
            <span className="text-white text-xs sm:text-sm font-semibold opacity-0 group-hover:opacity-100 bg-black/60 px-2 sm:px-3 py-1 rounded-full transition">
              Ver +
            </span>
          </div>
          {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
            <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-orange-500 text-white text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold shadow-md">
              ¡Últimos {product.stock}!
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-red-500 text-white text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold shadow-md">
              Agotado
            </div>
          )}
        </div>
        <div className="p-2.5 sm:p-3 md:p-4 flex-1 flex flex-col min-h-0">
          <h3
            className="font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-1.5 line-clamp-2 leading-tight"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
            title={product.name}
          >
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs sm:text-sm mb-1.5 sm:mb-2 line-clamp-2 flex-1 leading-relaxed" style={{ color: theme.textColor, opacity: 0.85 }}>
              {product.description}
            </p>
          )}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5 sm:mb-2">
              {product.tags.slice(0, 2).map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="px-1.5 sm:px-2 py-0.5 text-xs rounded-full border"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: theme.titleColor,
                    borderColor: theme.subtitleColor || '#d1d5db',
                    fontSize: '0.65rem',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center mb-1.5 sm:mb-2">
            {product.hide_price ? (
              <span
                className="text-xs sm:text-sm font-medium flex items-center gap-1"
                style={{ color: '#25D366', fontFamily: theme.fontBody }}
              >
                <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Consulta precio
              </span>
            ) : (
              <span
                className="text-sm sm:text-base md:text-lg font-bold"
                style={{ color: theme.buttonColor, fontFamily: theme.fontTitle }}
              >
                ${product.price.toLocaleString()}
              </span>
            )}
            {product.weight && (
              <span className="text-xs sm:text-sm flex items-center gap-0.5" style={{ color: theme.subtitleColor }}>
                <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
                {product.weight}g
              </span>
            )}
          </div>
          <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
            {quantity > 0 ? (
              <div 
                className="flex items-center justify-between gap-1 sm:gap-1.5 rounded-lg p-1 sm:p-1.5"
                style={{ backgroundColor: theme.cardColor + '40' }}
              >
                <button
                  onClick={handleDecrement}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm sm:text-base hover:opacity-80 transition shadow-sm"
                  style={{
                    backgroundColor: theme.buttonColor,
                    color: ensureButtonContrast(theme.buttonColor, theme.buttonTextColor || '#ffffff'),
                  }}
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span className="text-sm sm:text-base font-bold min-w-[1.75rem] sm:min-w-[2rem] text-center" style={{ color: theme.titleColor }}>
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm sm:text-base hover:opacity-80 transition shadow-sm"
                  style={{
                    backgroundColor: theme.buttonColor,
                    color: ensureButtonContrast(theme.buttonColor, theme.buttonTextColor || '#ffffff'),
                  }}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            ) : (
              <AnimatedButton
                onClick={() => onAddToCart(product, 1)}
                style={{
                  backgroundColor: theme.buttonColor,
                  color: ensureButtonContrast(theme.buttonColor, theme.buttonTextColor || '#ffffff'),
                  fontFamily: theme.fontButton,
                }}
                className="w-full py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg hover:opacity-90 font-medium shadow-sm hover:shadow-md transition-all"
                ariaLabel={`Agregar ${product.name} al carrito`}
              >
                <span className="flex items-center justify-center gap-1">
                  <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar
                </span>
              </AnimatedButton>
            )}
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}

// Layout 2: Estilo Lista - Imagen cuadrada (como pymerp.cl producción)
export function Layout2ProductCard({ product, theme, quantity, onAddToCart, onUpdateQuantity, onProductClick, index, imagePosition = 'left' }: ProductCardProps) {
  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 0) {
      onUpdateQuantity(product.id, quantity - 1);
    }
  };

  const borderClr = theme.buttonColor ? `${theme.buttonColor}25` : 'rgba(204, 5, 25, 0.145)';
  const shadowClr = theme.buttonColor ? `${theme.buttonColor}12` : 'rgba(204, 5, 25, 0.07)';
  const isImageRight = imagePosition === 'right';

  const imageComponent = (
    <div className="relative flex-shrink-0">
      <div 
        className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-md transition-all duration-500 group-hover:scale-105"
        style={{ 
          background: `linear-gradient(135deg, ${theme.buttonColor || '#cc0519'}18 0%, ${theme.buttonColor || '#cc0519'}08 100%)`,
              border: `3px solid ${theme.buttonColor ? theme.buttonColor + '30' : 'rgba(204, 5, 25, 0.19)'}`,
          boxShadow: theme.buttonColor ? `${theme.buttonColor}20 0px 8px 24px` : 'rgba(204, 5, 25, 0.125) 0px 8px 24px',
        }}
      >
        <img
          src={product.image_url || 'https://placehold.co/400x400/EEF2FF/1F2937?text=Sin+imagen'}
          alt={product.image_url ? `Imagen del producto ${product.name}` : `Imagen no disponible para ${product.name}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ aspectRatio: '1 / 1' }}
          loading="lazy"
        />
      </div>
      {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
        <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-orange-500 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded-full font-bold shadow-md">
          {product.stock}
        </div>
      )}
      {product.stock === 0 && (
        <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded-full font-bold shadow-md">
          ✕
        </div>
      )}
    </div>
  );

  return (
    <div onClick={() => onProductClick(product)} className="cursor-pointer group">
      <AnimatedCard
        delay={index * 0.1}
        className={`rounded-2xl sm:rounded-3xl overflow-hidden flex flex-wrap items-start gap-4 sm:gap-5 md:gap-6 p-4 sm:p-5 md:p-6 border-2 hover:shadow-2xl hover:scale-[1.01] transition-all duration-500 ${
          isImageRight ? 'flex-row-reverse' : ''
        }`}
        style={{ 
          backgroundColor: theme.cardColor, 
          color: theme.textColor, 
          fontFamily: theme.fontBody,
          borderColor: borderClr,
          boxShadow: `${shadowClr} 0px 4px 20px, rgba(0, 0, 0, 0.08) 0px 2px 6px`,
        }}
      >
        {/* Imagen cuadrada (posición configurable) */}
        {imageComponent}
        
        {/* Contenido central */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-extrabold text-base sm:text-lg md:text-xl lg:text-2xl mb-2 sm:mb-3 line-clamp-2 leading-tight text-left"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm sm:text-base mb-2 sm:mb-3 line-clamp-2 leading-relaxed text-left" style={{ color: theme.textColor, opacity: 0.8 }}>
              {product.description}
            </p>
          )}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 sm:mb-3 justify-start">
              {product.tags.slice(0, 2).map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs sm:text-sm rounded-full font-medium shadow-sm"
                  style={{
                    backgroundColor: theme.buttonColor ? `${theme.buttonColor}18` : 'rgba(204, 5, 25, 0.094)',
                    color: theme.buttonColor || '#cc0519',
                    border: `1px solid ${theme.buttonColor ? theme.buttonColor + '35' : 'rgba(204, 5, 25, 0.208)'}`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-start gap-3 sm:gap-4 flex-wrap">
            {product.hide_price ? (
              <span
                className="text-xs sm:text-sm font-medium flex items-center gap-1"
                style={{ color: '#25D366', fontFamily: theme.fontBody }}
              >
                <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Consulta precio
              </span>
            ) : (
              <span
                className="text-lg sm:text-xl md:text-2xl font-extrabold"
                style={{ color: theme.buttonColor, fontFamily: theme.fontTitle, textShadow: theme.buttonColor ? `${theme.buttonColor}25 0px 2px 8px` : undefined }}
              >
                ${product.price.toLocaleString()}
              </span>
            )}
            {product.weight && (
              <span className="text-xs sm:text-sm" style={{ color: theme.subtitleColor }}>
                {product.weight}g
              </span>
            )}
          </div>
        </div>
        
        {/* Controles a la derecha */}
        <div className="flex-shrink-0 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
          {quantity > 0 ? (
            <div 
              className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 rounded-lg p-1 sm:p-1.5"
              style={{ backgroundColor: theme.cardColor + '40' }}
            >
              <button
                onClick={handleDecrement}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm sm:text-base hover:opacity-80 transition shadow-sm"
                style={{
                  backgroundColor: theme.buttonColor,
                  color: ensureButtonContrast(theme.buttonColor, theme.buttonTextColor || '#ffffff'),
                }}
                aria-label="Disminuir cantidad"
              >
                −
              </button>
              <span className="text-sm sm:text-base font-bold min-w-[1.75rem] sm:min-w-[2rem] text-center" style={{ color: theme.titleColor }}>
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-sm sm:text-base hover:opacity-80 transition shadow-sm"
                style={{
                  backgroundColor: theme.buttonColor,
                  color: ensureButtonContrast(theme.buttonColor, theme.buttonTextColor || '#ffffff'),
                }}
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
          ) : (
            <AnimatedButton
              onClick={() => onAddToCart(product, 1)}
              style={{
                backgroundColor: theme.buttonColor,
                color: ensureButtonContrast(theme.buttonColor, theme.buttonTextColor || '#ffffff'),
                fontFamily: theme.fontButton,
              }}
              className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 text-sm sm:text-base rounded-xl hover:opacity-90 font-semibold shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.98] whitespace-nowrap"
              ariaLabel={`Agregar ${product.name} al carrito`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Agregar
              </span>
            </AnimatedButton>
          )}
        </div>
      </AnimatedCard>
    </div>
  );
}

// Layout 6: Estilo Tarjeta Premium - Con gradientes sutiles y sombras suaves
export function Layout6ProductCard({ product, theme, quantity, onAddToCart, onUpdateQuantity, onProductClick, index }: ProductCardProps) {
  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 0) {
      onUpdateQuantity(product.id, quantity - 1);
    }
  };

  return (
    <div onClick={() => onProductClick(product)} className="cursor-pointer group h-full">
      <AnimatedCard
        delay={index * 0.1}
        className="rounded-xl sm:rounded-2xl overflow-hidden flex flex-col border hover:shadow-2xl hover:scale-[1.01] transition-all relative h-full"
        style={{ 
          backgroundColor: theme.cardColor, 
          color: theme.textColor, 
          fontFamily: theme.fontBody,
          borderColor: theme.buttonColor + '20',
          boxShadow: `0 8px 32px ${theme.buttonColor}08`,
        }}
      >
        <div className="relative h-36 xs:h-40 sm:h-44 md:h-48 lg:h-52 overflow-hidden">
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${theme.buttonColor}08 0%, ${theme.buttonColor}02 100%)`,
            }}
          >
            <img
              src={product.image_url || 'https://placehold.co/400x400/EEF2FF/1F2937?text=Sin+imagen'}
              alt={product.image_url ? `Imagen del producto ${product.name}` : `Imagen no disponible para ${product.name}`}
              className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5" />
          {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-orange-500 text-white text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold shadow-lg z-10">
              ¡Últimos {product.stock}!
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-red-500 text-white text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold shadow-lg z-10">
              Agotado
            </div>
          )}
        </div>
        
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col flex-1 relative">
          {/* Línea decorativa superior */}
          <div 
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{ 
              background: `linear-gradient(90deg, ${theme.buttonColor} 0%, ${theme.buttonColor}80 50%, transparent 100%)`,
            }}
          />
          
          <h3
            className="font-bold text-sm sm:text-base md:text-lg lg:text-xl mb-1.5 sm:mb-2 mt-1 line-clamp-2"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs sm:text-sm md:text-base mb-3 sm:mb-4 line-clamp-2 flex-1 leading-relaxed sm:leading-loose" style={{ color: theme.textColor, opacity: 0.8 }}>
              {product.description}
            </p>
          )}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
              {product.tags.slice(0, 3).map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="px-1.5 sm:px-2 py-0.5 text-xs rounded-full"
                  style={{
                    backgroundColor: theme.buttonColor + '20',
                    color: theme.buttonColor,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div>
              {product.hide_price ? (
                <span
                  className="text-sm sm:text-base md:text-lg font-medium flex items-center gap-1.5"
                  style={{ color: '#25D366', fontFamily: theme.fontBody }}
                >
                  <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Consulta precio por WhatsApp
                </span>
              ) : (
                <span
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold block"
                  style={{ color: theme.buttonColor, fontFamily: theme.fontTitle }}
                >
                  ${product.price.toLocaleString()}
                </span>
              )}
              {product.weight && (
                <span className="text-xs sm:text-sm font-light mt-0.5" style={{ color: theme.subtitleColor }}>
                  Peso: {product.weight}g
                </span>
              )}
            </div>
          </div>
          
          <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
            {quantity > 0 ? (
              <div 
                className="flex items-center justify-between gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl p-1 sm:p-1.5"
                style={{ backgroundColor: theme.cardColor + '40' }}
              >
                <button
                  onClick={handleDecrement}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-base sm:text-lg hover:opacity-80 transition shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${theme.buttonColor} 0%, ${theme.buttonColor}ee 100%)`,
                    color: ensureButtonContrast(theme.buttonColor, theme.buttonTextColor || '#ffffff'),
                  }}
                  aria-label="Disminuir cantidad"
                >
                  −
                </button>
                <span className="text-base sm:text-lg font-bold min-w-[2rem] sm:min-w-[2.5rem] text-center" style={{ color: theme.titleColor }}>
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-base sm:text-lg hover:opacity-80 transition shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${theme.buttonColor} 0%, ${theme.buttonColor}ee 100%)`,
                    color: ensureButtonContrast(theme.buttonColor, theme.buttonTextColor || '#ffffff'),
                  }}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
            ) : (
              <AnimatedButton
                onClick={() => onAddToCart(product, 1)}
                style={{ 
                  background: `linear-gradient(135deg, ${theme.buttonColor} 0%, ${theme.buttonColor}ee 100%)`,
                  color: ensureButtonContrast(theme.buttonColor, theme.buttonTextColor || '#ffffff'), 
                  fontFamily: theme.fontButton 
                }}
                className="w-full py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base rounded-lg sm:rounded-xl hover:opacity-90 font-semibold shadow-md hover:shadow-lg transition-all"
                ariaLabel={`Agregar ${product.name} al carrito`}
              >
                <span className="flex items-center justify-center gap-1">
                  <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar al carrito
                </span>
              </AnimatedButton>
            )}
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}

// Mapper function
export function getProductCardLayout(layout: 1 | 2 | 3) {
  const layouts = {
    1: Layout1ProductCard, // Grid Clásico
    2: Layout2ProductCard, // Lista con imagen circular
    3: Layout6ProductCard, // Tarjeta Premium
  };
  return layouts[layout] || Layout1ProductCard;
}

