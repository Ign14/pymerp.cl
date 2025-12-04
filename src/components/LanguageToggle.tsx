/**
 * LanguageToggle - Componente simple para cambiar idioma
 * 
 * Wrapper sobre LanguageSelector para mantener compatibilidad
 * con el código existente
 */

import LanguageSelector from './LanguageSelector';

export default function LanguageToggle() {
  return <LanguageSelector variant="button" />;
}
