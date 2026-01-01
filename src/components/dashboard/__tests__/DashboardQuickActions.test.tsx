import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardQuickActions from '../DashboardQuickActions';
import * as useAnalyticsHook from '../../../hooks/useAnalytics';

// Mock hooks
vi.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: vi.fn(),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    firestoreUser: { uid: 'owner', company_id: 'company-1' },
  }),
}));

vi.mock('../../../services/firestore', () => ({
  getCompany: vi.fn().mockResolvedValue({ business_type: 'SERVICES' }),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: vi.fn() },
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'quickActions.title': 'Quick Actions',
        'quickActions.manualBooking.title': 'Manual Booking',
        'quickActions.manualBooking.description': 'Create an appointment',
        'quickActions.manualBooking.button': 'New Appointment',
        'quickActions.manualBooking.ariaLabel': 'Create manual appointment',
        'quickActions.reviewSchedule.title': 'Review Schedule',
        'quickActions.reviewSchedule.description': 'View all appointments',
        'quickActions.reviewSchedule.button': 'View Schedule',
        'quickActions.reviewSchedule.ariaLabel': 'Open schedule view',
        'quickActions.manageNotifications.title': 'Notifications',
        'quickActions.manageNotifications.description': 'Configure alerts',
        'quickActions.manageNotifications.button': 'Settings',
        'quickActions.manageNotifications.ariaLabel': 'Open notification settings',
        'quickActions.createProfessional.title': 'Professionals',
        'quickActions.createProfessional.description': 'Create or assign professionals',
        'quickActions.createProfessional.button': 'New professional',
        'quickActions.createProfessional.ariaLabel': 'Create professional',
      };
      return translations[key] || key;
    },
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('DashboardQuickActions', () => {
  const mockTrackClick = vi.fn(() => vi.fn());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAnalyticsHook.useAnalytics).mockReturnValue({
      trackClick: mockTrackClick,
      trackEvent: vi.fn(),
      trackPageView: vi.fn(),
      trackTiming: vi.fn(),
      trackException: vi.fn(),
    } as any);
  });

  it('renders all quick action cards', async () => {
    render(
      <BrowserRouter>
        <DashboardQuickActions />
      </BrowserRouter>
    );

    expect(await screen.findByText('Quick Actions')).toBeInTheDocument();
    expect(await screen.findByText('Manual Booking')).toBeInTheDocument();
    expect(await screen.findByText('Review Schedule')).toBeInTheDocument();
    expect(await screen.findByText('Notifications')).toBeInTheDocument();
    expect(await screen.findByText('Professionals')).toBeInTheDocument();
  });

  it('renders action descriptions', async () => {
    render(
      <BrowserRouter>
        <DashboardQuickActions />
      </BrowserRouter>
    );

    expect(await screen.findByText('Create an appointment')).toBeInTheDocument();
    expect(await screen.findByText('View all appointments')).toBeInTheDocument();
    expect(await screen.findByText('Configure alerts')).toBeInTheDocument();
    expect(await screen.findByText('Create or assign professionals')).toBeInTheDocument();
  });

  it('navigates to /dashboard/appointments/new when manual booking is clicked', async () => {
    render(
      <BrowserRouter>
        <DashboardQuickActions />
      </BrowserRouter>
    );

    const button = await screen.findByRole('button', { name: /Create manual appointment/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/appointments/new');
  });

  it('tracks analytics event when manual booking is clicked', async () => {
    render(
      <BrowserRouter>
        <DashboardQuickActions />
      </BrowserRouter>
    );

    const button = await screen.findByRole('button', { name: /Create manual appointment/i });
    fireEvent.click(button);

    expect(mockTrackClick).toHaveBeenCalledWith('quick_action_manual_booking');
  });

  it('navigates to /dashboard/schedule when review schedule is clicked', async () => {
    render(
      <BrowserRouter>
        <DashboardQuickActions />
      </BrowserRouter>
    );

    const button = await screen.findByRole('button', { name: /Open schedule view/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/schedule');
  });

  it('tracks analytics event when review schedule is clicked', async () => {
    render(
      <BrowserRouter>
        <DashboardQuickActions />
      </BrowserRouter>
    );

    const button = await screen.findByRole('button', { name: /Open schedule view/i });
    fireEvent.click(button);

    expect(mockTrackClick).toHaveBeenCalledWith('quick_action_review_schedule');
  });

  it('navigates to /dashboard/settings/notifications when notifications is clicked', async () => {
    render(
      <BrowserRouter>
        <DashboardQuickActions />
      </BrowserRouter>
    );

    const button = await screen.findByRole('button', { name: /Open notification settings/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/settings/notifications');
  });

  it('tracks analytics event when notifications is clicked', async () => {
    render(
      <BrowserRouter>
        <DashboardQuickActions />
      </BrowserRouter>
    );

    const button = await screen.findByRole('button', { name: /Open notification settings/i });
    fireEvent.click(button);

    expect(mockTrackClick).toHaveBeenCalledWith('quick_action_notifications');
  });

  it('navigates to /dashboard/professionals/new when professional action is clicked', async () => {
    render(
      <BrowserRouter>
        <DashboardQuickActions />
      </BrowserRouter>
    );

    const button = await screen.findByRole('button', { name: /Create professional/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/professionals/new');
  });

  it('tracks analytics event when professional action is clicked', async () => {
    render(
      <BrowserRouter>
        <DashboardQuickActions />
      </BrowserRouter>
    );

    const button = await screen.findByRole('button', { name: /Create professional/i });
    fireEvent.click(button);

    expect(mockTrackClick).toHaveBeenCalledWith('quick_action_create_professional');
  });

  it('has proper accessibility structure', async () => {
    render(
      <BrowserRouter>
        <DashboardQuickActions />
      </BrowserRouter>
    );

    // Section has aria-labelledby
    const section = await screen.findByRole('region', { name: /Quick Actions/i });
    expect(section).toBeInTheDocument();

    // All buttons have aria-label
    const buttons = await screen.findAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label');
    });
  });
});
