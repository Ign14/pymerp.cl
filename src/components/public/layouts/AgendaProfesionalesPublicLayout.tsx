import type { PublicLayoutProps } from '../../../pages/public/layouts/types';
import { BarberiasPublicLayout } from './BarberiasPublicLayout';

/**
 * Agenda Profesionales
 * 
 * Duplicado funcional de Barberías: misma estructura/UX (hero, servicios, equipo, agenda)
 * + mismo picker mobile “Agendar” con filtro por profesional + booking modal flow.
 *
 * Esto permite que la categoría nueva tenga su propio layout key, sin duplicar lógica.
 */
export function AgendaProfesionalesPublicLayout(props: PublicLayoutProps) {
  return <BarberiasPublicLayout {...props} />;
}

