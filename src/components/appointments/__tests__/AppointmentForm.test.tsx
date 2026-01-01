import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppointmentForm from '../AppointmentForm';
import { axe, toHaveNoViolations } from 'jest-axe';
import * as professionalsService from '../../../services/professionals';
import * as appointmentsService from '../../../services/appointments';
import * as firestoreService from '../../../services/firestore';

expect.extend(toHaveNoViolations);

// Mock services
vi.mock('../../../services/professionals', () => ({
  listProfessionals: vi.fn(),
}));

vi.mock('../../../services/appointments', () => ({
  createManualAppointment: vi.fn(),
}));

vi.mock('../../../services/firestore', () => ({
  getServices: vi.fn(),
}));

// Mock hooks
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    firestoreUser: {
      id: 'user-123',
      company_id: 'company-456',
      email: 'test@test.com',
    },
  }),
}));

vi.mock('../../../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleAsyncError: vi.fn((fn) => fn()),
  }),
}));

vi.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: vi.fn(),
    trackNamedEvent: vi.fn(),
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'form.title': 'New Appointment',
        'form.labels.client': 'Client',
        'form.labels.clientName': 'Client Name',
        'form.labels.clientPhone': 'Phone',
        'form.labels.clientEmail': 'Email (optional)',
        'form.labels.service': 'Service',
        'form.labels.professional': 'Professional',
        'form.labels.date': 'Date',
        'form.labels.startTime': 'Start Time',
        'form.labels.endTime': 'End Time',
        'form.labels.notes': 'Notes (optional)',
        'form.validation.clientNameMinLength': 'Client name must be at least 3 characters',
        'form.validation.clientEmailInvalid': 'Invalid email format',
        'form.validation.notesMaxLength': 'Notes must be shorter',
        'form.placeholders.clientName': 'John Doe',
        'form.placeholders.clientPhone': '+1234567890',
        'form.placeholders.selectService': 'Select service',
        'form.placeholders.selectProfessional': 'Select professional',
        'form.validation.clientNameRequired': 'Client name is required',
        'form.validation.clientPhoneRequired': 'Phone number is required',
        'form.validation.clientPhoneInvalid': 'Invalid phone format',
        'form.validation.serviceRequired': 'Please select a service',
        'form.validation.professionalRequired': 'Please select a professional',
        'form.validation.dateRequired': 'Date is required',
        'form.validation.startTimeRequired': 'Start time is required',
        'form.validation.endTimeRequired': 'End time is required',
        'form.validation.invalidTimeRange': 'End time must be after start time',
        'form.buttons.submit': 'Create Appointment',
        'form.buttons.cancel': 'Cancel',
        'messages.created': 'Appointment created successfully',
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AppointmentForm', () => {
  const mockProfessionals = [
    {
      id: 'pro-1',
      company_id: 'company-456',
      name: 'Dr. Smith',
      email: 'smith@test.com',
      status: 'ACTIVE',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];
  const mockServices = [
    { id: 'svc-1', name: 'Corte de pelo', company_id: 'company-456' } as any,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(professionalsService.listProfessionals).mockResolvedValue(mockProfessionals);
    vi.mocked(firestoreService.getServices).mockResolvedValue(mockServices);
  });

  const renderLoadedForm = async (props: any = {}) => {
    const utils = render(<AppointmentForm {...props} />);
    await waitFor(() => {
      expect(professionalsService.listProfessionals).toHaveBeenCalled();
      expect(firestoreService.getServices).toHaveBeenCalled();
    });
    return utils;
  };

  it('renders the form with all required fields', async () => {
    await renderLoadedForm();

    expect(await screen.findByText('New Appointment')).toBeInTheDocument();
    expect(await screen.findByLabelText(/Client Name/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Phone/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Email \(optional\)/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Service/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Professional/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Date/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/Start Time/i)).toBeInTheDocument();
    expect(await screen.findByLabelText(/End Time/i)).toBeInTheDocument();
  });

  it('loads professionals on mount', async () => {
    await renderLoadedForm();
    expect(professionalsService.listProfessionals).toHaveBeenCalledWith('company-456');
  });

  it('shows validation errors when submitting empty form', async () => {
    await renderLoadedForm();

    const submitButton = screen.getByRole('button', { name: /Create Appointment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Client name is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      expect(screen.getByText('Please select a service')).toBeInTheDocument();
      expect(screen.getByText('Please select a professional')).toBeInTheDocument();
      expect(screen.getByText('Date is required')).toBeInTheDocument();
      expect(screen.getByText('Start time is required')).toBeInTheDocument();
      expect(screen.getByText('End time is required')).toBeInTheDocument();
    });
  });

  it('validates phone format', async () => {
    await renderLoadedForm();

    const phoneInput = screen.getByLabelText(/Phone/i);
    fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });

    const submitButton = screen.getByRole('button', { name: /Create Appointment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid phone format')).toBeInTheDocument();
    });
  });

  it('validates email format when provided', async () => {
    await renderLoadedForm();

    fireEvent.change(screen.getByLabelText(/Client Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Email \(optional\)/i), {
      target: { value: 'bad-email' },
    });
    fireEvent.change(screen.getByLabelText(/Service/i), {
      target: { value: 'svc-1' },
    });
    fireEvent.change(screen.getByLabelText(/Professional/i), {
      target: { value: 'pro-1' },
    });
    fireEvent.change(screen.getByLabelText(/Date/i), {
      target: { value: '2025-12-25' },
    });
    fireEvent.change(screen.getByLabelText(/Start Time/i), {
      target: { value: '10:00' },
    });
    fireEvent.change(screen.getByLabelText(/End Time/i), {
      target: { value: '11:00' },
    });

    const submitButton = screen.getByRole('button', { name: /Create Appointment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('limits notes length', async () => {
    await renderLoadedForm();

    fireEvent.change(screen.getByLabelText(/Client Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Service/i), {
      target: { value: 'svc-1' },
    });
    fireEvent.change(screen.getByLabelText(/Professional/i), {
      target: { value: 'pro-1' },
    });
    fireEvent.change(screen.getByLabelText(/Date/i), {
      target: { value: '2025-12-25' },
    });
    fireEvent.change(screen.getByLabelText(/Start Time/i), {
      target: { value: '10:00' },
    });
    fireEvent.change(screen.getByLabelText(/End Time/i), {
      target: { value: '11:00' },
    });

    const notesInput = screen.getByLabelText(/Notes \(optional\)/i);
    fireEvent.change(notesInput, {
      target: { value: 'x'.repeat(605) },
    });

    const submitButton = screen.getByRole('button', { name: /Create Appointment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Notes must be shorter')).toBeInTheDocument();
    });
  });

  it('validates time range (end time must be after start time)', async () => {
    await renderLoadedForm();

    fireEvent.change(screen.getByLabelText(/Client Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Start Time/i), {
      target: { value: '14:00' },
    });
    fireEvent.change(screen.getByLabelText(/End Time/i), {
      target: { value: '13:00' },
    });

    const submitButton = screen.getByRole('button', { name: /Create Appointment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('End time must be after start time')).toBeInTheDocument();
    });
  });

  it('clears validation error when user starts typing', async () => {
    await renderLoadedForm();

    const submitButton = screen.getByRole('button', { name: /Create Appointment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Client name is required')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Client Name/i);
    fireEvent.change(nameInput, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.queryByText('Client name is required')).not.toBeInTheDocument();
    });
  });

  it('calls onSuccess callback after successful submission', async () => {
    const mockOnSuccess = vi.fn();
    vi.mocked(appointmentsService.createManualAppointment).mockResolvedValue('appt-123');

    await renderLoadedForm({ onSuccess: mockOnSuccess });

    fireEvent.change(await screen.findByLabelText(/Client Name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Date/i), {
      target: { value: '2025-12-25' },
    });
    fireEvent.change(screen.getByLabelText(/Start Time/i), {
      target: { value: '10:00' },
    });
    fireEvent.change(screen.getByLabelText(/End Time/i), {
      target: { value: '11:00' },
    });

    fireEvent.change(screen.getByLabelText(/Service/i), {
      target: { value: 'svc-1' },
    });

    fireEvent.change(screen.getByLabelText(/Professional/i), {
      target: { value: 'pro-1' },
    });

    const submitButton = screen.getByRole('button', { name: /Create Appointment/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(appointmentsService.createManualAppointment).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('calls onCancel callback when cancel button is clicked', async () => {
    const mockOnCancel = vi.fn();
    await renderLoadedForm({ onCancel: mockOnCancel });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  describe('Accessibility', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = await renderLoadedForm();
      await screen.findByText('New Appointment');
      const results = await axe(container);

      expect(results).toHaveNoViolations();
    });

    it('has proper ARIA attributes on inputs', async () => {
      await renderLoadedForm();

      const nameInput = screen.getByLabelText(/Client Name/i);
      expect(nameInput).toHaveAttribute('aria-invalid', 'false');

      // After validation error
      const submitButton = screen.getByRole('button', { name: /Create Appointment/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        expect(nameInput).toHaveAttribute('aria-describedby');
      });
    });

    it('associates error messages with inputs', async () => {
      await renderLoadedForm();

      const submitButton = screen.getByRole('button', { name: /Create Appointment/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Client name is required');
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('id', 'clientName-error');
      });
    });

    it('has required field indicators', async () => {
      await renderLoadedForm();

      const requiredFields = screen.getAllByText('*');
      // Should have asterisks for: clientName, clientPhone, service, professional, date, startTime, endTime
      expect(requiredFields.length).toBeGreaterThanOrEqual(7);
    });
  });
});
