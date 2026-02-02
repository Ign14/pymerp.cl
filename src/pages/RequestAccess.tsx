import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createAccessRequest,
  createCompany,
  createUser,
  updateUser,
  getCompany,
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
import {
  createAuthUser,
  getCurrentFirestoreUser,
  requestPasswordReset,
  signOutAuth,
} from '../services/auth';
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type User as FirebaseUser,
} from 'firebase/auth';

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'google' | 'email'>('google');
  const [googleSession, setGoogleSession] = useState(false);
  const [checkingRedirect, setCheckingRedirect] = useState(true);
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

  const syncGoogleUser = async (user: FirebaseUser) => {
    const displayName = user.displayName || '';
    const userEmail = user.email || '';

    setFormData((prev) => ({
      ...prev,
      full_name: prev.full_name || displayName,
      email: prev.email || userEmail,
    }));
    setEmailError(null);
    setAuthMethod('google');
    setGoogleSession(true);

    if (!user.uid) return;

    try {
      const firestoreUser = await getCurrentFirestoreUser();
      if (firestoreUser?.company_id) {
        const company = await getCompany(firestoreUser.company_id);
        if (company?.setup_completed) {
          navigate('/dashboard');
          return;
        }
        navigate('/setup/company-basic');
      }
    } catch (error) {
      logger.warn('No se pudo validar empresa asociada a Google:', error);
    }
  };

  const startGoogleAuth = async () => {
    setGoogleLoading(true);
    setEmailError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      await syncGoogleUser(result.user);
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
        toast.error('No pudimos abrir la ventana. Intentaremos redirigir...');
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectError) {
          logger.error('Error iniciando Google con redirect:', redirectError);
        }
      } else if (error?.code === 'auth/account-exists-with-different-credential') {
        toast.error('Este email ya tiene una cuenta con otro método. Usa el acceso por email.');
        setAuthMethod('email');
      } else {
        logger.error('Error en Google Sign-In:', error);
        toast.error('No pudimos iniciar sesión con Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const closeGoogleSession = async () => {
    await signOutAuth();
    setGoogleSession(false);
  };

  useEffect(() => {
    let isMounted = true;

    const initGoogle = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!isMounted) return;

        if (result?.user) {
          await syncGoogleUser(result.user);
        } else if (auth.currentUser?.providerData?.some((p) => p.providerId === 'google.com')) {
          await syncGoogleUser(auth.currentUser);
        }
      } catch (error) {
        logger.warn('Error procesando redirect de Google:', error);
      } finally {
        if (isMounted) {
          setCheckingRedirect(false);
        }
      }
    };

    initGoogle();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const usingGoogle = authMethod === 'google';
    const googleEmail = auth.currentUser?.email?.toLowerCase() || '';
    const normalizedEmail = (usingGoogle ? googleEmail || formData.email : formData.email).trim().toLowerCase();
    const normalizedName = formData.full_name.trim() || auth.currentUser?.displayName || '';
    const normalizedBusiness = formData.business_name.trim();
    const sanitizedWhatsapp = formData.whatsapp.replace(/\D/g, '');

    if (usingGoogle && !googleSession) {
      toast.error('Primero autentica tu cuenta Google.');
      return;
    }

    if (!usingGoogle && googleSession) {
      toast.error('Cierra sesión de Google para continuar con email.');
      return;
    }

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

    try {
      const payload = {
        full_name: normalizedName,
        email: normalizedEmail,
        business_name: normalizedBusiness,
        whatsapp: sanitizedWhatsapp,
        plan: formData.plan,
      };
      const normalizedPlan = (formData.plan || 'BASIC').toUpperCase() as
        | 'BASIC'
        | 'STARTER'
        | 'PRO'
        | 'BUSINESS'
        | 'ENTERPRISE';
      const password = usingGoogle ? '' : generateRandomPassword();
      const slugSource = normalizedBusiness || normalizedEmail.split('@')[0] || normalizedEmail;
      const slug = generateSlug(slugSource);

      logger.info('🔵 Paso 1: Creando access request...');
      const accessRequestData = {
        ...payload,
        plan: normalizedPlan,
        whatsapp: sanitizedWhatsapp,
      };
      logger.info('📋 Datos del access request:', accessRequestData);
      await createAccessRequest(accessRequestData);
      logger.info('✅ Access request creado');

      let userId = auth.currentUser?.uid || '';

      if (!usingGoogle) {
        logger.info('🔵 Paso 2: Creando usuario en Firebase Auth...');
        const firebaseUser = await createAuthUser(normalizedEmail, password);
        userId = firebaseUser.uid;
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
      } else {
        if (!userId) {
          throw new Error('No se encontró sesión de Google activa.');
        }

        const firestoreUser = await getCurrentFirestoreUser();
        if (!firestoreUser) {
          await createUser(
            {
              email: normalizedEmail,
              status: UserStatus.ACTIVE,
              role: UserRole.ENTREPRENEUR,
            },
            userId
          );
        }
      }

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

      if (!usingGoogle) {
        // Enviar email oficial de Firebase para que el usuario establezca su contraseña
        await requestPasswordReset(normalizedEmail);

        // Cerrar sesión de la cuenta recién creada para evitar sesión indeseada en el dispositivo actual
        await signOutAuth();

        setSubmitted(true);
      } else {
        navigate('/setup/company-basic');
      }
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
      if (!usingGoogle) {
        // Evitar dejar la sesión abierta con el usuario recién creado
        if (auth.currentUser?.email?.toLowerCase() === normalizedEmail) {
          await signOutAuth().catch(() => {});
        }
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

        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setAuthMethod('google')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                authMethod === 'google'
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Con Google
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                authMethod === 'email'
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Con Email
            </button>
          </div>
        </div>

        {authMethod === 'google' && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900">
            <p className="font-semibold">Primero autentica tu cuenta Google y luego completa los datos del negocio.</p>
            <button
              type="button"
              onClick={startGoogleAuth}
              disabled={googleLoading || checkingRedirect}
              className="mt-3 w-full rounded-lg border border-blue-200 bg-white px-4 py-2.5 font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {googleLoading || checkingRedirect ? 'Continuar con Google...' : 'Continuar con Google'}
            </button>
            {googleSession && auth.currentUser?.email && (
              <div className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-blue-900">
                Sesión activa: <span className="font-semibold">{auth.currentUser.email}</span>
              </div>
            )}
          </div>
        )}

        {authMethod === 'email' && googleSession && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Estás conectado con Google.</p>
            <p className="mt-1 text-amber-800/90">
              Para continuar con email debes cerrar sesión de Google.
            </p>
            <button
              type="button"
              onClick={closeGoogleSession}
              className="mt-3 w-full rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
            >
              Cerrar sesión
            </button>
          </div>
        )}

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
                readOnly={authMethod === 'google' && googleSession}
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
                readOnly={authMethod === 'google' && googleSession}
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
