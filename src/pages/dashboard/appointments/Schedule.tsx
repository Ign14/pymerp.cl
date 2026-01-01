import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { getServices } from '../../../services/firestore';
import {
  getProfessionals,
  listenAppointmentsByRange,
  confirmAppointmentWithNotifications,
  cancelAppointmentWithNotifications,
  getPendingAppointments,
} from '../../../services/appointments';
import { Service, Professional, Appointment } from '../../../types';
import { format, startOfWeek, endOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import { motion } from 'framer-motion';
import AppointmentCard from '../../../components/appointments/AppointmentCard';
import PendingList from '../../../components/appointments/PendingList';

type ViewMode = 'day' | 'week';

export default function Schedule() {
  const navigate = useNavigate();
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [showPending, setShowPending] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!firestoreUser?.company_id) return;

    const startDate = viewMode === 'day' 
      ? new Date(selectedDate.setHours(0, 0, 0, 0))
      : startOfWeek(selectedDate, { weekStartsOn: 1 });
    
    const endDate = viewMode === 'day'
      ? new Date(selectedDate.setHours(23, 59, 59, 999))
      : endOfWeek(selectedDate, { weekStartsOn: 1 });

    const unsubscribe = listenAppointmentsByRange(
      firestoreUser.company_id,
      startDate,
      endDate,
      (data) => {
        if (selectedProfessional === 'all') {
          setAppointments(data);
        } else {
          setAppointments(data.filter((a) => a.professional_id === selectedProfessional));
        }
      }
    );

    return () => unsubscribe();
  }, [firestoreUser?.company_id, selectedDate, viewMode, selectedProfessional]);

  const loadInitialData = async () => {
    if (!firestoreUser?.company_id) return;

    try {
      const [servicesData, professionalsData, pendingData] = await Promise.all([
        getServices(firestoreUser.company_id),
        getProfessionals(firestoreUser.company_id),
        getPendingAppointments(firestoreUser.company_id),
      ]);

      setServices(servicesData);
      setProfessionals(professionalsData);
      setPendingAppointments(pendingData);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await confirmAppointmentWithNotifications(id);
      toast.success('Cita confirmada. Se enviaron notificaciones al cliente.');
      // Reload pending
      if (firestoreUser?.company_id) {
        const pending = await getPendingAppointments(firestoreUser.company_id);
        setPendingAppointments(pending);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta cita? Se enviará una notificación al cliente.')) return;
    
    try {
      await cancelAppointmentWithNotifications(id);
      toast.success('Cita cancelada. Se enviaron notificaciones al cliente.');
      // Reload pending
      if (firestoreUser?.company_id) {
        const pending = await getPendingAppointments(firestoreUser.company_id);
        setPendingAppointments(pending);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter((a) => isSameDay(a.appointment_date, date));
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDay(selectedDate);

    if (dayAppointments.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay citas para este día</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {dayAppointments.map((appointment) => {
          const service = services.find((s) => s.id === appointment.service_id);
          const professional = professionals.find((p) => p.id === appointment.professional_id);
          
          return (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              serviceName={service?.name}
              professionalName={professional?.name}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              showActions={true}
            />
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div key={day.toISOString()} className={`border-2 rounded-lg p-3 ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {format(day, 'EEE d', { locale: es })}
              </h3>
              {dayAppointments.length === 0 ? (
                <p className="text-xs text-gray-500">Sin citas</p>
              ) : (
                <div className="space-y-2">
                  {dayAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="text-xs bg-white border border-gray-200 rounded p-2 cursor-pointer hover:shadow"
                      onClick={() => setSelectedDate(day)}
                    >
                      <p className="font-medium text-gray-900">{appt.start_time}</p>
                      <p className="text-gray-600 truncate">{appt.client_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
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
              <h1 className="text-3xl font-bold text-gray-900">Horarios y Citas</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/appointments/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              + Nueva cita
            </button>
          </div>

          {/* Pending Badge */}
          {pendingAppointments.length > 0 && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowPending(!showPending)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-100 border-2 border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                <span className="text-yellow-900 font-semibold">
                  ⚠️ {pendingAppointments.length} citas pendientes de confirmar
                </span>
                <span className="text-yellow-700">{showPending ? '▲' : '▼'}</span>
              </button>
            </div>
          )}

          {/* Pending Panel */}
          {showPending && pendingAppointments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white shadow rounded-lg p-6 mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Citas pendientes</h2>
              <PendingList
                appointments={pendingAppointments}
                services={services}
                professionals={professionals}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
              />
            </motion.div>
          )}

          {/* Filters & Controls */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Date Navigation */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date(selectedDate.getTime() - (viewMode === 'day' ? 86400000 : 604800000)))}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  ←
                </button>
                <span className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                  {viewMode === 'day'
                    ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
                    : `Semana del ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'd MMM', { locale: es })}`}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date(selectedDate.getTime() + (viewMode === 'day' ? 86400000 : 604800000)))}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date())}
                  className="px-3 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-sm font-medium"
                >
                  Hoy
                </button>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('day')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    viewMode === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Día
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    viewMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Semana
                </button>
              </div>

              {/* Professional Filter */}
              <div>
                <label htmlFor="professional_filter" className="sr-only">
                  Filtrar por profesional
                </label>
                <select
                  id="professional_filter"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedProfessional}
                  onChange={(e) => setSelectedProfessional(e.target.value)}
                >
                  <option value="all">Todos los profesionales</option>
                  {professionals.map((pro) => (
                    <option key={pro.id} value={pro.id}>
                      {pro.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          <div className="bg-white shadow rounded-lg p-6">
            {viewMode === 'day' ? renderDayView() : renderWeekView()}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
