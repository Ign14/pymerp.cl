import { useEffect, useState } from 'react';

interface EditableIndicatorProps {
  label: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  isPreview?: boolean;
}

export function EditableIndicator({ label, position = 'top', isPreview = false }: EditableIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Solo mostrar si estamos en modo preview
    if (isPreview) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isPreview]);

  if (!isPreview || !isVisible) return null;

  const positionClasses = {
    top: '-top-8 left-1/2 -translate-x-1/2',
    bottom: '-bottom-8 left-1/2 -translate-x-1/2',
    left: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-2',
    right: 'right-0 top-1/2 -translate-y-1/2 translate-x-full ml-2',
  };

  return (
    <div
      className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded shadow-lg whitespace-nowrap pointer-events-none ${positionClasses[position]} animate-fade-in`}
      role="tooltip"
    >
      {label}
      <div
        className={`absolute w-2 h-2 bg-blue-600 transform rotate-45 ${
          position === 'top'
            ? 'bottom-[-4px] left-1/2 -translate-x-1/2'
            : position === 'bottom'
            ? 'top-[-4px] left-1/2 -translate-x-1/2'
            : position === 'left'
            ? 'right-[-4px] top-1/2 -translate-y-1/2'
            : 'left-[-4px] top-1/2 -translate-y-1/2'
        }`}
      />
    </div>
  );
}
