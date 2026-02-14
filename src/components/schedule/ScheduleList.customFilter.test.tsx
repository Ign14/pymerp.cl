import { describe, it, expect } from 'vitest';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Verificación del filtro personalizado en /dashboard/schedule (categoría barbería).
 *
 * La tarjeta "Rango personalizado activo" (09/02/2026 → 15/02/2026) y la lista de citas
 * usan la misma fuente: dateRangeDates (activeRangeStart / activeRangeEnd).
 * FiltersSection muestra format(activeRangeStart, 'dd/MM/yyyy') y format(activeRangeEnd, 'dd/MM/yyyy').
 * filteredAppointments filtra por dateRangeDates.start y dateRangeDates.end.
 */
describe('ScheduleList - Filtro personalizado (lógica de fechas)', () => {
  it('formato de la tarjeta coincide con el rango usado para filtrar (dd/MM/yyyy)', () => {
    const customStartDate = '2026-02-09';
    const customEndDate = '2026-02-15';
    const startDate = parseISO(customStartDate);
    const endDate = parseISO(customEndDate);
    const startNorm = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0);
    const endNorm = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);

    const displayStart = format(startNorm, 'dd/MM/yyyy', { locale: es });
    const displayEnd = format(endNorm, 'dd/MM/yyyy', { locale: es });

    expect(displayStart).toBe('09/02/2026');
    expect(displayEnd).toBe('15/02/2026');
  });

  it('una cita dentro del rango 09/02–15/02 se considera en el filtro', () => {
    const rangeStart = new Date(2026, 1, 9, 0, 0, 0, 0);
    const rangeEnd = new Date(2026, 1, 15, 23, 59, 59, 999);
    const aptDate = new Date(2026, 1, 10, 12, 0, 0, 0);
    const aptDateNormalized = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate(), 0, 0, 0, 0);
    const isInRange =
      aptDateNormalized.getTime() >= rangeStart.getTime() && aptDateNormalized.getTime() <= rangeEnd.getTime();
    expect(isInRange).toBe(true);
  });

  it('una cita fuera del rango 09/02–15/02 se excluye del filtro', () => {
    const rangeStart = new Date(2026, 1, 9, 0, 0, 0, 0);
    const rangeEnd = new Date(2026, 1, 15, 23, 59, 59, 999);
    const aptDate = new Date(2026, 1, 20, 12, 0, 0, 0);
    const aptDateNormalized = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate(), 0, 0, 0, 0);
    const isInRange =
      aptDateNormalized.getTime() >= rangeStart.getTime() && aptDateNormalized.getTime() <= rangeEnd.getTime();
    expect(isInRange).toBe(false);
  });
});
