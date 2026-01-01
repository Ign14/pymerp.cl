export type Locale = 'es' | 'en';

type TranslationKeys =
  | 'brand'
  | 'tagline'
  | 'loginTitle'
  | 'loginSubmit'
  | 'backHome'
  | 'email'
  | 'password'
  | 'requestAccessTitle'
  | 'requestAccessSubtitle'
  | 'fullName'
  | 'businessName'
  | 'whatsapp'
  | 'sendRequest'
  | 'alreadyAccount'
  | 'goLogin'
  | 'landingLogin'
  | 'landingRequest';

export const translations: Record<Locale, Record<TranslationKeys, string>> = {
  es: {
    brand: 'AgendaEmprendimiento',
    tagline: '',
    loginTitle: 'Iniciar sesión',
    loginSubmit: 'Iniciar sesión',
    backHome: 'Volver al inicio',
    email: 'Email',
    password: 'Contraseña',
    requestAccessTitle: 'Solicitar acceso',
    requestAccessSubtitle: 'Completa el formulario y recibirás tu acceso por correo cuando sea aprobado',
    fullName: 'Nombre completo',
    businessName: 'Nombre del emprendimiento',
    whatsapp: 'Teléfono WhatsApp (del emprendimiento)',
    sendRequest: 'Enviar solicitud',
    alreadyAccount: '¿Ya tienes cuenta?',
    goLogin: 'Ir a iniciar sesión',
    landingLogin: 'Ingresar',
    landingRequest: 'Solicitar acceso',
  },
  en: {
    brand: 'AgendaBusiness',
    tagline: 'A platform to showcase your services or products and connect with customers via WhatsApp.',
    loginTitle: 'Sign in',
    loginSubmit: 'Sign in',
    backHome: 'Back to home',
    email: 'Email',
    password: 'Password',
    requestAccessTitle: 'Request access',
    requestAccessSubtitle: 'Fill out the form and you will receive access by email once approved.',
    fullName: 'Full name',
    businessName: 'Business name',
    whatsapp: 'WhatsApp phone (business)',
    sendRequest: 'Send request',
    alreadyAccount: 'Already have an account?',
    goLogin: 'Go to login',
    landingLogin: 'Sign in',
    landingRequest: 'Request access',
  },
};
