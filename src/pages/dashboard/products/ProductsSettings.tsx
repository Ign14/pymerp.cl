import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getCompanyAppearance, setCompanyAppearance, getCompany, updateCompany } from '../../../services/firestore';
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

export default function ProductsSettings() {
  const { firestoreUser } = useAuth();
  const { handleError } = useErrorHandler();
  const [appearance, setAppearance] = useState({
    logo_url: '',
    banner_url: '',
    logo_position: 'center' as 'left' | 'center' | 'right',
    background_color: '#ffffff',
    menu_background_color: '#f9fafb',
    menu_background_image: '',
    card_color: '#ffffff',
    menu_card_color: '#ffffff',
    background_opacity: 1,
    card_opacity: 1,
    menu_hero_card_color: '#000000',
    menu_hero_card_opacity: 0,
    menu_hero_logo_card_color: '#000000',
    menu_hero_logo_card_opacity: 0,
    button_color: '#2563eb',
    button_text_color: '#ffffff',
    menu_button_color: '#2563eb',
    menu_button_text_color: '#ffffff',
    title_color: '#111827',
    menu_title_color: '#111827',
    subtitle_color: '#4b5563',
    text_color: '#4b5563',
    menu_text_color: '#374151',
    font_title: FONT_OPTIONS[0].value,
    font_body: FONT_OPTIONS[0].value,
    font_button: FONT_OPTIONS[0].value,
    layout: 'LIST' as 'GRID' | 'LIST',
    card_layout: 2 as 1 | 2 | 3,
    show_whatsapp_fab: false,
    menu_category_image_default: '',
    hero_kicker: '',
    hero_title: '',
    hero_description: '',
    // Nuevas configuraciones de botones flotantes
    show_cart_fab: true,
    show_call_fab: true,
    fab_cart_color: '#f59e0b',
    fab_cart_opacity: 1,
    fab_call_color: '#10b981',
    fab_call_opacity: 1,
    fab_whatsapp_color: '#25D366',
    fab_whatsapp_opacity: 1,
    // Configuración de productos en lista
    product_list_image_position: 'left' as 'left' | 'right',
    // Header mobile
    hide_hero_logo_on_mobile: true,
  });
  const [companySchedule, setCompanySchedule] = useState({
    weekday_days: [] as string[],
    weekday_open_time: '',
    weekday_close_time: '',
    weekend_days: [] as string[],
    weekend_open_time: '',
    weekend_close_time: '',
  });
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const DAY_NAMES: Record<string, string> = {
    MONDAY: 'Lunes',
    TUESDAY: 'Martes',
    WEDNESDAY: 'Miércoles',
    THURSDAY: 'Jueves',
    FRIDAY: 'Viernes',
    SATURDAY: 'Sábado',
    SUNDAY: 'Domingo',
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!firestoreUser?.company_id) return;

    try {
      const [appearanceData, companyData] = await Promise.all([
        getCompanyAppearance(firestoreUser.company_id, BusinessType.PRODUCTS),
        getCompany(firestoreUser.company_id),
      ]);
      if (appearanceData) {
        setAppearance({
          logo_url: appearanceData.logo_url || '',
          banner_url: appearanceData.banner_url || '',
          logo_position: appearanceData.logo_position || 'center',
          background_color: appearanceData.background_color || '#ffffff',
          menu_background_color: appearanceData.menu_background_color || '#f9fafb',
          menu_background_image: appearanceData.menu_background_image || '',
          card_color: appearanceData.card_color || '#ffffff',
          menu_card_color: appearanceData.menu_card_color || '#ffffff',
          background_opacity: appearanceData.background_opacity ?? 1,
          card_opacity: appearanceData.card_opacity ?? 1,
          menu_hero_card_color: appearanceData.menu_hero_card_color || '#000000',
          menu_hero_card_opacity: appearanceData.menu_hero_card_opacity ?? 0,
          menu_hero_logo_card_color: appearanceData.menu_hero_logo_card_color || '#000000',
          menu_hero_logo_card_opacity: appearanceData.menu_hero_logo_card_opacity ?? 0,
          button_color: appearanceData.button_color || '#2563eb',
          button_text_color: appearanceData.button_text_color || '#ffffff',
          menu_button_color: appearanceData.menu_button_color || '#2563eb',
          menu_button_text_color: appearanceData.menu_button_text_color || '#ffffff',
          title_color: appearanceData.title_color || '#111827',
          menu_title_color: appearanceData.menu_title_color || '#111827',
          subtitle_color: appearanceData.subtitle_color || '#4b5563',
          text_color: appearanceData.text_color || '#4b5563',
          menu_text_color: appearanceData.menu_text_color || '#374151',
          font_title: appearanceData.font_title || FONT_OPTIONS[0].value,
          font_body: appearanceData.font_body || FONT_OPTIONS[0].value,
          font_button: appearanceData.font_button || FONT_OPTIONS[0].value,
          layout: 'LIST', // Fijo en LIST
          card_layout: 2, // Fijo en Layout 2
          show_whatsapp_fab: appearanceData.show_whatsapp_fab || false,
          menu_category_image_default: appearanceData.menu_category_image_default || '',
          hero_kicker: appearanceData.hero_kicker || '',
          hero_title: appearanceData.hero_title || '',
          hero_description: appearanceData.hero_description || '',
          // Nuevas configuraciones
          show_cart_fab: appearanceData.show_cart_fab ?? true,
          show_call_fab: appearanceData.show_call_fab ?? true,
          fab_cart_color: appearanceData.fab_cart_color || '#f59e0b',
          fab_cart_opacity: appearanceData.fab_cart_opacity ?? 1,
          fab_call_color: appearanceData.fab_call_color || '#10b981',
          fab_call_opacity: appearanceData.fab_call_opacity ?? 1,
          fab_whatsapp_color: appearanceData.fab_whatsapp_color || '#25D366',
          fab_whatsapp_opacity: appearanceData.fab_whatsapp_opacity ?? 1,
          product_list_image_position: appearanceData.product_list_image_position || 'left',
          hide_hero_logo_on_mobile: appearanceData.hide_hero_logo_on_mobile ?? true,
        });
      }
      if (companyData) {
        setCompanySchedule({
          weekday_days: companyData.weekday_days || [],
          weekday_open_time: companyData.weekday_open_time || '',
          weekday_close_time: companyData.weekday_close_time || '',
          weekend_days: companyData.weekend_days || [],
          weekend_open_time: companyData.weekend_open_time || '',
          weekend_close_time: companyData.weekend_close_time || '',
        });
        setDeliveryEnabled(companyData.delivery_enabled || false);
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

  const handleMenuImageUpload = async (
    file: File,
    field: 'menu_background_image' | 'menu_category_image_default'
  ) => {
    if (!firestoreUser?.company_id) return;

    try {
      const path = `companies/${firestoreUser.company_id}/${field}_${Date.now()}`;
      const options =
        field === 'menu_background_image'
          ? { width: 1920, height: 1080, maxSizeKB: 1500, format: 'image/jpeg' as const, quality: 0.9 }
          : { width: 900, height: 900, maxSizeKB: 900, format: 'image/jpeg' as const, quality: 0.9 };
      const url = await uploadImage(file, path, options);

      setAppearance((prev) => ({ ...prev, [field]: url }));
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
      await Promise.all([
        setCompanyAppearance(firestoreUser.company_id, BusinessType.PRODUCTS, appearance),
        updateCompany(firestoreUser.company_id, {
          weekday_days: companySchedule.weekday_days,
          weekday_open_time: companySchedule.weekday_open_time,
          weekday_close_time: companySchedule.weekday_close_time,
          weekend_days: companySchedule.weekend_days,
          weekend_open_time: companySchedule.weekend_open_time,
          weekend_close_time: companySchedule.weekend_close_time,
          delivery_enabled: deliveryEnabled,
        }),
      ]);
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
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-100"
              aria-label="Volver"
            >
              ←
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Configuración Visual - Productos</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              const slug = firestoreUser?.company_id; // Usar el ID de la empresa como slug por ahora
              window.open(`/${slug}?preview=true`, '_blank');
            }}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 font-medium text-sm flex items-center gap-2"
            aria-label="Vista previa con modo edición"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Vista Previa
          </button>
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

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Diseño del menú</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fondo del menú</label>
                <input
                  type="color"
                  value={appearance.menu_background_color}
                  onChange={(e) => setAppearance({ ...appearance, menu_background_color: e.target.value })}
                  className="h-10 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de fondo del menú</label>
                <p className="text-xs text-gray-500 mb-1">Recomendado: 1920x1080 px, JPG, máx ~1.5MB.</p>
                {appearance.menu_background_image && (
                  <div className="mb-2">
                    <img
                      src={appearance.menu_background_image}
                      alt="Fondo del menú"
                      className="w-full h-40 object-cover rounded mb-2"
                    />
                    <button
                      type="button"
                      onClick={() => setAppearance({ ...appearance, menu_background_image: '' })}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Eliminar imagen
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleMenuImageUpload(file, 'menu_background_image');
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tarjetas del menú</label>
                  <input
                    type="color"
                    value={appearance.menu_card_color}
                    onChange={(e) => setAppearance({ ...appearance, menu_card_color: e.target.value })}
                    className="h-10 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texto del menú</label>
                  <input
                    type="color"
                    value={appearance.menu_text_color}
                    onChange={(e) => setAppearance({ ...appearance, menu_text_color: e.target.value })}
                    className="h-10 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título del menú</label>
                  <input
                    type="color"
                    value={appearance.menu_title_color}
                    onChange={(e) => setAppearance({ ...appearance, menu_title_color: e.target.value })}
                    className="h-10 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Botón del menú</label>
                  <input
                    type="color"
                    value={appearance.menu_button_color}
                    onChange={(e) => setAppearance({ ...appearance, menu_button_color: e.target.value })}
                    className="h-10 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texto de botón (menú)</label>
                  <input
                    type="color"
                    value={appearance.menu_button_text_color}
                    onChange={(e) => setAppearance({ ...appearance, menu_button_text_color: e.target.value })}
                    className="h-10 w-full"
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-gray-800">Hero del menú</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kicker</label>
                    <input
                      type="text"
                      value={appearance.hero_kicker}
                      onChange={(e) => setAppearance({ ...appearance, hero_kicker: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Ej: Especialistas en completos"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                    <input
                      type="text"
                      value={appearance.hero_title}
                      onChange={(e) => setAppearance({ ...appearance, hero_title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Nombre destacado en el hero"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                    <textarea
                      value={appearance.hero_description}
                      onChange={(e) => setAppearance({ ...appearance, hero_description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[90px]"
                      placeholder="Breve descripción en el hero"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarjeta hero (color)</label>
                    <input
                      type="color"
                      value={appearance.menu_hero_card_color}
                      onChange={(e) => setAppearance({ ...appearance, menu_hero_card_color: e.target.value })}
                      className="h-10 w-full"
                    />
                    <label className="block text-xs text-gray-600 mt-2">Opacidad</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((appearance.menu_hero_card_opacity ?? 0) * 100)}
                      onChange={(e) =>
                        setAppearance({ ...appearance, menu_hero_card_opacity: Number(e.target.value) / 100 })
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarjeta logo (color)</label>
                    <input
                      type="color"
                      value={appearance.menu_hero_logo_card_color}
                      onChange={(e) => setAppearance({ ...appearance, menu_hero_logo_card_color: e.target.value })}
                      className="h-10 w-full"
                    />
                    <label className="block text-xs text-gray-600 mt-2">Opacidad</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((appearance.menu_hero_logo_card_opacity ?? 0) * 100)}
                      onChange={(e) =>
                        setAppearance({ ...appearance, menu_hero_logo_card_opacity: Number(e.target.value) / 100 })
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Horario semana</h2>
              <div className="mb-3">
                <p className="text-sm font-medium mb-2 text-gray-700">Días</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setCompanySchedule((prev) => ({
                          ...prev,
                          weekday_days: prev.weekday_days.includes(day)
                            ? prev.weekday_days.filter((d) => d !== day)
                            : [...prev.weekday_days, day],
                        }))
                      }
                      className={`px-3 py-1 rounded-md text-sm ${
                        companySchedule.weekday_days.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {DAY_NAMES[day]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                  <input
                    type="time"
                    value={companySchedule.weekday_open_time}
                    onChange={(e) =>
                      setCompanySchedule((prev) => ({ ...prev, weekday_open_time: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                  <input
                    type="time"
                    value={companySchedule.weekday_close_time}
                    onChange={(e) =>
                      setCompanySchedule((prev) => ({ ...prev, weekday_close_time: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Horario fin de semana</h2>
              <div className="mb-3">
                <p className="text-sm font-medium mb-2 text-gray-700">Días</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        setCompanySchedule((prev) => ({
                          ...prev,
                          weekend_days: prev.weekend_days.includes(day)
                            ? prev.weekend_days.filter((d) => d !== day)
                            : [...prev.weekend_days, day],
                        }))
                      }
                      className={`px-3 py-1 rounded-md text-sm ${
                        companySchedule.weekend_days.includes(day)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {DAY_NAMES[day]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                  <input
                    type="time"
                    value={companySchedule.weekend_open_time}
                    onChange={(e) =>
                      setCompanySchedule((prev) => ({ ...prev, weekend_open_time: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                  <input
                    type="time"
                    value={companySchedule.weekend_close_time}
                    onChange={(e) =>
                      setCompanySchedule((prev) => ({ ...prev, weekend_close_time: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
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


          {/* Sección de Botones Flotantes */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Botones Flotantes (FAB)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Configura los botones de acción flotantes que aparecen en la esquina inferior derecha de tu página pública.
            </p>

            <div className="space-y-4">
              {/* Toggle WhatsApp */}
              <div className="flex items-start gap-3 border rounded-lg p-4">
                <input
                  id="whatsappFab"
                  type="checkbox"
                  className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={appearance.show_whatsapp_fab}
                  onChange={(e) => setAppearance({ ...appearance, show_whatsapp_fab: e.target.checked })}
                />
                <div className="flex-1">
                  <label htmlFor="whatsappFab" className="text-sm font-medium text-gray-900">
                    💬 Botón de WhatsApp
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    Permite a los clientes contactarte por WhatsApp desde la página pública.
                  </p>
                  {appearance.show_whatsapp_fab && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="color"
                          value={appearance.fab_whatsapp_color}
                          onChange={(e) => setAppearance({ ...appearance, fab_whatsapp_color: e.target.value })}
                          className="h-10 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Opacidad: {Math.round(appearance.fab_whatsapp_opacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(appearance.fab_whatsapp_opacity * 100)}
                          onChange={(e) => setAppearance({ ...appearance, fab_whatsapp_opacity: Number(e.target.value) / 100 })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle Carrito */}
              <div className="flex items-start gap-3 border rounded-lg p-4 bg-orange-50">
                <input
                  id="cartFab"
                  type="checkbox"
                  className="mt-1 h-5 w-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  checked={appearance.show_cart_fab}
                  onChange={(e) => setAppearance({ ...appearance, show_cart_fab: e.target.checked })}
                />
                <div className="flex-1">
                  <label htmlFor="cartFab" className="text-sm font-medium text-gray-900">
                    🛒 Botón de Carrito
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    Muestra el carrito de compras flotante para acceso rápido.
                  </p>
                  {appearance.show_cart_fab && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="color"
                          value={appearance.fab_cart_color}
                          onChange={(e) => setAppearance({ ...appearance, fab_cart_color: e.target.value })}
                          className="h-10 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Opacidad: {Math.round(appearance.fab_cart_opacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(appearance.fab_cart_opacity * 100)}
                          onChange={(e) => setAppearance({ ...appearance, fab_cart_opacity: Number(e.target.value) / 100 })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle Llamadas */}
              <div className="flex items-start gap-3 border rounded-lg p-4 bg-green-50">
                <input
                  id="callFab"
                  type="checkbox"
                  className="mt-1 h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  checked={appearance.show_call_fab}
                  onChange={(e) => setAppearance({ ...appearance, show_call_fab: e.target.checked })}
                />
                <div className="flex-1">
                  <label htmlFor="callFab" className="text-sm font-medium text-gray-900">
                    📞 Botón de Llamadas
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    Permite a los clientes llamarte directamente desde la página pública.
                  </p>
                  {appearance.show_call_fab && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                        <input
                          type="color"
                          value={appearance.fab_call_color}
                          onChange={(e) => setAppearance({ ...appearance, fab_call_color: e.target.value })}
                          className="h-10 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Opacidad: {Math.round(appearance.fab_call_opacity * 100)}%
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(appearance.fab_call_opacity * 100)}
                          onChange={(e) => setAppearance({ ...appearance, fab_call_opacity: Number(e.target.value) / 100 })}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Configuración de Header Mobile */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Header Mobile</h2>
            <div className="flex items-start gap-3 border rounded-lg p-4">
              <input
                id="hideHeroLogo"
                type="checkbox"
                className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={appearance.hide_hero_logo_on_mobile}
                onChange={(e) => setAppearance({ ...appearance, hide_hero_logo_on_mobile: e.target.checked })}
              />
              <div>
                <label htmlFor="hideHeroLogo" className="text-sm font-medium text-gray-900">
                  Ocultar logo del hero en mobile
                </label>
                <p className="text-xs text-gray-600">
                  Cuando está activado, el logo del hero no se muestra en mobile (solo se muestra en el header superior).
                  Esto evita duplicar el logo en pantallas pequeñas.
                </p>
              </div>
            </div>
          </div>

          {/* Configuración de Productos en Lista */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Productos en Lista</h2>
            <div className="border rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Posición de imagen</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAppearance({ ...appearance, product_list_image_position: 'left' })}
                  className={`px-4 py-3 rounded-lg border-2 transition font-medium ${
                    appearance.product_list_image_position === 'left'
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
                  onClick={() => setAppearance({ ...appearance, product_list_image_position: 'right' })}
                  className={`px-4 py-3 rounded-lg border-2 transition font-medium ${
                    appearance.product_list_image_position === 'right'
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
                Cuando los productos se muestran en formato lista, la imagen aparecerá a la izquierda o derecha según tu configuración.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border rounded-lg p-4 bg-green-50">
            <input
              id="deliveryEnabled"
              type="checkbox"
              className="mt-1 h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              checked={deliveryEnabled}
              onChange={(e) => setDeliveryEnabled(e.target.checked)}
            />
            <div>
              <label htmlFor="deliveryEnabled" className="text-sm font-medium text-gray-900 flex items-center gap-2">
                🚚 Recibir pedidos a domicilio
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Al activar esta opción, los clientes podrán solicitar entrega a domicilio en el carrito de compras. 
                Se les pedirá que compartan su dirección y ubicación por WhatsApp.
              </p>
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
