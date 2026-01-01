import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createAccessRequest,
  createCompany,
  createUser,
  updateUser,
} from '../services/firestore';
import { sendAccessRequestEmail } from '../services/email';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { getCurrentLanguage } from '../config/i18n';
import { usePageMeta } from '../utils/usePageMeta';
import '../styles/marquee.css';
import { logger } from '../utils/logger';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { setCompanyClaim } from '../services/admin';
import { generateRandomPassword } from '../utils/password';
import { generateSlug } from '../utils/slug';
import { UserRole, UserStatus, BusinessType } from '../types';
import { auth } from '../config/firebase';
import { createAuthUser, requestPasswordReset, signOutAuth } from '../services/auth';

export default function RequestAccess() {
  const { handleError } = useErrorHandler();
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
  const [showBetaModal, setShowBetaModal] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  usePageMeta({
    title: `${t('requestAccess.title')} | PYM-ERP`,
    description: t('requestAccess.subtitle'),
    image: '/logopymerp.png',
  });

  // Verificar si el email ya está registrado cuando el usuario termine de escribir
  // Email validation will be done during form submission
  // Removed real-time email checking to avoid Firestore permission issues for unauthenticated users

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedName = formData.full_name.trim();
    const normalizedBusiness = formData.business_name.trim();
    const sanitizedWhatsapp = formData.whatsapp.replace(/\D/g, '');

    if (!normalizedName || !normalizedBusiness || !normalizedEmail) {
      toast.error(t('requestAccess.submitError'));
      return;
    }

    if (sanitizedWhatsapp.length < 9 || sanitizedWhatsapp.length > 15) {
      toast.error(t('requestAccess.invalidWhatsapp'));
      return;
    }

    if (!formData.acceptedBeta) {
      toast.error(t('requestAccess.acceptBetaTerms'));
      return;
    }

    setLoading(true);
    let requestId: string | null = null;

    try {
      const payload = {
        full_name: normalizedName,
        email: normalizedEmail,
        business_name: normalizedBusiness,
        whatsapp: sanitizedWhatsapp,
        plan: formData.plan,
      };
      const normalizedPlan = (formData.plan || 'BASIC').toUpperCase() as 'BASIC' | 'STANDARD' | 'PRO';
      const password = generateRandomPassword();
      const slugSource = normalizedBusiness || normalizedEmail.split('@')[0] || normalizedEmail;
      const slug = generateSlug(slugSource);

      logger.info('🔵 Paso 1: Creando access request...');
      const accessRequestData = {
        ...payload,
        plan: normalizedPlan,
        whatsapp: sanitizedWhatsapp,
      };
      logger.info('📋 Datos del access request:', accessRequestData);
      requestId = await createAccessRequest(accessRequestData);
      logger.info('✅ Access request creado:', requestId);

      logger.info('🔵 Paso 2: Creando usuario en Firebase Auth...');
      const firebaseUser = await createAuthUser(normalizedEmail, password);
      const userId = firebaseUser.uid;
      logger.info('✅ Usuario Auth creado:', userId);

      logger.info('🔵 Paso 3: Creando documento de usuario en Firestore...');
      await createUser(
        {
          email: normalizedEmail,
          status: UserStatus.FORCE_PASSWORD_CHANGE,
          role: UserRole.ENTREPRENEUR,
        },
        userId
      );
      logger.info('✅ Documento de usuario creado');

      logger.info('🔵 Paso 4: Creando compañía...');
      const companyId = await createCompany({
        owner_user_id: userId,
        name: normalizedBusiness,
        rut: '',
        industry: '',
        whatsapp: sanitizedWhatsapp,
        address: '',
        slug,
        setup_completed: false,
        subscription_plan: normalizedPlan,
        business_type: BusinessType.SERVICES, // Cambia a BusinessType.PRODUCTS si aplica
      });
      logger.info('✅ Compañía creada:', companyId);

      logger.info('🔵 Paso 5: Actualizando usuario con company_id...');
      await updateUser(userId, { company_id: companyId });
      logger.info('✅ Usuario actualizado con company_id');

  try {
    await setCompanyClaim(userId, companyId);
  } catch (claimError) {
    logger.warn('No se pudo asignar claim de compañía automáticamente', claimError);
  }

  await sendAccessRequestEmail({
    ...payload,
    plan: normalizedPlan,
    created_at: new Date(),
    language: getCurrentLanguage(),
      });

      // Enviar email oficial de Firebase para que el usuario establezca su contraseña
      await requestPasswordReset(normalizedEmail);

      // Cerrar sesión de la cuenta recién creada para evitar sesión indeseada en el dispositivo actual
      await signOutAuth();

      setSubmitted(true);
    } catch (error: any) {
      // Log detallado del error para diagnóstico
      logger.error('Error completo en submitAccessRequest:', error);
      logger.error('Error code:', error?.code);
      logger.error('Error message:', error?.message);
      
      // Errores conocidos de Firebase Auth para dar feedback claro
      if (error?.code === 'auth/email-already-in-use') {
        const message = t('requestAccess.emailAlreadyRegisteredLong');
        toast.error(message);
        setEmailError(message);
      } else {
        // Mostrar mensaje de error más específico si es posible
        const errorMsg = error?.message || error?.code || 'Error desconocido';
        logger.error('Mostrando error al usuario:', errorMsg);
        toast.error(t('requestAccess.submitError') + ': ' + errorMsg);
      }

      handleError(error, { 
        showToast: false,
        context: { action: 'submitAccessRequest' }
      });
    } finally {
      // Evitar dejar la sesión abierta con el usuario recién creado
      if (auth.currentUser?.email?.toLowerCase() === normalizedEmail) {
        await signOutAuth().catch(() => {});
      }
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
                autoComplete="name"
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
                autoComplete="email"
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
              />
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
              autoComplete="organization"
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
                autoComplete="tel"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm cursor-not-allowed"
                value={formData.plan}
                disabled
              >
                <option value="BASIC">{t('requestAccess.plans.basic')}</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                El plan BÁSICO es gratis para siempre
              </p>
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
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('requestAccess.sendingButton') : t('requestAccess.submitButton')}
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
