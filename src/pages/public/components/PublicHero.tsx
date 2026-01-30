import React from 'react';
import { AppearanceTheme } from '../types';
import type { Company, CompanyAppearance } from '../../../types';
import { getCategoryConfig, resolveCategoryId } from '../../../config/categories';

interface PublicHeroProps {
  company: Company;
  appearance: CompanyAppearance | null;
  theme: AppearanceTheme;
  onPrimaryCta?: () => void;
  primaryLabel: string;
  secondary?: React.ReactNode;
  showDescription?: boolean;
  hidePrimaryCta?: boolean;
  hideLogoOnMobile?: boolean;
  onMenuClick?: () => void;
}

export function PublicHero({
  company,
  appearance,
  theme,
  onPrimaryCta,
  primaryLabel,
  secondary,
  showDescription: _showDescription = true, // kept for API compatibility
  hidePrimaryCta = false,
  hideLogoOnMobile = false,
  onMenuClick,
}: PublicHeroProps) {
  // Para barberías, la tarjeta debe ser 100% transparente
  const categoryId = resolveCategoryId(company);
  const categoryConfig = getCategoryConfig(categoryId);
  const isRetailCategory = categoryConfig?.group === 'RETAIL';
  const isBarberias = categoryId === 'barberias';
  
  // Obtener colores del hero desde appearance o usar defaults
  const heroCardColor = appearance?.hero_card_color || theme.cardColor;
  // Si es barberías, forzar opacidad a 0 (100% transparente)
  const heroCardOpacity = isBarberias ? 0 : (appearance?.hero_card_opacity ?? theme.cardOpacity ?? 1);
  const heroBackgroundImage = appearance?.hero_background_image;
  const heroTitleColor = appearance?.hero_title_color || theme.titleColor;
  const heroTextColor = appearance?.hero_text_color || theme.textColor;
  const heroPrimaryButtonColor = appearance?.hero_primary_button_color || theme.buttonColor;
  const heroPrimaryButtonTextColor = appearance?.hero_primary_button_text_color || theme.buttonTextColor;
  const heroSecondaryButtonColor = appearance?.hero_secondary_button_color || theme.buttonColor;
  const heroSecondaryButtonTextColor = appearance?.hero_secondary_button_text_color || theme.buttonTextColor;

  // Calcular rgba para el color de la tarjeta
  const toRgba = (color: string, alpha: number): string => {
    const safeAlpha = Math.min(1, Math.max(0, alpha));
    const hex = color?.trim();
    if (!hex) return `rgba(255,255,255,${safeAlpha})`;
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
      return hex.replace(/rgba?\(([^)]+)\)/, (_, values) => {
        const parts = values.split(',').map((v: string) => v.trim());
        const [r, g, b] = parts;
        return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
      });
    }
    const normalized = hex.replace('#', '');
    const fullHex = normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized;
    const intVal = parseInt(fullHex.substring(0, 6), 16);
    const r = (intVal >> 16) & 255;
    const g = (intVal >> 8) & 255;
    const b = intVal & 255;
    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
  };

  const renderContent = () => {
    const logoUrl = appearance?.logo_url || (company as any)?.logo_url;
    const logoElement = logoUrl ? (
      <div className={`items-center gap-3 ${hideLogoOnMobile ? 'hidden sm:flex' : 'flex'}`}>
        <img
          src={logoUrl}
          alt={`Logo de ${company.name}`}
          className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
          loading="eager"
        />
      </div>
    ) : null;

    // No mostrar botones si hidePrimaryCta es true o si es categoría de productos (retail)
    const hideButtons = hidePrimaryCta || isRetailCategory;
    const buttonsElement = !hideButtons ? (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onPrimaryCta}
          className="rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: heroPrimaryButtonColor,
            color: heroPrimaryButtonTextColor,
            fontFamily: theme.fontButton,
          }}
          aria-label={primaryLabel}
        >
          {primaryLabel}
        </button>
        {secondary && (() => {
          // No renderizar si contiene "Chat on WhatsApp" o el emoji 💬
          let shouldHide = false;
          if (typeof secondary === 'string') {
            shouldHide = secondary.includes('Chat on WhatsApp') || secondary.includes('💬') || secondary.includes('Chat');
          } else if (React.isValidElement(secondary)) {
            const children = secondary.props?.children;
            const childrenStr = typeof children === 'string' ? children : String(children || '');
            shouldHide = childrenStr.includes('Chat on WhatsApp') || childrenStr.includes('💬') || childrenStr.includes('Chat');
          } else {
            const secondaryStr = String(secondary);
            shouldHide = secondaryStr.includes('Chat on WhatsApp') || secondaryStr.includes('💬') || secondaryStr.includes('Chat');
          }
          
          if (shouldHide) {
            return null;
          }
          
          return (
            <div
              className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{
                backgroundColor: `${heroSecondaryButtonColor}10`,
                borderColor: `${heroSecondaryButtonColor}30`,
                color: heroSecondaryButtonTextColor,
                fontFamily: theme.fontBody,
              }}
            >
              {secondary}
            </div>
          );
        })()}
      </div>
    ) : null;

    return (
      <div className="space-y-6">
        <div
          className="flex items-center justify-between rounded-2xl border px-4 py-3 backdrop-blur"
          style={{
            backgroundColor: toRgba(heroCardColor, heroCardOpacity),
            borderColor: toRgba(heroCardColor, Math.min(heroCardOpacity + 0.1, 1)),
          }}
        >
          <div className="flex items-center gap-3">
            {logoElement}
            <span
              className="text-sm font-semibold uppercase tracking-wide"
              style={{ color: heroTitleColor, fontFamily: theme.fontTitle }}
            >
              Menú
            </span>
          </div>
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex sm:hidden items-center justify-center rounded-full p-3 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            aria-label="Abrir menú"
            style={{ color: heroTextColor }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {buttonsElement && (
          <div className="space-y-4">
            {buttonsElement}
          </div>
        )}
      </div>
    );
  };

  return (
    <section 
      className="relative overflow-hidden rounded-3xl sm:rounded-[32px] p-5 sm:p-8 lg:p-10 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 transition-shadow shadow-xl"
      style={heroBackgroundImage ? {
        backgroundImage: `url(${heroBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      } : undefined}
      tabIndex={-1}
    >
      {/* Overlay con el color de fondo y opacidad */}
      {/* Para barberías, este overlay es 100% transparente */}
      <div
        className="absolute inset-0 rounded-3xl sm:rounded-[32px]"
        style={{
          backgroundColor: toRgba(heroCardColor, heroCardOpacity),
        }}
      />
      
      {/* Contenido sobre el overlay */}
      <div className="relative z-10">
        {renderContent()}
      </div>
    </section>
  );
}
