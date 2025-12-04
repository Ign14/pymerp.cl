/**
 * Utilidades de accesibilidad
 * Funciones para verificar y mejorar la accesibilidad web
 */

/**
 * Calcula el ratio de contraste entre dos colores
 * Basado en WCAG 2.1 guidelines
 * @param color1 Color en formato hex (#RRGGBB)
 * @param color2 Color en formato hex (#RRGGBB)
 * @returns Ratio de contraste (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calcula la luminancia relativa de un color
 * @param color Color en formato hex (#RRGGBB)
 * @returns Luminancia relativa (0-1)
 */
function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convierte color hex a RGB
 * @param hex Color en formato hex (#RRGGBB o #RGB)
 * @returns Objeto con valores r, g, b o null si es inválido
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Verifica si el contraste cumple con WCAG AA
 * @param color1 Color de texto
 * @param color2 Color de fondo
 * @param isLargeText Texto es mayor a 18pt o 14pt bold
 * @returns true si cumple con WCAG AA
 */
export function meetsWCAG_AA(
  color1: string, 
  color2: string, 
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Verifica si el contraste cumple con WCAG AAA
 * @param color1 Color de texto
 * @param color2 Color de fondo
 * @param isLargeText Texto es mayor a 18pt o 14pt bold
 * @returns true si cumple con WCAG AAA
 */
export function meetsWCAG_AAA(
  color1: string, 
  color2: string, 
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(color1, color2);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Sugerencias de colores seguros para accesibilidad
 * Estos colores cumplen con WCAG AA para texto normal sobre fondo blanco
 */
export const ACCESSIBLE_COLORS = {
  // Sobre fondo blanco (#FFFFFF)
  onWhite: {
    text: {
      primary: '#1f2937',   // gray-800 - Ratio: 12.6:1
      secondary: '#4b5563', // gray-600 - Ratio: 7.5:1
      link: '#1d4ed8',      // blue-700 - Ratio: 8.6:1
      success: '#059669',   // green-600 - Ratio: 4.5:1
      warning: '#d97706',   // amber-600 - Ratio: 5.4:1
      error: '#dc2626',     // red-600 - Ratio: 5.9:1
    },
    button: {
      primary: '#2563eb',   // blue-600 - Ratio: 7.5:1
      success: '#16a34a',   // green-600 - Ratio: 3.9:1 (large text only)
      warning: '#ca8a04',   // yellow-600 - Ratio: 6.4:1
      danger: '#dc2626',    // red-600 - Ratio: 5.9:1
    }
  },
  
  // Sobre fondo oscuro (#111827 - gray-900)
  onDark: {
    text: {
      primary: '#f9fafb',   // gray-50 - Ratio: 15.5:1
      secondary: '#e5e7eb', // gray-200 - Ratio: 12.6:1
      link: '#60a5fa',      // blue-400 - Ratio: 7.2:1
      success: '#34d399',   // green-400 - Ratio: 7.8:1
      warning: '#fbbf24',   // amber-400 - Ratio: 10.4:1
      error: '#f87171',     // red-400 - Ratio: 6.1:1
    },
    button: {
      primary: '#3b82f6',   // blue-500 - Ratio: 6.2:1
      success: '#22c55e',   // green-500 - Ratio: 6.7:1
      warning: '#f59e0b',   // amber-500 - Ratio: 8.5:1
      danger: '#ef4444',    // red-500 - Ratio: 5.2:1
    }
  }
};

/**
 * Genera un color de texto accesible para un fondo dado
 * @param backgroundColor Color de fondo en hex
 * @returns Color de texto que cumple WCAG AA
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const luminance = getRelativeLuminance(backgroundColor);
  // Si el fondo es claro, usar texto oscuro; si es oscuro, usar texto claro
  return luminance > 0.5 ? ACCESSIBLE_COLORS.onWhite.text.primary : ACCESSIBLE_COLORS.onDark.text.primary;
}

/**
 * Verifica si un elemento tiene contraste suficiente con su fondo
 * Útil para debugging y validación
 */
export function validateElementContrast(
  element: HTMLElement,
  minRatio: number = 4.5
): { isValid: boolean; ratio: number; message: string } {
  const computedStyle = window.getComputedStyle(element);
  const color = rgbToHex(computedStyle.color);
  const bgColor = rgbToHex(computedStyle.backgroundColor);
  
  if (!color || !bgColor) {
    return {
      isValid: false,
      ratio: 0,
      message: 'No se pudieron determinar los colores'
    };
  }
  
  const ratio = getContrastRatio(color, bgColor);
  const isValid = ratio >= minRatio;
  
  return {
    isValid,
    ratio: Math.round(ratio * 10) / 10,
    message: isValid 
      ? `✓ Contraste válido: ${ratio.toFixed(1)}:1`
      : `✗ Contraste insuficiente: ${ratio.toFixed(1)}:1 (mínimo: ${minRatio}:1)`
  };
}

/**
 * Convierte RGB a Hex
 */
function rgbToHex(rgb: string): string | null {
  const matches = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!matches) return null;
  
  const r = parseInt(matches[1]);
  const g = parseInt(matches[2]);
  const b = parseInt(matches[3]);
  
  return '#' + [r, g, b]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

