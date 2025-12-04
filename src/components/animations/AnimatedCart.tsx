import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useRef } from 'react';

interface AnimatedCartProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function AnimatedCart({ isOpen, onClose, children }: AnimatedCartProps) {
  const cartRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        cartRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
            role="presentation"
            aria-hidden="true"
          />
          
          {/* Cart Drawer */}
          <motion.div
            ref={cartRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de compras"
            tabIndex={-1}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function CartBadge({ count }: { count: number }) {
  return (
    <AnimatePresence mode="wait">
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
        >
          {count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

