import { Company } from '../../../types';
import { AppearanceTheme } from '../types';

interface MissionVisionCardProps {
  company: Company;
  theme: AppearanceTheme;
}

export function MissionVisionCard({ company, theme }: MissionVisionCardProps) {
  if (!company.mission && !company.vision) {
    return null;
  }

  return (
    <div
      className="mb-8 rounded-lg p-5 sm:p-6 shadow space-y-4"
      style={{ backgroundColor: theme.cardColor, color: theme.textColor, fontFamily: theme.fontBody }}
    >
      {company.mission && (
        <div className="space-y-2">
          <h2 className="font-semibold text-lg sm:text-xl" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
            Misión
          </h2>
          <p className="text-sm sm:text-base">{company.mission}</p>
        </div>
      )}
      {company.vision && (
        <div className="space-y-2">
          <h2 className="font-semibold text-lg sm:text-xl" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
            Visión
          </h2>
          <p className="text-sm sm:text-base">{company.vision}</p>
        </div>
      )}
    </div>
  );
}
