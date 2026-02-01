import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { createEvent, getEvent, updateEvent } from '../../../services/events';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import { Event as EventType } from '../../../types';

const toInputDateTime = (date?: Date | string) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 16);
};

export default function EventEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { firestoreUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EventType>({
    id: '',
    company_id: '',
    title: '',
    description: '',
    start_date: new Date(),
    end_date: undefined,
    location: '',
    capacity: undefined,
    status: 'DRAFT',
    created_at: new Date(),
    updated_at: new Date(),
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const ev = await getEvent(id);
        if (!ev) {
          toast.error(t('eventsModule.notFound'));
          navigate('/dashboard/events');
          return;
        }
        setForm(ev);
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
    if (!form.title?.trim()) {
      toast.error(t('eventsModule.requiredTitle'));
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        company_id: firestoreUser.company_id,
        start_date: form.start_date instanceof Date ? form.start_date : form.start_date ? new Date(form.start_date) : new Date(),
        end_date: form.end_date ? (form.end_date instanceof Date ? form.end_date : new Date(form.end_date)) : undefined,
      };

      if (isEdit && id) {
        await updateEvent(id, payload);
        toast.success(t('eventsModule.updated'));
      } else {
        await createEvent({ ...payload, id: undefined });
        toast.success(t('eventsModule.created'));
      }
      navigate('/dashboard/events');
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
              {isEdit ? t('eventsModule.editTitle') : t('eventsModule.newTitle')}
            </h1>
            <p className="text-sm text-gray-600">{t('eventsModule.subtitle')}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('eventsModule.fields.title')}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('eventsModule.fields.description')}</label>
            <textarea
              value={form.description || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('eventsModule.fields.startDate')}</label>
              <input
                type="datetime-local"
                value={toInputDateTime(form.start_date)}
                onChange={(e) => setForm((prev) => ({ ...prev, start_date: new Date(e.target.value) }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('eventsModule.fields.endDate')}</label>
              <input
                type="datetime-local"
                value={toInputDateTime(form.end_date)}
                onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value ? new Date(e.target.value) : undefined }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">{t('eventsModule.fields.location')}</label>
            <input
              type="text"
              value={form.location || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('eventsModule.fields.capacity')}</label>
              <input
                type="number"
                min="0"
                value={form.capacity ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('eventsModule.fields.status')}</label>
              <select
                value={form.status || 'DRAFT'}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as any }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRAFT">{t('eventsModule.status.draft')}</option>
                <option value="PUBLISHED">{t('eventsModule.status.published')}</option>
                <option value="CANCELLED">{t('eventsModule.status.cancelled')}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/events')}
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
              {saving ? t('eventsModule.saving') : t('eventsModule.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
