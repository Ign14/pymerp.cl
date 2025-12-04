import { Company, CompanyAppearance } from '../../../types';
import { AppearanceTheme } from '../types';

interface PublicHeaderProps {
  company: Company;
  appearance: CompanyAppearance | null;
  theme: AppearanceTheme;
}

export function PublicHeader({ company, appearance, theme }: PublicHeaderProps) {
  return (
    <header id="navigation" className="relative w-full">
      {appearance?.banner_url && (
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
          appearance?.banner_url ? 'absolute inset-0 flex items-center justify-center' : 'py-8'
        }`}
        style={{ color: theme.textColor, fontFamily: theme.fontBody }}
      >
        <div
          className={`text-center ${appearance?.banner_url ? 'px-4 py-4 sm:px-6 sm:py-6' : 'mb-8'}`}
          style={appearance?.banner_url ? { marginTop: '1rem', backgroundColor: 'transparent' } : undefined}
        >
          {appearance?.logo_url ? (
            <div className="mt-1 sm:mt-3 flex justify-center">
              <img
                src={appearance.logo_url}
                alt={`Logo de ${company.name}`}
                className="object-contain h-[6.5rem] sm:h-[8.5rem]"
                loading="eager"
              />
            </div>
          ) : (
            <>
              <h1
                className="text-xl sm:text-4xl font-bold mb-1 sm:mb-2"
                style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
              >
                {company.name}
              </h1>
              <p className="text-sm sm:text-xl" style={{ color: theme.subtitleColor, fontFamily: theme.fontBody }}>
                {company.industry}
              </p>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
