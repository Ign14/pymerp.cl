import { useState, useEffect, useRef, ReactNode, Children } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { AppearanceTheme } from '../types';

interface HorizontalCarouselProps {
  children: ReactNode | ReactNode[];
  theme: AppearanceTheme;
}

export function HorizontalCarousel({ children, theme }: HorizontalCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  
  const x = useMotionValue(0);
  const springConfig = { damping: 30, stiffness: 300 };
  useSpring(x, springConfig);

  // Convertir children a array de forma segura
  const childrenArray = Children.toArray(children).filter(Boolean);
  const totalItems = childrenArray.length;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollButtons = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons);
    
    // Observar cambios en el tamaño
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      resizeObserver.disconnect();
    };
  }, [childrenArray.length]);

  const scrollTo = (index: number) => {
    const container = scrollContainerRef.current;
    const item = itemsRef.current[index];
    if (!container || !item) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const scrollLeft = container.scrollLeft + (itemRect.left - containerRect.left) - (containerRect.width / 2) + (itemRect.width / 2);

    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    });

    setCurrentIndex(index);
  };

  const scrollBy = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    const newScrollLeft = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    x.set(scrollLeft);

    // Encontrar el índice más cercano
    let closestIndex = 0;
    let closestDistance = Infinity;

    itemsRef.current.forEach((item, index) => {
      if (!item) return;
      const itemRect = item.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const itemCenter = itemRect.left + itemRect.width / 2;
      const containerCenter = containerRect.left + containerRect.width / 2;
      const distance = Math.abs(itemCenter - containerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setCurrentIndex(closestIndex);
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  return (
    <div className="relative w-full">
      {/* Navigation Buttons */}
      {canScrollLeft && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => scrollBy('left')}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 h-12 w-12 items-center justify-center rounded-full shadow-lg backdrop-blur-sm bg-white/90 hover:bg-white transition-colors"
          style={{ color: theme.buttonColor }}
          aria-label="Deslizar hacia la izquierda"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>
      )}

      {canScrollRight && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => scrollBy('right')}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 h-12 w-12 items-center justify-center rounded-full shadow-lg backdrop-blur-sm bg-white/90 hover:bg-white transition-colors"
          style={{ color: theme.buttonColor }}
          aria-label="Deslizar hacia la derecha"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>
      )}

      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-6 scrollbar-hide scroll-smooth px-2 md:px-0"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {childrenArray.map((child, index) => (
          <motion.div
            key={index}
            ref={(el) => {
              itemsRef.current[index] = el;
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="snap-start min-w-[80vw] sm:min-w-[65vw] md:min-w-[42vw] lg:min-w-[34vw] xl:min-w-[28vw] 2xl:min-w-[24vw] max-w-[80vw] sm:max-w-[65vw] md:max-w-[42vw] lg:max-w-[34vw] xl:max-w-[28vw] 2xl:max-w-[24vw] flex-shrink-0"
          >
            <div className="h-full aspect-square bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-xl shadow-lg p-3 sm:p-4 md:p-5 transition-all duration-300 hover:shadow-xl border border-white/30 dark:border-gray-700/30 hover:border-white/50 dark:hover:border-gray-600/50 overflow-hidden">
              <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {child}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Indicators */}
      {totalItems > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          {childrenArray.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? 'w-8 h-3'
                  : 'w-3 h-3 opacity-40 hover:opacity-60'
              }`}
              style={{
                backgroundColor: index === currentIndex ? theme.buttonColor : theme.subtitleColor,
              }}
              aria-label={`Ir a sección ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll Hint (solo en móvil) */}
      {canScrollRight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
        >
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-xs font-medium">Desliza</span>
          </div>
        </motion.div>
      )}

    </div>
  );
}

