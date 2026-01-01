import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../../components/SEO';
import { validateEmail, validateRequired, validateFields } from '../../services/errorHelpers';
import toast from 'react-hot-toast';

type ContactType = 
  | 'solution'
  | 'question'
  | 'internship-commercial'
  | 'internship-developer'
  | 'internship-marketing'
  | 'internship-designer'
  | 'other';

export default function Contacto() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    contactType: '' as ContactType | '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const contactTypes = [
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
    const type = contactTypes.find(t => t.value === value);
    return type ? type.label : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validación con helpers
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
        validators: [validateRequired],
      },
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Por favor completa todos los campos requeridos correctamente');
      return;
    }

    setLoading(true);

    try {
      // Intentar enviar usando función HTTP si está disponible
      const functionUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || '';
      
      if (functionUrl) {
        try {
          const response = await fetch(`${functionUrl}/sendContactEmailHttp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: formData.name.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim() || 'No proporcionado',
              contactType: getContactTypeLabel(formData.contactType),
              message: formData.message.trim(),
              date: new Date().toISOString(),
            }),
          });

          if (response.ok) {
            setSubmitted(true);
            setFormData({ name: '', email: '', phone: '', contactType: '' as ContactType | '', message: '' });
            return;
          }
        } catch (err) {
          console.warn('Error enviando por función HTTP, usando mailto:', err);
        }
      }

      // Fallback: usar mailto
      const subject = encodeURIComponent(`Contacto PyM-ERP: ${getContactTypeLabel(formData.contactType)}`);
      const body = encodeURIComponent(
        `Nombre: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Teléfono: ${formData.phone || 'No proporcionado'}\n` +
        `Tipo de consulta: ${getContactTypeLabel(formData.contactType)}\n\n` +
        `Mensaje:\n${formData.message}`
      );
      window.location.href = `mailto:ignacio@datakomerz.com?subject=${subject}&body=${body}`;
      
      // Simular éxito después de un momento
      setTimeout(() => {
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', contactType: '' as ContactType | '', message: '' });
      }, 500);
    } catch (err) {
      toast.error('Hubo un error al enviar tu mensaje. Por favor intenta nuevamente.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Limpiar error del campo al editar
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
        <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 flex items-center justify-center px-4">
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
                  setFormData({ name: '', email: '', phone: '', contactType: '' as ContactType | '', message: '' });
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Enviar otro mensaje
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
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
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate('/')}
            className="mb-8 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Volver al inicio
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Contáctanos
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Estamos aquí para ayudarte. Cuéntanos qué necesitas y te responderemos lo antes posible.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-10"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Tipo de Consulta */}
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

              {/* Información Personal */}
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

              {/* Mensaje */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                  Mensaje <span className="text-red-500">*</span>
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
                  placeholder="Cuéntanos más sobre tu consulta, proyecto o interés..."
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'message-error' : undefined}
                />
                {errors.message && (
                  <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">
                    Campo requerido
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Mientras más detalles nos compartas, mejor podremos ayudarte
                </p>
              </div>

              {/* Error Message - ahora solo para errores generales */}
              {Object.keys(errors).length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <p className="text-red-700 font-medium">Por favor corrige los errores en el formulario</p>
                </div>
              )}

              {/* Submit Button */}
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
                ) : (
                  'Enviar Mensaje →'
                )}
              </motion.button>

              <p className="text-sm text-gray-500 text-center">
                Al enviar este formulario, aceptas que nos pongamos en contacto contigo para responder tu consulta.
              </p>
            </form>
          </motion.div>

          {/* Información Adicional */}
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
