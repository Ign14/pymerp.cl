import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useAnalytics } from '../../hooks/useAnalytics';
import { listProfessionals } from '../../services/professionals';
import { createManualAppointment } from '../../services/appointments';
import { getServices } from '../../services/firestore';
import { isServiceError, ServiceErrorCode } from '../../services/errorHelpers';
import type { Professional, Service } from '../../types';
import { AppointmentStatus } from '../../types';
import toast from 'react-hot-toast';
import LoadingSpinner from '../animations/LoadingSpinner';
import { sanitizeText, isValidPhone, isValidEmail } from '../../services/validation';

interface AppointmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AppointmentForm({ onSuccess, onCancel }: AppointmentFormProps) {
  const { t } = useTranslation('appointments');
  const { firestoreUser } = useAuth();
  const { handleAsyncError } = useErrorHandler();
  const { trackNamedEvent } = useAnalytics();
  
  const [loading, setLoading] = useState(false);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    serviceId: '',
    professionalId: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (firestoreUser?.company_id) {
      loadProfessionals();
      loadServices();
    }
  }, [firestoreUser]);

  const loadProfessionals = async () => {
    if (!firestoreUser?.company_id) return;
    
    try {
      const data = await listProfessionals(firestoreUser.company_id);
      setProfessionals(data);
    } catch (error) {
      handleAsyncError(async () => {
        throw error;
      });
    }
  };

  const loadServices = async () => {
    if (!firestoreUser?.company_id) return;

    try {
      const data = await getServices(firestoreUser.company_id);
      setServices(data);
    } catch (error) {
      handleAsyncError(async () => {
        throw error;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = t('form.validation.clientNameRequired');
    } else if (formData.clientName.trim().length < 3) {
      newErrors.clientName = t('form.validation.clientNameMinLength', { min: 3 });
    }

    if (!formData.clientPhone.trim()) {
      newErrors.clientPhone = t('form.validation.clientPhoneRequired');
    } else if (!isValidPhone(formData.clientPhone)) {
      newErrors.clientPhone = t('form.validation.clientPhoneInvalid');
    }

    if (formData.clientEmail && !isValidEmail(formData.clientEmail)) {
      newErrors.clientEmail = t('form.validation.clientEmailInvalid');
    }

    if (!formData.serviceId) {
      newErrors.serviceId = t('form.validation.serviceRequired');
    }

    if (!formData.professionalId) {
      newErrors.professionalId = t('form.validation.professionalRequired');
    }

    if (!formData.date) {
      newErrors.date = t('form.validation.dateRequired');
    }

    if (!formData.startTime) {
      newErrors.startTime = t('form.validation.startTimeRequired');
    }

    if (!formData.endTime) {
      newErrors.endTime = t('form.validation.endTimeRequired');
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = t('form.validation.invalidTimeRange');
    }

    if (formData.notes && formData.notes.length > 600) {
      newErrors.notes = t('form.validation.notesMaxLength', { max: 600 });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !firestoreUser?.company_id) return;

    setLoading(true);

    try {
      await handleAsyncError(async () => {
        const appointmentDate = new Date(formData.date);
        const sanitizedNotes = formData.notes ? sanitizeText(formData.notes, 600) : undefined;
        
        await createManualAppointment(
          {
            company_id: firestoreUser.company_id!,
            service_id: formData.serviceId,
            professional_id: formData.professionalId,
            client_name: sanitizeText(formData.clientName, 120),
            client_phone: formData.clientPhone.trim(),
            client_email: formData.clientEmail ? formData.clientEmail.trim() : undefined,
            appointment_date: appointmentDate,
            start_time: formData.startTime,
            end_time: formData.endTime,
            notes: sanitizedNotes,
            status: AppointmentStatus.CONFIRMED,
          },
          firestoreUser.id
        );

        trackNamedEvent('appointments.manualCreated', {
          professional_id: formData.professionalId,
          service_id: formData.serviceId,
        });

        toast.success(t('messages.created'));
        onSuccess?.();
      });
    } catch (error: any) {
      // Custom error handling for specific cases
      if (isServiceError(error, ServiceErrorCode.SLOT_TAKEN)) {
        toast.error(t('errors.slotTaken'));
      } else if (isServiceError(error, ServiceErrorCode.SLOT_UNAVAILABLE)) {
        toast.error(t('errors.slotUnavailable'));
      } else {
        toast.error(t('errors.unknownError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('form.title')}</h2>

        {/* Client Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('form.labels.client')}</h3>

          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
              {t('form.labels.clientName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="clientName"
              value={formData.clientName}
              onChange={(e) => handleChange('clientName', e.target.value)}
              placeholder={t('form.placeholders.clientName')}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.clientName
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              aria-invalid={!!errors.clientName}
              aria-describedby={errors.clientName ? 'clientName-error' : undefined}
            />
            {errors.clientName && (
              <p id="clientName-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.clientName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700">
                {t('form.labels.clientPhone')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="clientPhone"
                value={formData.clientPhone}
                onChange={(e) => handleChange('clientPhone', e.target.value)}
                placeholder={t('form.placeholders.clientPhone')}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.clientPhone
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                aria-invalid={!!errors.clientPhone}
                aria-describedby={errors.clientPhone ? 'clientPhone-error' : undefined}
              />
              {errors.clientPhone && (
                <p id="clientPhone-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.clientPhone}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700">
                {t('form.labels.clientEmail')}
              </label>
              <input
                type="email"
                id="clientEmail"
                value={formData.clientEmail}
                onChange={(e) => handleChange('clientEmail', e.target.value)}
                placeholder={t('form.placeholders.clientEmail')}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.clientEmail
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                aria-invalid={!!errors.clientEmail}
                aria-describedby={errors.clientEmail ? 'clientEmail-error' : undefined}
              />
              {errors.clientEmail && (
                <p id="clientEmail-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.clientEmail}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700">
                {t('form.labels.service')} <span className="text-red-500">*</span>
              </label>
              <select
                id="serviceId"
                value={formData.serviceId}
                onChange={(e) => handleChange('serviceId', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.serviceId
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                aria-invalid={!!errors.serviceId}
                aria-describedby={errors.serviceId ? 'serviceId-error' : undefined}
              >
                <option value="">{t('form.placeholders.selectService')}</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {errors.serviceId && (
                <p id="serviceId-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.serviceId}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="professionalId" className="block text-sm font-medium text-gray-700">
                {t('form.labels.professional')} <span className="text-red-500">*</span>
              </label>
              <select
                id="professionalId"
                value={formData.professionalId}
                onChange={(e) => handleChange('professionalId', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.professionalId
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                aria-invalid={!!errors.professionalId}
                aria-describedby={errors.professionalId ? 'professionalId-error' : undefined}
              >
                <option value="">{t('form.placeholders.selectProfessional')}</option>
                {professionals.map((pro) => (
                  <option key={pro.id} value={pro.id}>
                    {pro.name}
                  </option>
                ))}
              </select>
              {errors.professionalId && (
                <p id="professionalId-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.professionalId}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                {t('form.labels.date')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.date
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? 'date-error' : undefined}
              />
              {errors.date && (
                <p id="date-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.date}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                {t('form.labels.startTime')} <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="startTime"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.startTime
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                aria-invalid={!!errors.startTime}
                aria-describedby={errors.startTime ? 'startTime-error' : undefined}
              />
              {errors.startTime && (
                <p id="startTime-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.startTime}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                {t('form.labels.endTime')} <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="endTime"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  errors.endTime
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
                aria-invalid={!!errors.endTime}
                aria-describedby={errors.endTime ? 'endTime-error' : undefined}
              />
              {errors.endTime && (
                <p id="endTime-error" className="mt-1 text-sm text-red-600" role="alert">
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              {t('form.labels.notes')}
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder={t('form.placeholders.notes')}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                errors.notes
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              aria-invalid={!!errors.notes}
              aria-describedby={errors.notes ? 'notes-error' : undefined}
            />
            {errors.notes && (
              <p id="notes-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('form.buttons.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading && <LoadingSpinner size="sm" />}
          {t('form.buttons.submit')}
        </button>
      </div>
    </form>
  );
}
