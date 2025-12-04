import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider, useLanguage } from '../LanguageContext';
import { changeLanguage } from '../../config/i18n';

function LanguageConsumer() {
  const { locale, toggleLocale, t } = useLanguage();

  return (
    <div>
      <p data-testid="locale">{locale}</p>
      <p data-testid="translation">{t('loginTitle')}</p>
      <button type="button" onClick={toggleLocale}>
        Toggle locale
      </button>
    </div>
  );
}

import { describe, test, beforeEach, expect } from 'vitest';

describe('LanguageContext', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.lang = '';
    document.body.lang = '';
    await changeLanguage('es');
  });

  test('usa español por defecto', () => {
    render(
      <LanguageProvider>
        <LanguageConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('locale').textContent).toBe('es');
    expect(screen.getByTestId('translation').textContent).toBe('Iniciar sesión');
  });

  test('cambia a inglés y persiste en localStorage', async () => {
    render(
      <LanguageProvider>
        <LanguageConsumer />
      </LanguageProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /toggle locale/i }));

    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('translation').textContent).toBe('Sign in');
    expect(localStorage.getItem('i18nextLng')).toBe('en');
    await waitFor(() => expect(document.documentElement.lang).toBe('en'));
  });

  test('recupera el locale guardado al iniciar', async () => {
    await changeLanguage('en');

    render(
      <LanguageProvider>
        <LanguageConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(screen.getByTestId('translation').textContent).toBe('Sign in');
    await waitFor(() => expect(document.documentElement.lang).toBe('en'));
  });
});

export {};
