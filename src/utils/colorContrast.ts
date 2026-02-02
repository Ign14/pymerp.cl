/**
 * Utilidad para garantizar contraste legible entre fondo y texto.
 * Evita combinaciones como texto blanco sobre fondo blanco.
 */

function parseRgb(color: string): { r: number; g: number; b: number } | null {
  if (!color || typeof color !== 'string') return null;
  const t = color.trim();
  const hex = t.match(/^#([0-9a-fA-F]{3,8})$/);
  if (hex) {
    let s = hex[1];
    if (s.length === 3) s = s.split('').map((c) => c + c).join('');
    if (s.length >= 6) {
      const r = parseInt(s.slice(0, 2), 16);
      const g = parseInt(s.slice(2, 4), 16);
      const b = parseInt(s.slice(4, 6), 16);
      return { r, g, b };
    }
  }
  const rgb = t.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) {
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
  }
  return null;
}

/**
 * Luminancia relativa (sRGB), 0 = negro, 1 = blanco.
 */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Retorna color de texto con buen contraste sobre el fondo dado.
 * - Fondo claro (luminancia > 0.5) → texto oscuro
 * - Fondo oscuro (luminancia <= 0.5) → texto claro
 */
export function getContrastingTextColor(bgColor: string): string {
  const rgb = parseRgb(bgColor);
  if (!rgb) return '#1e293b';
  const L = luminance(rgb.r, rgb.g, rgb.b);
  return L > 0.5 ? '#1e293b' : '#ffffff';
}

/**
 * Dado un color de botón (backgroundColor) y el color de texto deseado,
 * retorna un color de texto que garantice contraste legible.
 * Si el color deseado ya contrasta bien, se usa; si no, se ajusta.
 */
export function ensureButtonContrast(
  backgroundColor: string,
  desiredTextColor: string
): string {
  const rgb = parseRgb(backgroundColor);
  if (!rgb) return desiredTextColor || '#ffffff';
  const L = luminance(rgb.r, rgb.g, rgb.b);
  const desiredRgb = parseRgb(desiredTextColor);
  if (desiredRgb) {
    const desiredL = luminance(desiredRgb.r, desiredRgb.g, desiredRgb.b);
    // Si ambos son claros o ambos oscuros, hay mal contraste
    const bothLight = L > 0.5 && desiredL > 0.5;
    const bothDark = L <= 0.5 && desiredL <= 0.5;
    if (bothLight) return '#1e293b';
    if (bothDark) return '#ffffff';
  }
  return desiredTextColor || (L > 0.5 ? '#1e293b' : '#ffffff');
}
