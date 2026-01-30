import type { SeoCompany, SeoServiceItem } from './types';

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}…`;
};

const safeTitleCase = (value: string): string =>
  value
    .split(' ')
    .map((word) => (word.length > 1 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');

export const resolveLocationLabel = (company: SeoCompany): string | null => {
  const comuna = company.comuna?.trim();
  const region = company.region?.trim();
  if (comuna && region) return `${safeTitleCase(comuna)}, ${safeTitleCase(region)}`;
  if (comuna) return safeTitleCase(comuna);
  if (region) return safeTitleCase(region);
  return null;
};

export const buildBarberiaTitle = (company: SeoCompany, locationLabel: string | null): string => {
  const base = locationLabel
    ? `${company.name} | Barbería en ${locationLabel} – Reserva Online`
    : `${company.name} | Barbería – Reserva Online`;
  return truncate(base, 70);
};

export const buildBarberiaDescription = (
  company: SeoCompany,
  locationLabel: string | null,
  topServices: SeoServiceItem[]
): string => {
  const servicesSnippet = topServices.length > 0
    ? `${topServices.map((service) => service.name).slice(0, 3).join(', ')}.`
    : 'Cortes, barba y estilismo.';
  const locationSnippet = locationLabel ? ` (${locationLabel})` : '';
  const base = `Reserva en ${company.name}${locationSnippet}. ${servicesSnippet} Horarios, precios y atención rápida. Agenda online en pymerp.`;
  return truncate(base, 160);
};

export const buildBarberiaH1 = (company: SeoCompany, locationLabel: string | null): string => {
  return locationLabel
    ? `${company.name} – Barbería en ${locationLabel}`
    : `${company.name} – Barbería`;
};

export const buildBarberiaKeywords = (company: SeoCompany, locationLabel: string | null): string[] => {
  const location = locationLabel || 'Chile';
  return [
    `barbería ${location}`,
    `corte de pelo ${location}`,
    `barba ${location}`,
    `${company.name} barbería`,
    `reservar barbería online ${location}`,
  ];
};

export const buildBarberiaBodyText = (
  company: SeoCompany,
  locationLabel: string | null,
  topServices: SeoServiceItem[]
): string => {
  const locationPart = locationLabel ? `en ${locationLabel}` : 'en tu ciudad';
  const servicesList = topServices.map((service) => service.name).slice(0, 3);
  const servicesSentence =
    servicesList.length > 0
      ? `Servicios destacados: ${servicesList.join(', ')}.`
      : 'Cortes, barba y estilismo con profesionales locales.';

  const paragraphs = [
    `${company.name} es una barbería ${locationPart} con agenda online y atención personalizada. Aquí encuentras horarios claros, precios transparentes y una experiencia cómoda para planificar tu visita.`,
    servicesSentence,
    'Si buscas mantener tu estilo y ahorrar tiempo, puedes agendar de forma rápida y recibir confirmación directa. La información de contacto y ubicación está disponible para resolver cualquier duda antes de tu visita.',
    'Agenda en pymerp y encuentra el servicio que mejor se adapte a tu rutina.',
  ];

  const text = paragraphs.join(' ');
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 120 && words.length <= 300) return text;

  if (words.length < 120) {
    return `${text} Atendemos con cuidado cada detalle para que tu experiencia sea simple, ordenada y segura.`;
  }

  return words.slice(0, 300).join(' ');
};

