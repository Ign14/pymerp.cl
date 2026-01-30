import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCompany } from '../../services/firestore';
import { getProperties } from '../../services/rentals';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import type { Property } from '../../types';

export default function PublicStayList() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();

  const [companyName, setCompanyName] = useState<string>('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!companyId) return;
      try {
        const [company, props] = await Promise.all([getCompany(companyId), getProperties(companyId)]);
        if (!company) {
          navigate('/');
          return;
        }
        setCompanyName(company.name);
        setProperties(props.filter((p) => p.status !== 'INACTIVE'));
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, handleError, navigate]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">{companyName}</p>
            <h1 className="text-2xl font-bold text-gray-900">{t('propertiesModule.publicTitle')}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/${companyId}`)}
            className="text-sm text-blue-600 hover:underline"
          >
            {t('menuView.backToProfile')}
          </button>
        </div>

        {properties.length === 0 && <p className="text-sm text-gray-600">{t('propertiesModule.publicEmpty')}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((prop) => (
            <div key={prop.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{prop.title}</h2>
              <p className="text-sm text-gray-600 line-clamp-3">{prop.description}</p>
              <p className="text-sm text-gray-500">{prop.address}</p>
              <p className="text-sm text-gray-600">
                {prop.price_per_night ? `$${prop.price_per_night}/noche` : t('common.notAvailable')}
              </p>
              <Link to={`/${companyId}/stay/${prop.id}`} className="text-sm text-blue-600 hover:underline">
                {t('propertiesModule.viewDetails')}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
