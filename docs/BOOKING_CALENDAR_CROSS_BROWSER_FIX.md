# Fix: Calendario modal "Agendar servicio" (Barberías) — consistencia cross-browser

## Root cause (resumen)

1. **Header oscuro en Brave / Safari iOS / Chrome Android**: Las reglas de dark mode en `index.css` usaban `body[data-theme='dark'] .react-datepicker` (y header, días, etc.) **sin excluir la página pública**. El `ThemeContext` asigna `data-theme` desde `localStorage` o `prefers-color-scheme: dark`, así que en dispositivos con tema oscuro el body tenía `data-theme='dark'` y las reglas globales pintaban el calendario del modal público con el gradiente oscuro del dashboard.

2. **Escala / “se ve más grande” en móvil**: Faltaba control de `-webkit-text-size-adjust` en el modal y en el wrapper del calendario, y métricas explícitas (line-height, font-size, box-sizing) en celdas y header para evitar diferencias entre navegadores.

3. **Leyenda como “radios”**: La leyenda ya era divs/spans; se reforzaron `appearance: none` y estilos explícitos (font-size, line-height) para que se vea siempre como chips en todos los navegadores.

## Archivos modificados

| Archivo | Cambio |
|--------|--------|
| `src/index.css` | Todas las reglas dark del DatePicker/booking (`.react-datepicker*`, `.booking-day-*`, `.bg-white.border`) pasan a `body[data-theme='dark']:not(.public-page-mode)` para que **no** apliquen en páginas públicas (body con clase `public-page-mode`). |
| `src/styles/booking-datepicker.css` | • `-webkit-text-size-adjust: 100%` en `.booking-modal-container` y `.booking-datepicker`.<br>• Header: `background-color: #3b82f6` de fallback antes del gradiente.<br>• Días, mes actual y nombres de día: `font-family: inherit`, `line-height: 1.25`, `padding: 0`, `box-sizing: border-box`, `min-w: 0` donde aplica.<br>• Leyenda: `appearance: none` y tipografía fija para chips consistentes. |

## Cómo validar

1. **Desktop Chrome / Firefox (referencia)**  
   - Ir a una página pública de categoría Barberías (o agenda profesionales).  
   - Clic en "Agendar" en un servicio.  
   - Comprobar: header del calendario azul claro, leyenda como chips, tamaños normales.

2. **Brave (Windows)**  
   - Mismo flujo. Con tema oscuro del sistema o tema oscuro guardado en la app, el modal “Agendar servicio” debe seguir mostrando calendario en estilo claro (header azul, no oscuro).

3. **Chrome Android**  
   - Abrir la misma URL en modo dispositivo móvil o en un Android real.  
   - Abrir el modal de agendar y comprobar que el calendario y la leyenda se ven igual que en desktop (sin agrandarse ni cambiar a estilo oscuro).

4. **iOS Safari (o Playwright WebKit)**  
   - Navegar a la página pública, abrir el modal “Agendar servicio”.  
   - Comprobar que el texto no se auto-ajusta de forma rara y que el header es azul claro y la leyenda son chips.

5. **Dashboard (no regresiones)**  
   - En una ruta de dashboard que use el DatePicker (p. ej. citas / horarios), activar dark mode.  
   - El calendario del **dashboard** debe seguir viéndose en estilo oscuro; solo el calendario del **modal público** debe quedar siempre en estilo claro.

## Notas

- El CSS adicional está **scoped** a `.booking-datepicker` y `.booking-modal-container`; no afecta al resto del dashboard ni a otras categorías.
- PWA/Workbox: `cleanupOutdatedCaches` y builds con hash hacen que un nuevo deploy sirva CSS/JS nuevos; si un usuario sigue viendo estilos viejos, un refresh completo (o cerrar pestaña y volver) suele bastar.
- Accesibilidad: se mantienen `focus-visible` y navegación por teclado en el calendario; no se ha tocado la lógica de negocio del agendamiento.
