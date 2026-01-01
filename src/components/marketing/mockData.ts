import { Logo, Feature, Segment, Step, Testimonial, FAQ } from './types';

export const logos: Logo[] = [];

export const features: Feature[] = [
  {
    id: '1',
    icon: '📅',
    title: 'Agenda Online',
    description: 'Sistema de reservas automático donde tus clientes agendan 24/7 sin llamadas ni mensajes.',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: '2',
    icon: '🛍️',
    title: 'Catálogo de Productos/Servicios',
    description: 'Muestra lo que ofreces con fotos, descripciones y precios. Todo en un solo lugar.',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: '3',
    icon: '💬',
    title: 'WhatsApp Integrado',
    description: 'Recibe notificaciones y confirmaciones directamente en tu WhatsApp personal o de negocio.',
    color: 'from-green-500 to-teal-600'
  },
  {
    id: '4',
    icon: '🌐',
    title: 'Página Pública Propia',
    description: 'Tu link único pymerp.cl/tu-negocio para compartir en redes, tarjetas o donde quieras.',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: '5',
    icon: '🎨',
    title: 'Personalización Visual',
    description: 'Elige colores, sube tu logo y personaliza tu página para que refleje tu marca.',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    id: '6',
    icon: '📱',
    title: 'App Instalable (PWA)',
    description: 'Tus clientes pueden instalar tu página como una app en su celular con un click.',
    color: 'from-indigo-500 to-purple-600'
  }
];

export const segments: Segment[] = [
  {
    id: 'service-1',
    type: 'service',
    title: 'Negocios de Servicios',
    description: 'Para peluquerías, spas, talleres mecánicos, profesionales independientes y todo negocio que agende citas.',
    features: [
      'Sistema de reservas online',
      'Gestión de horarios y disponibilidad',
      'Recordatorios automáticos por WhatsApp',
      'Catálogo de servicios personalizable',
      'Registro de clientes y historial'
    ],
    icon: '📅',
    color: 'from-blue-600 to-indigo-700'
  },
  {
    id: 'product-1',
    type: 'product',
    title: 'Negocios de Productos',
    description: 'Para tiendas, distribuidoras, artesanos y emprendedores que venden productos físicos o digitales.',
    features: [
      'Catálogo de productos con imágenes',
      'Gestión de inventario',
      'Solicitudes por WhatsApp',
      'Carrito de compras',
      'Control de stock y disponibilidad'
    ],
    icon: '🛒',
    color: 'from-green-600 to-teal-700'
  }
];

export const steps: Step[] = [
  {
    number: 1,
    title: 'Crea tu emprendimiento',
    description: 'Registra tu negocio con nombre, logo y datos básicos en 2 minutos.',
    icon: '🏪'
  },
  {
    number: 2,
    title: 'Configura servicios o productos',
    description: 'Agrega lo que ofreces: servicios con agenda o productos con catálogo.',
    icon: '⚙️'
  },
  {
    number: 3,
    title: 'Comparte y recibe reservas',
    description: 'Obtén tu link único y empieza a recibir reservas o pedidos por WhatsApp.',
    icon: '🚀'
  }
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'María González',
    role: 'CEO',
    company: 'TechStart Solutions',
    avatar: 'https://i.pravatar.cc/150?img=1',
    content: 'Esta plataforma transformó completamente nuestra forma de trabajar. La productividad de nuestro equipo aumentó un 300% en solo 3 meses.',
    rating: 5
  },
  {
    id: '2',
    name: 'Carlos Rodríguez',
    role: 'Director de Tecnología',
    company: 'Innovate Corp',
    avatar: 'https://i.pravatar.cc/150?img=12',
    content: 'La mejor decisión que tomamos este año. El soporte técnico es excepcional y las integraciones funcionan a la perfección.',
    rating: 5
  },
  {
    id: '3',
    name: 'Ana Martínez',
    role: 'Product Manager',
    company: 'Digital Ventures',
    avatar: 'https://i.pravatar.cc/150?img=5',
    content: 'Intuitivo, potente y confiable. Nos permite enfocarnos en lo importante: nuestros clientes. Altamente recomendado.',
    rating: 5
  }
];

export const faqs: FAQ[] = [
  {
    id: '1',
    question: '¿Cómo creo mi espacio digital gratis?',
    answer: 'Crear tu espacio digital en PyM-ERP toma solo 2 minutos. Regístrate gratis, completa tu información básica y comienza a usar todas las funcionalidades del plan básico inmediatamente. No necesitas tarjeta de crédito ni compromisos.'
  },
  {
    id: '2',
    question: '¿Cuáles son los costos de usar PyM-ERP?',
    answer: 'El plan BÁSICO es completamente GRATIS para siempre. Está diseñado para emprendedores y PYMEs que quieren un espacio digital profesional. Cuando lancemos PyM-ERP APP, tendrás la opción de actualizar a planes Lite ($17.000 CLP/mes), Standard ($69.000 CLP/mes) o Enterprise ($139.000 CLP/mes) con funcionalidades avanzadas de gestión empresarial.'
  },
  {
    id: '3',
    question: '¿Qué incluye el plan básico gratuito?',
    answer: 'El plan básico incluye: página web profesional para tu negocio, catálogo de productos/servicios, sistema de reservas o solicitudes por WhatsApp, búsqueda por comuna y categoría, presencia digital completa. Todo lo que necesitas para empezar a crecer online.'
  },
  {
    id: '4',
    question: '¿Mis datos están seguros?',
    answer: 'Absolutamente. Utilizamos tecnología Firebase de Google con cifrado de nivel empresarial, cumplimos con estándares internacionales de seguridad, y realizamos backups automáticos. Tus datos nunca se comparten con terceros.'
  },
  {
    id: '5',
    question: '¿Cómo encuentran mis clientes mi negocio?',
    answer: 'Tu negocio aparece en nuestro directorio público, donde clientes pueden buscar por comuna, categoría o nombre. Además, tendrás tu propia URL personalizada para compartir en redes sociales, WhatsApp o tarjetas de presentación.'
  },
  {
    id: '6',
    question: '¿Necesito conocimientos técnicos?',
    answer: 'No. PyM-ERP está diseñado para ser intuitivo y fácil de usar. Con nuestro asistente de configuración paso a paso, cualquier persona puede crear su espacio digital profesional sin conocimientos técnicos previos.'
  }
];

