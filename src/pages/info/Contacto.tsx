import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import SEO from '../../components/SEO';
import { validateEmail, validateRequired, validateFields } from '../../services/errorHelpers';
import { getAllPlans, type SubscriptionPlan, type PlanConfig } from '../../config/subscriptionPlans';

type ContactType =
  | 'subscription-plan'
  | 'solution'
  | 'question'
  | 'internship-commercial'
  | 'internship-developer'
  | 'internship-marketing'
  | 'internship-designer'
  | 'other';

const PLAN_GRADIENTS: Record<SubscriptionPlan, string> = {
  BASIC: 'from-gray-500 to-gray-600',
  STARTER: 'from-blue-500 to-blue-600',
  PRO: 'from-purple-500 to-purple-600',
  BUSINESS: 'from-indigo-500 to-indigo-600',
  ENTERPRISE: 'from-green-500 to-green-600',
};

const PLAN_ORDER: SubscriptionPlan[] = ['STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE'];

export default function Contacto() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');
  const planOptions = useMemo<PlanConfig[]>(() => {
    const plans = getAllPlans().filter((plan) => plan.planId !== 'BASIC');
    return PLAN_ORDER.map((planId) => plans.find((plan) => plan.planId === planId)).filter(Boolean) as PlanConfig[];
  }, []);

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
    contactType: '' as ContactType | '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!planParam) return;
    const normalized = planParam.trim().toUpperCase();
    const isValid = planOptions.some((plan) => plan.planId === normalized);
    if (isValid) {
      setSelectedPlan(normalized as SubscriptionPlan);
    }
  }, [planOptions, planParam]);

  useEffect(() => {
    if (!selectedPlan) return;
    setFormData((prev) => ({ ...prev, contactType: 'subscription-plan' }));
  }, [selectedPlan]);

  const contactTypes = [
    {
      value: 'subscription-plan',
      label: 'Solicitar plan de suscripción',
      icon: '💳',
      description: 'Activación de planes por categoría según nivel de herramientas'
    },
    {
      value: 'solution',
      label: 'Necesitas una solución digital específica en tu proyecto?',
      icon: '💡',
      description: 'Cuéntanos sobre tu proyecto y te ayudamos a encontrar la mejor solución'
    },
    {
      value: 'question',
      label: 'Tienes alguna duda o un feedback?',
      icon: '💬',
      description: 'Estamos aquí para escucharte y ayudarte'
    },
    {
      value: 'internship-commercial',
      label: 'Práctica profesional - Comercial',
      icon: '📊',
      description: 'Únete a nuestro equipo comercial'
    },
    {
      value: 'internship-developer',
      label: 'Práctica profesional - Programador',
      icon: '💻',
      description: 'Desarrolla con tecnologías modernas'
    },
    {
      value: 'internship-marketing',
      label: 'Práctica profesional - Marketing',
      icon: '📱',
      description: 'Crea estrategias digitales innovadoras'
    },
    {
      value: 'internship-designer',
      label: 'Práctica profesional - Diseñador',
      icon: '🎨',
      description: 'Diseña experiencias increíbles'
    },
    {
      value: 'other',
      label: 'Otros',
      icon: '📝',
      description: 'Otra consulta o propuesta'
    }
  ];

  const getContactTypeLabel = (value: ContactType | '') => {
    const type = contactTypes.find((entry) => entry.value === value);
    return type ? type.label : '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors({});

    const validationErrors = validateFields({
      name: {
        value: formData.name,
        validators: [validateRequired],
      },
      email: {
        value: formData.email,
        validators: [validateEmail],
      },
      contactType: {
        value: formData.contactType,
        validators: [validateRequired],
      },
      message: {
        value: formData.message,
        validators: formData.contactType === 'subscription-plan' ? [] : [validateRequired],
      },
    });

    if (formData.contactType === 'subscription-plan') {
      if (hasAccount === null) {
        validationErrors.hasAccount = 'Por favor indica si ya tienes una cuenta';
      }
      if (hasAccount === true && (!formData.rut || !formData.rut.trim())) {
        validationErrors.rut = 'El RUT es requerido para activar el plan en una cuenta existente';
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Por favor completa todos los campos requeridos correctamente');
      return;
    }

    setLoading(true);

    try {
      let messageBody = formData.message.trim();

        if (selectedPlan && formData.contactType === 'subscription-plan') {
          const planConfig = planOptions.find((plan) => plan.planId === selectedPlan);
          messageBody = `Solicitud de activación del plan ${planConfig?.label || selectedPlan}\n\n`;
          messageBody += `Plan: ${planConfig?.label || selectedPlan}\n`;
          messageBody += `Precio: Sin precio público\n\n`;

        if (hasAccount === true) {
          messageBody += '✅ Ya tengo una cuenta creada\n';
          messageBody += `RUT de la empresa: ${formData.rut || 'No proporcionado'}\n`;
          messageBody += `Correo de la cuenta: ${formData.email}\n\n`;
          messageBody += `Por favor activar el plan ${planConfig?.label || selectedPlan} en esta cuenta existente.\n\n`;
        } else if (hasAccount === false) {
          messageBody += '🆕 No tengo cuenta, necesito crear una nueva\n';
          messageBody += `Correo para la nueva cuenta: ${formData.email}\n\n`;
          messageBody += `Por favor crear una nueva cuenta y activar el plan ${planConfig?.label || selectedPlan}.\n\n`;
        }

        if (formData.message.trim()) {
          messageBody += `Mensaje adicional:\n${formData.message.trim()}`;
        }
      }

      const subject = selectedPlan
        ? `Solicitud Plan ${selectedPlan} - PyM-ERP`
        : `Contacto PyM-ERP: ${getContactTypeLabel(formData.contactType)}`;

      const body =
        `Nombre: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Teléfono: ${formData.phone || 'No proporcionado'}\n` +
        (formData.rut ? `RUT: ${formData.rut}\n` : '') +
        (formData.contactType === 'subscription-plan'
          ? `Tiene cuenta: ${hasAccount ? 'Sí' : 'No'}\n`
          : '') +
        `\nMensaje:\n${messageBody}`;

      window.location.href = `mailto:ignacio@datakomerz.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      setTimeout(() => {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          rut: '',
          contactType: '' as ContactType | '',
          message: '',
        });
        setSelectedPlan(null);
        setHasAccount(null);
      }, 500);
    } catch (error) {
      toast.error('Hubo un error al enviar tu mensaje. Por favor intenta nuevamente.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  if (submitted) {
    return (
      <>
        <SEO
          title="Contacto | PyM-ERP"
          description="Contáctanos para resolver tus dudas, solicitar soluciones digitales o unirte a nuestro equipo."
          canonical="/contacto"
        />
        <div className="min-h-screen bg-gradient-to-b from-blue-700 via-blue-800 to-indigo-900 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 md:p-12 shadow-xl max-w-2xl w-full text-center"
          >
            <div className="text-6xl mb-6">✅</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¡Mensaje Enviado!
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Gracias por contactarnos. Hemos recibido tu mensaje y te responderemos pronto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    rut: '',
                    contactType: '' as ContactType | '',
                    message: '',
                  });
                  setSelectedPlan(null);
                  setHasAccount(null);
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Enviar otro mensaje
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-white text-blue-900 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Volver al inicio
              </motion.button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Contacto | PyM-ERP"
        description="Contáctanos para resolver tus dudas, solicitar soluciones digitales o unirte a nuestro equipo."
        canonical="/contacto"
      />
      <div className="min-h-screen bg-gradient-to-b from-blue-700 via-blue-800 to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate('/')}
            className="mb-8 text-blue-100 hover:text-white font-medium"
          >
            ← Volver al inicio
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Contáctanos
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Estamos aquí para ayudarte. Cuéntanos qué necesitas y te responderemos lo antes posible.
            </p>
          </motion.div>

          {!selectedPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
                Solicita un plan de suscripción
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {planOptions.map((plan) => (
                  <motion.button
                    key={plan.planId}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedPlan(plan.planId);
                      setFormData((prev) => ({ ...prev, contactType: 'subscription-plan' }));
                    }}
                    className={`bg-gradient-to-r ${PLAN_GRADIENTS[plan.planId]} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all text-left`}
                  >
                    <div className="font-bold text-xl mb-2">{plan.label}</div>
                    <div className="text-sm opacity-90 mb-3">{plan.description}</div>
                    <div className="text-xs opacity-80">Planes sin precio público</div>
                  </motion.button>
                ))}
              </div>
              <p className="text-center text-blue-100 mt-4 text-sm">
                O continúa con el formulario general de contacto
              </p>
            </motion.div>
          )}

          {selectedPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Plan seleccionado: {planOptions.find((plan) => plan.planId === selectedPlan)?.label}
                  </h3>
                  <p className="text-gray-700">
                    {planOptions.find((plan) => plan.planId === selectedPlan)?.description}. Plan sin precio público.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan(null);
                    setHasAccount(null);
                    setFormData((prev) => ({ ...prev, rut: '', contactType: '' }));
                  }}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors border border-gray-300"
                >
                  Cambiar plan
                </button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-10"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  ¿Cómo podemos ayudarte? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contactTypes.map((type) => (
                    <motion.div
                      key={type.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.contactType === type.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="radio"
                          name="contactType"
                          value={type.value}
                          checked={formData.contactType === type.value}
                          onChange={(e) => handleFieldChange('contactType', e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{type.icon}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">{type.label}</div>
                            <div className="text-sm text-gray-600">{type.description}</div>
                          </div>
                          {formData.contactType === type.value && (
                            <span className="text-indigo-600 text-xl">✓</span>
                          )}
                        </div>
                      </label>
                    </motion.div>
                  ))}
                </div>
              </div>

              {selectedPlan && formData.contactType === 'subscription-plan' && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    ¿Ya tienes una cuenta en PyM-ERP? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setHasAccount(true)}
                      className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                        hasAccount === true
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">✅</div>
                      <div>Sí, ya tengo cuenta</div>
                      <div className="text-sm font-normal mt-1 opacity-75">Activar plan en cuenta existente</div>
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setHasAccount(false);
                        setFormData((prev) => ({ ...prev, rut: '' }));
                      }}
                      className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                        hasAccount === false
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">🆕</div>
                      <div>No, crear cuenta nueva</div>
                      <div className="text-sm font-normal mt-1 opacity-75">Crear cuenta y activar plan</div>
                    </motion.button>
                  </div>

                  {hasAccount === true && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 space-y-4"
                    >
                      <div>
                        <label htmlFor="rut" className="block text-sm font-semibold text-gray-900 mb-2">
                          RUT de la empresa <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="rut"
                          value={formData.rut}
                          onChange={(e) => handleFieldChange('rut', e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                            errors.rut
                              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                              : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                          }`}
                          placeholder="12.345.678-9"
                          aria-invalid={!!errors.rut}
                          aria-describedby={errors.rut ? 'rut-error' : undefined}
                        />
                        {errors.rut && (
                          <p id="rut-error" className="mt-1 text-sm text-red-600" role="alert">
                            {errors.rut}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Necesitamos tu RUT para identificar tu cuenta y activar el plan
                        </p>
                      </div>

                      <div>
                        <label htmlFor="account-email" className="block text-sm font-semibold text-gray-900 mb-2">
                          Correo de la cuenta <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="account-email"
                          value={formData.email}
                          onChange={(e) => handleFieldChange('email', e.target.value)}
                          className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                            errors.email
                              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                              : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                          }`}
                          placeholder="correo@de-tu-cuenta.com"
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'email-error' : undefined}
                        />
                        {errors.email && (
                          <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                            {errors.email === 'required-field' ? 'Campo requerido' : 'Email inválido'}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          El correo con el que te registraste en PyM-ERP
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                      errors.name
                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                    }`}
                    placeholder="Tu nombre"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.name && (
                    <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                      Campo requerido
                    </p>
                  )}
                </div>

                {(!selectedPlan || hasAccount === false || hasAccount === null) && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors ${
                        errors.email
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                      }`}
                      placeholder="tu@email.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.email === 'required-field' ? 'Campo requerido' : 'Email inválido'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
                  Teléfono / WhatsApp <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-colors"
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                  {formData.contactType === 'subscription-plan' ? 'Mensaje adicional' : 'Mensaje'}
                  {formData.contactType !== 'subscription-plan' && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleFieldChange('message', e.target.value)}
                  rows={6}
                  className={`w-full px-4 py-3 border-2 rounded-lg outline-none transition-colors resize-none ${
                    errors.message
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                  }`}
                  placeholder={
                    formData.contactType === 'subscription-plan'
                      ? '¿Alguna pregunta sobre el plan o información adicional que quieras compartir? (opcional)'
                      : 'Cuéntanos más sobre tu consulta, proyecto o interés...'
                  }
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                />
                {errors.message && (
                  <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">
                    Campo requerido
                  </p>
                )}
                {formData.contactType === 'subscription-plan' ? (
                  <p className="text-sm text-gray-500 mt-2">
                    Si tienes alguna pregunta específica sobre el plan o necesitas información adicional, compártela aquí.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">
                    Mientras más detalles nos compartas, mejor podremos ayudarte
                  </p>
                )}
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-red-700 font-medium mb-2">
                    Por favor corrige los errores en el formulario:
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {errors.hasAccount && <li>{errors.hasAccount}</li>}
                    {errors.rut && <li>{errors.rut}</li>}
                    {errors.name && <li>Nombre completo es requerido</li>}
                    {errors.email && <li>Email es requerido y debe ser válido</li>}
                    {errors.contactType && <li>Tipo de consulta es requerido</li>}
                    {errors.message && <li>Mensaje es requerido</li>}
                  </ul>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className={`w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </span>
                ) : formData.contactType === 'subscription-plan' && selectedPlan ? (
                  `Solicitar Plan ${planOptions.find((plan) => plan.planId === selectedPlan)?.label || selectedPlan} →`
                ) : (
                  'Enviar Mensaje →'
                )}
              </motion.button>

              <p className="text-sm text-gray-500 text-center">
                Al enviar este formulario, aceptas que nos pongamos en contacto contigo para responder tu consulta.
              </p>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-3xl mb-3">📧</div>
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <a href="mailto:ignacio@datakomerz.com" className="text-indigo-600 hover:text-indigo-700">
                ignacio@datakomerz.com
              </a>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-3xl mb-3">⏱️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Tiempo de Respuesta</h3>
              <p className="text-gray-600">24-48 horas</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-3xl mb-3">🌍</div>
              <h3 className="font-semibold text-gray-900 mb-2">Ubicación</h3>
              <p className="text-gray-600">Chile</p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
