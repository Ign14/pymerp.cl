import { BusinessType, Company } from '../../../types';
import { AppearanceTheme } from '../types';
import { DAY_NAMES_ES } from '../constants';

interface OperatingHoursCardProps {
  company: Company;
  theme: AppearanceTheme;
}

export function OperatingHoursCard({ company, theme }: OperatingHoursCardProps) {
  const hasSchedule = company.weekday_days?.length || company.weekend_days?.length;
  if (company.business_type !== BusinessType.PRODUCTS) {
    return null;
  }

  if (!hasSchedule) {
    return null;
  }

  return (
    <div
      className="mb-8 rounded-lg p-5 sm:p-6 shadow space-y-3"
      style={{ backgroundColor: theme.cardColor, color: theme.textColor, fontFamily: theme.fontBody }}
    >
      <h2 className="font-semibold text-lg sm:text-xl" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
        Horario de atención
      </h2>
      <div className="space-y-3">
        {company.weekday_days?.length ? (
          <div>
            <p className="font-semibold" style={{ color: theme.subtitleColor, fontFamily: theme.fontTitle }}>
              Semana
            </p>
            <p className="text-sm sm:text-base">
              {company.weekday_days.map((d: string) => DAY_NAMES_ES[d] || d).join(', ')}{' '}
              {company.weekday_open_time && company.weekday_close_time
                ? `• ${company.weekday_open_time} - ${company.weekday_close_time}`
                : ''}
            </p>
          </div>
        ) : null}
        {company.weekend_days?.length ? (
          <div>
            <p className="font-semibold" style={{ color: theme.subtitleColor, fontFamily: theme.fontTitle }}>
              Fin de semana
            </p>
            <p className="text-sm sm:text-base">
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
