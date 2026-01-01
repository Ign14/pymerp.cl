import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import NewAppointment from '../NewAppointment';
import { AuthContext } from '../../../../contexts/AuthContext';

// Mock services
vi.mock('../../../../services/firestore', () => ({
  getServices: vi.fn(() => Promise.resolve([
    { id: '1', name: 'Service 1', estimated_duration_minutes: 30 },
  ])),
}));

vi.mock('../../../../services/appointments', () => ({
  getProfessionals: vi.fn(() => Promise.resolve([
    { id: '1', name: 'Professional 1', status: 'ACTIVE' },
  ])),
  createManualAppointment: vi.fn(),
  isTimeSlotAvailable: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../../../../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({ handleError: vi.fn() }),
}));

vi.mock('../../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({ trackClick: vi.fn() }),
}));

describe('NewAppointment - Smoke Test', () => {
  const mockUser = {
    id: 'test-user',
    email: 'test@example.com',
    company_id: 'test-company',
    role: 'ENTREPRENEUR',
    status: 'ACTIVE',
    created_at: new Date(),
  };

  const mockAuthValue = {
    firestoreUser: mockUser,
    authUser: null,
    loading: false,
    updateFirestoreUser: vi.fn(),
  };

  it('renders new appointment form without crashing', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <NewAppointment />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Wait for form to load
    await screen.findByText('Nueva cita manual', {}, { timeout: 3000 });
  });

  it('shows form fields', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <NewAppointment />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await screen.findByText('Nueva cita manual');
    
    expect(screen.getByText('Información del cliente')).toBeInTheDocument();
    expect(screen.getByText('Detalles de la cita')).toBeInTheDocument();
  });
});

