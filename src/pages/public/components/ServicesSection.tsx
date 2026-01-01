import { Service } from '../../../types';
import { AppearanceTheme } from '../types';
import { getServiceCardLayout } from './cardLayouts/ServiceCardLayouts';

interface ServicesSectionProps {
  services: Service[];
  theme: AppearanceTheme;
  onBook: (service: Service) => void;
  onServiceClick: (service: Service) => void;
}

export function ServicesSection({ services, theme, onBook, onServiceClick }: ServicesSectionProps) {
  if (services.length === 0) {
    return null;
  }

  const cardLayout = theme.cardLayout || 1;
  
  const CardComponent = getServiceCardLayout(cardLayout);
  
  // Layout 2 es lista, necesita grid diferente
  const isListLayout = cardLayout === 2;
  const gridClasses = isListLayout 
    ? 'grid grid-cols-1 gap-3 sm:gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4';

  return (
    <div className="h-full flex flex-col">
      <h2
        className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 sticky top-0 z-10 pb-2"
        style={{ 
          color: theme.titleColor, 
          fontFamily: theme.fontTitle,
          backgroundColor: 'transparent',
        }}
      >
        Servicios
      </h2>
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-1">
        <div className={gridClasses}>
          {services.map((service, index) => (
            <CardComponent
              key={service.id}
              service={service}
              theme={theme}
              onBook={onBook}
              onServiceClick={onServiceClick}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
