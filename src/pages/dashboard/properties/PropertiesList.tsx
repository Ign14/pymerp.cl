import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import AnimatedCard from '../../../components/animations/AnimatedCard';
import AnimatedButton from '../../../components/animations/AnimatedButton';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { getProperties, deleteProperty } from '../../../services/rentals';
import type { Property } from '../../../types';

export default function PropertiesList() {
  const { firestoreUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!firestoreUser?.company_id) return;
      try {
        const list = await getProperties(firestoreUser.company_id);
        setProperties(list);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [firestoreUser?.company_id, handleError]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('propertiesModule.deleteConfirm'))) return;
    try {
      await deleteProperty(id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      toast.success(t('propertiesModule.deleted'));
    } catch (error) {
      handleError(error);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
              aria-label={t('common.back')}
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{t('propertiesModule.title')}</h1>
          </div>
          <Link to="/dashboard/properties/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            {t('propertiesModule.new')}
          </Link>
        </div>

        {properties.length === 0 && <p className="text-sm text-gray-600">{t('propertiesModule.empty')}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((prop, idx) => (
            <AnimatedCard key={prop.id} delay={idx * 0.05} className="bg-white border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{prop.title}</h2>
                  <p className="text-sm text-gray-600 line-clamp-2">{prop.description}</p>
                  <p className="text-sm text-gray-500">{prop.address}</p>
                  <p className="text-sm text-gray-600">{t('propertiesModule.capacity')}: {prop.capacity ?? '-'}</p>
                  <p className="text-sm text-gray-600">{t('propertiesModule.price')}: {prop.price_per_night ? `$${prop.price_per_night}` : t('common.notAvailable')}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${prop.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                  {prop.status || 'INACTIVE'}
                </span>
              </div>
              <div className="flex gap-2">
                <Link to={`/dashboard/properties/${prop.id}`} className="px-3 py-2 rounded bg-blue-50 text-blue-700 text-sm border border-blue-100 hover:bg-blue-100">
                  {t('common.edit')}
                </Link>
                <Link to={`/dashboard/properties/${prop.id}/calendar`} className="px-3 py-2 rounded bg-indigo-50 text-indigo-700 text-sm border border-indigo-100 hover:bg-indigo-100">
                  {t('propertiesModule.calendar')}
                </Link>
                <Link to={`/dashboard/properties/${prop.id}/bookings`} className="px-3 py-2 rounded bg-purple-50 text-purple-700 text-sm border border-purple-100 hover:bg-purple-100">
                  {t('propertiesModule.bookings')}
                </Link>
                <AnimatedButton onClick={() => handleDelete(prop.id)} className="px-3 py-2 bg-red-50 text-red-700 border border-red-100 rounded text-sm hover:bg-red-100">
                  {t('common.delete')}
                </AnimatedButton>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </div>
  );
}
