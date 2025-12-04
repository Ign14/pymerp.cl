import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import RequestAccess from '../pages/RequestAccess';

const renderWithProviders = (ui: ReactElement, initialEntries = ['/']) => {
  return render(
    <HelmetProvider>
      <LanguageProvider>
        <ThemeProvider>
          <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
        </ThemeProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
};

import { describe, test, expect } from 'vitest';

describe('Accesibilidad', () => {
  test('Landing page no presenta violaciones de accesibilidad', async () => {
    const { container } = renderWithProviders(<Landing />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Login page no presenta violaciones de accesibilidad', async () => {
    const { container } = renderWithProviders(<Login />, ['/login']);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('Request Access page no presenta violaciones de accesibilidad', async () => {
    const { container } = renderWithProviders(<RequestAccess />, ['/request-access']);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

export {};
