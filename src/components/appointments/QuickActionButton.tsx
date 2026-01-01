import { motion } from 'framer-motion';

interface QuickActionButtonProps {
  icon: string;
  label: string;
  description?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function QuickActionButton({
  icon,
  label,
  description,
  onClick,
  variant = 'primary',
  disabled = false,
}: QuickActionButtonProps) {
  const baseStyles = 'flex flex-col items-center justify-center p-6 rounded-xl shadow-md transition-all duration-200 min-h-[160px] w-full';
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg',
    secondary: 'bg-white text-gray-900 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg',
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      whileHover={!disabled ? { scale: 1.02, y: -4 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      aria-label={label}
    >
      <span className="text-4xl mb-3" role="img" aria-hidden="true">
        {icon}
      </span>
      <span className="text-lg font-semibold mb-1">{label}</span>
      {description && (
        <span className={`text-sm ${variant === 'primary' ? 'text-blue-100' : 'text-gray-600'}`}>
          {description}
        </span>
      )}
    </motion.button>
  );
}

