import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { createProperty, getProperty, updateProperty } from '../../../services/rentals';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import type { Property } from '../../../types';

export default function PropertyEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Property>({
    id: '',
    company_id: '',
    title: '',
    description: '',
    address: '',
    location: '',
    capacity: undefined,
    amenities: [],
    price_per_night: undefined,
    currency: 'CLP',
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const prop = await getProperty(id);
        if (!prop) {
          toast.error(t('propertiesModule.notFound'));
          navigate('/dashboard/properties');
          return;
        }
        setForm(prop);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, handleError, navigate, t]);

  const handleSave = async () => {
    if (!firestoreUser?.company_id) return;
    if (!form.title.trim()) {
      toast.error(t('propertiesModule.requiredTitle'));
      return;
    }
    setSaving(true);
    try {
      const payload: any = { ...form, company_id: firestoreUser.company_id };
      if (isEdit && id) {
        await updateProperty(id, payload);
        toast.success(t('propertiesModule.updated'));
      } else {
        await createProperty({ ...payload, id: undefined });
        toast.success(t('propertiesModule.created'));
      }
      navigate('/dashboard/properties');
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
            aria-label={t('common.back')}
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? t('propertiesModule.editTitle') : t('propertiesModule.newTitle')}
            </h1>
            <p className="text-sm text-gray-600">{t('propertiesModule.subtitle')}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('propertiesModule.fields.title')}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('propertiesModule.fields.description')}</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('propertiesModule.fields.address')}</label>
            <input
              type="text"
              value={form.address || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('propertiesModule.fields.capacity')}</label>
              <input
                type="number"
                min="0"
                value={form.capacity ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('propertiesModule.fields.price')}</label>
              <input
                type="number"
                min="0"
                value={form.price_per_night ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, price_per_night: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('propertiesModule.fields.status')}</label>
            <select
              value={form.status || 'ACTIVE'}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as any }))}
              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">{t('propertiesModule.status.active')}</option>
              <option value="INACTIVE">{t('propertiesModule.status.inactive')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('propertiesModule.fields.amenities')}</label>
            <input
              type="text"
              value={form.amenities?.join(', ') || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, amenities: e.target.value.split(',').map((a) => a.trim()).filter(Boolean) }))}
              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="WiFi, Estacionamiento, Desayuno"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/properties')}
              className="px-4 py-2 border border-gray-200 rounded text-sm hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              {saving ? t('propertiesModule.saving') : t('propertiesModule.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
