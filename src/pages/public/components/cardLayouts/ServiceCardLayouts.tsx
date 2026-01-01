import { Service } from '../../../../types';
import { AppearanceTheme } from '../../types';
import AnimatedButton from '../../../../components/animations/AnimatedButton';

interface ServiceCardProps {
  service: Service;
  theme: AppearanceTheme;
  onBook: (service: Service) => void;
  onServiceClick: (service: Service) => void;
  index: number;
}

// Layout 1: Grid Clásico (actual)
export function Layout1ServiceCard({ service, theme, onBook, onServiceClick }: ServiceCardProps) {
  return (
    <div
      onClick={() => onServiceClick(service)}
      className="rounded-lg sm:rounded-xl shadow-md overflow-hidden flex flex-col border border-gray-200/50 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer h-full"
      style={{ backgroundColor: theme.cardColor, color: theme.textColor, fontFamily: theme.fontBody }}
    >
      <div className="relative">
        <div 
          className="w-full h-32 xs:h-36 sm:h-40 md:h-44 flex items-center justify-center group relative flex-shrink-0"
          style={{ backgroundColor: theme.cardColor + '20' }}
        >
          <img
            src={service.image_url}
            alt={`Imagen del servicio ${service.name}`}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
            <span className="text-white text-xs sm:text-sm font-semibold bg-black/50 px-2 sm:px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition">
              Ver detalles
            </span>
          </div>
        </div>
      </div>
      <div className="p-2.5 sm:p-3 md:p-4 flex flex-col flex-1">
        <h3
          className="font-semibold text-xs sm:text-sm md:text-base mb-1 sm:mb-1.5 line-clamp-2"
          style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
        >
          {service.name}
        </h3>
        <p className="text-xs sm:text-sm mb-2 sm:mb-2.5 line-clamp-2 flex-1 leading-relaxed" style={{ color: theme.textColor }}>
          {service.description}
        </p>
        <div className="flex justify-between items-center mb-2 sm:mb-2.5 text-xs sm:text-sm">
          {service.hide_price ? (
            <span
              className="text-xs sm:text-sm font-medium flex items-center gap-1"
              style={{ color: '#25D366', fontFamily: theme.fontBody }}
            >
              <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Consulta precio
            </span>
          ) : (
            <span
              className="text-sm sm:text-base md:text-lg font-bold"
              style={{ color: theme.buttonColor, fontFamily: theme.fontTitle }}
            >
              ${service.price.toLocaleString()}
            </span>
          )}
          <span className="flex items-center gap-1" style={{ color: theme.subtitleColor }}>
            <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs sm:text-sm">{service.estimated_duration_minutes} min</span>
          </span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <AnimatedButton
            onClick={() => onBook(service)}
            style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
            className="w-full py-1.5 sm:py-2 text-xs sm:text-sm rounded-md hover:opacity-90 font-medium"
            ariaLabel={`Agendar servicio ${service.name}`}
          >
            📅 Agendar
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}


// Layout 6: Estilo Tarjeta Premium - Con gradientes sutiles y sombras suaves
export function Layout6ServiceCard({ service, theme, onBook, onServiceClick }: ServiceCardProps) {
  return (
    <div
      onClick={() => onServiceClick(service)}
      className="rounded-xl sm:rounded-2xl overflow-hidden flex flex-col border hover:shadow-2xl hover:scale-[1.01] transition-all cursor-pointer relative group h-full"
      style={{ 
        backgroundColor: theme.cardColor, 
        color: theme.textColor, 
        fontFamily: theme.fontBody,
        borderColor: theme.buttonColor + '20',
        boxShadow: `0 8px 32px ${theme.buttonColor}08`,
      }}
    >
      <div className="relative h-36 xs:h-40 sm:h-44 md:h-48 lg:h-52 overflow-hidden">
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${theme.buttonColor}08 0%, ${theme.buttonColor}02 100%)`,
          }}
        >
          <img
            src={service.image_url}
            alt={`Imagen del servicio ${service.name}`}
            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5" />
      </div>
      
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col flex-1 relative">
        {/* Línea decorativa superior */}
        <div 
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ 
            background: `linear-gradient(90deg, ${theme.buttonColor} 0%, ${theme.buttonColor}80 50%, transparent 100%)`,
          }}
        />
        
        <h3
          className="font-bold text-sm sm:text-base md:text-lg lg:text-xl mb-1.5 sm:mb-2 mt-1 line-clamp-2"
          style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
        >
          {service.name}
        </h3>
        <p className="text-xs sm:text-sm md:text-base mb-3 sm:mb-4 line-clamp-2 flex-1 leading-relaxed sm:leading-loose" style={{ color: theme.textColor, opacity: 0.8 }}>
          {service.description}
        </p>
        
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            {service.hide_price ? (
              <span
                className="text-sm sm:text-base md:text-lg font-medium flex items-center gap-1.5"
                style={{ color: '#25D366', fontFamily: theme.fontBody }}
              >
                <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Consulta precio por WhatsApp
              </span>
            ) : (
              <span
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold block"
                style={{ color: theme.buttonColor, fontFamily: theme.fontTitle }}
              >
                ${service.price.toLocaleString()}
              </span>
            )}
            <span className="text-xs sm:text-sm font-light mt-0.5" style={{ color: theme.subtitleColor }}>
              Duración: {service.estimated_duration_minutes} min
            </span>
          </div>
        </div>
        
        <div onClick={(e) => e.stopPropagation()}>
          <AnimatedButton
            onClick={() => onBook(service)}
            style={{ 
              background: `linear-gradient(135deg, ${theme.buttonColor} 0%, ${theme.buttonColor}ee 100%)`,
              color: theme.buttonTextColor, 
              fontFamily: theme.fontButton 
            }}
            className="w-full py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base rounded-lg sm:rounded-xl hover:opacity-90 font-semibold shadow-md hover:shadow-lg transition-all"
            ariaLabel={`Agendar servicio ${service.name}`}
          >
            📅 Reservar
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}

// Layout 2: Estilo Lista - Imagen circular y botón a la derecha
export function Layout2ServiceCard({ service, theme, onBook, onServiceClick }: ServiceCardProps) {
  return (
    <div
      onClick={() => onServiceClick(service)}
      className="rounded-lg sm:rounded-xl overflow-hidden flex flex-col sm:flex-row items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 border hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer group"
      style={{ 
        backgroundColor: theme.cardColor, 
        color: theme.textColor, 
        fontFamily: theme.fontBody,
        borderColor: theme.buttonColor + '20',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      {/* Imagen circular */}
      <div className="relative flex-shrink-0">
        <div 
          className="w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex items-center justify-center"
          style={{ 
            backgroundColor: theme.buttonColor + '15',
            border: `2px solid ${theme.buttonColor}30`,
          }}
        >
          <img
            src={service.image_url}
            alt={`Imagen del servicio ${service.name}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        </div>
      </div>
      
      {/* Contenido central */}
      <div className="flex-1 min-w-0 w-full sm:w-auto">
        <h3
          className="font-bold text-xs sm:text-sm md:text-base lg:text-lg mb-0.5 sm:mb-1 line-clamp-1 sm:line-clamp-2 text-center sm:text-left"
          style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
        >
          {service.name}
        </h3>
        <p className="text-xs sm:text-sm mb-1.5 sm:mb-2 line-clamp-2 leading-relaxed text-center sm:text-left" style={{ color: theme.textColor, opacity: 0.85 }}>
          {service.description}
        </p>
        <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 flex-wrap">
          {service.hide_price ? (
            <span
              className="text-xs sm:text-sm font-medium flex items-center gap-1"
              style={{ color: '#25D366', fontFamily: theme.fontBody }}
            >
              <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Consulta precio
            </span>
          ) : (
            <span
              className="text-sm sm:text-base md:text-lg lg:text-xl font-extrabold"
              style={{ color: theme.buttonColor, fontFamily: theme.fontTitle }}
            >
              ${service.price.toLocaleString()}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs sm:text-sm" style={{ color: theme.subtitleColor }}>
            <svg className="w-3 sm:w-3.5 h-3 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {service.estimated_duration_minutes} min
          </span>
        </div>
      </div>
      
      {/* Botón a la derecha */}
      <div className="flex-shrink-0 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
        <AnimatedButton
          onClick={() => onBook(service)}
          style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
          className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base rounded-lg hover:opacity-90 font-semibold shadow-md hover:shadow-lg transition-all whitespace-nowrap"
          ariaLabel={`Agendar servicio ${service.name}`}
        >
          📅 Agendar
        </AnimatedButton>
      </div>
    </div>
  );
}

// Mapper function
export function getServiceCardLayout(layout: 1 | 2 | 3) {
  const layouts = {
    1: Layout1ServiceCard, // Grid Clásico
    2: Layout2ServiceCard, // Lista con imagen circular
    3: Layout6ServiceCard, // Tarjeta Premium (usando Layout 6 que ya está bien)
  };
  return layouts[layout] || Layout1ServiceCard;
}

