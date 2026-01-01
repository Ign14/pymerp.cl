import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { listenProfessionals } from '../../../services/professionals';
import { deleteProfessional } from '../../../services/appointments';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import type { Professional } from '../../../types';
import LoadingSpinner from '../../../components/animations/LoadingSpinner';
import { UserPlus, Mail, Phone, ArrowLeft, Edit, Trash2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import ProfessionalAvailabilityModal from '../../../components/professionals/ProfessionalAvailabilityModal';

export default function ProfessionalsListPage() {
  const { firestoreUser } = useAuth();
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessionalForSchedule, setSelectedProfessionalForSchedule] = useState<Professional | null>(null);

  useEffect(() => {
    if (!firestoreUser?.company_id) return;

    const unsubscribe = listenProfessionals(
      firestoreUser.company_id,
      (data) => {
        setProfessionals(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestoreUser]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteProfessional(id);
      toast.success('Profesional eliminado');
    } catch (error) {
      handleError(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profesionales</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona tu equipo de profesionales
              </p>
            </div>
          </div>
          
          <Link
            to="/dashboard/professionals/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Profesional
          </Link>
        </div>

        {professionals.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-orange-100 rounded-full">
                <UserPlus className="w-12 h-12 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay profesionales registrados
                </h3>
                <p className="text-gray-600 mb-4">
                  Crea tu primer profesional para comenzar a asignar servicios
                </p>
                <Link
                  to="/dashboard/professionals/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Crear Profesional
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map((professional) => (
              <div
                key={professional.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {professional.name}
                    </h3>
                    {professional.specialties && professional.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {professional.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      professional.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {professional.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {professional.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a
                        href={`mailto:${professional.email}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {professional.email}
                      </a>
                    </div>
                  )}
                  {professional.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a
                        href={`tel:${professional.phone}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {professional.phone}
                      </a>
                    </div>
                  )}
                </div>

                {!professional.email && !professional.phone && (
                  <p className="text-sm text-gray-400 italic mt-2">
                    Sin información de contacto
                  </p>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProfessionalForSchedule(professional)}
                      className="w-full px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Seleccionar horarios disponibles
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/professionals/edit/${professional.id}`)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(professional.id, professional.name)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Creado: {professional.created_at.toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability Modal */}
      {selectedProfessionalForSchedule && (
        <ProfessionalAvailabilityModal
          professional={selectedProfessionalForSchedule}
          isOpen={!!selectedProfessionalForSchedule}
          onClose={() => setSelectedProfessionalForSchedule(null)}
        />
      )}
    </div>
  );
}
