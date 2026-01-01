/**
 * Mensajes estandarizados para la aplicación
 * 
 * Centraliza todos los textos de UI, errores y éxitos
 * para mantener consistencia y facilitar traducciones
 */

export const MESSAGES = {
  // ============ AUTENTICACIÓN ============
  auth: {
    loginSuccess: '✅ Sesión iniciada correctamente',
    loginError: '❌ Email o contraseña incorrectos',
    logoutSuccess: '✅ Sesión cerrada',
    emailInvalid: '❌ Por favor ingresa un email válido',
    passwordWeak: '❌ La contraseña debe tener al menos 8 caracteres',
    passwordsNotMatch: '❌ Las contraseñas no coinciden',
    unauthorized: '❌ No tienes permisos para acceder a esta sección',
    sessionExpired: '⏱️ Tu sesión ha expirado. Por favor inicia sesión nuevamente',
  },

  // ============ FORMULARIOS ============
  forms: {
    fillRequired: '⚠️ Por favor completa todos los campos obligatorios',
    saveSuccess: '✅ Cambios guardados correctamente',
    saveError: '❌ No se pudieron guardar los cambios. Intenta nuevamente',
    deleteConfirm: '¿Estás seguro de eliminar este elemento? Esta acción no se puede deshacer.',
    deleteSuccess: '✅ Elemento eliminado correctamente',
    deleteError: '❌ No se pudo eliminar el elemento',
    uploadSuccess: '✅ Archivo subido correctamente',
    uploadError: '❌ Error al subir el archivo',
    fileTooLarge: '❌ El archivo es demasiado grande. Máximo {size}MB',
    fileTypeInvalid: '❌ Tipo de archivo no permitido. Usa: {types}',
  },

  // ============ PRODUCTOS/SERVICIOS ============
  business: {
    productCreated: '✅ Producto creado correctamente',
    productUpdated: '✅ Producto actualizado',
    productDeleted: '✅ Producto eliminado',
    serviceCreated: '✅ Servicio creado correctamente',
    serviceUpdated: '✅ Servicio actualizado',
    serviceDeleted: '✅ Servicio eliminado',
    limitReached: '⚠️ Has alcanzado el límite de tu plan {plan}. Actualiza para crear más.',
  },

  // ============ CARRITO ============
  cart: {
    addedToCart: '✅ Producto agregado al carrito',
    removedFromCart: '✅ Producto eliminado del carrito',
    cartEmpty: '🛒 El carrito está vacío',
    orderSent: '✅ Solicitud enviada por WhatsApp',
    orderError: '❌ No se pudo enviar la solicitud',
  },

  // ============ RESERVAS ============
  booking: {
    sent: '✅ Solicitud de reserva enviada por WhatsApp',
    error: '❌ No se pudo enviar la solicitud de reserva',
    fillDate: '⚠️ Por favor selecciona una fecha',
    fillSchedule: '⚠️ Por favor selecciona un horario',
    fillContact: '⚠️ Por favor completa tu nombre y WhatsApp',
  },

  // ============ GDPR ============
  gdpr: {
    cookiesAccepted: '✅ Preferencias de cookies guardadas',
    dataExported: '✅ Tus datos se han descargado correctamente',
    dataExportError: '❌ No se pudieron exportar los datos. Intenta nuevamente',
    deletionRequested: '✅ Solicitud de eliminación enviada. Te contactaremos en 24-48 horas hábiles',
    deletionError: '❌ No se pudo procesar la solicitud. Contacta a soporte@pymerp.cl',
    confirmDeletion: 'Por favor escribe ELIMINAR para confirmar',
  },

  // ============ PWA ============
  pwa: {
    installPrompt: 'Instala AgendaWeb para acceso rápido y uso sin conexión',
    updateAvailable: 'Nueva versión disponible. Actualiza para obtener las últimas mejoras',
    offlineMode: 'Sin conexión a internet - Trabajando en modo sin conexión',
    onlineAgain: 'Conexión restaurada',
  },

  // ============ VALIDACIÓN ============
  validation: {
    emailInvalid: '❌ Por favor ingresa un email válido',
    phoneInvalid: '❌ Número de teléfono inválido. Formato: 912345678',
    rutInvalid: '❌ RUT inválido. Formato: 12345678-9',
    urlInvalid: '❌ URL inválida. Debe comenzar con http:// o https://',
    minLength: '❌ Mínimo {length} caracteres',
    maxLength: '❌ Máximo {length} caracteres',
    required: '❌ Este campo es obligatorio',
  },

  // ============ ERRORES GENERALES ============
  errors: {
    generic: '❌ Ocurrió un error inesperado. Por favor intenta nuevamente',
    network: '❌ Error de conexión. Verifica tu internet',
    notFound: '❌ No se encontró el elemento solicitado',
    forbidden: '❌ No tienes permisos para realizar esta acción',
    timeout: '⏱️ La operación tardó demasiado. Intenta nuevamente',
  },

  // ============ ÉXITOS GENERALES ============
  success: {
    generic: '✅ Operación completada correctamente',
    copied: '✅ Copiado al portapapeles',
    sent: '✅ Información enviada correctamente',
  },

  // ============ CONFIRMACIONES ============
  confirm: {
    delete: '¿Estás seguro de eliminar este elemento?',
    logout: '¿Deseas cerrar tu sesión?',
    discard: '¿Deseas descartar los cambios?',
    leave: '¿Estás seguro de salir? Los cambios no guardados se perderán',
  },

  // ============ ARIA LABELS ============
  ariaLabels: {
    closeModal: 'Cerrar ventana',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    previousPage: 'Página anterior',
    nextPage: 'Página siguiente',
    loading: 'Cargando...',
    search: 'Buscar',
    filter: 'Filtrar resultados',
    sort: 'Ordenar',
    increaseQuantity: 'Aumentar cantidad',
    decreaseQuantity: 'Disminuir cantidad',
    removeItem: 'Eliminar elemento',
    viewImage: 'Ver imagen ampliada',
    editItem: 'Editar elemento',
    deleteItem: 'Eliminar elemento',
  },
};

/**
 * Reemplazar placeholders en mensajes
 */
export function formatMessage(message: string, params: Record<string, any>): string {
  let formatted = message;
  Object.keys(params).forEach(key => {
    formatted = formatted.replace(`{${key}}`, String(params[key]));
  });
  return formatted;
}

/**
 * Textos específicos para componentes
 */
export const COMPONENT_TEXTS = {
  cookieConsent: {
    title: 'Este sitio usa cookies',
    description: 'Usamos cookies esenciales para el funcionamiento de AgendaWeb y cookies de análisis para mejorar tu experiencia.',
    acceptAll: 'Aceptar Todo',
    rejectAll: 'Rechazar Todo',
    customize: 'Personalizar',
    savePreferences: 'Guardar Preferencias',
    learnMore: 'Ver Política de Privacidad',
    essential: {
      title: 'Cookies Esenciales',
      description: 'Necesarias para el funcionamiento de AgendaWeb: autenticación, sesión de usuario y seguridad.',
      status: 'Siempre activas',
    },
    analytics: {
      title: 'Cookies de Análisis',
      description: 'Nos ayudan a entender cómo usas AgendaWeb para mejorar continuamente. Utilizamos Google Analytics 4.',
    },
    marketing: {
      title: 'Cookies de Publicidad',
      description: 'Actualmente no utilizamos cookies de publicidad. AgendaWeb no muestra anuncios de terceros.',
      status: 'Desactivadas',
    },
  },

  dataExport: {
    title: 'Descargar Mis Datos',
    description: 'Descarga una copia completa de toda tu información personal almacenada en AgendaWeb.',
    buttonDownload: 'Descargar Mis Datos',
    buttonDownloading: 'Descargando...',
    disclaimer: 'El archivo incluirá: perfil, empresa, servicios y productos. No incluye datos de Google Analytics (solicítalos directamente a Google).',
  },

  dataDeletion: {
    title: 'Eliminar Permanentemente Mi Cuenta',
    step1: {
      warning: 'Esta acción es permanente y no se puede deshacer',
      whatDeletes: '¿Qué información se eliminará?',
      whatStays: '¿Qué NO podemos eliminar?',
      process: '¿Cómo funciona el proceso?',
      buttonCancel: 'Cancelar',
      buttonContinue: 'Continuar con la Eliminación',
    },
    step2: {
      instructions: 'Para confirmar la eliminación permanente, escribe exactamente:',
      confirmWord: 'ELIMINAR',
      placeholder: 'Escribe: ELIMINAR',
      warning: 'Una vez confirmado, NO podrás recuperar tu información',
      buttonBack: 'Volver Atrás',
      buttonDelete: 'Eliminar Permanentemente',
      buttonDeleting: 'Procesando...',
    },
  },

  pwaInstall: {
    title: 'Instalar AgendaWeb en tu dispositivo',
    description: 'Instala la aplicación para acceder más rápido y usarla sin conexión a internet',
    benefits: [
      'Abre como aplicación desde tu pantalla de inicio',
      'Funciona sin conexión a internet',
      'Actualizaciones automáticas cuando haya novedades',
    ],
    buttonInstall: 'Instalar Ahora',
    buttonLater: 'Ahora No',
    buttonClose: 'Cerrar',
  },

  pwaUpdate: {
    newVersion: 'Nueva versión disponible',
    offlineReady: 'Listo para usar sin conexión',
    descriptionUpdate: 'Hay una actualización de pymerp.cl. Actualiza ahora para obtener las últimas mejoras.',
    descriptionOffline: 'pymerp.cl ya está disponible sin conexión. Puedes usarla en cualquier momento.',
    buttonUpdate: 'Actualizar Ahora',
    buttonClose: 'Cerrar',
  },

  offline: {
    message: 'Sin conexión a internet - Trabajando en modo sin conexión',
    reconnected: 'Conexión restaurada',
  },
};

