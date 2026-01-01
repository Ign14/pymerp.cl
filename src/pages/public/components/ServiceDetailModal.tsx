import { motion, AnimatePresence } from 'framer-motion';
import { Service, Professional } from '../../../types';
import { AppearanceTheme } from '../types';

interface ServiceDetailModalProps {
  service: Service | null;
  professionals: Professional[];
  theme: AppearanceTheme;
  onClose: () => void;
  onBook: () => void;
}

export function ServiceDetailModal({
  service,
  professionals,
  theme,
  onClose,
  onBook,
}: ServiceDetailModalProps) {
  if (!service) return null;

  // Filter professionals assigned to this service, or show all if none assigned
  const assignedProfessionals = service.professional_ids && service.professional_ids.length > 0
    ? professionals.filter((prof) => service.professional_ids?.includes(prof.id))
    : professionals;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: theme.cardColor, color: theme.textColor }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg transition"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          {service.image_url && (
            <div className="w-full h-64 sm:h-96 bg-gray-100 flex items-center justify-center">
              <img
                src={service.image_url}
                alt={service.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 sm:p-8">
            <h2
              className="text-2xl sm:text-3xl font-bold mb-4"
              style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
            >
              {service.name}
            </h2>

            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <span
                className="text-3xl font-bold"
                style={{ color: theme.buttonColor, fontFamily: theme.fontTitle }}
              >
                {service.hide_price ? (
                  <span className="text-base font-medium flex items-center gap-2" style={{ color: '#25D366' }}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Consulta precio por WhatsApp
                  </span>
                ) : (
                  `$${service.price.toLocaleString()}`
                )}
              </span>
              <div className="flex items-center gap-4 text-sm" style={{ color: theme.subtitleColor }}>
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {service.estimated_duration_minutes} minutos
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3
                className="text-lg font-semibold mb-3"
                style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
              >
                📋 Descripción
              </h3>
              <p
                className="text-base leading-relaxed whitespace-pre-wrap"
                style={{ color: theme.textColor }}
              >
                {service.description}
              </p>
            </div>

            {/* Professionals */}
            {assignedProfessionals.length > 0 && (
              <div className="mb-6">
                <h3
                  className="text-lg font-semibold mb-3"
                  style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
                >
                  👨‍⚕️ Profesionales disponibles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assignedProfessionals.map((prof) => (
                    <div
                      key={prof.id}
                      className="p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        backgroundColor: theme.cardColor + '80',
                        borderColor: theme.subtitleColor + '40' || '#e5e7eb',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {prof.avatar_url ? (
                          <img
                            src={prof.avatar_url}
                            alt={prof.name}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
                            style={{ backgroundColor: theme.buttonColor }}
                          >
                            {prof.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-semibold text-sm mb-1"
                            style={{ color: theme.titleColor }}
                          >
                            {prof.name}
                          </p>
                          {prof.specialties && prof.specialties.length > 0 && (
                            <p
                              className="text-xs mb-2 line-clamp-1"
                              style={{ color: theme.subtitleColor }}
                            >
                              {prof.specialties.join(', ')}
                            </p>
                          )}
                          {prof.email && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.subtitleColor }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <a
                                href={`mailto:${prof.email}`}
                                className="text-xs truncate hover:underline"
                                style={{ color: theme.buttonColor }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {prof.email}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Book Button */}
            <button
              onClick={() => {
                onClose();
                onBook();
              }}
              className="w-full py-3 rounded-lg font-semibold text-lg hover:opacity-90 transition"
              style={{
                backgroundColor: theme.buttonColor,
                color: theme.buttonTextColor,
                fontFamily: theme.fontButton,
              }}
            >
              📅 Agendar este servicio
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

