import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompaniesWithCommune } from '../../services/firestore';
import type { Company } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { env } from '../../config/env';

interface CommuneGroup {
  name: string;
  normalized: string;
  companies: Company[];
}

export default function NearbyCompanies() {
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CommuneGroup | null>(null);
  const mapsKey = env.googleMapsApiKey;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCompaniesWithCommune();
        setCompanies(data);
      } catch (error) {
        handleError(error, { customMessage: 'Error cargando empresas', showToast: false });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const groups = useMemo<CommuneGroup[]>(() => {
    const map = new Map<string, CommuneGroup>();
    for (const company of companies) {
      const raw = (company.commune || '').trim();
      if (!raw) continue;
      const normalized = raw.toLowerCase();
      const display =
        raw
          .toLowerCase()
          .split(' ')
          .filter(Boolean)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') || raw;
      if (!map.has(normalized)) {
        map.set(normalized, { name: display, normalized, companies: [] });
      }
      map.get(normalized)?.companies.push(company);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [companies]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-gray-900">PyMEs cercanas</h1>
        </div>
        <p className="text-gray-700">
          Explora las comunas con PyMEs que publican sus catálogos y agendas en pymerp.cl.
        </p>

        {groups.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center text-gray-600">
            Aún no hay comunas configuradas. Vuelve pronto.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {groups.map(group => (
              <div
                key={group.normalized}
                className="rounded-xl bg-white shadow border border-gray-100 p-4 flex flex-col items-center text-center hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelected(group)}
              >
                <div className="text-3xl mb-2">📍</div>
                <h2 className="text-lg font-semibold text-gray-900">{group.name}</h2>
                <p className="text-xs text-gray-600 mt-1">{group.companies.length} PyME(s)</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <span className="text-xl">📍</span>
                <h3 className="text-lg font-semibold text-gray-900">{selected.name}</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-600 hover:text-gray-800 text-xl"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {selected.companies
                .slice()
                .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'))
                .map((company) => (
                  <div
                    key={company.id}
                    className="border border-gray-100 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1">
                      <a
                        href={`/${company.slug}`}
                        className="text-blue-600 font-semibold hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {company.name || 'Sin nombre'}
                      </a>
                      <p className="text-sm text-gray-700">{company.address || 'Dirección no especificada'}</p>
                    </div>
                    <div className="w-full sm:w-40 h-24 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      {company.latitude && company.longitude && mapsKey ? (
                        <img
                          src={`https://maps.googleapis.com/maps/api/staticmap?center=${company.latitude},${company.longitude}&zoom=14&size=400x200&markers=color:red|${company.latitude},${company.longitude}&key=${mapsKey}`}
                          alt="Mapa"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-xs text-gray-600 px-2 text-center">Mapa no disponible</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
