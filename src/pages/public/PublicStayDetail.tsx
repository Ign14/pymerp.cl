import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { getCompany } from '../../services/firestore';
import { getProperty, getPropertyBookings } from '../../services/rentals';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import type { Property, PropertyBooking } from '../../types';
import { useAnalytics } from '../../hooks/useAnalytics';
import { formatLocalDate } from '../../utils/date';

const dateToInput = (d?: Date) => (d ? formatLocalDate(d) : '');

export default function PublicStayDetail() {
  const { companyId, propertyId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();
  const { trackEvent } = useAnalytics();

  const [property, setProperty] = useState<Property | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [companyWhatsapp, setCompanyWhatsapp] = useState<string>('');
  const [bookings, setBookings] = useState<PropertyBooking[]>([]);
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [guests, setGuests] = useState<number>(2);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!companyId || !propertyId) return;
      try {
        const [company, prop, res] = await Promise.all([
          getCompany(companyId),
          getProperty(propertyId),
          getPropertyBookings(companyId, propertyId),
        ]);
        if (!company || !prop || prop.status === 'INACTIVE') {
          navigate('/');
          return;
        }
        setCompanyName(company.name);
        setCompanyWhatsapp(company.whatsapp || '');
        setProperty(prop);
        setBookings(res);
        trackEvent('properties.view', { company_id: company.id, property_id: prop.id });
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, propertyId, handleError, navigate, trackEvent]);

  const overlapping = useMemo(() => {
    if (!checkIn || !checkOut) return false;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    return bookings.some((b) => {
      if ((b.status || 'CONFIRMED') !== 'CONFIRMED') return false;
      const bIn = new Date(b.check_in as any);
      const bOut = new Date(b.check_out as any);
      return inDate < bOut && outDate > bIn;
    });
  }, [bookings, checkIn, checkOut]);

  const handleWhatsapp = () => {
    if (!companyWhatsapp) {
      toast.error(t('menuView.noWhatsapp'));
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error(t('propertiesModule.selectDates'));
      return;
    }
    if (overlapping) {
      toast.error(t('propertiesModule.notAvailableRange'));
      return;
    }
    const phone = companyWhatsapp.replace(/\D/g, '');
    const lines = [
      `Hola! Quiero reservar ${property?.title}`,
      `Check-in: ${checkIn}`,
      `Check-out: ${checkOut}`,
      `Huespedes: ${guests}`,
      property?.price_per_night ? `Precio listado: $${property.price_per_night}/noche` : '',
    ];
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`;
    trackEvent('properties.whatsapp', {
      company_id: companyId,
      property_id: propertyId,
      guests,
    });
    window.open(url, '_blank');
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!property) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <button
          type="button"
          onClick={() => navigate(`/${companyId}/stay`)}
          className="text-sm text-blue-600 hover:underline"
        >
          {t('common.back')}
        </button>
        <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-5 space-y-3">
          <p className="text-xs text-gray-500">{companyName}</p>
          <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
          <p className="text-sm text-gray-600">{property.description}</p>
          <p className="text-sm text-gray-600">{property.address}</p>
          <p className="text-sm text-gray-600">
            {property.price_per_night ? `$${property.price_per_night}/noche` : t('common.notAvailable')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('propertiesModule.checkIn')}</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2"
                min={dateToInput(new Date())}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('propertiesModule.checkOut')}</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2"
                min={checkIn || dateToInput(new Date())}
              />
            </div>
          </div>
          {overlapping && <p className="text-sm text-red-600">{t('propertiesModule.notAvailableRange')}</p>}
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">{t('propertiesModule.guests')}</label>
            <input
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 border border-gray-200 rounded px-3 py-2"
            />
            <button
              type="button"
              onClick={handleWhatsapp}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {t('propertiesModule.whatsapp')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
