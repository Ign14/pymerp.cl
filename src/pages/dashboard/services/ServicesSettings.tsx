import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getCompany, getCompanyAppearance, setCompanyAppearance } from '../../../services/firestore';
import { uploadImage } from '../../../services/storage';
import { BusinessType, type Company, type IndustrialProjectMedia } from '../../../types';
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
  const [company, setCompany] = useState<Company | null>(null);
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
    // Layout industrial (Construccion y Mantenciones)
    industrial_hero_title: '',
    industrial_hero_subtitle: '',
    industrial_hero_badge_1: '',
    industrial_hero_badge_2: '',
    industrial_hero_badge_3: '',
    industrial_hero_cta_primary: '',
    industrial_hero_cta_secondary: '',
    industrial_hero_title_color: '#ffffff',
    industrial_hero_subtitle_color: '#e2e8f0',
    industrial_hero_kicker_color: '#fbbf24',
    industrial_hero_badge_bg_color: '#f59e0b',
    industrial_hero_badge_border_color: '#f59e0b',
    industrial_hero_badge_text_color: '#fef3c7',
    industrial_hero_primary_button_color: '#10b981',
    industrial_hero_primary_button_text_color: '#ffffff',
    industrial_hero_secondary_button_color: 'rgba(255,255,255,0.1)',
    industrial_hero_secondary_button_text_color: '#ffffff',
    industrial_hero_card_color: '#ffffff',
    industrial_hero_card_opacity: 0.16,
    industrial_hero_overlay_color: '#0e1624',
    industrial_hero_overlay_opacity: 0.85,
    industrial_hero_background_image: '',
    industrial_hero_card_label_clients: '',
    industrial_hero_card_value_clients: '',
    industrial_hero_card_label_coverage: '',
    industrial_hero_card_value_coverage: '',
    industrial_hero_card_label_response: '',
    industrial_hero_card_value_response: '',
    industrial_hero_card_label_services: '',
    industrial_hero_card_value_services: '',
    industrial_hero_card_label_attention: '',
    industrial_hero_card_value_attention: '',
    industrial_trust_label_1: '',
    industrial_trust_label_2: '',
    industrial_trust_label_3: '',
    industrial_trust_label_4: '',
    industrial_trust_bg_color: '#ffffff',
    industrial_trust_bg_opacity: 0.95,
    industrial_trust_text_color: '#334155',
    industrial_trust_icon_bg_color: '#0f172a',
    industrial_services_title: '',
    industrial_services_subtitle: '',
    industrial_services_cta: '',
    industrial_services_bg_color: '#ffffff',
    industrial_services_bg_opacity: 1,
    industrial_services_card_color: '#ffffff',
    industrial_services_card_opacity: 0.95,
    industrial_services_title_color: '#0f172a',
    industrial_services_text_color: '#475569',
    industrial_services_button_color: '#10b981',
    industrial_services_button_text_color: '#ffffff',
    industrial_process_title: '',
    industrial_process_step_1: '',
    industrial_process_step_2: '',
    industrial_process_step_3: '',
    industrial_process_step_4: '',
    industrial_process_bg_color: '#ffffff',
    industrial_process_bg_opacity: 0.95,
    industrial_process_card_color: '#f8fafc',
    industrial_process_card_opacity: 0.9,
    industrial_process_title_color: '#0f172a',
    industrial_process_text_color: '#334155',
    industrial_projects_title: '',
    industrial_projects_subtitle: '',
    industrial_projects_cta: '',
    industrial_projects_bg_color: '#ffffff',
    industrial_projects_bg_opacity: 1,
    industrial_projects_card_color: '#ffffff',
    industrial_projects_card_opacity: 0.95,
    industrial_projects_title_color: '#0f172a',
    industrial_projects_text_color: '#475569',
    industrial_projects_button_color: '#ffffff',
    industrial_projects_button_text_color: '#334155',
    industrial_projects: [] as IndustrialProjectMedia[],
    industrial_coverage_title: '',
    industrial_coverage_subtitle: '',
    industrial_coverage_chip_1: '',
    industrial_coverage_chip_2: '',
    industrial_coverage_chip_3: '',
    industrial_coverage_note: '',
    industrial_coverage_bg_color: '#ffffff',
    industrial_coverage_bg_opacity: 0.95,
    industrial_coverage_card_color: '#f8fafc',
    industrial_coverage_card_opacity: 0.95,
    industrial_coverage_title_color: '#0f172a',
    industrial_coverage_text_color: '#475569',
    industrial_coverage_chip_bg_color: '#ffffff',
    industrial_coverage_chip_text_color: '#475569',
    industrial_form_title: '',
    industrial_form_subtitle: '',
    industrial_form_name_placeholder: '',
    industrial_form_phone_placeholder: '',
    industrial_form_location_placeholder: '',
    industrial_form_service_placeholder: '',
    industrial_form_urgency_placeholder: '',
    industrial_form_description_placeholder: '',
    industrial_form_cta: '',
    industrial_form_bg_color: '#ffffff',
    industrial_form_bg_opacity: 0.95,
    industrial_form_title_color: '#0f172a',
    industrial_form_text_color: '#475569',
    industrial_form_button_color: '#10b981',
    industrial_form_button_text_color: '#ffffff',
    industrial_footer_bg_color: '#0e1624',
    industrial_footer_text_color: '#e2e8f0',
    industrial_footer_link_color: '#86efac',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!firestoreUser?.company_id) return;

    try {
      const [appearanceData, companyData] = await Promise.all([
        getCompanyAppearance(firestoreUser.company_id, BusinessType.SERVICES),
        getCompany(firestoreUser.company_id),
      ]);
      setCompany(companyData);
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
          industrial_hero_title: appearanceData.industrial_hero_title || '',
          industrial_hero_subtitle: appearanceData.industrial_hero_subtitle || '',
          industrial_hero_badge_1: appearanceData.industrial_hero_badge_1 || '',
          industrial_hero_badge_2: appearanceData.industrial_hero_badge_2 || '',
          industrial_hero_badge_3: appearanceData.industrial_hero_badge_3 || '',
          industrial_hero_cta_primary: appearanceData.industrial_hero_cta_primary || '',
          industrial_hero_cta_secondary: appearanceData.industrial_hero_cta_secondary || '',
          industrial_hero_title_color: appearanceData.industrial_hero_title_color || '#ffffff',
          industrial_hero_subtitle_color: appearanceData.industrial_hero_subtitle_color || '#e2e8f0',
          industrial_hero_kicker_color: appearanceData.industrial_hero_kicker_color || '#fbbf24',
          industrial_hero_badge_bg_color: appearanceData.industrial_hero_badge_bg_color || '#f59e0b',
          industrial_hero_badge_border_color: appearanceData.industrial_hero_badge_border_color || '#f59e0b',
          industrial_hero_badge_text_color: appearanceData.industrial_hero_badge_text_color || '#fef3c7',
          industrial_hero_primary_button_color: appearanceData.industrial_hero_primary_button_color || '#10b981',
          industrial_hero_primary_button_text_color: appearanceData.industrial_hero_primary_button_text_color || '#ffffff',
          industrial_hero_secondary_button_color: appearanceData.industrial_hero_secondary_button_color || 'rgba(255,255,255,0.1)',
          industrial_hero_secondary_button_text_color: appearanceData.industrial_hero_secondary_button_text_color || '#ffffff',
          industrial_hero_card_color: appearanceData.industrial_hero_card_color || '#ffffff',
          industrial_hero_card_opacity: appearanceData.industrial_hero_card_opacity ?? 0.16,
          industrial_hero_overlay_color: appearanceData.industrial_hero_overlay_color || '#0e1624',
          industrial_hero_overlay_opacity: appearanceData.industrial_hero_overlay_opacity ?? 0.85,
          industrial_hero_background_image: appearanceData.industrial_hero_background_image || '',
          industrial_hero_card_label_clients: appearanceData.industrial_hero_card_label_clients || '',
          industrial_hero_card_value_clients: appearanceData.industrial_hero_card_value_clients || '',
          industrial_hero_card_label_coverage: appearanceData.industrial_hero_card_label_coverage || '',
          industrial_hero_card_value_coverage: appearanceData.industrial_hero_card_value_coverage || '',
          industrial_hero_card_label_response: appearanceData.industrial_hero_card_label_response || '',
          industrial_hero_card_value_response: appearanceData.industrial_hero_card_value_response || '',
          industrial_hero_card_label_services: appearanceData.industrial_hero_card_label_services || '',
          industrial_hero_card_value_services: appearanceData.industrial_hero_card_value_services || '',
          industrial_hero_card_label_attention: appearanceData.industrial_hero_card_label_attention || '',
          industrial_hero_card_value_attention: appearanceData.industrial_hero_card_value_attention || '',
          industrial_trust_label_1: appearanceData.industrial_trust_label_1 || '',
          industrial_trust_label_2: appearanceData.industrial_trust_label_2 || '',
          industrial_trust_label_3: appearanceData.industrial_trust_label_3 || '',
          industrial_trust_label_4: appearanceData.industrial_trust_label_4 || '',
          industrial_trust_bg_color: appearanceData.industrial_trust_bg_color || '#ffffff',
          industrial_trust_bg_opacity: appearanceData.industrial_trust_bg_opacity ?? 0.95,
          industrial_trust_text_color: appearanceData.industrial_trust_text_color || '#334155',
          industrial_trust_icon_bg_color: appearanceData.industrial_trust_icon_bg_color || '#0f172a',
          industrial_services_title: appearanceData.industrial_services_title || '',
          industrial_services_subtitle: appearanceData.industrial_services_subtitle || '',
          industrial_services_cta: appearanceData.industrial_services_cta || '',
          industrial_services_bg_color: appearanceData.industrial_services_bg_color || '#ffffff',
          industrial_services_bg_opacity: appearanceData.industrial_services_bg_opacity ?? 1,
          industrial_services_card_color: appearanceData.industrial_services_card_color || '#ffffff',
          industrial_services_card_opacity: appearanceData.industrial_services_card_opacity ?? 0.95,
          industrial_services_title_color: appearanceData.industrial_services_title_color || '#0f172a',
          industrial_services_text_color: appearanceData.industrial_services_text_color || '#475569',
          industrial_services_button_color: appearanceData.industrial_services_button_color || '#10b981',
          industrial_services_button_text_color: appearanceData.industrial_services_button_text_color || '#ffffff',
          industrial_process_title: appearanceData.industrial_process_title || '',
          industrial_process_step_1: appearanceData.industrial_process_step_1 || '',
          industrial_process_step_2: appearanceData.industrial_process_step_2 || '',
          industrial_process_step_3: appearanceData.industrial_process_step_3 || '',
          industrial_process_step_4: appearanceData.industrial_process_step_4 || '',
          industrial_process_bg_color: appearanceData.industrial_process_bg_color || '#ffffff',
          industrial_process_bg_opacity: appearanceData.industrial_process_bg_opacity ?? 0.95,
          industrial_process_card_color: appearanceData.industrial_process_card_color || '#f8fafc',
          industrial_process_card_opacity: appearanceData.industrial_process_card_opacity ?? 0.9,
          industrial_process_title_color: appearanceData.industrial_process_title_color || '#0f172a',
          industrial_process_text_color: appearanceData.industrial_process_text_color || '#334155',
          industrial_projects_title: appearanceData.industrial_projects_title || '',
          industrial_projects_subtitle: appearanceData.industrial_projects_subtitle || '',
          industrial_projects_cta: appearanceData.industrial_projects_cta || '',
          industrial_projects_bg_color: appearanceData.industrial_projects_bg_color || '#ffffff',
          industrial_projects_bg_opacity: appearanceData.industrial_projects_bg_opacity ?? 1,
          industrial_projects_card_color: appearanceData.industrial_projects_card_color || '#ffffff',
          industrial_projects_card_opacity: appearanceData.industrial_projects_card_opacity ?? 0.95,
          industrial_projects_title_color: appearanceData.industrial_projects_title_color || '#0f172a',
          industrial_projects_text_color: appearanceData.industrial_projects_text_color || '#475569',
          industrial_projects_button_color: appearanceData.industrial_projects_button_color || '#ffffff',
          industrial_projects_button_text_color: appearanceData.industrial_projects_button_text_color || '#334155',
          industrial_projects: appearanceData.industrial_projects || [],
          industrial_coverage_title: appearanceData.industrial_coverage_title || '',
          industrial_coverage_subtitle: appearanceData.industrial_coverage_subtitle || '',
          industrial_coverage_chip_1: appearanceData.industrial_coverage_chip_1 || '',
          industrial_coverage_chip_2: appearanceData.industrial_coverage_chip_2 || '',
          industrial_coverage_chip_3: appearanceData.industrial_coverage_chip_3 || '',
          industrial_coverage_note: appearanceData.industrial_coverage_note || '',
          industrial_coverage_bg_color: appearanceData.industrial_coverage_bg_color || '#ffffff',
          industrial_coverage_bg_opacity: appearanceData.industrial_coverage_bg_opacity ?? 0.95,
          industrial_coverage_card_color: appearanceData.industrial_coverage_card_color || '#f8fafc',
          industrial_coverage_card_opacity: appearanceData.industrial_coverage_card_opacity ?? 0.95,
          industrial_coverage_title_color: appearanceData.industrial_coverage_title_color || '#0f172a',
          industrial_coverage_text_color: appearanceData.industrial_coverage_text_color || '#475569',
          industrial_coverage_chip_bg_color: appearanceData.industrial_coverage_chip_bg_color || '#ffffff',
          industrial_coverage_chip_text_color: appearanceData.industrial_coverage_chip_text_color || '#475569',
          industrial_form_title: appearanceData.industrial_form_title || '',
          industrial_form_subtitle: appearanceData.industrial_form_subtitle || '',
          industrial_form_name_placeholder: appearanceData.industrial_form_name_placeholder || '',
          industrial_form_phone_placeholder: appearanceData.industrial_form_phone_placeholder || '',
          industrial_form_location_placeholder: appearanceData.industrial_form_location_placeholder || '',
          industrial_form_service_placeholder: appearanceData.industrial_form_service_placeholder || '',
          industrial_form_urgency_placeholder: appearanceData.industrial_form_urgency_placeholder || '',
          industrial_form_description_placeholder: appearanceData.industrial_form_description_placeholder || '',
          industrial_form_cta: appearanceData.industrial_form_cta || '',
          industrial_form_bg_color: appearanceData.industrial_form_bg_color || '#ffffff',
          industrial_form_bg_opacity: appearanceData.industrial_form_bg_opacity ?? 0.95,
          industrial_form_title_color: appearanceData.industrial_form_title_color || '#0f172a',
          industrial_form_text_color: appearanceData.industrial_form_text_color || '#475569',
          industrial_form_button_color: appearanceData.industrial_form_button_color || '#10b981',
          industrial_form_button_text_color: appearanceData.industrial_form_button_text_color || '#ffffff',
          industrial_footer_bg_color: appearanceData.industrial_footer_bg_color || '#0e1624',
          industrial_footer_text_color: appearanceData.industrial_footer_text_color || '#e2e8f0',
          industrial_footer_link_color: appearanceData.industrial_footer_link_color || '#86efac',
        });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppearance = (patch: Partial<typeof appearance>) => {
    setAppearance((prev) => ({ ...prev, ...patch }));
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
        updateAppearance({ logo_url: url });
      } else {
        updateAppearance({ banner_url: url });
      }
      
      toast.success('Imagen subida correctamente');
    } catch (error) {
      toast.error('Error al subir imagen');
      handleError(error);
    }
  };

  const createProjectId = () => `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const addProject = () => {
    const nextProject: IndustrialProjectMedia = {
      id: createProjectId(),
      title: '',
      location: '',
      result: '',
      images: [],
      video_url: '',
    };
    updateAppearance({ industrial_projects: [...appearance.industrial_projects, nextProject] });
  };

  const updateProject = (index: number, patch: Partial<IndustrialProjectMedia>) => {
    const next = [...appearance.industrial_projects];
    next[index] = { ...next[index], ...patch };
    updateAppearance({ industrial_projects: next });
  };

  const removeProject = (index: number) => {
    const next = appearance.industrial_projects.filter((_, i) => i !== index);
    updateAppearance({ industrial_projects: next });
  };

  const removeProjectImage = (projectIndex: number, imageIndex: number) => {
    const project = appearance.industrial_projects[projectIndex];
    const nextImages = (project.images || []).filter((_, i) => i !== imageIndex);
    updateProject(projectIndex, { images: nextImages });
  };

  const handleProjectImageUpload = async (projectIndex: number, files: FileList | null) => {
    if (!firestoreUser?.company_id || !files?.length) return;
    const project = appearance.industrial_projects[projectIndex];
    const existing = project.images || [];
    const remainingSlots = Math.max(0, 4 - existing.length);
    const toUpload = Array.from(files).slice(0, remainingSlots);

    if (toUpload.length === 0) {
      toast.error('Este proyecto ya tiene 4 imagenes.');
      return;
    }

    try {
      const uploads = await Promise.all(
        toUpload.map((file, idx) =>
          uploadImage(
            file,
            `companies/${firestoreUser.company_id}/industrial_projects/${project.id || createProjectId()}_${Date.now()}_${idx}`,
            { width: 1600, height: 900, maxSizeKB: 1200, format: 'image/jpeg', quality: 0.9 }
          )
        )
      );
      updateProject(projectIndex, { images: [...existing, ...uploads] });
      toast.success('Imagenes cargadas');
    } catch (error) {
      toast.error('Error al subir imagenes');
      handleError(error);
    }
  };

  const handleHeroBackgroundUpload = async (file: File) => {
    if (!firestoreUser?.company_id) return;
    try {
      const path = `companies/${firestoreUser.company_id}/industrial_hero_${Date.now()}`;
      const url = await uploadImage(file, path, { width: 1920, height: 1080, maxSizeKB: 1400, format: 'image/jpeg', quality: 0.9 });
      updateAppearance({ industrial_hero_background_image: url });
      toast.success('Fondo del hero actualizado');
    } catch (error) {
      toast.error('Error al subir fondo del hero');
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

  const isConstructionMaintenance =
    (company?.category_id || company?.categoryId || '').toLowerCase() === 'construccion_mantencion';

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
          {isConstructionMaintenance && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Configuracion de apariencia exclusiva para Construccion y Mantenciones.
            </div>
          )}
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

          {isConstructionMaintenance && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Hero - Fondo</h2>
                  <p className="text-xs text-gray-500">Imagen principal del hero (no reemplaza el background global).</p>
                </div>
                {appearance.industrial_hero_background_image && (
                  <button
                    type="button"
                    onClick={() => updateAppearance({ industrial_hero_background_image: '' })}
                    className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Eliminar fondo
                  </button>
                )}
              </div>
              {appearance.industrial_hero_background_image && (
                <img
                  src={appearance.industrial_hero_background_image}
                  alt="Hero fondo"
                  className="w-full max-h-56 object-cover rounded-md border"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleHeroBackgroundUpload(file);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Color overlay
                  <input
                    type="color"
                    value={appearance.industrial_hero_overlay_color}
                    onChange={(e) => updateAppearance({ industrial_hero_overlay_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Opacidad overlay
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((appearance.industrial_hero_overlay_opacity ?? 0.85) * 100)}
                    onChange={(e) =>
                      updateAppearance({ industrial_hero_overlay_opacity: Number(e.target.value) / 100 })
                    }
                    className="mt-2 w-full"
                  />
                </label>
              </div>
            </div>
          )}

          {isConstructionMaintenance && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Hero - Textos y botones</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  H1
                  <input
                    type="text"
                    value={appearance.industrial_hero_title}
                    onChange={(e) => updateAppearance({ industrial_hero_title: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Subtitulo
                  <input
                    type="text"
                    value={appearance.industrial_hero_subtitle}
                    onChange={(e) => updateAppearance({ industrial_hero_subtitle: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Badge 1
                  <input
                    type="text"
                    value={appearance.industrial_hero_badge_1}
                    onChange={(e) => updateAppearance({ industrial_hero_badge_1: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Badge 2
                  <input
                    type="text"
                    value={appearance.industrial_hero_badge_2}
                    onChange={(e) => updateAppearance({ industrial_hero_badge_2: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Badge 3
                  <input
                    type="text"
                    value={appearance.industrial_hero_badge_3}
                    onChange={(e) => updateAppearance({ industrial_hero_badge_3: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  CTA primaria
                  <input
                    type="text"
                    value={appearance.industrial_hero_cta_primary}
                    onChange={(e) => updateAppearance({ industrial_hero_cta_primary: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  CTA secundaria
                  <input
                    type="text"
                    value={appearance.industrial_hero_cta_secondary}
                    onChange={(e) => updateAppearance({ industrial_hero_cta_secondary: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Color H1
                  <input
                    type="color"
                    value={appearance.industrial_hero_title_color}
                    onChange={(e) => updateAppearance({ industrial_hero_title_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color subtitulo
                  <input
                    type="color"
                    value={appearance.industrial_hero_subtitle_color}
                    onChange={(e) => updateAppearance({ industrial_hero_subtitle_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color kicker
                  <input
                    type="color"
                    value={appearance.industrial_hero_kicker_color}
                    onChange={(e) => updateAppearance({ industrial_hero_kicker_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color badges
                  <input
                    type="color"
                    value={appearance.industrial_hero_badge_bg_color}
                    onChange={(e) => updateAppearance({ industrial_hero_badge_bg_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Borde badges
                  <input
                    type="color"
                    value={appearance.industrial_hero_badge_border_color}
                    onChange={(e) => updateAppearance({ industrial_hero_badge_border_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color texto badges
                  <input
                    type="color"
                    value={appearance.industrial_hero_badge_text_color}
                    onChange={(e) => updateAppearance({ industrial_hero_badge_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Boton primario
                  <input
                    type="color"
                    value={appearance.industrial_hero_primary_button_color}
                    onChange={(e) => updateAppearance({ industrial_hero_primary_button_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Texto boton primario
                  <input
                    type="color"
                    value={appearance.industrial_hero_primary_button_text_color}
                    onChange={(e) => updateAppearance({ industrial_hero_primary_button_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Boton secundario
                  <input
                    type="color"
                    value={appearance.industrial_hero_secondary_button_color}
                    onChange={(e) => updateAppearance({ industrial_hero_secondary_button_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Texto boton secundario
                  <input
                    type="color"
                    value={appearance.industrial_hero_secondary_button_text_color}
                    onChange={(e) => updateAppearance({ industrial_hero_secondary_button_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
              </div>
            </div>
          )}

          {isConstructionMaintenance && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Ficha tecnica - Etiquetas y valores</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Label clientes
                  <input
                    type="text"
                    value={appearance.industrial_hero_card_label_clients}
                    onChange={(e) => updateAppearance({ industrial_hero_card_label_clients: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Valor clientes
                  <input
                    type="text"
                    value={appearance.industrial_hero_card_value_clients}
                    onChange={(e) => updateAppearance({ industrial_hero_card_value_clients: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Label cobertura
                  <input
                    type="text"
                    value={appearance.industrial_hero_card_label_coverage}
                    onChange={(e) => updateAppearance({ industrial_hero_card_label_coverage: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Valor cobertura
                  <input
                    type="text"
                    value={appearance.industrial_hero_card_value_coverage}
                    onChange={(e) => updateAppearance({ industrial_hero_card_value_coverage: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Label respuesta
                  <input
                    type="text"
                    value={appearance.industrial_hero_card_label_response}
                    onChange={(e) => updateAppearance({ industrial_hero_card_label_response: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Valor respuesta
                  <input
                    type="text"
                    value={appearance.industrial_hero_card_value_response}
                    onChange={(e) => updateAppearance({ industrial_hero_card_value_response: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Label servicios
                  <input
                    type="text"
                    value={appearance.industrial_hero_card_label_services}
                    onChange={(e) => updateAppearance({ industrial_hero_card_label_services: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Valor servicios
                  <input
                    type="text"
                    value={appearance.industrial_hero_card_value_services}
                    onChange={(e) => updateAppearance({ industrial_hero_card_value_services: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Label atencion
                  <input
                    type="text"
                    value={appearance.industrial_hero_card_label_attention}
                    onChange={(e) => updateAppearance({ industrial_hero_card_label_attention: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Valor atencion
                  <input
                    type="text"
                    value={appearance.industrial_hero_card_value_attention}
                    onChange={(e) => updateAppearance({ industrial_hero_card_value_attention: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color ficha tecnica
                  <input
                    type="color"
                    value={appearance.industrial_hero_card_color}
                    onChange={(e) => updateAppearance({ industrial_hero_card_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Opacidad ficha tecnica
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((appearance.industrial_hero_card_opacity ?? 0.16) * 100)}
                    onChange={(e) =>
                      updateAppearance({ industrial_hero_card_opacity: Number(e.target.value) / 100 })
                    }
                    className="mt-2 w-full"
                  />
                </label>
              </div>
            </div>
          )}

          {isConstructionMaintenance && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Barra de confianza</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Label 1
                  <input
                    type="text"
                    value={appearance.industrial_trust_label_1}
                    onChange={(e) => updateAppearance({ industrial_trust_label_1: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Label 2
                  <input
                    type="text"
                    value={appearance.industrial_trust_label_2}
                    onChange={(e) => updateAppearance({ industrial_trust_label_2: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Label 3
                  <input
                    type="text"
                    value={appearance.industrial_trust_label_3}
                    onChange={(e) => updateAppearance({ industrial_trust_label_3: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Label 4
                  <input
                    type="text"
                    value={appearance.industrial_trust_label_4}
                    onChange={(e) => updateAppearance({ industrial_trust_label_4: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Fondo
                  <input
                    type="color"
                    value={appearance.industrial_trust_bg_color}
                    onChange={(e) => updateAppearance({ industrial_trust_bg_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Opacidad fondo
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((appearance.industrial_trust_bg_opacity ?? 0.95) * 100)}
                    onChange={(e) => updateAppearance({ industrial_trust_bg_opacity: Number(e.target.value) / 100 })}
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color texto
                  <input
                    type="color"
                    value={appearance.industrial_trust_text_color}
                    onChange={(e) => updateAppearance({ industrial_trust_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color icono
                  <input
                    type="color"
                    value={appearance.industrial_trust_icon_bg_color}
                    onChange={(e) => updateAppearance({ industrial_trust_icon_bg_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
              </div>
            </div>
          )}

          {isConstructionMaintenance && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Servicios</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Titulo
                  <input
                    type="text"
                    value={appearance.industrial_services_title}
                    onChange={(e) => updateAppearance({ industrial_services_title: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Subtitulo
                  <input
                    type="text"
                    value={appearance.industrial_services_subtitle}
                    onChange={(e) => updateAppearance({ industrial_services_subtitle: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  CTA
                  <input
                    type="text"
                    value={appearance.industrial_services_cta}
                    onChange={(e) => updateAppearance({ industrial_services_cta: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Fondo seccion
                  <input
                    type="color"
                    value={appearance.industrial_services_bg_color}
                    onChange={(e) => updateAppearance({ industrial_services_bg_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Opacidad seccion
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((appearance.industrial_services_bg_opacity ?? 1) * 100)}
                    onChange={(e) => updateAppearance({ industrial_services_bg_opacity: Number(e.target.value) / 100 })}
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Fondo tarjetas
                  <input
                    type="color"
                    value={appearance.industrial_services_card_color}
                    onChange={(e) => updateAppearance({ industrial_services_card_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Opacidad tarjetas
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((appearance.industrial_services_card_opacity ?? 0.95) * 100)}
                    onChange={(e) => updateAppearance({ industrial_services_card_opacity: Number(e.target.value) / 100 })}
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color titulo
                  <input
                    type="color"
                    value={appearance.industrial_services_title_color}
                    onChange={(e) => updateAppearance({ industrial_services_title_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color texto
                  <input
                    type="color"
                    value={appearance.industrial_services_text_color}
                    onChange={(e) => updateAppearance({ industrial_services_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Boton CTA
                  <input
                    type="color"
                    value={appearance.industrial_services_button_color}
                    onChange={(e) => updateAppearance({ industrial_services_button_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Texto boton CTA
                  <input
                    type="color"
                    value={appearance.industrial_services_button_text_color}
                    onChange={(e) => updateAppearance({ industrial_services_button_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
              </div>
            </div>
          )}

          {isConstructionMaintenance && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Proceso</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Titulo
                  <input
                    type="text"
                    value={appearance.industrial_process_title}
                    onChange={(e) => updateAppearance({ industrial_process_title: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Paso 1
                  <input
                    type="text"
                    value={appearance.industrial_process_step_1}
                    onChange={(e) => updateAppearance({ industrial_process_step_1: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Paso 2
                  <input
                    type="text"
                    value={appearance.industrial_process_step_2}
                    onChange={(e) => updateAppearance({ industrial_process_step_2: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Paso 3
                  <input
                    type="text"
                    value={appearance.industrial_process_step_3}
                    onChange={(e) => updateAppearance({ industrial_process_step_3: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Paso 4
                  <input
                    type="text"
                    value={appearance.industrial_process_step_4}
                    onChange={(e) => updateAppearance({ industrial_process_step_4: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Fondo seccion
                  <input
                    type="color"
                    value={appearance.industrial_process_bg_color}
                    onChange={(e) => updateAppearance({ industrial_process_bg_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Opacidad seccion
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((appearance.industrial_process_bg_opacity ?? 0.95) * 100)}
                    onChange={(e) => updateAppearance({ industrial_process_bg_opacity: Number(e.target.value) / 100 })}
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Fondo tarjetas
                  <input
                    type="color"
                    value={appearance.industrial_process_card_color}
                    onChange={(e) => updateAppearance({ industrial_process_card_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Opacidad tarjetas
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((appearance.industrial_process_card_opacity ?? 0.9) * 100)}
                    onChange={(e) => updateAppearance({ industrial_process_card_opacity: Number(e.target.value) / 100 })}
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color titulo
                  <input
                    type="color"
                    value={appearance.industrial_process_title_color}
                    onChange={(e) => updateAppearance({ industrial_process_title_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color texto
                  <input
                    type="color"
                    value={appearance.industrial_process_text_color}
                    onChange={(e) => updateAppearance({ industrial_process_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
              </div>
            </div>
          )}

          {isConstructionMaintenance && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Proyectos</h2>
                  <p className="text-xs text-gray-500">Agrega proyectos con hasta 4 imagenes o un video de YouTube.</p>
                </div>
                <button
                  type="button"
                  onClick={addProject}
                  className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Agregar proyecto
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Titulo
                  <input
                    type="text"
                    value={appearance.industrial_projects_title}
                    onChange={(e) => updateAppearance({ industrial_projects_title: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Subtitulo
                  <input
                    type="text"
                    value={appearance.industrial_projects_subtitle}
                    onChange={(e) => updateAppearance({ industrial_projects_subtitle: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  CTA
                  <input
                    type="text"
                    value={appearance.industrial_projects_cta}
                    onChange={(e) => updateAppearance({ industrial_projects_cta: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Fondo seccion
                  <input
                    type="color"
                    value={appearance.industrial_projects_bg_color}
                    onChange={(e) => updateAppearance({ industrial_projects_bg_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Opacidad seccion
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((appearance.industrial_projects_bg_opacity ?? 1) * 100)}
                    onChange={(e) => updateAppearance({ industrial_projects_bg_opacity: Number(e.target.value) / 100 })}
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Fondo tarjetas
                  <input
                    type="color"
                    value={appearance.industrial_projects_card_color}
                    onChange={(e) => updateAppearance({ industrial_projects_card_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Opacidad tarjetas
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((appearance.industrial_projects_card_opacity ?? 0.95) * 100)}
                    onChange={(e) => updateAppearance({ industrial_projects_card_opacity: Number(e.target.value) / 100 })}
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color titulo
                  <input
                    type="color"
                    value={appearance.industrial_projects_title_color}
                    onChange={(e) => updateAppearance({ industrial_projects_title_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color texto
                  <input
                    type="color"
                    value={appearance.industrial_projects_text_color}
                    onChange={(e) => updateAppearance({ industrial_projects_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Boton CTA
                  <input
                    type="color"
                    value={appearance.industrial_projects_button_color}
                    onChange={(e) => updateAppearance({ industrial_projects_button_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Texto boton CTA
                  <input
                    type="color"
                    value={appearance.industrial_projects_button_text_color}
                    onChange={(e) => updateAppearance({ industrial_projects_button_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
              </div>
              <div className="space-y-4">
                {appearance.industrial_projects.map((project, index) => (
                  <div key={project.id || index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">Proyecto {index + 1}</h3>
                      <button
                        type="button"
                        onClick={() => removeProject(index)}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        value={project.title || ''}
                        onChange={(e) => updateProject(index, { title: e.target.value })}
                        placeholder="Titulo del proyecto"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={project.location || ''}
                        onChange={(e) => updateProject(index, { location: e.target.value })}
                        placeholder="Ubicacion"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={project.result || ''}
                        onChange={(e) => updateProject(index, { result: e.target.value })}
                        placeholder="Resultado"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={project.video_url || ''}
                        onChange={(e) => updateProject(index, { video_url: e.target.value })}
                        placeholder="URL YouTube (opcional)"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    {project.video_url && (
                      <p className="text-xs text-amber-600">
                        Este proyecto usa video. Si quieres imagenes, deja el video vacio.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {(project.images || []).map((image, imgIndex) => (
                        <div key={`${image}-${imgIndex}`} className="relative">
                          <img src={image} alt="Proyecto" className="h-20 w-28 object-cover rounded-md border" />
                          <button
                            type="button"
                            onClick={() => removeProjectImage(index, imgIndex)}
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <label className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-xs ${project.video_url ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 cursor-pointer hover:bg-gray-50'}`}>
                        + Agregar imagenes
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleProjectImageUpload(index, e.target.files)}
                          className="hidden"
                          disabled={Boolean(project.video_url)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isConstructionMaintenance && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Cobertura</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Titulo
                  <input
                    type="text"
                    value={appearance.industrial_coverage_title}
                    onChange={(e) => updateAppearance({ industrial_coverage_title: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Subtitulo
                  <input
                    type="text"
                    value={appearance.industrial_coverage_subtitle}
                    onChange={(e) => updateAppearance({ industrial_coverage_subtitle: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Chip 1
                  <input
                    type="text"
                    value={appearance.industrial_coverage_chip_1}
                    onChange={(e) => updateAppearance({ industrial_coverage_chip_1: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Chip 2
                  <input
                    type="text"
                    value={appearance.industrial_coverage_chip_2}
                    onChange={(e) => updateAppearance({ industrial_coverage_chip_2: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Chip 3
                  <input
                    type="text"
                    value={appearance.industrial_coverage_chip_3}
                    onChange={(e) => updateAppearance({ industrial_coverage_chip_3: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700 md:col-span-2">
                  Nota
                  <textarea
                    value={appearance.industrial_coverage_note}
                    onChange={(e) => updateAppearance({ industrial_coverage_note: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    rows={2}
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Fondo seccion
                  <input
                    type="color"
                    value={appearance.industrial_coverage_bg_color}
                    onChange={(e) => updateAppearance({ industrial_coverage_bg_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Opacidad seccion
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((appearance.industrial_coverage_bg_opacity ?? 0.95) * 100)}
                    onChange={(e) => updateAppearance({ industrial_coverage_bg_opacity: Number(e.target.value) / 100 })}
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Fondo tarjeta info
                  <input
                    type="color"
                    value={appearance.industrial_coverage_card_color}
                    onChange={(e) => updateAppearance({ industrial_coverage_card_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Opacidad tarjeta
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((appearance.industrial_coverage_card_opacity ?? 0.95) * 100)}
                    onChange={(e) => updateAppearance({ industrial_coverage_card_opacity: Number(e.target.value) / 100 })}
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color titulo
                  <input
                    type="color"
                    value={appearance.industrial_coverage_title_color}
                    onChange={(e) => updateAppearance({ industrial_coverage_title_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color texto
                  <input
                    type="color"
                    value={appearance.industrial_coverage_text_color}
                    onChange={(e) => updateAppearance({ industrial_coverage_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Fondo chips
                  <input
                    type="color"
                    value={appearance.industrial_coverage_chip_bg_color}
                    onChange={(e) => updateAppearance({ industrial_coverage_chip_bg_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Texto chips
                  <input
                    type="color"
                    value={appearance.industrial_coverage_chip_text_color}
                    onChange={(e) => updateAppearance({ industrial_coverage_chip_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
              </div>
            </div>
          )}

          {isConstructionMaintenance && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Formulario</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Titulo
                  <input
                    type="text"
                    value={appearance.industrial_form_title}
                    onChange={(e) => updateAppearance({ industrial_form_title: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Subtitulo
                  <input
                    type="text"
                    value={appearance.industrial_form_subtitle}
                    onChange={(e) => updateAppearance({ industrial_form_subtitle: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Placeholder nombre
                  <input
                    type="text"
                    value={appearance.industrial_form_name_placeholder}
                    onChange={(e) => updateAppearance({ industrial_form_name_placeholder: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Placeholder telefono
                  <input
                    type="text"
                    value={appearance.industrial_form_phone_placeholder}
                    onChange={(e) => updateAppearance({ industrial_form_phone_placeholder: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Placeholder ubicacion
                  <input
                    type="text"
                    value={appearance.industrial_form_location_placeholder}
                    onChange={(e) => updateAppearance({ industrial_form_location_placeholder: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Placeholder servicio
                  <input
                    type="text"
                    value={appearance.industrial_form_service_placeholder}
                    onChange={(e) => updateAppearance({ industrial_form_service_placeholder: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Placeholder urgencia
                  <input
                    type="text"
                    value={appearance.industrial_form_urgency_placeholder}
                    onChange={(e) => updateAppearance({ industrial_form_urgency_placeholder: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Placeholder descripcion
                  <input
                    type="text"
                    value={appearance.industrial_form_description_placeholder}
                    onChange={(e) => updateAppearance({ industrial_form_description_placeholder: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  CTA formulario
                  <input
                    type="text"
                    value={appearance.industrial_form_cta}
                    onChange={(e) => updateAppearance({ industrial_form_cta: e.target.value })}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Fondo seccion
                  <input
                    type="color"
                    value={appearance.industrial_form_bg_color}
                    onChange={(e) => updateAppearance({ industrial_form_bg_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Opacidad seccion
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((appearance.industrial_form_bg_opacity ?? 0.95) * 100)}
                    onChange={(e) => updateAppearance({ industrial_form_bg_opacity: Number(e.target.value) / 100 })}
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color titulo
                  <input
                    type="color"
                    value={appearance.industrial_form_title_color}
                    onChange={(e) => updateAppearance({ industrial_form_title_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color texto
                  <input
                    type="color"
                    value={appearance.industrial_form_text_color}
                    onChange={(e) => updateAppearance({ industrial_form_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Color boton
                  <input
                    type="color"
                    value={appearance.industrial_form_button_color}
                    onChange={(e) => updateAppearance({ industrial_form_button_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Texto boton
                  <input
                    type="color"
                    value={appearance.industrial_form_button_text_color}
                    onChange={(e) => updateAppearance({ industrial_form_button_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
              </div>
            </div>
          )}

          {isConstructionMaintenance && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Footer</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm text-gray-700">
                  Fondo
                  <input
                    type="color"
                    value={appearance.industrial_footer_bg_color}
                    onChange={(e) => updateAppearance({ industrial_footer_bg_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Texto
                  <input
                    type="color"
                    value={appearance.industrial_footer_text_color}
                    onChange={(e) => updateAppearance({ industrial_footer_text_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  Links
                  <input
                    type="color"
                    value={appearance.industrial_footer_link_color}
                    onChange={(e) => updateAppearance({ industrial_footer_link_color: e.target.value })}
                    className="mt-2 h-10 w-full"
                  />
                </label>
              </div>
            </div>
          )}

          {!isConstructionMaintenance && (
            <>
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
            </>
          )}

          {!isConstructionMaintenance && (
            <>
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
            </>
          )}

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
