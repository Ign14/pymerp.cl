import { Appointment } from '../types';
import { getService } from '../services/firestore';

/**
 * Obtiene el nombre del servicio desde un appointment
 * Primero intenta obtenerlo del appointment directamente, si no está disponible, lo carga desde la base de datos
 * @param appointment - La cita que contiene el service_id
 * @returns Promise con el nombre del servicio
 */
export async function getServiceNameFromAppointment(appointment: Appointment): Promise<string> {
  // Si ya tenemos el nombre del servicio en el appointment, usarlo directamente
  if ((appointment as any).service_name || (appointment as any).service || (appointment as any).serviceName) {
    return (
      (appointment as any).service_name ||
      (appointment as any).service ||
      (appointment as any).serviceName
    );
  }

  // Si no, cargar desde la base de datos
  try {
    const service = await getService(appointment.service_id);
    if (service) {
      return service.name;
    } else {
      return 'Servicio no encontrado';
    }
  } catch (error) {
    console.error('Error cargando servicio:', error);
    return appointment.service_id;
  }
}

