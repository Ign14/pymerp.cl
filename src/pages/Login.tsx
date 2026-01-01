import { useState } from 'react';
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

import AnimatedButton from '../components/animations/AnimatedButton';
import AnimatedModal from '../components/animations/AnimatedModal';
import LoadingSpinner from '../components/animations/LoadingSpinner';

export default function Login() {
  const { handleError } = useErrorHandler();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      const user = await getUserByEmail(email);
      
      if (user?.status === UserStatus.FORCE_PASSWORD_CHANGE) {
        navigate('/change-password');
      } else if (user?.role === 'SUPERADMIN') {
        navigate('/admin');
      } else {
        // Check if company is set up
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
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {t('login.title')}
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              <AnimatedButton
                type="button"
                onClick={() => navigate('/')}
                className="group relative w-full flex justify-center py-2 px-4 mt-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none fokus:ring-2 fokus:ring-offset-2 focus:ring-blue-500"
              >
                {t('common.backHome')}
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
