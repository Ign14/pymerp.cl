/**
 * Language Context - Wrapper sobre react-i18next
 * 
 * Proporciona un contexto simplificado para i18n
 * Mantiene compatibilidad con el código existente mientras usa react-i18next
 */

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage, changeLanguage, type SupportedLanguage } from '../config/i18n';

interface LanguageContextType {
  locale: SupportedLanguage;
  language: SupportedLanguage; // Alias para compatibilidad
  toggleLocale: () => Promise<void>;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { t } = useTranslation();
  const currentLang = getCurrentLanguage();

  const toggleLocale = async () => {
    const newLang: SupportedLanguage = currentLang === 'es' ? 'en' : 'es';
    await changeLanguage(newLang);
  };

  const contextValue: LanguageContextType = useMemo(() => ({
    locale: currentLang,
    language: currentLang, // Alias
    toggleLocale,
    setLanguage: changeLanguage,
    t,
  }), [currentLang, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
