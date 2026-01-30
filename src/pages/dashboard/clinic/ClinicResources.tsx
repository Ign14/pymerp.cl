import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AnimatedButton from '../../../components/animations/AnimatedButton';
import AnimatedCard from '../../../components/animations/AnimatedCard';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import {
  createClinicResource,
  deleteClinicResource,
  getClinicResources,
  updateClinicResource,
} from '../../../services/clinicResources';
import type { ClinicResource } from '../../../types';

export default function ClinicResources() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();

  const [resources, setResources] = useState<ClinicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'ROOM',
    quantity: '',
    notes: '',
  });

  useEffect(() => {
    if (firestoreUser?.company_id) {
      loadResources();
    }
  }, [firestoreUser?.company_id]);

  const loadResources = async () => {
    if (!firestoreUser?.company_id) return;
    setLoading(true);
    try {
      const data = await getClinicResources(firestoreUser.company_id);
      setResources(data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!firestoreUser?.company_id || !form.name.trim()) return;
    setSaving(true);
    try {
      await createClinicResource({
        company_id: firestoreUser.company_id,
        name: form.name.trim(),
        type: form.type,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        notes: form.notes?.trim() || undefined,
        active: true,
      } as any);
      setForm({ name: '', type: 'ROOM', quantity: '', notes: '' });
      await loadResources();
    } catch (error) {
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateField = async (id: string, updates: Partial<ClinicResource>) => {
    try {
      await updateClinicResource(id, updates);
      setResources((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('clinicResources.deleteConfirm'))) return;
    try {
      await deleteClinicResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      handleError(error);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
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
              <h1 className="text-2xl font-bold text-gray-900">{t('clinicResources.title')}</h1>
              <p className="text-sm text-gray-600">{t('clinicResources.subtitle')}</p>
            </div>
          </div>
        </div>

        <AnimatedCard className="bg-white border border-gray-100 shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 mb-1">{t('clinicResources.name')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder={t('clinicResources.namePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('clinicResources.type')}</label>
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="ROOM">{t('clinicResources.types.ROOM')}</option>
                <option value="EQUIPMENT">{t('clinicResources.types.EQUIPMENT')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('clinicResources.quantity')}</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="1"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm text-gray-700 mb-1">{t('clinicResources.notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <AnimatedButton
              onClick={handleCreate}
              disabled={saving || !form.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {saving ? t('clinicResources.creating') : t('clinicResources.create')}
            </AnimatedButton>
          </div>
        </AnimatedCard>

        <div className="space-y-3">
          {resources.length === 0 && (
            <p className="text-gray-500 text-sm">{t('clinicResources.empty')}</p>
          )}
          {resources.map((resource) => (
            <AnimatedCard key={resource.id} className="bg-white border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={resource.name}
                    onChange={(e) =>
                      setResources((prev) =>
                        prev.map((r) => (r.id === resource.id ? { ...r, name: e.target.value } : r))
                      )
                    }
                    onBlur={(e) => handleUpdateField(resource.id, { name: e.target.value.trim() })}
                    className="text-lg font-semibold text-gray-900 border border-transparent focus:border-blue-500 rounded px-1 py-1"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    {t('clinicResources.types.' + (resource.type as 'ROOM' | 'EQUIPMENT'))}
                  </p>
                  {resource.notes && <p className="text-sm text-gray-500 mt-1">{resource.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateField(resource.id, {
                        active: resource.active === false ? true : false,
                      })
                    }
                    className={`px-3 py-1 rounded text-sm ${
                      resource.active === false ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {resource.active === false ? t('clinicResources.inactive') : t('clinicResources.active')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(resource.id)}
                    className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-sm hover:bg-red-100"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <label className="flex items-center gap-2">
                  <span>{t('clinicResources.typesLabel')}</span>
                  <select
                    value={resource.type}
                    onChange={(e) => handleUpdateField(resource.id, { type: e.target.value })}
                    className="border border-gray-200 rounded px-2 py-1 text-sm"
                  >
                    <option value="ROOM">{t('clinicResources.types.ROOM')}</option>
                    <option value="EQUIPMENT">{t('clinicResources.types.EQUIPMENT')}</option>
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span>{t('clinicResources.quantity')}</span>
                  <input
                    type="number"
                    min="0"
                    value={resource.quantity ?? ''}
                    onChange={(e) => handleUpdateField(resource.id, { quantity: Number(e.target.value) || 0 })}
                    className="w-20 border border-gray-200 rounded px-2 py-1"
                  />
                </label>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </div>
  );
}
