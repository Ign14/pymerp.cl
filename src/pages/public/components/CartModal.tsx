import AnimatedButton from '../../../components/animations/AnimatedButton';
import AnimatedCart from '../../../components/animations/AnimatedCart';
import { CartItem } from '../../../types';
import { AppearanceTheme, OrderForm } from '../types';

interface CartModalProps {
  isOpen: boolean;
  cart: CartItem[];
  orderForm: OrderForm;
  theme: AppearanceTheme;
  onClose: () => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onFormChange: (field: keyof OrderForm, value: string) => void;
  onSubmit: () => void;
}

export function CartModal({
  isOpen,
  cart,
  orderForm,
  theme,
  onClose,
  onQuantityChange,
  onRemove,
  onFormChange,
  onSubmit,
}: CartModalProps) {
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <AnimatedCart isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <p className="text-sm text-gray-500">Carrito</p>
          <h3 className="text-xl font-bold">Productos ({totalCartItems})</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
          aria-label="Cerrar carrito"
        >
          ×
        </button>
      </div>

      <div className="p-6 max-h-[calc(100%-200px)] overflow-y-auto">
        {cart.length === 0 ? (
          <p className="text-gray-500 text-center py-8">El carrito está vacío</p>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-4 border-b pb-4">
                  <img
                    src={item.product.image_url}
                    alt={`${item.product.name} en el carrito`}
                    className="w-16 h-16 object-cover rounded"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.product.name}</h4>
                    <p className="text-sm text-gray-600">${item.product.price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onQuantityChange(item.product.id, item.quantity - 1)}
                      className="px-2 py-1 bg-gray-200 rounded"
                      aria-label={`Reducir cantidad de ${item.product.name}`}
                    >
                      -
                    </button>
                    <span aria-label={`Cantidad: ${item.quantity}`}>{item.quantity}</span>
                    <button
                      onClick={() => onQuantityChange(item.product.id, item.quantity + 1)}
                      className="px-2 py-1 bg-gray-200 rounded"
                      aria-label={`Aumentar cantidad de ${item.product.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => onRemove(item.product.id)}
                    className="text-red-600 hover:text-red-800"
                    aria-label={`Eliminar ${item.product.name} del carrito`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="flex justify-between font-bold text-lg mb-4">
                <span>Total:</span>
                <span>${totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={orderForm.client_name}
                  onChange={(e) => onFormChange('client_name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
                <input
                  type="tel"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={orderForm.client_whatsapp}
                  onChange={(e) => onFormChange('client_whatsapp', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentario</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={orderForm.client_comment}
                  onChange={(e) => onFormChange('client_comment', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <AnimatedButton
                onClick={onSubmit}
                style={{ backgroundColor: theme.buttonColor }}
                className="px-4 py-3 text-white rounded-md hover:opacity-90"
              >
                Solicitar disponibilidad por WhatsApp
              </AnimatedButton>
              <AnimatedButton
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Seguir comprando
              </AnimatedButton>
            </div>
          </>
        )}
      </div>
    </AnimatedCart>
  );
}
