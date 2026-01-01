import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { getAppointmentsByCompany, getProfessionals } from '../../../services/appointments';
import { getServices } from '../../../services/firestore';
import { Appointment, AppointmentStatus, Professional, Service } from '../../../types';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import { motion } from 'framer-motion';

interface AppointmentMetrics {
  total: number;
  requested: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  byService: Record<string, number>;
  byProfessional: Record<string, number>;
  byDay: Record<string, number>;
  averageDuration: number;
  completionRate: number;
  cancellationRate: number;
}

export default function AppointmentsReport() {
  const navigate = useNavigate();
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [metrics, setMetrics] = useState<AppointmentMetrics | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (appointments.length > 0) {
      calculateMetrics();
    }
  }, [appointments, selectedMonth]);

  const loadData = async () => {
    if (!firestoreUser?.company_id) return;

    try {
      const [appointmentsData, servicesData, professionalsData] = await Promise.all([
        getAppointmentsByCompany(firestoreUser.company_id),
        getServices(firestoreUser.company_id),
        getProfessionals(firestoreUser.company_id),
      ]);

      setAppointments(appointmentsData);
      setServices(servicesData);
      setProfessionals(professionalsData);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const monthAppointments = appointments.filter((appt) =>
      isWithinInterval(appt.appointment_date, { start: monthStart, end: monthEnd })
    );

    if (monthAppointments.length === 0) {
      setMetrics({
        total: 0,
        requested: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        byService: {},
        byProfessional: {},
        byDay: {},
        averageDuration: 0,
        completionRate: 0,
        cancellationRate: 0,
      });
      return;
    }

    const byStatus = {
      requested: monthAppointments.filter((a) => a.status === AppointmentStatus.REQUESTED).length,
      confirmed: monthAppointments.filter((a) => a.status === AppointmentStatus.CONFIRMED).length,
      completed: monthAppointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length,
      cancelled: monthAppointments.filter((a) => a.status === AppointmentStatus.CANCELLED).length,
      noShow: monthAppointments.filter((a) => a.status === AppointmentStatus.NO_SHOW).length,
    };

    const byService: Record<string, number> = {};
    const byProfessional: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    monthAppointments.forEach((appt) => {
      // By service
      byService[appt.service_id] = (byService[appt.service_id] || 0) + 1;

      // By professional
      byProfessional[appt.professional_id] = (byProfessional[appt.professional_id] || 0) + 1;

      // By day
      const day = format(appt.appointment_date, 'yyyy-MM-dd');
      byDay[day] = (byDay[day] || 0) + 1;
    });

    const completionRate =
      byStatus.completed > 0
        ? (byStatus.completed / (byStatus.completed + byStatus.noShow + byStatus.cancelled)) * 100
        : 0;

    const cancellationRate =
      byStatus.cancelled > 0 ? (byStatus.cancelled / monthAppointments.length) * 100 : 0;

    setMetrics({
      total: monthAppointments.length,
      requested: byStatus.requested,
      confirmed: byStatus.confirmed,
      completed: byStatus.completed,
      cancelled: byStatus.cancelled,
      noShow: byStatus.noShow,
      byService,
      byProfessional,
      byDay,
      averageDuration: 0, // TODO: Calculate if needed
      completionRate,
      cancellationRate,
    });
  };

  const getServiceName = (serviceId: string) => {
    return services.find((s) => s.id === serviceId)?.name || 'Desconocido';
  };

  const getProfessionalName = (professionalId: string) => {
    return professionals.find((p) => p.id === professionalId)?.name || 'Sin asignar';
  };

  const handleMonthChange = (delta: number) => {
    setSelectedMonth((prev) => subMonths(prev, -delta));
  };

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (!metrics) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
                aria-label="Volver"
              >
                ←
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Reporte de Citas</h1>
            </div>
          </div>

          {/* Month Selector */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleMonthChange(-1)}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                ←
              </button>
              <span className="text-lg font-semibold text-gray-900">
                {format(selectedMonth, "MMMM yyyy", { locale: es })}
              </span>
              <button
                type="button"
                onClick={() => handleMonthChange(1)}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                →
              </button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total de citas"
              value={metrics.total}
              icon="📅"
              color="blue"
            />
            <StatCard
              title="Completadas"
              value={metrics.completed}
              icon="✅"
              color="green"
              subtitle={`${metrics.completionRate.toFixed(1)}% tasa de éxito`}
            />
            <StatCard
              title="Canceladas"
              value={metrics.cancelled}
              icon="❌"
              color="red"
              subtitle={`${metrics.cancellationRate.toFixed(1)}% tasa cancelación`}
            />
            <StatCard
              title="No asistieron"
              value={metrics.noShow}
              icon="⚠️"
              color="yellow"
            />
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* By Status */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Por estado</h2>
              <div className="space-y-3">
                <StatusBar label="Solicitadas" count={metrics.requested} total={metrics.total} color="yellow" />
                <StatusBar label="Confirmadas" count={metrics.confirmed} total={metrics.total} color="blue" />
                <StatusBar label="Completadas" count={metrics.completed} total={metrics.total} color="green" />
                <StatusBar label="Canceladas" count={metrics.cancelled} total={metrics.total} color="red" />
                <StatusBar label="No asistieron" count={metrics.noShow} total={metrics.total} color="gray" />
              </div>
            </div>

            {/* By Service */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Por servicio</h2>
              <div className="space-y-3">
                {Object.entries(metrics.byService)
                  .sort(([, a], [, b]) => b - a)
                  .map(([serviceId, count]) => (
                    <StatusBar
                      key={serviceId}
                      label={getServiceName(serviceId)}
                      count={count}
                      total={metrics.total}
                      color="blue"
                    />
                  ))}
                {Object.keys(metrics.byService).length === 0 && (
                  <p className="text-gray-500 text-sm">No hay datos</p>
                )}
              </div>
            </div>
          </div>

          {/* By Professional */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Por profesional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(metrics.byProfessional)
                .sort(([, a], [, b]) => b - a)
                .map(([professionalId, count]) => (
                  <div key={professionalId} className="p-4 border-2 border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{getProfessionalName(professionalId)}</span>
                      <span className="text-2xl font-bold text-blue-600">{count}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {((count / metrics.total) * 100).toFixed(1)}% del total
                    </div>
                  </div>
                ))}
              {Object.keys(metrics.byProfessional).length === 0 && (
                <p className="text-gray-500 text-sm col-span-2">No hay datos</p>
              )}
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => toast.error('Exportación próximamente disponible')}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              📊 Exportar a CSV
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'yellow';
  subtitle?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl" role="img" aria-hidden="true">
          {icon}
        </span>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
    </div>
  );
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
    gray: 'bg-gray-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

