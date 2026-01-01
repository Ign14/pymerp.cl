import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { axe } from 'jest-axe';
import { vi } from 'vitest';
import { LandingPage } from '../LandingPage';

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

beforeAll(() => {
  // Framer Motion viewport features rely on IntersectionObserver
  // jsdom doesn't provide it by default, so we polyfill with a no-op version.
  (globalThis as any).IntersectionObserver = (globalThis as any).IntersectionObserver || MockIntersectionObserver;
});

const renderLanding = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </HelmetProvider>
  );

describe('LandingPage marketing surface', () => {
  it('renders key marketing headings and CTAs', () => {
    renderLanding();

    expect(
      screen.getByRole('heading', {
        name: /transforma tu negocio a digital/i,
        level: 1,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /solicitar acceso/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver precios/i })).toBeInTheDocument();
  });

  it('exposes accessible mobile nav toggle state', async () => {
    renderLanding();
    const user = userEvent.setup();

    const toggle = screen.getByRole('button', { name: /menú de navegación/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('has no obvious accessibility violations', async () => {
    const { container } = renderLanding();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
