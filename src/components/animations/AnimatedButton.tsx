import { motion } from 'framer-motion';
import type { ReactNode, CSSProperties, MouseEventHandler } from 'react';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  style?: CSSProperties;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export default function AnimatedButton({
  children,
  onClick,
  className = '',
  style,
  type = 'button',
  disabled = false,
  ariaLabel,
  ariaDescribedBy
}: AnimatedButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={style}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled}
    >
      {children}
    </motion.button>
  );
}
