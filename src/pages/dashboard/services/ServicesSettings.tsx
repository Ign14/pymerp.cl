import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getCompanyAppearance, setCompanyAppearance } from '../../../services/firestore';
import { uploadImage } from '../../../services/storage';
import { BusinessType } from '../../../types';
import toast from 'react-hot-toast';
import { useErrorHandler } from '../../../hooks/useErrorHandler';

const FONT_OPTIONS = [
  { label: 'Sans (Inter/Segoe)', value: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif' },
  { label: 'Serif (Georgia)', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Rounded (Nunito)', value: '"Nunito", "Segoe UI Rounded", system-ui, sans-serif' },
  { label: 'Century Gothic', value: '"Century Gothic", "Apple Gothic", sans-serif' },
  { label: 'Graffiti', value: '"Rock Salt", "Comic Sans MS", cursive' },
  { label: 'Code', value: '"Source Code Pro", "Fira Code", monospace' },
  { label: 'Display (Oswald)', value: '"Oswald", "Arial Narrow", sans-serif' },
  { label: 'Grotesk (Space Grotesk)', value: '"Space Grotesk", "Inter", system-ui, sans-serif' },
  { label: 'Humanist (Gill Sans)', value: '"Gill Sans", "Trebuchet MS", sans-serif' },
];

export default function ServicesSettings() {
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();
  const [appearance, setAppearance] = useState({
    logo_url: '',
    banner_url: '',
    logo_position: 'center' as 'left' | 'center' | 'right',
    background_color: '#ffffff',
    card_color: '#ffffff',
    background_opacity: 1,
    card_opacity: 1,
    button_color: '#2563eb',
    button_text_color: '#ffffff',
    title_color: '#111827',
    subtitle_color: '#4b5563',
    text_color: '#4b5563',
    font_title: FONT_OPTIONS[0].value,
    font_body: FONT_OPTIONS[0].value,
    font_button: FONT_OPTIONS[0].value,
    card_layout: 1 as 1 | 2 | 3,
    show_whatsapp_fab: false,
    // Personalización del calendario
    calendar_card_color: '#ffffff',
    calendar_card_opacity: 100,
    calendar_text_color: '#111827',
    calendar_title_color: '#111827',
    calendar_button_color: '#2563eb',
    calendar_button_text_color: '#ffffff',
    calendar_available_day_color: '#22c55e',
    calendar_low_slots_color: '#eab308',
    calendar_no_slots_color: '#ef4444',
    calendar_selected_day_color: '#2563eb',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!firestoreUser?.company_id) return;

    try {
      const appearanceData = await getCompanyAppearance(firestoreUser.company_id, BusinessType.SERVICES);
      if (appearanceData) {
        setAppearance({
          logo_url: appearanceData.logo_url || '',
          banner_url: appearanceData.banner_url || '',
          logo_position: appearanceData.logo_position || 'center',
          background_color: appearanceData.background_color || '#ffffff',
          card_color: appearanceData.card_color || '#ffffff',
          background_opacity: appearanceData.background_opacity ?? 1,
          card_opacity: appearanceData.card_opacity ?? 1,
          button_color: appearanceData.button_color || '#2563eb',
          button_text_color: appearanceData.button_text_color || '#ffffff',
          title_color: appearanceData.title_color || '#111827',
          subtitle_color: appearanceData.subtitle_color || '#4b5563',
          text_color: appearanceData.text_color || '#4b5563',
          font_title: appearanceData.font_title || FONT_OPTIONS[0].value,
          font_body: appearanceData.font_body || FONT_OPTIONS[0].value,
          font_button: appearanceData.font_button || FONT_OPTIONS[0].value,
          card_layout: (appearanceData.card_layout || 1) as 1 | 2 | 3,
          show_whatsapp_fab: appearanceData.show_whatsapp_fab || false,
          // Personalización del calendario
          calendar_card_color: appearanceData.calendar_card_color || '#ffffff',
          calendar_card_opacity: appearanceData.calendar_card_opacity ?? 100,
          calendar_text_color: appearanceData.calendar_text_color || '#111827',
          calendar_title_color: appearanceData.calendar_title_color || '#111827',
          calendar_button_color: appearanceData.calendar_button_color || '#2563eb',
          calendar_button_text_color: appearanceData.calendar_button_text_color || '#ffffff',
          calendar_available_day_color: appearanceData.calendar_available_day_color || '#22c55e',
          calendar_low_slots_color: appearanceData.calendar_low_slots_color || '#eab308',
          calendar_no_slots_color: appearanceData.calendar_no_slots_color || '#ef4444',
          calendar_selected_day_color: appearanceData.calendar_selected_day_color || '#2563eb',
        });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'banner') => {
    if (!firestoreUser?.company_id) return;

    try {
      const path = `companies/${firestoreUser.company_id}/${type}_${Date.now()}`;
      const url = await uploadImage(
        file,
        path,
        type === 'logo'
          ? { width: 512, height: 512, maxSizeKB: 500, format: 'image/png', quality: 0.95 }
          : { width: 1600, height: 600, maxSizeKB: 1000, format: 'image/jpeg', quality: 0.9 }
      );
      
      if (type === 'logo') {
        setAppearance({ ...appearance, logo_url: url });
      } else {
        setAppearance({ ...appearance, banner_url: url });
      }
      
      toast.success('Imagen subida correctamente');
    } catch (error) {
      toast.error('Error al subir imagen');
      handleError(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestoreUser?.company_id) return;

    setSaving(true);
    try {
      await setCompanyAppearance(firestoreUser.company_id, BusinessType.SERVICES, appearance);
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error('Error al guardar');
      handleError(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Configuración Visual - Servicios</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
            <p className="text-xs text-gray-500 mb-1">Recomendado: 512x512 px, PNG transparente o JPG, máx ~500KB.</p>
            {appearance.logo_url && (
              <div className="flex items-center gap-3 mb-2">
                <img src={appearance.logo_url} alt="Logo" className="h-24" />
                <button
                  type="button"
                  onClick={() => setAppearance({ ...appearance, logo_url: '' })}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Eliminar logo
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, 'logo');
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {appearance.logo_url && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Posición del logo</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setAppearance({ ...appearance, logo_position: 'left' })}
                    className={`px-4 py-3 rounded-lg border-2 transition font-medium ${
                      appearance.logo_position === 'left'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">⬅️</div>
                      <div className="text-sm">Izquierda</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppearance({ ...appearance, logo_position: 'center' })}
                    className={`px-4 py-3 rounded-lg border-2 transition font-medium ${
                      appearance.logo_position === 'center'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">⬆️</div>
                      <div className="text-sm">Centro</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppearance({ ...appearance, logo_position: 'right' })}
                    className={`px-4 py-3 rounded-lg border-2 transition font-medium ${
                      appearance.logo_position === 'right'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">➡️</div>
                      <div className="text-sm">Derecha</div>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  El logo se mostrará más grande cuando esté centrado para mayor visibilidad.
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banner</label>
            <p className="text-xs text-gray-500 mb-1">Recomendado: 1600x600 px, JPG o PNG, máx ~1MB.</p>
            {appearance.banner_url && (
              <div className="mb-2">
                <img src={appearance.banner_url} alt="Banner" className="w-full h-48 object-cover rounded mb-2" />
                <button
                  type="button"
                  onClick={() => setAppearance({ ...appearance, banner_url: '' })}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Eliminar banner
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, 'banner');
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color de fondo</label>
            <input
              type="color"
              value={appearance.background_color}
              onChange={(e) => setAppearance({ ...appearance, background_color: e.target.value })}
              className="h-10 w-full"
            />
            <label className="block text-sm font-medium text-gray-700 mt-2">Transparencia de fondo</label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((appearance.background_opacity ?? 1) * 100)}
              onChange={(e) =>
                setAppearance({ ...appearance, background_opacity: Number(e.target.value) / 100 })
              }
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Opacidad: {Math.round((appearance.background_opacity ?? 1) * 100)}%
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color de tarjetas</label>
            <input
              type="color"
              value={appearance.card_color}
              onChange={(e) => setAppearance({ ...appearance, card_color: e.target.value })}
              className="h-10 w-full"
            />
            <label className="block text-sm font-medium text-gray-700 mt-2">Transparencia de tarjetas</label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((appearance.card_opacity ?? 1) * 100)}
              onChange={(e) =>
                setAppearance({ ...appearance, card_opacity: Number(e.target.value) / 100 })
              }
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Opacidad: {Math.round((appearance.card_opacity ?? 1) * 100)}%
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color de botones</label>
            <input
              type="color"
              value={appearance.button_color}
              onChange={(e) => setAppearance({ ...appearance, button_color: e.target.value })}
              className="h-10 w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Texto de botones</label>
              <input
                type="color"
                value={appearance.button_text_color}
                onChange={(e) => setAppearance({ ...appearance, button_text_color: e.target.value })}
                className="h-10 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color de títulos</label>
              <input
                type="color"
                value={appearance.title_color}
                onChange={(e) => setAppearance({ ...appearance, title_color: e.target.value })}
                className="h-10 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color de subtítulos</label>
              <input
                type="color"
                value={appearance.subtitle_color}
                onChange={(e) => setAppearance({ ...appearance, subtitle_color: e.target.value })}
                className="h-10 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color de texto</label>
              <input
                type="color"
                value={appearance.text_color}
                onChange={(e) => setAppearance({ ...appearance, text_color: e.target.value })}
                className="h-10 w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuente títulos</label>
              <select
                value={appearance.font_title}
                onChange={(e) => setAppearance({ ...appearance, font_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuente cuerpo</label>
              <select
                value={appearance.font_body}
                onChange={(e) => setAppearance({ ...appearance, font_body: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuente botones</label>
              <select
                value={appearance.font_button}
                onChange={(e) => setAppearance({ ...appearance, font_button: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Layout Premium de Tarjetas</label>
            <select
              value={appearance.card_layout}
              onChange={(e) => setAppearance({ ...appearance, card_layout: Number(e.target.value) as 1 | 2 | 3 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={1}>Layout 1: Grid Clásico</option>
              <option value={2}>Layout 2: Lista con Imagen Circular</option>
              <option value={3}>Layout 3: Carrusel Fullscreen</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Selecciona el diseño premium para las tarjetas de servicios en tu página pública.
            </p>
          </div>

          <div className="flex items-start gap-3 border rounded-lg p-4">
            <input
              id="whatsappFab"
              type="checkbox"
              className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={appearance.show_whatsapp_fab}
              onChange={(e) => setAppearance({ ...appearance, show_whatsapp_fab: e.target.checked })}
            />
            <div>
              <label htmlFor="whatsappFab" className="text-sm font-medium text-gray-900">
                Mostrar botón flotante de WhatsApp
              </label>
              <p className="text-xs text-gray-600">
                Agrega un acceso rápido en la esquina inferior para que los clientes escriban por WhatsApp desde la página pública.
              </p>
            </div>
          </div>

          {/* Personalización del Calendario de Agenda */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📅 Personalización del Calendario de Agenda
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Personaliza los colores y estilos del calendario de reservas en tu página pública.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color de fondo de tarjetas</label>
                <input
                  type="color"
                  value={appearance.calendar_card_color}
                  onChange={(e) => setAppearance({ ...appearance, calendar_card_color: e.target.value })}
                  className="h-10 w-full rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacidad de tarjetas: {appearance.calendar_card_opacity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={appearance.calendar_card_opacity}
                  onChange={(e) => setAppearance({ ...appearance, calendar_card_opacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color de texto</label>
                <input
                  type="color"
                  value={appearance.calendar_text_color}
                  onChange={(e) => setAppearance({ ...appearance, calendar_text_color: e.target.value })}
                  className="h-10 w-full rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color de títulos</label>
                <input
                  type="color"
                  value={appearance.calendar_title_color}
                  onChange={(e) => setAppearance({ ...appearance, calendar_title_color: e.target.value })}
                  className="h-10 w-full rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color de botones</label>
                <input
                  type="color"
                  value={appearance.calendar_button_color}
                  onChange={(e) => setAppearance({ ...appearance, calendar_button_color: e.target.value })}
                  className="h-10 w-full rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color de texto de botones</label>
                <input
                  type="color"
                  value={appearance.calendar_button_text_color}
                  onChange={(e) => setAppearance({ ...appearance, calendar_button_text_color: e.target.value })}
                  className="h-10 w-full rounded border border-gray-300"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Colores de disponibilidad de días</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días disponibles (verde)
                  </label>
                  <input
                    type="color"
                    value={appearance.calendar_available_day_color}
                    onChange={(e) => setAppearance({ ...appearance, calendar_available_day_color: e.target.value })}
                    className="h-10 w-full rounded border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pocos slots (amarillo)
                  </label>
                  <input
                    type="color"
                    value={appearance.calendar_low_slots_color}
                    onChange={(e) => setAppearance({ ...appearance, calendar_low_slots_color: e.target.value })}
                    className="h-10 w-full rounded border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sin slots (rojo)
                  </label>
                  <input
                    type="color"
                    value={appearance.calendar_no_slots_color}
                    onChange={(e) => setAppearance({ ...appearance, calendar_no_slots_color: e.target.value })}
                    className="h-10 w-full rounded border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Día seleccionado
                  </label>
                  <input
                    type="color"
                    value={appearance.calendar_selected_day_color}
                    onChange={(e) => setAppearance({ ...appearance, calendar_selected_day_color: e.target.value })}
                    className="h-10 w-full rounded border border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
