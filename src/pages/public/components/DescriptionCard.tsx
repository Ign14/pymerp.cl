import type { Company } from '../../../types';
import type { AppearanceTheme } from '../types';

interface DescriptionCardProps {
  company: Company;
  theme: AppearanceTheme;
  isCarousel?: boolean;
}

export function DescriptionCard({ company, theme, isCarousel = false }: DescriptionCardProps) {
  // Only show if description exists and show_description is explicitly true (default false)
  if (!company.description || company.show_description === false) {
    return null;
  }

  if (isCarousel) {
    return (
      <div
        className="w-full h-full flex flex-col rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 shadow-lg overflow-hidden"
        style={{ backgroundColor: theme.cardColor, color: theme.textColor, fontFamily: theme.fontBody }}
      >
        <div className="flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
          <h2 className="font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl flex-shrink-0" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
            📋 Acerca de {company.name}
          </h2>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl leading-relaxed sm:leading-loose md:leading-loose whitespace-pre-line break-words hyphens-auto" style={{ color: theme.textColor }}>
              {company.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const borderColor =
    theme.titleColor && theme.titleColor.startsWith('#')
      ? `${theme.titleColor}20`
      : 'rgba(148,163,184,0.25)';
  return (
    <div
      className="mb-4 sm:mb-6 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm sm:shadow-md overflow-hidden border"
      style={{
        backgroundColor: theme.cardColor,
        color: theme.textColor,
        fontFamily: theme.fontBody,
        borderColor,
      }}
    >
      <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
        <h2 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl mb-1.5 sm:mb-2 md:mb-2.5 flex-shrink-0" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
          📋 Acerca de {company.name}
        </h2>
        <div className="overflow-hidden">
          <p className="text-xs sm:text-sm md:text-base lg:text-base leading-relaxed sm:leading-relaxed md:leading-loose whitespace-pre-line break-words hyphens-auto line-clamp-none" style={{ color: theme.textColor }}>
            {company.description}
          </p>
        </div>
      </div>
    </div>
  );
}

