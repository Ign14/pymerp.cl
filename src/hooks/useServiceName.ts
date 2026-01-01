import { useEffect, useState } from 'react';
import { Appointment } from '../types';
import { getService } from '../services/firestore';

/**
 * Hook para obtener el nombre del servicio desde la base de datos
 * @param appointment - La cita que contiene el service_id
 * @returns El nombre del servicio o un valor por defecto mientras carga
 */
export function useServiceName(appointment: Appointment | null): string {
  const [serviceName, setServiceName] = useState<string>('Cargando...');

  useEffect(() => {
    if (!appointment) {
      setServiceName('Sin servicio');
      return;
    }

    const loadServiceName = async () => {
      // Si ya tenemos el nombre del servicio en el appointment, usarlo directamente
      if ((appointment as any).service_name || (appointment as any).service || (appointment as any).serviceName) {
        setServiceName(
          (appointment as any).service_name ||
          (appointment as any).service ||
          (appointment as any).serviceName
        );
        return;
      }

      // Si no, cargar desde la base de datos
      try {
        const service = await getService(appointment.service_id);
        if (service) {
          setServiceName(service.name);
        } else {
          setServiceName('Servicio no encontrado');
        }
      } catch (error) {
        console.error('Error cargando servicio:', error);
        setServiceName(appointment.service_id);
      }
    };

    loadServiceName();
  }, [appointment?.service_id]);

  return serviceName;
}

