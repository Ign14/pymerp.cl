import { Professional } from '../../types';

interface ProfessionalHeaderRowProps {
  professionals: Professional[];
  selectedProfessionalId?: string;
}

export function ProfessionalHeaderRow({
  professionals,
  selectedProfessionalId,
}: ProfessionalHeaderRowProps) {
  return (
    <div className="flex bg-gray-50 sticky top-0 z-10 border-b border-gray-200 shadow-sm">
      {professionals.map((professional) => (
        <div
          key={professional.id}
          className={`min-w-[220px] px-4 py-3 border-r border-gray-100 flex items-center gap-3 transition-colors ${
            selectedProfessionalId === professional.id
              ? 'bg-indigo-50 border-indigo-200'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${
            selectedProfessionalId === professional.id
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-100 text-indigo-700'
          }`}>
            {professional.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold truncate ${
              selectedProfessionalId === professional.id
                ? 'text-indigo-900'
                : 'text-gray-900'
            }`}>
              {professional.name}
            </p>
            {professional.specialties && professional.specialties.length > 0 && (
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {professional.specialties.join(', ')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProfessionalHeaderRow;
