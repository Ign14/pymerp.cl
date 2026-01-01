import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import SchedulePage from '../SchedulePage';
import appI18n from '../../../config/i18n';
import { AuthContext } from '../../../contexts/AuthContext';
import { AppointmentStatus } from '../../../types';
import * as appointmentsService from '../../../services/appointments';
import * as professionalsService from '../../../services/professionals';

vi.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({ trackEvent: vi.fn() }),
}));

vi.mock('../../../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn(),
    handleAsyncError: async <T,>(fn: () => Promise<T>) => fn(),
  }),
}));

vi.mock('../../../services/appointments', async () => {
  const actual = await vi.importActual<typeof appointmentsService>('../../../services/appointments');
  return {
    ...actual,
    listenAppointmentsByRange: vi.fn(),
    updateAppointment: vi.fn(),
  };
});

vi.mock('../../../services/professionals', async () => {
  const actual = await vi.importActual<typeof professionalsService>('../../../services/professionals');
  return {
    ...actual,
    listenProfessionals: vi.fn(),
  };
});

const mockUser = {
  id: 'user-1',
  email: 'user@test.com',
  company_id: 'company-123',
  role: 'ENTREPRENEUR',
  status: 'ACTIVE',
  created_at: new Date(),
};

const mockProfessionals = [
  {
    id: 'pro-1',
    company_id: 'company-123',
    name: 'Dra. Ruiz',
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const mockAppointments = [
  {
    id: 'apt-1',
    company_id: 'company-123',
    service_id: 'srv-1',
    professional_id: 'pro-1',
    client_name: 'Cliente Test',
    client_phone: '+56912345678',
    appointment_date: new Date(),
    start_time: '10:00',
    end_time: '11:00',
    status: AppointmentStatus.CONFIRMED,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

const mockUnsubscribe = vi.fn();

const renderWithProviders = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider
        value={{ firebaseUser: null, firestoreUser: mockUser as any, loading: false }}
      >
        <SchedulePage />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

const mockMatchMedia = (options: { mobile?: boolean; desktop?: boolean }) => {
  window.matchMedia = (query: string) => {
    const isMobileQuery = query.includes('max-width: 767px');
    const isDesktopQuery = query.includes('min-width: 1024px');
    const matches = isMobileQuery ? !!options.mobile : isDesktopQuery ? !!options.desktop : false;
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  };
};

describe('SchedulePage', () => {
  beforeAll(() => {
    appI18n.addResourceBundle(
      'es',
      'schedule',
      {
        title: 'Agenda',
        subtitle: 'Revisa y gestiona la agenda de tu equipo en tiempo real',
        toolbar: {
          date: 'Fecha',
          professional: 'Profesional',
          allProfessionals: 'Todos',
          mode: 'Modo',
          list: 'Lista',
          grid: 'Grilla',
          viewInGrid: 'Ver en grilla',
        },
        labels: { hours: 'Horas', unavailable: 'No disponible {{range}}' },
        empty: { title: 'No hay citas', description: '', cta: 'Agenda manual' },
        details: {
          client: 'Cliente',
          service: 'Servicio',
          date: 'Fecha',
          professional: 'Profesional',
          phone: 'Teléfono',
          email: 'Email',
          status: 'Estado',
          changeStatus: 'Cambiar estado',
          cancel: 'Cancelar cita',
          viewRecord: 'Ver ficha',
          whatsapp: 'WhatsApp',
          timeRange: 'Horario',
        },
      },
      true,
      true
    );
    appI18n.addResourceBundle(
      'es',
      'appointments',
      {
        status: {
          requested: 'Solicitada',
          confirmed: 'Confirmada',
          cancelled: 'Cancelada',
          completed: 'Completada',
          noShow: 'No asistió',
        },
      },
      true,
      true
    );
    appI18n.changeLanguage('es');
  });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(professionalsService.listenProfessionals).mockImplementation((_companyId, callback) => {
      callback(mockProfessionals as any);
      return mockUnsubscribe;
    });

    vi.mocked(appointmentsService.listenAppointmentsByRange).mockImplementation(
      (_companyId, _start, _end, callback) => {
        callback(mockAppointments as any);
        return mockUnsubscribe;
      }
    );
  });

  it('renders schedule page without crashing', async () => {
    mockMatchMedia({ desktop: true });
    renderWithProviders();

    expect(
      await screen.findByRole('heading', { name: /Agenda|Schedule/i })
    ).toBeInTheDocument();
  });

  it('shows professional selector and opens bottom sheet on mobile', async () => {
    mockMatchMedia({ mobile: true });
    renderWithProviders();

    expect(await screen.findByLabelText(/Profesional|Professional/i)).toBeInTheDocument();

    const apptButton = await screen.findByText('Cliente Test');
    await userEvent.click(apptButton);

    expect(await screen.findByText(/Cambiar estado|Change status/i)).toBeInTheDocument();
  });

  it('renders grid and opens modal on desktop', async () => {
    mockMatchMedia({ desktop: true });
    renderWithProviders();

    const professionalLabels = await screen.findAllByText('Dra. Ruiz');
    expect(professionalLabels.length).toBeGreaterThan(0);

    const apptButton = await screen.findByText('Cliente Test');
    await userEvent.click(apptButton);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });
});
