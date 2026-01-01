import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import DashboardOverview from '../DashboardOverview';
import { AuthContext } from '../../../contexts/AuthContext';

// Mock hooks and services
vi.mock('../../../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({ handleError: vi.fn() }),
}));

vi.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({ trackClick: vi.fn() }),
}));

vi.mock('../../../services/firestore', () => ({
  getCompany: vi.fn(() => Promise.resolve({
    id: 'test-company',
    name: 'Test Company',
    business_type: 'SERVICES',
    setup_completed: true,
    slug: 'test-company',
  })),
  getPublicPageEvents: vi.fn(() => Promise.resolve([])),
  getAppointmentRequests: vi.fn(() => Promise.resolve([])),
  getProductOrderRequests: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../components/LogoutCorner', () => ({
  default: () => <div>Logout Corner</div>,
}));

vi.mock('../../../components/dashboard/DashboardQuickActions', () => ({
  default: () => <div>Quick Actions</div>,
}));

describe('DashboardOverview - Smoke Test', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard without crashing', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <DashboardOverview />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Wait for async operations
    await screen.findByText('Dashboard', {}, { timeout: 3000 });
  });

  it('shows quick actions for services business', async () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <DashboardOverview />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await screen.findByText('Dashboard');
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });
});

