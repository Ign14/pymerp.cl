import AnimatedCard from '../../../components/animations/AnimatedCard';
import AnimatedButton from '../../../components/animations/AnimatedButton';
import { Service } from '../../../types';
import { AppearanceTheme } from '../types';

interface ServicesSectionProps {
  services: Service[];
  theme: AppearanceTheme;
  onPreview: (url?: string | null) => void;
  onBook: (service: Service) => void;
}

export function ServicesSection({ services, theme, onPreview, onBook }: ServicesSectionProps) {
  if (services.length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      <h2
        className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6"
        style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
      >
        Servicios
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {services.map((service, idx) => (
          <AnimatedCard
            key={service.id}
            delay={idx * 0.1}
            className="rounded-lg shadow overflow-hidden flex flex-col"
            style={{ backgroundColor: theme.cardColor, color: theme.textColor, fontFamily: theme.fontBody }}
          >
            <button
              type="button"
              onClick={() => onPreview(service.image_url)}
              className="w-full h-48 sm:h-52 bg-gray-100 flex items-center justify-center group relative"
              aria-label={`Ver imagen grande de ${service.name}`}
            >
              <img
                src={service.image_url}
                alt={`Imagen del servicio ${service.name}`}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition flex items-center justify-center text-white text-lg opacity-0 group-hover:opacity-100">
                🔍
              </span>
            </button>
            <div className="p-4 flex flex-col flex-1">
              <h3
                className="font-semibold text-base sm:text-lg mb-2"
                style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
              >
                {service.name}
              </h3>
              <p className="text-sm mb-4 line-clamp-3" style={{ color: theme.textColor }}>
                {service.description}
              </p>
              <div className="flex justify-between items-center mb-4 text-sm">
                <span
                  className="text-lg sm:text-xl font-bold"
                  style={{ color: theme.buttonColor, fontFamily: theme.fontTitle }}
                >
                  ${service.price.toLocaleString()}
                </span>
                <span style={{ color: theme.subtitleColor }}>{service.estimated_duration_minutes} min</span>
              </div>
              <AnimatedButton
                onClick={() => onBook(service)}
                style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
                className="w-full py-2 rounded-md hover:opacity-90 mt-auto"
              >
                Agendar
              </AnimatedButton>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}
