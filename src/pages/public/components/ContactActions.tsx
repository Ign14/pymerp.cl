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
    <div className="flex flex-col sm:flex-row sm:justify-center gap-3 items-center mt-6">
      <AnimatedButton
        onClick={onWhatsApp}
        style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
        className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 w-full sm:w-auto"
      >
        Contactar por WhatsApp
      </AnimatedButton>
      {showCartCta && onOpenCart && (
        <AnimatedButton
          onClick={onOpenCart}
          className="px-8 py-3 text-blue-700 border border-blue-200 rounded-lg font-semibold hover:bg-blue-50 w-full sm:w-auto relative"
        >
          Ver carrito ({cartItems})
          <CartBadge count={cartItems} />
        </AnimatedButton>
      )}
    </div>
  );
}
