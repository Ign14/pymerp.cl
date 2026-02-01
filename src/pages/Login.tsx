import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../services/auth';
import { getUserByEmail, getCompany, getAccessRequestByEmail, updateUser, updateAccessRequest } from '../services/firestore';
import { UserStatus } from '../types';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { usePageMeta } from '../utils/usePageMeta';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { requestPasswordReset } from '../services/auth';
import { auth } from '../config/firebase';
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type User as FirebaseUser,
} from 'firebase/auth';
import { logger } from '../utils/logger';

import AnimatedButton from '../components/animations/AnimatedButton';
import AnimatedModal from '../components/animations/AnimatedModal';
import LoadingSpinner from '../components/animations/LoadingSpinner';

export default function Login() {
  const { handleError } = useErrorHandler();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingRedirect, setCheckingRedirect] = useState(true);
  const [authMethod, setAuthMethod] = useState<'email' | 'google'>('google');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { handleAuthError } = useErrorHandler();
  usePageMeta({
    title: `${t('login.title')} | PYM-ERP`,
    description: t('login.subtitle'),
    image: '/logopymerp.png',
  });

  const navigateAfterLogin = async (userEmail: string) => {
    const user = await getUserByEmail(userEmail);

    if (user?.status === UserStatus.FORCE_PASSWORD_CHANGE) {
      navigate('/change-password');
    } else if (user?.role === 'SUPERADMIN') {
      navigate('/admin');
    } else {
      if (user?.company_id) {
        const company = await getCompany(user.company_id);
        if (company && !company.setup_completed) {
          navigate('/setup/company-basic');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/setup/company-basic');
      }
    }
    toast.success(t('login.successMessage'));
  };

  const syncGoogleLogin = async (user: FirebaseUser) => {
    const userEmail = user.email?.toLowerCase();
    if (!userEmail) {
      toast.error('No pudimos obtener el email de Google.');
      return;
    }
    await navigateAfterLogin(userEmail);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      await syncGoogleLogin(result.user);
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
      } else {
        logger.error('Error en Google Sign-In:', error);
        toast.error('No pudimos iniciar sesión con Google.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!mounted) return;
        if (result?.user) {
          await syncGoogleLogin(result.user);
        }
      } catch (error) {
        logger.warn('Error procesando redirect de Google en login:', error);
      } finally {
        if (mounted) {
          setCheckingRedirect(false);
        }
      }
    };
    checkRedirect();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      await navigateAfterLogin(email.toLowerCase());
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center mb-2">
              <div className="flex gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>
            <div className="flex justify-center mb-4">
              <img
                alt="PyM-ERP"
                className="w-36 sm:w-40 object-contain"
                loading="lazy"
                decoding="async"
                src="/logopymerp.png"
              />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {t('login.title')}
            </h2>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
                authMethod === 'email'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Email y contraseña
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('google')}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
                authMethod === 'google'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Google
            </button>
          </div>

          {authMethod === 'google' && (
            <div className="mt-6 space-y-4">
              <AnimatedButton
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || checkingRedirect}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none fokus:ring-2 fokus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {googleLoading || checkingRedirect ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner size="sm" color="#1f2937" />
                    Continuar con Google...
                  </span>
                ) : (
                  'Continuar con Google'
                )}
              </AnimatedButton>
              <p className="text-xs text-center text-gray-500">
                Inicia sesión con tu cuenta Google para ingresar más rápido.
              </p>
              <AnimatedButton
                type="button"
                onClick={() => navigate('/')}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none fokus:ring-2 fokus:ring-offset-2 focus:ring-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Volver al inicio
              </AnimatedButton>
            </div>
          )}

          {authMethod === 'email' && (
            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="email" className="sr-only">
                    {t('common.email')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder={t('common.email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">
                    {t('common.password')}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder={t('common.password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <AnimatedButton
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" color="#ffffff" />
                      {t('login.submittingButton')}...
                    </span>
                  ) : (
                    t('login.submitButton')
                  )}
                </AnimatedButton>
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <AnimatedModal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setResetSent(false);
          setResetLoading(false);
        }}
        className="p-6 relative"
      >
        <button
          type="button"
          onClick={() => {
            setShowResetModal(false);
            setResetSent(false);
            setResetLoading(false);
          }}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800 text-xl"
          aria-label="Cerrar"
        >
          ×
        </button>

            {!resetSent ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('login.resetPasswordTitle')}</h3>
                <p className="text-sm text-gray-700 mb-4">
                  {t('login.resetPasswordMessage')}
                </p>
                <form
                  className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setResetLoading(true);
                  try {
                    const emailToReset = resetEmail.trim().toLowerCase();

                    // Intentar leer datos de Firestore (opcional, puede fallar por permisos)
                    // No bloqueamos el flujo si falla - Firebase Auth validará el email
                    let user = null;
                    let request = null;
                    
                    try {
                      [user, request] = await Promise.all([
                        getUserByEmail(emailToReset).catch(() => null),
                        getAccessRequestByEmail(emailToReset).catch(() => null),
                      ]);
                    } catch (readError) {
                      // Ignorar errores de lectura - no es crítico
                      console.warn('No se pudieron leer datos de Firestore (no crítico):', readError);
                    }

                    const targetEmail = user?.email || request?.email || emailToReset;

                    // Enviar email de recuperación de contraseña
                    // Firebase Auth manejará la validación del email automáticamente
                    await requestPasswordReset(targetEmail);

                    // Intentar actualizar documentos (opcional, no crítico si falla)
                    // Estas actualizaciones pueden fallar si el usuario no está autenticado
                    // pero no deben bloquear el envío del email de recuperación
                    try {
                      if (user?.id) {
                        await updateUser(user.id, { status: UserStatus.ACTIVE });
                      }
                    } catch (updateError) {
                      // Ignorar errores de actualización - no es crítico
                      console.warn('No se pudo actualizar el estado del usuario (no crítico):', updateError);
                    }

                    try {
                      if (request?.id) {
                        await updateAccessRequest(request.id, { last_password_reset: new Date() });
                      }
                    } catch (updateError) {
                      // Ignorar errores de actualización - no es crítico
                      console.warn('No se pudo actualizar la solicitud de acceso (no crítico):', updateError);
                    }

                    setResetSent(true);
                    setResetLoading(false);
                    setTimeout(() => {
                      setShowResetModal(false);
                      setResetSent(false);
                      navigate('/login');
                    }, 1200);
                  } catch (error: any) {
                    // Manejar errores específicos de Firebase Auth
                    if (error.code === 'auth/user-not-found') {
                      // Firebase Auth no encontró el usuario, pero no mostramos error específico
                      // por seguridad (evita enumeración de emails)
                      setResetSent(true);
                      setResetLoading(false);
                      setTimeout(() => {
                        setShowResetModal(false);
                        setResetSent(false);
                        navigate('/login');
                      }, 1200);
                    } else {
                      // Otros errores se muestran normalmente
                      handleError(error);
                      toast.error(t('login.resetSendError'));
                      setResetLoading(false);
                    }
                  } finally {
                    setResetLoading(false);
                  }
                }}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.email')}</label>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                  <AnimatedButton
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" color="#ffffff" />
                        {t('login.resetSendingButton')}...
                      </span>
                    ) : (
                      t('login.resetSendButton')
                    )}
                  </AnimatedButton>
                </form>
              </>
            ) : (
              <div className="text-center space-y-3 py-6">
                <div className="text-5xl text-green-500">✓</div>
                <h4 className="text-lg font-semibold text-gray-900">{t('login.resetSuccessTitle')}</h4>
                <p className="text-sm text-gray-700">{t('login.resetSuccessMessage')}</p>
              </div>
            )}
      </AnimatedModal>
    </>
  );
}
