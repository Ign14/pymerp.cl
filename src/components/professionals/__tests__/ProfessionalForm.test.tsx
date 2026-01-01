import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import ProfessionalForm from '../ProfessionalForm';
import { useAuth } from '../../../contexts/AuthContext';
import { createProfessional } from '../../../services/professionals';
import toast from 'react-hot-toast';

// Mocks
vi.mock('../../../contexts/AuthContext');
vi.mock('../../../services/professionals');
vi.mock('react-hot-toast');
vi.mock('../../../hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleAsyncError: vi.fn((fn) => fn()),
  }),
}));
vi.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: vi.fn(),
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

describe('ProfessionalForm', () => {
  const mockUser = {
    uid: 'test-uid',
    company_id: 'company-1',
    role: 'ENTREPRENEUR',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      firestoreUser: mockUser,
    });
    (createProfessional as any).mockResolvedValue({ id: 'pro-1' });
  });

  it('renderiza el formulario correctamente', () => {
    render(
      <BrowserRouter>
        <ProfessionalForm />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/especialidades/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear profesional/i })).toBeInTheDocument();
  });

  it('valida campos requeridos', async () => {
    render(
      <BrowserRouter>
        <ProfessionalForm />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /crear profesional/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/nombre es obligatorio/i)).toBeInTheDocument();
    });

    expect(createProfessional).not.toHaveBeenCalled();
  });

  it('valida formato de email', async () => {
    render(
      <BrowserRouter>
        <ProfessionalForm />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    
    fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /crear profesional/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  it('valida formato de teléfono', async () => {
    render(
      <BrowserRouter>
        <ProfessionalForm />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const phoneInput = screen.getByLabelText(/teléfono/i);
    
    fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
    fireEvent.change(phoneInput, { target: { value: 'abc123' } });

    const submitButton = screen.getByRole('button', { name: /crear profesional/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/formato de teléfono inválido/i)).toBeInTheDocument();
    });
  });

  it('crea un profesional exitosamente con todos los campos', async () => {
    const onSuccess = vi.fn();
    render(
      <BrowserRouter>
        <ProfessionalForm onSuccess={onSuccess} />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/email/i);
    const phoneInput = screen.getByLabelText(/teléfono/i);
    const specialtiesInput = screen.getByLabelText(/especialidades/i);

    fireEvent.change(nameInput, { target: { value: 'Dr. Juan Pérez' } });
    fireEvent.change(emailInput, { target: { value: 'juan@ejemplo.cl' } });
    fireEvent.change(phoneInput, { target: { value: '+56912345678' } });
    fireEvent.change(specialtiesInput, { target: { value: 'Corte, Peinado, Manicure' } });

    const submitButton = screen.getByRole('button', { name: /crear profesional/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createProfessional).toHaveBeenCalledWith({
        companyId: 'company-1',
        name: 'Dr. Juan Pérez',
        email: 'juan@ejemplo.cl',
        phone: '+56912345678',
        specialties: ['Corte', 'Peinado', 'Manicure'],
      });
      expect(toast.success).toHaveBeenCalledWith('Profesional creado exitosamente');
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('crea un profesional solo con nombre (campos opcionales vacíos)', async () => {
    const onSuccess = vi.fn();
    render(
      <BrowserRouter>
        <ProfessionalForm onSuccess={onSuccess} />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText(/nombre completo/i);
    fireEvent.change(nameInput, { target: { value: 'María González' } });

    const submitButton = screen.getByRole('button', { name: /crear profesional/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createProfessional).toHaveBeenCalledWith({
        companyId: 'company-1',
        name: 'María González',
        email: undefined,
        phone: undefined,
        specialties: undefined,
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('maneja error de límite de profesionales', async () => {
    const error = { code: 'PRO_LIMIT_REACHED' };
    (createProfessional as any).mockRejectedValue(error);

    render(
      <BrowserRouter>
        <ProfessionalForm />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText(/nombre completo/i);
    fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });

    const submitButton = screen.getByRole('button', { name: /crear profesional/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('límite de profesionales'),
        { duration: 5000 }
      );
    });
  });

  it('limpia errores al editar campos', async () => {
    render(
      <BrowserRouter>
        <ProfessionalForm />
      </BrowserRouter>
    );

    // Trigger validation errors
    const submitButton = screen.getByRole('button', { name: /crear profesional/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/nombre es obligatorio/i)).toBeInTheDocument();
    });

    // Start typing
    const nameInput = screen.getByLabelText(/nombre completo/i);
    fireEvent.change(nameInput, { target: { value: 'J' } });

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/nombre es obligatorio/i)).not.toBeInTheDocument();
    });
  });

  it('llama a onCancel cuando se presiona cancelar', () => {
    const onCancel = vi.fn();
    render(
      <BrowserRouter>
        <ProfessionalForm onCancel={onCancel} />
      </BrowserRouter>
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('deshabilita el botón durante el envío', async () => {
    (createProfessional as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <BrowserRouter>
        <ProfessionalForm />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText(/nombre completo/i);
    fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });

    const submitButton = screen.getByRole('button', { name: /crear profesional/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
