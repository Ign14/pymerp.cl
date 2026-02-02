import { BusinessType, Company } from '../../../types';
import { AppearanceTheme } from '../types';
import { DAY_NAMES_ES } from '../constants';

interface OperatingHoursCardProps {
  company: Company;
  theme: AppearanceTheme;
  isCarousel?: boolean;
}

export function OperatingHoursCard({ company, theme, isCarousel = false }: OperatingHoursCardProps) {
  const hasSchedule = company.weekday_days?.length || company.weekend_days?.length;
  if (company.business_type !== BusinessType.PRODUCTS) {
    return null;
  }

  if (!hasSchedule) {
    return null;
  }

  if (isCarousel) {
    return (
      <div
        className="w-full h-full flex flex-col justify-center rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-lg"
        style={{ backgroundColor: theme.cardColor, color: theme.textColor, fontFamily: theme.fontBody }}
      >
        <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-6 sm:mb-8 md:mb-10" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
          Horario de atención
        </h2>
        <div className="space-y-6 sm:space-y-8 md:space-y-10 flex-1 flex flex-col justify-center">
          {company.weekday_days?.length ? (
            <div>
              <p className="font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-3 sm:mb-4 md:mb-5" style={{ color: theme.subtitleColor, fontFamily: theme.fontTitle }}>
                Semana
              </p>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl leading-relaxed sm:leading-loose">
                {company.weekday_days.map((d: string) => DAY_NAMES_ES[d] || d).join(', ')}{' '}
                {company.weekday_open_time && company.weekday_close_time
                  ? `• ${company.weekday_open_time} - ${company.weekday_close_time}`
                  : ''}
              </p>
            </div>
          ) : null}
          {company.weekend_days?.length ? (
            <div>
              <p className="font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-3 sm:mb-4 md:mb-5" style={{ color: theme.subtitleColor, fontFamily: theme.fontTitle }}>
                Fin de semana
              </p>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl leading-relaxed sm:leading-loose">
                {company.weekend_days.map((d: string) => DAY_NAMES_ES[d] || d).join(', ')}{' '}
                {company.weekend_open_time && company.weekend_close_time
                  ? `• ${company.weekend_open_time} - ${company.weekend_close_time}`
                  : ''}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // Badges interactivos para horario
  return (
    <div
      className="mb-4 sm:mb-6"
      style={{
        fontFamily: theme.fontBody,
      }}
    >
      <div className="flex flex-wrap gap-2 items-center">
        {/* Badge de título */}
        <div
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full font-semibold text-xs sm:text-sm shadow-sm"
          style={{
            backgroundColor: theme.buttonColor,
            color: theme.buttonTextColor,
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Horario</span>
        </div>

        {/* Badge de días de semana */}
        {company.weekday_days?.length ? (
          <div
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm shadow-sm border"
            style={{
              backgroundColor: theme.cardColor,
              color: theme.textColor,
              borderColor: theme.buttonColor,
            }}
          >
            <span className="font-semibold" style={{ color: theme.titleColor }}>
              {company.weekday_days.map((d: string) => DAY_NAMES_ES[d]?.[0] || d[0]).join('')}
            </span>
            {company.weekday_open_time && company.weekday_close_time && (
              <>
                <span style={{ color: theme.subtitleColor }}>•</span>
                <span>{company.weekday_open_time} - {company.weekday_close_time}</span>
              </>
            )}
          </div>
        ) : null}

        {/* Badge de fin de semana */}
        {company.weekend_days?.length ? (
          <div
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm shadow-sm border"
            style={{
              backgroundColor: theme.cardColor,
              color: theme.textColor,
              borderColor: theme.buttonColor,
            }}
          >
            <span className="font-semibold" style={{ color: theme.titleColor }}>
              {company.weekend_days.map((d: string) => DAY_NAMES_ES[d]?.[0] || d[0]).join('')}
            </span>
            {company.weekend_open_time && company.weekend_close_time && (
              <>
                <span style={{ color: theme.subtitleColor }}>•</span>
                <span>{company.weekend_open_time} - {company.weekend_close_time}</span>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
