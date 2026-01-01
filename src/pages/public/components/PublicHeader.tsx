import { Company, CompanyAppearance } from '../../../types';
import { AppearanceTheme } from '../types';

interface PublicHeaderProps {
  company: Company;
  appearance: CompanyAppearance | null;
  theme: AppearanceTheme;
}

export function PublicHeader({ company, appearance, theme }: PublicHeaderProps) {
  const hasBanner = Boolean(appearance?.banner_url);
  const logoPosition = appearance?.logo_position || 'center';
  const isCentered = logoPosition === 'center';
  
  // Tamaño del logo: más grande si está centrado
  const logoSizeClass = isCentered 
    ? 'h-[8rem] sm:h-[12rem]' 
    : 'h-[5rem] sm:h-[6.5rem]';
  
  // Clases de alineación según la posición
  const alignmentClass = 
    logoPosition === 'left' ? 'justify-start' :
    logoPosition === 'right' ? 'justify-end' :
    'justify-center';
  
  return (
    <header id="navigation" className={hasBanner ? 'relative w-full' : 'w-full'}>
      {hasBanner && appearance?.banner_url && (
        <div className="w-full h-36 sm:h-64 overflow-hidden">
          <img
            src={appearance.banner_url}
            alt={`Banner de ${company.name}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
          hasBanner ? 'absolute inset-0 flex items-center' : 'py-8'
        }`}
        style={{ color: theme.textColor, fontFamily: theme.fontBody }}
      >
        <div
          className={`w-full ${hasBanner ? 'px-4 py-4 sm:px-6 sm:py-6' : ''} ${
            isCentered ? 'text-center' : ''
          }`}
          style={hasBanner ? { marginTop: '1rem', backgroundColor: 'transparent' } : undefined}
        >
          {appearance?.logo_url ? (
            <div className={`flex ${alignmentClass} ${hasBanner ? 'mt-1 sm:mt-3' : 'mb-4'}`}>
              <img
                src={appearance.logo_url}
                alt={`Logo de ${company.name}`}
                className={`object-contain ${logoSizeClass}`}
                loading="eager"
              />
            </div>
          ) : (
            <div className={isCentered ? 'text-center' : ''}>
              <h1
                className="text-xl sm:text-4xl font-bold mb-1 sm:mb-2"
                style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
              >
                {company.name}
              </h1>
              <p className="text-sm sm:text-xl" style={{ color: theme.subtitleColor, fontFamily: theme.fontBody }}>
                {company.industry}
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
