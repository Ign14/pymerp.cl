import type { CategoryConfig, CategoryId } from '../../src/config/categories';
import { getDemoProfile, type DemoProfile } from './profiles';

const SAO_PAULO_TZ = 'America/Sao_Paulo';

export type DemoImagePaths = {
  hero: string;
  items: string[];
};

export type DemoDataSets = {
  profile: DemoProfile;
  imagePaths: DemoImagePaths;
  professionals: any[];
  services: any[];
  scheduleSlots: any[];
  serviceSchedules: any[];
  appointments: any[];
  appointmentRequests: any[];
  menuCategories: any[];
  products: any[];
  productOrders: any[];
  properties: any[];
  propertyBookings: any[];
  leads: any[];
  workOrdersLite: any[];
};

const addDays = (days: number) => {
  const now = new Date();
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
};

const formatDateString = (date: Date) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
};

const addMinutesToTime = (time: string, minutes: number) => {
  const [h, m] = time.split(':').map((v) => parseInt(v, 10));
  const total = h * 60 + m + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60)
    .toString()
    .padStart(2, '0');
  const mm = Math.floor(total % 60)
    .toString()
    .padStart(2, '0');
  return `${hh}:${mm}`;
};

const ensureLength = (arr: string[], target: number, fillerPrefix: string) => {
  const result = [...arr];
  while (result.length < target) {
    result.push(`${fillerPrefix} ${result.length + 1}`);
  }
  return result;
};

const baseNames = ['Camila Rojas', 'Javier Muñoz', 'Paula Hernández', 'Diego Contreras', 'Valentina Díaz', 'Felipe Gómez'];

const defaultMenuCategories = ['Clásicos', 'Especialidades', 'Premium', 'Saludable', 'Bebidas', 'Promociones'];

const priceBands: Record<string, [number, number]> = {
  restaurantes_comida_rapida: [3500, 15000],
  panaderia_pasteleria: [2500, 12000],
  minimarket: [1200, 12000],
  productos_cuidado_personal: [4500, 19000],
  default: [6000, 18000],
};

const cyclePrice = (idx: number, categoryId: CategoryId) => {
  const [min, max] = priceBands[categoryId] || priceBands.default;
  const span = max - min;
  return Math.round(min + ((idx * 137) % span));
};

const buildImagePaths = (categoryId: string): DemoImagePaths => ({
  hero: `/demo-images/${categoryId}/hero.webp`,
  items: Array.from({ length: 7 }).map((_, i) => `/demo-images/${categoryId}/item-${i + 1}.webp`),
});

const generateProfessionals = (companyId: string, slug: string, profile: DemoProfile, imagePaths: DemoImagePaths) => {
  const specialties = profile.specialties || ['General'];
  return baseNames.slice(0, 4).map((name, idx) => ({
    id: `${slug}-pro-${idx + 1}`,
    company_id: companyId,
    name,
    phone: `+56955550${(220 + idx).toString().padStart(3, '0')}`,
    email: `pro${idx + 1}@${slug}.demo`,
    avatar_url: imagePaths.items[idx % imagePaths.items.length],
    specialties,
    status: 'ACTIVE',
    created_at: addDays(-7),
    updated_at: addDays(-2),
    created_by_demo_seed: true,
  }));
};

const generateServices = (companyId: string, slug: string, profile: DemoProfile, professionals: any[], imagePaths: DemoImagePaths) => {
  const base = ensureLength(profile.serviceExamples || [], 6, 'Servicio demo');
  return base.slice(0, 8).map((name, idx) => {
    const proIds = professionals.filter((_, proIdx) => proIdx % 2 === idx % 2).map((p) => p.id);
    return {
      id: `${slug}-svc-${idx + 1}`,
      company_id: companyId,
      name,
      description: `${name} dentro de ${profile.companyName}. ${profile.tagline}`,
      price: Math.round(12000 + idx * 1800),
      image_url: imagePaths.items[idx % imagePaths.items.length],
      estimated_duration_minutes: 35 + (idx % 4) * 10,
      professional_ids: proIds,
      status: 'ACTIVE',
      hide_price: false,
      created_by_demo_seed: true,
    };
  });
};

const generateScheduleSlots = (companyId: string, slug: string) => {
  return [
    {
      id: `${slug}-slot-1`,
      company_id: companyId,
      days_of_week: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      start_time: '09:00',
      end_time: '13:00',
      status: 'ACTIVE',
      created_by_demo_seed: true,
    },
    {
      id: `${slug}-slot-2`,
      company_id: companyId,
      days_of_week: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      start_time: '14:30',
      end_time: '19:00',
      status: 'ACTIVE',
      created_by_demo_seed: true,
    },
    {
      id: `${slug}-slot-3`,
      company_id: companyId,
      days_of_week: ['SATURDAY'],
      start_time: '10:00',
      end_time: '14:00',
      status: 'ACTIVE',
      created_by_demo_seed: true,
    },
  ];
};

const generateServiceSchedules = (services: any[], slots: any[]) =>
  services.flatMap((service) =>
    slots.slice(0, 2).map((slot) => ({
      id: `${service.id}-schedule-${slot.id}`,
      company_id: service.company_id,
      service_id: service.id,
      schedule_slot_id: slot.id,
      created_by_demo_seed: true,
    }))
  );

const generateAppointments = (companyId: string, services: any[], professionals: any[], slots: any[], slug: string) => {
  const statuses = ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CONFIRMED', 'NO_SHOW', 'CANCELLED'];
  return Array.from({ length: 10 }).map((_, idx) => {
    const service = services[idx % services.length];
    const professional = professionals[idx % professionals.length];
    const slot = slots[idx % slots.length];
    const baseDate = addDays(-6 + idx);
    return {
      id: `${slug}-appt-${idx + 1}`,
      company_id: companyId,
      service_id: service.id,
      professional_id: professional.id,
      appointment_date: baseDate,
      start_time: slot.start_time,
      end_time: addMinutesToTime(slot.start_time, 45),
      status: statuses[idx % statuses.length],
      client_name: `Cliente ${idx + 1}`,
      client_phone: `+56955559${(300 + idx).toString().padStart(3, '0')}`,
      client_email: `cliente${idx + 1}@${slug}.demo`,
      notes: 'Reserva generada automáticamente para demo',
      created_at: addDays(-8 + idx),
      updated_at: addDays(-1),
      created_by_demo_seed: true,
    };
  });
};

const generateAppointmentRequests = (companyId: string, services: any[], slots: any[], slug: string) => {
  return Array.from({ length: 12 }).map((_, idx) => {
    const service = services[idx % services.length];
    const slot = slots[idx % slots.length];
    const date = addDays(-10 + idx);
    return {
      id: `${slug}-req-${idx + 1}`,
      company_id: companyId,
      service_id: service.id,
      schedule_slot_id: slot.id,
      date: formatDateString(date),
      client_name: `Visita ${idx + 1}`,
      client_whatsapp: `+56955557${(400 + idx).toString().padStart(3, '0')}`,
      client_email: `visita${idx + 1}@${slug}.demo`,
      client_comment: 'Quiero confirmar un horario',
      created_at: date,
      created_by_demo_seed: true,
    };
  });
};

const generateMenuCategories = (companyId: string, slug: string, profile: DemoProfile, imagePaths: DemoImagePaths) => {
  const names = ensureLength(profile.menuCategories || defaultMenuCategories, 6, 'Categoría');
  return names.slice(0, 6).map((name, idx) => ({
    id: `${slug}-menu-${idx + 1}`,
    company_id: companyId,
    name,
    description: `${name} destacados de ${profile.companyName}`,
    image_url: imagePaths.items[idx % imagePaths.items.length],
    order: idx + 1,
    active: true,
    created_at: addDays(-5),
    updated_at: addDays(-1),
    created_by_demo_seed: true,
  }));
};

const generateProducts = (companyId: string, slug: string, categoryId: CategoryId, profile: DemoProfile, menuCategories: any[], imagePaths: DemoImagePaths) => {
  const names = ensureLength(profile.productExamples || [], 18, 'Producto demo');
  while (names.length < 30) {
    names.push(`${names[names.length % 10]} ${names.length + 1}`);
  }

  return names.slice(0, 30).map((name, idx) => {
    const menuCategoryId = menuCategories.length > 0 ? menuCategories[idx % menuCategories.length]?.id : undefined;
    const price = cyclePrice(idx, categoryId);
    return {
      id: `${slug}-prod-${idx + 1}`,
      company_id: companyId,
      name,
      description: `${name} disponible en ${profile.companyName}`,
      image_url: imagePaths.items[idx % imagePaths.items.length],
      price,
      stock: 12 + (idx % 8) * 4,
      status: 'ACTIVE',
      hide_price: false,
      menuCategoryId,
      menuOrder: idx + 1,
      isAvailable: true,
      created_at: addDays(-12 + idx % 5),
      updated_at: addDays(-1),
      created_by_demo_seed: true,
    };
  });
};

const generateProductOrders = (companyId: string, slug: string, products: any[]) => {
  const statuses = ['REQUESTED', 'CONFIRMED', 'PREPARING', 'DELIVERED', 'PAID', 'CANCELLED'];
  const orderTypes = ['TABLE', 'PICKUP', 'DELIVERY'];
  return Array.from({ length: 15 }).map((_, idx) => {
    const items = [
      products[idx % products.length],
      products[(idx + 7) % products.length],
    ];
    const quantities = [1 + (idx % 2), 1];
    const orderItems = items.map((product, itemIdx) => ({
      product_id: product.id,
      quantity: quantities[itemIdx],
      unit_price: product.price,
    }));
    const total = orderItems.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
    return {
      id: `${slug}-order-${idx + 1}`,
      company_id: companyId,
      items: orderItems,
      total_estimated: total,
      client_name: `Pedido ${idx + 1}`,
      client_whatsapp: `+56955558${(500 + idx).toString().padStart(3, '0')}`,
      client_comment: idx % 3 === 0 ? 'Sin cebolla, por favor' : 'Agregar servilletas',
      table_number: idx % 4 === 0 ? `M-${idx % 10}` : undefined,
      order_type: orderTypes[idx % orderTypes.length],
      channel: idx % 2 === 0 ? 'MENU' : 'WHATSAPP',
      status: statuses[idx % statuses.length],
      created_at: addDays(-18 + idx),
      created_by_demo_seed: true,
    };
  });
};

const generateProperties = (companyId: string, slug: string, profile: DemoProfile, imagePaths: DemoImagePaths) => {
  const titles = ensureLength(profile.propertyTitles || [], 12, 'Propiedad demo');
  return titles.slice(0, 12).map((title, idx) => ({
    id: `${slug}-prop-${idx + 1}`,
    company_id: companyId,
    title,
    description: `${title} gestionada por ${profile.companyName}. ${profile.tagline}`,
    address: profile.address,
    location: `${profile.commune}, ${profile.region}`,
    capacity: 2 + (idx % 5),
    amenities: ['Wifi', 'Estacionamiento', 'Terraza', 'Bodega', idx % 2 === 0 ? 'Quincho' : 'Piscina'],
    price_per_night: 450000 + idx * 25000,
    currency: 'CLP',
    status: 'ACTIVE',
    photos: [imagePaths.hero, ...imagePaths.items.slice(0, 3)],
    created_at: addDays(-15 + idx),
    updated_at: addDays(-1),
    created_by_demo_seed: true,
  }));
};

const generatePropertyBookings = (companyId: string, slug: string, properties: any[]) => {
  const statuses = ['PENDING', 'CONFIRMED', 'CONFIRMED', 'CANCELLED'];
  return Array.from({ length: 8 }).map((_, idx) => {
    const property = properties[idx % properties.length];
    const checkIn = addDays(idx - 6);
    const checkOut = addDays(idx - 4);
    return {
      id: `${slug}-booking-${idx + 1}`,
      company_id: companyId,
      property_id: property.id,
      guest_name: `Visita ${idx + 1}`,
      guest_email: `reserva${idx + 1}@${slug}.demo`,
      guest_phone: `+56955556${(520 + idx).toString().padStart(3, '0')}`,
      check_in: checkIn,
      check_out: checkOut,
      guests: 2 + (idx % 3),
      status: statuses[idx % statuses.length],
      total_price: property.price_per_night ? property.price_per_night * 0.1 : 320000,
      currency: 'CLP',
      created_at: addDays(idx - 8),
      updated_at: addDays(idx - 2),
      created_by_demo_seed: true,
    };
  });
};

const generateLeads = (companyId: string, slug: string, profile: DemoProfile, properties: any[]) => {
  const intents = profile.leadIntents || ['consult', 'visit', 'general'];
  return Array.from({ length: 15 }).map((_, idx) => {
    const property = properties[idx % properties.length];
    const preferred = addDays(idx - 5);
    return {
      id: `${slug}-lead-${idx + 1}`,
      company_id: companyId,
      property_id: property?.id,
      property_title: property?.title,
      intent: intents[idx % intents.length],
      name: `Lead ${idx + 1}`,
      whatsapp: `+56955554${(430 + idx).toString().padStart(3, '0')}`,
      email: `lead${idx + 1}@${slug}.demo`,
      message: 'Estoy interesado en coordinar una visita y recibir más detalles.',
      preferred_date: preferred,
      preferred_time: '11:00',
      source: 'demo-seed',
      created_at: addDays(idx - 9),
      updated_at: addDays(idx - 2),
      created_by_demo_seed: true,
    };
  });
};

const generateWorkOrders = (companyId: string, slug: string, profile: DemoProfile) => {
  const types = ensureLength(profile.workOrderTypes || ['Visita técnica', 'Revisión'], 5, 'Trabajo');
  const statuses = ['NEW', 'SCHEDULED', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
  return Array.from({ length: 15 }).map((_, idx) => ({
    id: `${slug}-wo-${idx + 1}`,
    company_id: companyId,
    requester_name: `Cliente obra ${idx + 1}`,
    phone: `+56955553${(600 + idx).toString().padStart(3, '0')}`,
    email: `obra${idx + 1}@${slug}.demo`,
    service_type: types[idx % types.length],
    description: `Requerimiento de ${types[idx % types.length]} en vivienda demo.`,
    preferred_date: addDays(idx - 4),
    preferred_time: idx % 2 === 0 ? '10:00' : '16:00',
    source: 'demo-seed',
    status: statuses[idx % statuses.length],
    created_at: addDays(idx - 10),
    updated_at: addDays(idx - 1),
    created_by_demo_seed: true,
  }));
};

export function buildDemoData(category: CategoryConfig, companyId: string, slug: string): DemoDataSets {
  const profile = getDemoProfile(category.id);
  const modules = new Set(category.dashboardModules);
  const imagePaths = buildImagePaths(category.id);

  const hasServiceModule = modules.has('appointments') || modules.has('appointments-lite') || modules.has('schedule');
  const professionals = hasServiceModule
    ? generateProfessionals(companyId, slug, profile, imagePaths)
    : [];

  const services = hasServiceModule
    ? generateServices(companyId, slug, profile, professionals, imagePaths)
    : [];

  const scheduleSlots = hasServiceModule
    ? generateScheduleSlots(companyId, slug)
    : [];

  const serviceSchedules = services.length > 0 && scheduleSlots.length > 0 ? generateServiceSchedules(services, scheduleSlots) : [];
  const appointments = services.length > 0 && professionals.length > 0 && scheduleSlots.length > 0
    ? generateAppointments(companyId, services, professionals, scheduleSlots, slug)
    : [];
  const appointmentRequests = services.length > 0 && scheduleSlots.length > 0
    ? generateAppointmentRequests(companyId, services, scheduleSlots, slug)
    : [];

  const menuCategories = modules.has('menu-categories') || modules.has('menu-qr')
    ? generateMenuCategories(companyId, slug, profile, imagePaths)
    : [];

  const productCategoryPool =
    modules.has('menu-categories') || modules.has('menu-qr')
      ? menuCategories
      : [];

  const products = (modules.has('catalog') || modules.has('orders'))
    ? generateProducts(companyId, slug, category.id, profile, productCategoryPool, imagePaths)
    : [];

  const productOrders = modules.has('orders') && products.length > 0
    ? generateProductOrders(companyId, slug, products)
    : [];

  const properties = modules.has('properties') ? generateProperties(companyId, slug, profile, imagePaths) : [];
  const propertyBookings = modules.has('property-bookings') && properties.length > 0
    ? generatePropertyBookings(companyId, slug, properties)
    : [];
  const leads = properties.length > 0 ? generateLeads(companyId, slug, profile, properties) : [];
  const workOrdersLite = modules.has('work-orders-lite') ? generateWorkOrders(companyId, slug, profile) : [];

  return {
    profile,
    imagePaths,
    professionals,
    services,
    scheduleSlots,
    serviceSchedules,
    appointments,
    appointmentRequests,
    menuCategories,
    products,
    productOrders,
    properties,
    propertyBookings,
    leads,
    workOrdersLite,
  };
}
