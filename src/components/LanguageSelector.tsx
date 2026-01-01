/**
 * Language Selector Component
 * 
 * Permite cambiar entre idiomas soportados con:
 * - Banderas de países
 * - Dropdown elegante
 * - Persistencia automática en localStorage
 * - Animaciones suaves
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguage, type SupportedLanguage } from '../config/i18n';

interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  flag: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
];

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'dropdown';
}

export default function LanguageSelector({ 
  className = '', 
  showLabel = false,
  variant = 'dropdown'
}: LanguageSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [useBadgeIcon, setUseBadgeIcon] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentLang = getCurrentLanguage();
  const currentLanguage = LANGUAGES.find(lang => lang.code === currentLang) || LANGUAGES[0];

  // Windows suele mostrar banderas emoji en blanco y negro; usa badges en ese caso.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUseBadgeIcon(window.navigator.userAgent.toLowerCase().includes('windows'));
    }
  }, []);

  const renderIcon = (language: LanguageOption) => {
    if (!useBadgeIcon) {
      return (
        <span className="text-lg" role="img" aria-label={language.name}>
          {language.flag}
        </span>
      );
    }
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold uppercase text-white shadow-sm"
      >
        {language.code}
      </span>
    );
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = async (langCode: SupportedLanguage) => {
    try {
      await changeLanguage(langCode);
      setIsOpen(false);
      
      // Pequeño delay para mostrar el cambio visualmente
      setTimeout(() => {
        // Forzar re-render si es necesario
        window.dispatchEvent(new Event('languageChanged'));
      }, 100);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Variant: Simple button toggle (solo 2 idiomas)
  if (variant === 'button') {
    const otherLang = LANGUAGES.find(lang => lang.code !== currentLang) || LANGUAGES[1];
    
    return (
      <button
        onClick={() => handleLanguageChange(otherLang.code)}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${className}`}
        title={t('language.toggle')}
        aria-label={t('language.toggle')}
      >
        {renderIcon(currentLanguage)}
        {showLabel && (
          <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        )}
      </button>
    );
  }

  // Variant: Dropdown (soporta múltiples idiomas)
  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={t('language.toggle')}
      >
        {renderIcon(currentLanguage)}
        {showLabel && (
          <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in slide-in-from-top-2 duration-200"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {LANGUAGES.map((language) => {
              const isActive = language.code === currentLang;
              
              return (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={`
                    w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                  role="menuitem"
                  disabled={isActive}
                >
                  <span className="text-lg" role="img" aria-label={language.name}>
                    {language.flag}
                  </span>
                  <div className="flex flex-col">
                    <span>{language.nativeName}</span>
                    {language.nativeName !== language.name && (
                      <span className="text-xs text-gray-500">{language.name}</span>
                    )}
                  </div>
                  {isActive && (
                    <svg
                      className="ml-auto w-4 h-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Export para uso directo en otros componentes
export { LANGUAGES, type LanguageOption };
