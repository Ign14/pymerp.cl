import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createAccessRequest,
  createCompany,
  createUser,
  getUserByEmail,
  updateAccessRequest,
  updateUser,
} from '../services/firestore';
import { sendAccessRequestEmail, sendUserCreationEmail } from '../services/email';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentLanguage } from '../config/i18n';
import { usePageMeta } from '../utils/usePageMeta';
import '../styles/marquee.css';
import { logger } from '../utils/logger';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { resetUserPassword, setCompanyClaim } from '../services/admin';
import { generateRandomPassword } from '../utils/password';
import { generateSlug } from '../utils/slug';
import { AccessRequestStatus, UserRole, UserStatus } from '../types';

export default function RequestAccess() {
  const { handleError, handleAsyncError } = useErrorHandler();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    business_name: '',
    whatsapp: '',
    plan: 'BASIC',
    acceptedBeta: false,
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  usePageMeta({
    title: `${t('requestAccess.title')} | PYM-ERP`,
    description: t('requestAccess.subtitle'),
    image: '/logopymerp.png',
  });

  // Verificar si el email ya está registrado cuando el usuario termine de escribir
  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.email || !formData.email.includes('@')) {
        setEmailError(null);
        return;
      }

      setCheckingEmail(true);
      const result = await handleAsyncError(
        async () => await getUserByEmail(formData.email),
        { showToast: false, context: { action: 'checkEmail' } }
      );
      
      if (result) {
        setEmailError(t('requestAccess.emailAlreadyRegistered'));
      } else {
        setEmailError(null);
      }
      setCheckingEmail(false);
    };

    // Debounce: esperar 500ms después de que el usuario deje de escribir
    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (emailError) {
      toast.error(t('requestAccess.fixEmailError'));
      return;
    }

    if (!formData.acceptedBeta) {
      toast.error(t('requestAccess.acceptBetaTerms'));
      return;
    }

    setLoading(true);
    let requestId: string | null = null;

    try {
      const existingUser = await getUserByEmail(formData.email);
      if (existingUser) {
        toast.error(t('requestAccess.emailAlreadyRegisteredLong'));
        setEmailError(t('requestAccess.emailAlreadyRegistered'));
        setLoading(false);
        return;
      }
    } catch (error) {
      logger.warn('No se pudo verificar el email, continuando...');
    }

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        business_name: formData.business_name,
        whatsapp: formData.whatsapp,
        plan: formData.plan,
      };
      const normalizedPlan = (formData.plan || 'BASIC').toUpperCase() as 'BASIC' | 'STANDARD' | 'PRO';
      const password = generateRandomPassword();
      const slug = generateSlug(formData.business_name);
      const loginUrl = 'https://www.pymerp.cl/login';

      requestId = await createAccessRequest({
        ...payload,
        plan: normalizedPlan,
        whatsapp: formData.whatsapp.replace(/\D/g, ''),
      });

      await resetUserPassword(formData.email, password);
      const userId = await createUser(
        {
          email: formData.email,
          status: UserStatus.FORCE_PASSWORD_CHANGE,
          role: UserRole.ENTREPRENEUR,
        },
        formData.email
      );

      const companyId = await createCompany({
        owner_user_id: userId,
        name: formData.business_name,
        rut: '',
        industry: '',
        whatsapp: formData.whatsapp,
        address: '',
        slug,
        setup_completed: false,
        subscription_plan: normalizedPlan,
      });

      await updateUser(userId, { company_id: companyId });

      try {
        await setCompanyClaim(userId, companyId);
      } catch (claimError) {
        logger.warn('No se pudo asignar claim de compañía automáticamente', claimError);
      }

      try {
        await updateAccessRequest(requestId, {
          status: AccessRequestStatus.APPROVED,
          processed_at: new Date(),
        });
      } catch (updateError) {
        logger.warn('No se pudo marcar la solicitud como aprobada automáticamente', updateError);
      }

      await sendAccessRequestEmail({
        ...payload,
        plan: normalizedPlan,
        created_at: new Date(),
        language: getCurrentLanguage(),
      });

      await sendUserCreationEmail(formData.email, password, loginUrl, getCurrentLanguage());

      setSubmitted(true);
    } catch (error: any) {
      if (requestId) {
        try {
          await updateAccessRequest(requestId, {
            status: AccessRequestStatus.REJECTED,
            processed_at: new Date(),
          });
        } catch (updateError) {
          logger.error('No se pudo actualizar el estado de la solicitud fallida', updateError);
        }
      }

      handleError(error, { 
        customMessage: t('requestAccess.submitError'),
        context: { action: 'submitAccessRequest' }
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-white shadow rounded-lg p-8">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('requestAccess.successTitle')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('requestAccess.successMessage')}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {t('common.backHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-2">
            <div className="flex gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('requestAccess.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('requestAccess.subtitle')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                {t('requestAccess.fullNameLabel')} *
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t('common.email')} *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  emailError 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none sm:text-sm`}
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setEmailError(null); // Limpiar error al escribir
                }}
                disabled={checkingEmail}
              />
              {checkingEmail && (
                <p className="mt-1 text-xs text-gray-500">{t('requestAccess.checkingEmail')}</p>
              )}
              {emailError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{emailError}</p>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    {t('requestAccess.goToLogin')}
                  </button>
                </div>
              )}
            </div>
          <div>
            <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
              {t('requestAccess.businessNameLabel')} *
            </label>
            <input
              id="business_name"
              name="business_name"
              type="text"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder=""
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            />
            <div className="relative overflow-hidden h-5 mt-1">
              <span className="absolute whitespace-nowrap text-xs text-blue-600 animate-marquee">
                {t('requestAccess.businessNameHint')}
              </span>
            </div>
          </div>
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                {t('requestAccess.whatsappLabel')} *
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="+56912345678"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
                {t('requestAccess.planLabel')}
              </label>
              <select
                id="plan"
                name="plan"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              >
                <option value="BASIC">{t('requestAccess.plans.basic')}</option>
                <option value="STANDARD">{t('requestAccess.plans.standard')}</option>
                <option value="PRO">{t('requestAccess.plans.pro')}</option>
              </select>
            </div>

            <div className="flex items-start gap-2">
              <input
                id="acceptedBeta"
                name="acceptedBeta"
                type="checkbox"
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={formData.acceptedBeta}
                onChange={(e) => setFormData({ ...formData, acceptedBeta: e.target.checked })}
                required
              />
              <label htmlFor="acceptedBeta" className="text-sm text-gray-700">
                {t('requestAccess.acceptBetaLabel')}{' '}
                <button
                  type="button"
                  onClick={() => setShowBetaModal(true)}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  {t('requestAccess.betaTermsLink')}
                </button>
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || checkingEmail || !!emailError}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('requestAccess.sendingButton') : checkingEmail ? t('requestAccess.checkingButton') : t('requestAccess.submitButton')}
            </button>
            {emailError && (
              <p className="mt-2 text-xs text-center text-red-600">
                {t('requestAccess.cannotSubmitWithRegisteredEmail')}
              </p>
            )}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mt-3"
            >
              {t('common.backHome')}
            </button>
          </div>
        </form>
      </div>

      {showBetaModal && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative">
            <button
              type="button"
              onClick={() => setShowBetaModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-xl"
              aria-label="Cerrar"
            >
              ×
            </button>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('requestAccess.betaConditionsTitle')}</h3>
            <div className="space-y-3 text-gray-700 text-sm sm:text-base">
              <p>{t('requestAccess.betaCondition1')}</p>
              <p>{t('requestAccess.betaCondition2')}</p>
              <p>{t('requestAccess.betaCondition3')}</p>
              <p>{t('requestAccess.betaCondition4')}</p>
              <p>{t('requestAccess.betaCondition5')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
