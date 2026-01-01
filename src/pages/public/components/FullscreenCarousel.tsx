import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Company, Service, Product, CartItem } from '../../../types';
import { AppearanceTheme } from '../types';
import { DescriptionCard } from './DescriptionCard';
import { MissionVisionCard } from './MissionVisionCard';
import { OperatingHoursCard } from './OperatingHoursCard';
import { LocationMapCard } from './LocationMapCard';
import { ServicesSection } from './ServicesSection';
import { ProductsSection } from './ProductsSection';
import { VideoCard } from './VideoCard';

interface FullscreenCarouselProps {
  company: Company;
  theme: AppearanceTheme;
  services?: Service[];
  products?: Product[];
  cart?: CartItem[];
  googleMapsApiKey?: string;
  onBook?: (service: Service) => void;
  onServiceClick?: (service: Service) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onProductClick?: (product: Product) => void;
  onOpenCart?: () => void;
}

export function FullscreenCarousel({
  company,
  theme,
  services = [],
  products = [],
  cart = [],
  googleMapsApiKey,
  onBook,
  onServiceClick,
  onAddToCart,
  onUpdateQuantity,
  onProductClick,
  onOpenCart,
}: FullscreenCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Construir array de slides
  const slides = [
    // Video HERO - al inicio si placement es HERO
    company?.video_enabled && company.video_placement === 'HERO' && company.video_url && {
      type: 'video-hero',
      component: <VideoCard company={company} theme={theme} />,
    },
    company?.description && company?.show_description !== false && {
      type: 'description',
      component: <DescriptionCard company={company} theme={theme} isCarousel={true} />,
    },
    (company?.mission || company?.vision) && company?.show_mission_vision !== false && {
      type: 'mission',
      component: <MissionVisionCard company={company} theme={theme} isCarousel={true} />,
    },
    ((company?.weekday_days && company.weekday_days.length > 0) || 
     (company?.weekend_days && company.weekend_days.length > 0)) && {
      type: 'hours',
      component: <OperatingHoursCard company={company} theme={theme} isCarousel={true} />,
    },
    company?.address && googleMapsApiKey && {
      type: 'location',
      component: <LocationMapCard company={company} theme={theme} googleMapsApiKey={googleMapsApiKey} isCarousel={true} />,
    },
    services.length > 0 && {
      type: 'services',
      component: (
        <ServicesSection
          services={services}
          theme={theme}
          onBook={onBook || (() => {})}
          onServiceClick={onServiceClick || (() => {})}
        />
      ),
    },
    products.length > 0 && {
      type: 'products',
      component: (
        <ProductsSection
          products={products}
          theme={theme}
          cart={cart}
          onAddToCart={onAddToCart || (() => {})}
          onUpdateQuantity={onUpdateQuantity || (() => {})}
          onOpenCart={onOpenCart || (() => {})}
          onProductClick={onProductClick || (() => {})}
        />
      ),
    },
    // Video FOOTER - al final si placement es FOOTER
    company?.video_enabled && company.video_placement === 'FOOTER' && company.video_url && {
      type: 'video-footer',
      component: <VideoCard company={company} theme={theme} />,
    },
  ].filter(Boolean) as Array<{ type: string; component: React.ReactNode }>;

  const nextSlide = () => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    // Reset video timer cuando se navega manualmente
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 700);
  };

  const prevSlide = () => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    // Reset video timer cuando se navega manualmente
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 700);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    // Reset video timer cuando se navega manualmente
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 700);
  };

  // Detectar si el slide actual es un video
  const isCurrentSlideVideo = slides[currentIndex]?.type === 'video-hero' || slides[currentIndex]?.type === 'video-footer';
  
  useEffect(() => {
    if (slides.length === 0) return;
    
    // Limpiar timer anterior
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    
    // Esperar a que termine la animación antes de iniciar el timer
    const startTimer = () => {
      // Si el slide actual es un video, esperar 3 minutos (180000 ms)
      if (isCurrentSlideVideo) {
        // Programar el siguiente slide después de 3 minutos
        autoAdvanceTimerRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 180000); // 3 minutos = 180000 ms
      } else {
        // Para slides normales, usar el intervalo de 6 segundos
        autoAdvanceTimerRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 6000);
      }
    };
    
    // Iniciar el timer después de que termine la animación
    const delay = isAnimating ? 700 : 0;
    const timerId = setTimeout(startTimer, delay);
    
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      clearTimeout(timerId);
    };
  }, [currentIndex, isAnimating, slides.length, isCurrentSlideVideo]);

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-[85vh] min-h-[600px] overflow-hidden rounded-3xl mb-8">
      {/* Contenedor del carrusel */}
      <div 
        className="absolute inset-0 flex transition-transform duration-700 ease-in-out"
        style={{ 
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="min-w-full h-full flex items-center justify-center p-6 sm:p-12 overflow-y-auto"
            style={{ 
              backgroundColor: theme.cardColor + '95',
              backdropFilter: 'blur(10px)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full h-full max-w-6xl"
              >
                {slide.component}
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Controles de navegación */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            disabled={isAnimating}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-transparent flex items-center justify-center transition-all z-10 disabled:opacity-50 hover:opacity-80"
            aria-label="Anterior"
          >
            <svg className="w-7 h-7" fill="none" stroke="#4B5563" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            disabled={isAnimating}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-transparent flex items-center justify-center transition-all z-10 disabled:opacity-50 hover:opacity-80"
            aria-label="Siguiente"
          >
            <svg className="w-7 h-7" fill="none" stroke="#4B5563" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isAnimating}
                className={`h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'w-10 bg-white shadow-lg' 
                    : 'w-3 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Ir a slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Contador de slides */}
          <div className="absolute top-6 right-6 z-10 px-4 py-2 rounded-full bg-transparent">
            <span className="text-sm font-semibold text-gray-700">
              {currentIndex + 1} / {slides.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

