import AnimatedButton from '../../../components/animations/AnimatedButton';
import { CartBadge } from '../../../components/animations/AnimatedCart';
import { AppearanceTheme } from '../types';

interface ContactActionsProps {
  theme: AppearanceTheme;
  onWhatsApp: () => void;
  onOpenCart?: () => void;
  cartItems?: number;
  showCartCta?: boolean;
}

export function ContactActions({ theme, onWhatsApp, onOpenCart, cartItems = 0, showCartCta }: ContactActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-4 items-center w-full">
      <AnimatedButton
        onClick={onWhatsApp}
        style={{ backgroundColor: '#25D366', color: '#ffffff', fontFamily: theme.fontButton }}
        className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg font-semibold hover:opacity-90 w-full sm:w-auto min-w-[200px] sm:min-w-[240px] text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
        ariaLabel="Contactar por WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20.52 3.48A11.82 11.82 0 0 0 12.07 0 11.86 11.86 0 0 0 1.07 12.17 11.7 11.7 0 0 0 3.5 20.5l-1 3.48 3.6-.94a11.93 11.93 0 0 0 5.94 1.52h.05A11.83 11.83 0 0 0 24 12.07 11.8 11.8 0 0 0 20.52 3.48ZM12.1 21a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-2.14.55.57-2.08-.24-.34a9.83 9.83 0 0 1-1.7-5.54A10.08 10.08 0 0 1 12.06 2a9.92 9.92 0 0 1 7.07 2.93 9.92 9.92 0 0 1 2.92 7.12A10 10 0 0 1 12.1 21Zm5.47-7.3c-.3-.15-1.77-.87-2.04-.97s-.47-.15-.67.15-.77.97-.94 1.17-.35.22-.64.07A8.14 8.14 0 0 1 10 11.8a9.18 9.18 0 0 1-1.65-2 .55.55 0 0 1 .13-.76c.13-.14.3-.37.45-.55a2.54 2.54 0 0 0 .3-.52.67.67 0 0 0-.03-.63c-.08-.15-.67-1.62-.92-2.22-.24-.58-.5-.5-.67-.51H6.8a1.3 1.3 0 0 0-.94.44 3.93 3.93 0 0 0-1.24 2.9c0 1.7 1.26 3.34 1.43 3.57.17.22 2.47 3.78 5.98 5.13a19.4 19.4 0 0 0 2.02.6 4.86 4.86 0 0 0 2.25.14c.69-.1 2.1-.86 2.4-1.7a3 3 0 0 0 .21-1.7c-.09-.14-.27-.22-.57-.37Z" />
        </svg>
        Contactar por WhatsApp
      </AnimatedButton>
      {showCartCta && onOpenCart && (
        <AnimatedButton
          onClick={onOpenCart}
          className="px-6 sm:px-8 py-3 sm:py-3.5 text-blue-700 border-2 border-blue-300 rounded-lg font-semibold hover:bg-blue-50 w-full sm:w-auto min-w-[200px] sm:min-w-[240px] relative text-sm sm:text-base shadow-md hover:shadow-lg transition-all duration-300"
          ariaLabel={`Ver carrito con ${cartItems} productos`}
        >
          🛒 Ver carrito ({cartItems})
          <CartBadge count={cartItems} />
        </AnimatedButton>
      )}
    </div>
  );
}
