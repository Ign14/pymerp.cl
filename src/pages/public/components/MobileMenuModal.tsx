import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import AnimatedModal from '../../../components/animations/AnimatedModal';
import type { CompanyAppearance } from '../../../types';

interface Section {
  id: string;
  label: string;
  icon?: string;
  scrollToId?: string; // ID del elemento al que hacer scroll
}

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  theme: {
    buttonColor: string;
    buttonTextColor: string;
    cardColor: string;
    textColor: string;
    titleColor: string;
  };
  appearance?: CompanyAppearance | null;
}

function scrollToSection(sectionId: string) {
  // Buscar el elemento por ID
  let element = document.getElementById(sectionId);
  
  // Si no se encuentra, intentar buscar dentro de la sección genérica
  if (!element) {
    // Para productos, buscar también "menu-section" (usado en layouts de comida)
    if (sectionId === 'section-products') {
      element = document.getElementById('menu-section');
    }
  }
  
  if (element) {
    const headerOffset = 80; // Offset para el header móvil
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }
}

export function MobileMenuModal({ isOpen, onClose, sections, theme, appearance }: MobileMenuModalProps) {
  const { t } = useTranslation();

  // Usar los mismos colores que la barra superior móvil
  // Priorizar colores del menú si están disponibles, sino usar los generales
  const backgroundColor = appearance?.card_color || theme.cardColor;
  const buttonColor = appearance?.menu_button_color || appearance?.button_color || theme.buttonColor;
  const buttonTextColor = appearance?.menu_button_text_color || appearance?.button_text_color || theme.buttonTextColor;
  const titleColor = appearance?.menu_title_color || appearance?.title_color || theme.titleColor;

  const handleSectionClick = (section: Section) => {
    const targetId = section.scrollToId || `section-${section.id}`;
    scrollToSection(targetId);
    // Cerrar el modal después de un pequeño delay para permitir que el scroll comience
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      className="p-0 relative max-w-full w-full overflow-hidden sm:max-h-[90vh] sm:rounded-lg"
    >
      <div 
        className="flex flex-col"
        style={{ backgroundColor }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b flex-shrink-0"
          style={{ 
            borderColor: `${buttonColor}20`,
            backgroundColor,
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: titleColor }}>
            {(() => {
              const translated = t('publicPage.mobileMenu.title');
              return translated === 'publicPage.mobileMenu.title' ? 'Menú' : translated;
            })()}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full transition hover:opacity-80"
            style={{ color: buttonColor }}
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Lista de secciones */}
        <div style={{ backgroundColor }}>
          <div className="p-4 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionClick(section)}
                className="w-full flex items-center gap-3 p-4 rounded-lg hover:opacity-90 transition text-left"
                style={{
                  backgroundColor: buttonColor,
                  color: buttonTextColor,
                }}
              >
                {section.icon && <span className="text-2xl">{section.icon}</span>}
                <span className="font-semibold">{section.label}</span>
                <svg
                  className="w-5 h-5 ml-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
}
