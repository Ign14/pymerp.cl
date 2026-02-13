import { type FormEvent, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import AnimatedButton from '../../animations/AnimatedButton';
import AnimatedModal from '../../animations/AnimatedModal';
import { type PublicLayoutProps } from '../../../pages/public/layouts/types';
import { isModuleEnabled, resolveCategoryId } from '../../../config/categories';
import { createWorkOrderLiteRequest } from '../../../services/workOrdersLite';
import { createLead } from '../../../services/leads';
import { sanitizeText, isValidPhone } from '../../../services/validation';
import { RateLimiter } from '../../../utils/security';
import type { IndustrialProjectMedia, Service } from '../../../types';

type FormState = {
  name: string;
  phone: string;
  location: string;
  serviceType: string;
  urgency: string;
  description: string;
};

const PLACEHOLDER_SERVICES = [
  {
    title: 'Instalaciones electricas / canalizaciones',
    bullets: ['Tableros y canalizaciones', 'Cumplimiento normativo', 'Ejecucion en terreno'],
  },
  {
    title: 'Mantencion preventiva/correctiva',
    bullets: ['Inspecciones programadas', 'Correccion de fallas criticas', 'Reportes tecnicos'],
  },
  {
    title: 'Normalizacion / revisiones',
    bullets: ['Levantamientos en terreno', 'Listas de chequeo', 'Entrega de respaldo'],
  },
  {
    title: 'Energias renovables / fotovoltaico',
    bullets: ['Evaluacion de factibilidad', 'Instalacion y puesta en marcha', 'Soporte post venta'],
  },
];

const FALLBACK_SERVICES = [
  {
    title: 'Obras civiles y montaje',
    bullets: ['Coordinacion de cuadrillas', 'Control de calidad en terreno', 'Cumplimiento de plazos'],
  },
  {
    title: 'Mantencion preventiva/correctiva',
    bullets: ['Planificacion tecnica', 'Respuesta ante contingencias', 'Respaldo documental'],
  },
  {
    title: 'Normalizacion / revisiones',
    bullets: ['Checklist de seguridad', 'Informe de hallazgos', 'Recomendaciones tecnicas'],
  },
  {
    title: 'Trabajos en terreno',
    bullets: ['Logistica y equipos', 'Ejecucion segura', 'Entrega por etapas'],
  },
];

function createServiceBullets(service: Service): string[] {
  const raw = (service.description || '').split(/[\n.]/).map((item) => item.trim()).filter(Boolean);
  const bullets = raw.slice(0, 3);
  while (bullets.length < 3) {
    bullets.push('Planificacion tecnica y ejecucion en terreno');
  }
  return bullets;
}

const withOpacity = (color: string | undefined, opacity: number, fallback: string): string => {
  const base = (color || fallback || '').trim();
  const safeOpacity = Math.min(1, Math.max(0, opacity));
  if (!base) return `rgba(255,255,255,${safeOpacity})`;
  if (base.startsWith('rgba') || base.startsWith('rgb')) {
    return base.replace(/rgba?\(([^)]+)\)/, (_, values) => {
      const parts = values.split(',').map((v: string) => v.trim());
      const [r, g, b] = parts;
      return `rgba(${r}, ${g}, ${b}, ${safeOpacity})`;
    });
  }
  const normalized = base.replace('#', '');
  const fullHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const intVal = parseInt(fullHex.substring(0, 6), 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${safeOpacity})`;
};

const resolveValue = (value: string | undefined | null, fallback: string): string =>
  value && value.trim().length > 0 ? value : fallback;

const getYouTubeId = (url?: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return match?.[1] || null;
};

export function ConstruccionIndustrialPublicLayout(props: PublicLayoutProps) {
  const {
    company,
    services = [],
    appearance,
    theme,
    sections,
    contactActions,
    floatingCta,
    onWhatsAppClick,
  } = props;
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    location: '',
    serviceType: '',
    urgency: '',
    description: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'about' | 'mission' | null>(null);
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const rateLimiterRef = useRef(new RateLimiter(3, 60000));

  const text = useCallback(
    (key: string, fallback: string) => {
      const value = t(key);
      return value === key ? fallback : value;
    },
    [t]
  );

  const categoryId = resolveCategoryId(company);
  const allowWorkOrders = isModuleEnabled(categoryId, 'work-orders-lite');

  const availableServices = useMemo(
    () => services.filter((service) => service.status !== 'INACTIVE'),
    [services]
  );

  const projectAssets = useMemo(() => {
    const assets: string[] = [];
    const gallery =
      (company as any)?.project_photos ||
      (company as any)?.projects_gallery ||
      (company as any)?.gallery ||
      (company as any)?.projects;

    if (Array.isArray(gallery)) {
      gallery.forEach((item: any) => {
        if (typeof item === 'string' && item) assets.push(item);
        else if (item?.url) assets.push(item.url);
      });
    }

    const banner = appearance?.banner_url || (company as any)?.background_url;
    if (banner) assets.push(banner);

    services.forEach((service) => {
      if (service.image_url) assets.push(service.image_url);
    });

    return Array.from(new Set(assets)).filter(Boolean).slice(0, 9);
  }, [appearance?.banner_url, company, services]);

  const heroImage =
    appearance?.industrial_hero_background_image ||
    projectAssets[0] ||
    appearance?.banner_url ||
    (company as any)?.background_url ||
    '';

  const isElectrical = useMemo(() => {
    const raw = `${company.industry || ''} ${company.sector || ''}`.toLowerCase();
    const normalized = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized.includes('electric') || normalized.includes('electr');
  }, [company.industry, company.sector]);

  const heroTitle = resolveValue(
    appearance?.industrial_hero_title,
    isElectrical
      ? text(
          'publicPage.constructionIndustrial.heroTitleElectrical',
          'Soluciones electricas para obras, industria y agricultura'
        )
      : text(
          'publicPage.constructionIndustrial.heroTitleGeneral',
          'Soluciones para obras y mantenciones en terreno'
        )
  );

  const coverageLabel = company.region || company.commune || company.sector || text(
    'publicPage.constructionIndustrial.coverageFallback',
    'Cobertura a coordinar'
  );

  const heroSubtitle = resolveValue(
    appearance?.industrial_hero_subtitle,
    text('publicPage.constructionIndustrial.heroSubtitle', '{{service}} - {{region}}')
      .replace(
        '{{service}}',
        company.sector ||
          company.industry ||
          text('publicPage.constructionIndustrial.heroSubtitleService', 'Servicios tecnicos')
      )
      .replace('{{region}}', coverageLabel)
  );

  const servicePlaceholders = isElectrical ? PLACEHOLDER_SERVICES : FALLBACK_SERVICES;
  const projects: IndustrialProjectMedia[] = appearance?.industrial_projects?.length
    ? appearance.industrial_projects
    : [];
  const activeProject = activeProjectIndex !== null ? projects[activeProjectIndex] : null;
  const activeProjectVideoId = getYouTubeId(activeProject?.video_url);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!company?.id) return;
    setErrorMessage(null);

    const rateLimitKey = `workorder_${company.id}_${form.phone.replace(/\D/g, '')}`;
    if (!rateLimiterRef.current.isAllowed(rateLimitKey)) {
      setErrorMessage(text('publicPage.constructionIndustrial.form.rateLimit', 'Has enviado muchas solicitudes.'));
      setStatus('error');
      toast.error(text('publicPage.constructionIndustrial.form.rateLimit', 'Has enviado muchas solicitudes.'));
      return;
    }

    const trimmedName = sanitizeText(form.name, 100);
    const normalizedPhone = form.phone.replace(/\D/g, '');
    const normalizedService = form.serviceType ? sanitizeText(form.serviceType, 120) : undefined;
    const normalizedLocation = form.location ? sanitizeText(form.location, 120) : undefined;
    const normalizedUrgency = form.urgency ? sanitizeText(form.urgency, 80) : undefined;
    const normalizedDescription = form.description ? sanitizeText(form.description, 500) : undefined;

    if (!trimmedName || trimmedName.length < 2) {
      const message = text('publicPage.constructionIndustrial.form.validationName', 'Ingresa tu nombre completo.');
      setErrorMessage(message);
      setStatus('error');
      toast.error(message);
      return;
    }

    if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
      const message = text('publicPage.constructionIndustrial.form.validationPhone', 'Ingresa un WhatsApp valido.');
      setErrorMessage(message);
      setStatus('error');
      toast.error(message);
      return;
    }

    if (normalizedDescription && normalizedDescription.length > 500) {
      const message = text('publicPage.constructionIndustrial.form.validationDescription', 'La descripcion no puede exceder 500 caracteres.');
      setErrorMessage(message);
      setStatus('error');
      toast.error(message);
      return;
    }

    setStatus('sending');

    try {
      const detailParts = [
        normalizedLocation ? `Ubicacion: ${normalizedLocation}` : null,
        normalizedUrgency ? `Urgencia: ${normalizedUrgency}` : null,
        normalizedDescription ? `Detalle: ${normalizedDescription}` : null,
      ].filter(Boolean);
      const mergedDescription = detailParts.length ? detailParts.join(' | ') : undefined;

      let requestId: string;

      if (allowWorkOrders) {
        requestId = await createWorkOrderLiteRequest({
          company_id: company.id,
          requester_name: trimmedName,
          phone: normalizedPhone,
          service_type: normalizedService,
          description: mergedDescription,
          source: 'public-construction-industrial',
        });
      } else {
        const leadId = await createLead({
          company_id: company.id,
          intent: 'visit',
          name: trimmedName,
          whatsapp: normalizedPhone,
          message:
            mergedDescription ||
            text('publicPage.constructionIndustrial.form.defaultMessage', 'Solicitud de cotizacion para obra y mantencion.'),
          property_id: undefined,
          property_title: normalizedService,
          source: 'public-construction-industrial',
        });
        requestId = leadId;
      }

      setSubmittedRequestId(requestId);
      setStatus('success');
      setForm({
        name: '',
        phone: '',
        location: '',
        serviceType: '',
        urgency: '',
        description: '',
      });

      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (error: any) {
      console.error('Error submitting industrial construction request:', error);
      setStatus('error');
      const message = text('publicPage.constructionIndustrial.form.error', 'No pudimos enviar la solicitud.');
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handleWhatsAppContact = useCallback(() => {
    if (!company?.whatsapp) {
      toast.error(text('common.errorWhatsAppNotConfigured', 'WhatsApp no configurado.'));
      return;
    }

    const message =
      company.booking_message ||
      text(
        'publicPage.constructionIndustrial.form.whatsappMessage',
        'Hola, quiero coordinar una visita tecnica para obras y mantenciones.'
      );
    const url = `https://wa.me/${company.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    try {
      const whatsappWindow = window.open(url, '_blank');
      if (!whatsappWindow || whatsappWindow.closed || typeof whatsappWindow.closed === 'undefined') {
        window.location.href = url;
      }
    } catch (error) {
      toast.error(text('common.errorOpeningWhatsApp', 'No pudimos abrir WhatsApp.'));
    }
  }, [company, text]);

  const heroTitleColor = appearance?.industrial_hero_title_color || '#ffffff';
  const heroSubtitleColor = appearance?.industrial_hero_subtitle_color || '#e2e8f0';
  const heroKickerColor = appearance?.industrial_hero_kicker_color || '#fbbf24';
  const heroBadgeBg = appearance?.industrial_hero_badge_bg_color || '#f59e0b';
  const heroBadgeBorder = appearance?.industrial_hero_badge_border_color || '#f59e0b';
  const heroBadgeText = appearance?.industrial_hero_badge_text_color || '#fef3c7';
  const heroPrimaryButtonColor = appearance?.industrial_hero_primary_button_color || '#10b981';
  const heroPrimaryButtonText = appearance?.industrial_hero_primary_button_text_color || '#ffffff';
  const heroSecondaryButtonColor = appearance?.industrial_hero_secondary_button_color || 'rgba(255,255,255,0.1)';
  const heroSecondaryButtonText = appearance?.industrial_hero_secondary_button_text_color || '#ffffff';
  const heroCardColor = withOpacity(
    appearance?.industrial_hero_card_color,
    appearance?.industrial_hero_card_opacity ?? 0.16,
    '#ffffff'
  );
  const heroOverlayColor = appearance?.industrial_hero_overlay_color || '#0e1624';
  const heroOverlayOpacity = appearance?.industrial_hero_overlay_opacity ?? 0.85;

  const trustBg = withOpacity(
    appearance?.industrial_trust_bg_color,
    appearance?.industrial_trust_bg_opacity ?? 0.95,
    '#ffffff'
  );
  const trustTextColor = appearance?.industrial_trust_text_color || '#334155';
  const trustIconBg = appearance?.industrial_trust_icon_bg_color || '#0f172a';

  const servicesBg = withOpacity(
    appearance?.industrial_services_bg_color,
    appearance?.industrial_services_bg_opacity ?? 1,
    '#ffffff'
  );
  const servicesCardBg = withOpacity(
    appearance?.industrial_services_card_color,
    appearance?.industrial_services_card_opacity ?? 0.95,
    '#ffffff'
  );
  const servicesTitleColor = appearance?.industrial_services_title_color || '#0f172a';
  const servicesTextColor = appearance?.industrial_services_text_color || '#475569';
  const servicesButtonColor = appearance?.industrial_services_button_color || '#10b981';
  const servicesButtonText = appearance?.industrial_services_button_text_color || '#ffffff';

  const processBg = withOpacity(
    appearance?.industrial_process_bg_color,
    appearance?.industrial_process_bg_opacity ?? 0.95,
    '#ffffff'
  );
  const processCardBg = withOpacity(
    appearance?.industrial_process_card_color,
    appearance?.industrial_process_card_opacity ?? 0.9,
    '#f8fafc'
  );
  const processTitleColor = appearance?.industrial_process_title_color || '#0f172a';
  const processTextColor = appearance?.industrial_process_text_color || '#334155';

  const projectsBg = withOpacity(
    appearance?.industrial_projects_bg_color,
    appearance?.industrial_projects_bg_opacity ?? 1,
    '#ffffff'
  );
  const projectsCardBg = withOpacity(
    appearance?.industrial_projects_card_color,
    appearance?.industrial_projects_card_opacity ?? 0.95,
    '#ffffff'
  );
  const projectsTitleColor = appearance?.industrial_projects_title_color || '#0f172a';
  const projectsTextColor = appearance?.industrial_projects_text_color || '#475569';
  const projectsButtonColor = appearance?.industrial_projects_button_color || '#ffffff';
  const projectsButtonText = appearance?.industrial_projects_button_text_color || '#334155';

  const coverageBg = withOpacity(
    appearance?.industrial_coverage_bg_color,
    appearance?.industrial_coverage_bg_opacity ?? 0.95,
    '#ffffff'
  );
  const coverageTitleColor = appearance?.industrial_coverage_title_color || '#0f172a';
  const coverageTextColor = appearance?.industrial_coverage_text_color || '#475569';
  const coverageChipBg = appearance?.industrial_coverage_chip_bg_color || '#ffffff';
  const coverageChipText = appearance?.industrial_coverage_chip_text_color || '#475569';

  const formBg = withOpacity(
    appearance?.industrial_form_bg_color,
    appearance?.industrial_form_bg_opacity ?? 0.95,
    '#ffffff'
  );
  const formTitleColor = appearance?.industrial_form_title_color || '#0f172a';
  const formTextColor = appearance?.industrial_form_text_color || '#475569';
  const formButtonColor = appearance?.industrial_form_button_color || '#10b981';
  const formButtonText = appearance?.industrial_form_button_text_color || '#ffffff';

  const footerBg = appearance?.industrial_footer_bg_color || '#0e1624';
  const footerTextColor = appearance?.industrial_footer_text_color || '#e2e8f0';
  const footerLinkColor = appearance?.industrial_footer_link_color || '#86efac';

  const navItems = [
    { id: 'services', label: text('publicPage.constructionIndustrial.nav.services', 'Servicios') },
    { id: 'projects', label: text('publicPage.constructionIndustrial.nav.projects', 'Proyectos') },
    { id: 'location', label: text('publicPage.constructionIndustrial.nav.coverage', 'Cobertura') },
    { id: 'contact', label: text('publicPage.constructionIndustrial.nav.quote', 'Cotizar') },
  ];

  return (
    <div className="-mt-[2cm] space-y-10 pb-10 sm:mt-0">
      <header className="hidden sm:block sticky top-0 z-30 h-[72px] border-b border-white/10 bg-[#0e1624]">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            {appearance?.logo_url ? (
              <img src={appearance.logo_url} alt={company.name} className="h-[calc(2.5rem+0.5cm)] w-[calc(2.5rem+0.5cm)] rounded-md object-contain" />
            ) : (
              <div className="flex h-[calc(2.5rem+0.5cm)] w-[calc(2.5rem+0.5cm)] items-center justify-center rounded-md bg-white/10 text-sm font-semibold text-white">
                {company.name?.slice(0, 2)?.toUpperCase() || 'OB'}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white">{company.name}</p>
              <p className="text-xs text-slate-300">{coverageLabel}</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6 text-sm text-slate-200">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#section-${item.id}`}
                className="transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-4">
            <button
              type="button"
              onClick={onWhatsAppClick ?? handleWhatsAppContact}
              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              {text('publicPage.constructionIndustrial.header.whatsapp', 'WhatsApp')}
            </button>
            <a
              href={`tel:${company.whatsapp}`}
              className="text-xs font-semibold text-slate-200 hover:text-white"
            >
              {company.whatsapp}
            </a>
          </div>
        </div>
      </header>

      <section
        id="section-hero"
        className="relative min-h-[85vh] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 text-white lg:min-h-[90vh]"
      >
        {heroImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
            aria-hidden="true"
          />
        ) : null}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${withOpacity(heroOverlayColor, heroOverlayOpacity, '#0e1624')} 0%, ${withOpacity(
              heroOverlayColor,
              Math.max(0, heroOverlayOpacity - 0.15),
              '#0e1624'
            )} 50%, ${withOpacity(heroOverlayColor, Math.min(1, heroOverlayOpacity + 0.05), '#0e1624')} 100%)`,
          }}
        />
        <div className="relative z-10 grid gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-16">
          <div className="space-y-6">
            <p
              className="text-xs font-semibold uppercase tracking-[0.32em]"
              style={{ color: heroKickerColor }}
            >
              {text('publicPage.constructionIndustrial.heroKicker', 'Industrial / Obras')}
            </p>
            <h1
              className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
              style={{ fontFamily: theme.fontTitle, color: heroTitleColor }}
            >
              {heroTitle}
            </h1>
            <p className="text-lg" style={{ color: heroSubtitleColor }}>
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                resolveValue(
                  appearance?.industrial_hero_badge_1,
                  text('publicPage.constructionIndustrial.badge.response', 'Respuesta < 24h')
                ),
                resolveValue(
                  appearance?.industrial_hero_badge_2,
                  text('publicPage.constructionIndustrial.badge.onSite', 'Visita tecnica en terreno')
                ),
                resolveValue(
                  appearance?.industrial_hero_badge_3,
                  text('publicPage.constructionIndustrial.badge.compliance', 'Cumplimiento normativo')
                ),
              ].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border px-3 py-1 text-xs font-semibold"
                  style={{
                    borderColor: withOpacity(heroBadgeBorder, 0.4, heroBadgeBorder),
                    backgroundColor: withOpacity(heroBadgeBg, 0.1, heroBadgeBg),
                    color: heroBadgeText,
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToForm}
                className="rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: heroPrimaryButtonColor,
                  color: heroPrimaryButtonText,
                  outlineColor: heroPrimaryButtonColor,
                }}
              >
                {resolveValue(
                  appearance?.industrial_hero_cta_primary,
                  text('publicPage.constructionIndustrial.heroCtaPrimary', 'Solicitar visita tecnica')
                )}
              </button>
              <button
                type="button"
                onClick={onWhatsAppClick ?? handleWhatsAppContact}
                className="rounded-full border px-5 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  borderColor: withOpacity(heroSecondaryButtonColor, 0.6, heroSecondaryButtonColor),
                  backgroundColor: heroSecondaryButtonColor,
                  color: heroSecondaryButtonText,
                }}
              >
                {resolveValue(
                  appearance?.industrial_hero_cta_secondary,
                  text('publicPage.constructionIndustrial.heroCtaSecondary', 'Cotizar por WhatsApp')
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <aside
              className="rounded-2xl border border-white/10 p-6 shadow-xl backdrop-blur-sm"
              style={{ backgroundColor: heroCardColor }}
            >
            <p className="text-sm font-semibold text-white">
              {text('publicPage.constructionIndustrial.heroCard.title', 'Ficha tecnica rapida')}
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>{resolveValue(
                  appearance?.industrial_hero_card_label_clients,
                  text('publicPage.constructionIndustrial.heroCard.clients', 'Tipo de clientes')
                )}</span>
                <span className="font-semibold text-white">
                  {resolveValue(
                    appearance?.industrial_hero_card_value_clients,
                    text('publicPage.constructionIndustrial.heroCard.clientsValue', 'Industrial / Comercial / Obras')
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{resolveValue(
                  appearance?.industrial_hero_card_label_coverage,
                  text('publicPage.constructionIndustrial.heroCard.coverage', 'Cobertura')
                )}</span>
                <span className="font-semibold text-white">
                  {resolveValue(appearance?.industrial_hero_card_value_coverage, coverageLabel)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{resolveValue(
                  appearance?.industrial_hero_card_label_response,
                  text('publicPage.constructionIndustrial.heroCard.response', 'Tiempo de respuesta')
                )}</span>
                <span className="font-semibold text-amber-300">
                  {resolveValue(
                    appearance?.industrial_hero_card_value_response,
                    text('publicPage.constructionIndustrial.heroCard.responseValue', 'Menos de 24h')
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{resolveValue(
                  appearance?.industrial_hero_card_label_services,
                  text('publicPage.constructionIndustrial.heroCard.services', 'Servicios activos')
                )}</span>
                <span className="font-semibold text-white">
                  {resolveValue(
                    appearance?.industrial_hero_card_value_services,
                    availableServices.length ? String(availableServices.length) : 'N/A'
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{resolveValue(
                  appearance?.industrial_hero_card_label_attention,
                  text('publicPage.constructionIndustrial.heroCard.attention', 'Atencion')
                )}</span>
                <span className="font-semibold text-white">
                  {resolveValue(
                    appearance?.industrial_hero_card_value_attention,
                    text('publicPage.constructionIndustrial.heroCard.attentionValue', 'Coordinacion previa')
                  )}
                </span>
              </div>
            </div>
            </aside>
            {(sections.highlight || sections.missionVision) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {sections.highlight && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('about')}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {text('publicPage.constructionIndustrial.heroCard.aboutCta', 'Ver descripcion')}
                  </button>
                )}
                {sections.missionVision && (
                  <button
                    type="button"
                    onClick={() => setActiveModal('mission')}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {text('publicPage.constructionIndustrial.heroCard.missionCta', 'Ver mision y vision')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        className="rounded-2xl border border-slate-200 px-6 py-5 shadow-sm"
        style={{ backgroundColor: trustBg }}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            resolveValue(
              appearance?.industrial_trust_label_1,
              text('publicPage.constructionIndustrial.trust.safety', 'Seguridad y calidad')
            ),
            resolveValue(
              appearance?.industrial_trust_label_2,
              text('publicPage.constructionIndustrial.trust.field', 'Ejecucion en terreno')
            ),
            resolveValue(
              appearance?.industrial_trust_label_3,
              text('publicPage.constructionIndustrial.trust.planning', 'Planificacion tecnica')
            ),
            resolveValue(
              appearance?.industrial_trust_label_4,
              text('publicPage.constructionIndustrial.trust.warranty', 'Garantia y respaldo')
            ),
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm font-semibold" style={{ color: trustTextColor }}>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: trustIconBg }}
              >
                OK
              </span>
              <span style={{ color: trustTextColor }}>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="section-services" className="space-y-6 rounded-3xl border border-slate-200 p-6" style={{ backgroundColor: servicesBg }}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
              {text('publicPage.constructionIndustrial.servicesKicker', 'Especialidades')}
            </p>
            <h2 className="text-2xl font-semibold" style={{ color: servicesTitleColor }}>
              {resolveValue(
                appearance?.industrial_services_title,
                text('publicPage.constructionIndustrial.servicesTitle', 'Especialidades tecnicas')
              )}
            </h2>
            <p className="text-sm" style={{ color: servicesTextColor }}>
              {resolveValue(
                appearance?.industrial_services_subtitle,
                text(
                  'publicPage.constructionIndustrial.servicesSubtitle',
                  'Obra nueva, mantencion o emergencia. Coordinamos cuadrillas en terreno.'
                )
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={scrollToForm}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold shadow-sm transition hover:-translate-y-0.5"
            style={{ backgroundColor: servicesButtonColor, color: servicesButtonText }}
          >
            {resolveValue(
              appearance?.industrial_services_cta,
              text('publicPage.constructionIndustrial.servicesCta', 'Solicitar visita tecnica')
            )}
          </button>
        </div>

        {sections.hours && (
          <div className="grid gap-4 lg:grid-cols-3">
            {sections.hours}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {availableServices.length > 0
            ? availableServices.map((service) => {
                const bullets = createServiceBullets(service);
                return (
                  <div
                    key={service.id}
                    className="rounded-2xl border border-slate-200 p-5 shadow-sm"
                    style={{ backgroundColor: servicesCardBg }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: servicesTitleColor }}>
                          {service.name}
                        </h3>
                        <ul className="mt-3 space-y-1 text-sm" style={{ color: servicesTextColor }}>
                          {bullets.map((bullet, idx) => (
                            <li key={`${service.id}-bullet-${idx}`}>- {bullet}</li>
                          ))}
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={scrollToForm}
                        className="mt-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition hover:opacity-90"
                        style={{ backgroundColor: servicesButtonColor, color: servicesButtonText }}
                      >
                        {resolveValue(
                          appearance?.industrial_services_cta,
                          text('publicPage.constructionIndustrial.servicesMiniCta', 'Cotizar')
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            : servicePlaceholders.map((service) => (
                <div
                  key={service.title}
                  className="rounded-2xl border border-slate-200 p-5 shadow-sm"
                  style={{ backgroundColor: servicesCardBg }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: servicesTitleColor }}>
                        {service.title}
                      </h3>
                      <ul className="mt-3 space-y-1 text-sm" style={{ color: servicesTextColor }}>
                        {service.bullets.map((bullet) => (
                          <li key={bullet}>- {bullet}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={scrollToForm}
                      className="mt-1 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition hover:opacity-90"
                      style={{ backgroundColor: servicesButtonColor, color: servicesButtonText }}
                    >
                      {resolveValue(
                        appearance?.industrial_services_cta,
                        text('publicPage.constructionIndustrial.servicesMiniCta', 'Cotizar')
                      )}
                    </button>
                  </div>
                </div>
              ))}
        </div>
      </section>

      <section
        className="rounded-3xl border border-slate-200 px-6 py-6 shadow-sm"
        style={{ backgroundColor: processBg }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
          {text('publicPage.constructionIndustrial.processKicker', 'Proceso')}
        </p>
        <h2 className="text-2xl font-semibold" style={{ color: processTitleColor }}>
          {resolveValue(
            appearance?.industrial_process_title,
            text('publicPage.constructionIndustrial.processTitle', 'Como trabajamos')
          )}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            resolveValue(
              appearance?.industrial_process_step_1,
              text('publicPage.constructionIndustrial.process.step1', '1. Levantamiento / visita tecnica')
            ),
            resolveValue(
              appearance?.industrial_process_step_2,
              text('publicPage.constructionIndustrial.process.step2', '2. Cotizacion y planificacion')
            ),
            resolveValue(
              appearance?.industrial_process_step_3,
              text('publicPage.constructionIndustrial.process.step3', '3. Ejecucion segura')
            ),
            resolveValue(
              appearance?.industrial_process_step_4,
              text('publicPage.constructionIndustrial.process.step4', '4. Entrega y respaldo')
            ),
          ].map((step) => (
            <div
              key={step}
              className="rounded-2xl border border-slate-200 px-4 py-5 text-sm font-semibold"
              style={{ backgroundColor: processCardBg, color: processTextColor }}
            >
              {step}
            </div>
          ))}
        </div>
      </section>

      <section
        id="section-projects"
        className="space-y-5 rounded-3xl border border-slate-200 px-6 py-6 shadow-sm"
        style={{ backgroundColor: projectsBg }}
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
              {text('publicPage.constructionIndustrial.projectsKicker', 'Proyectos')}
            </p>
            <h2 className="text-2xl font-semibold" style={{ color: projectsTitleColor }}>
              {resolveValue(
                appearance?.industrial_projects_title,
                text('publicPage.constructionIndustrial.projectsTitle', 'Proyectos realizados')
              )}
            </h2>
            <p className="text-sm" style={{ color: projectsTextColor }}>
              {resolveValue(
                appearance?.industrial_projects_subtitle,
                text(
                  'publicPage.constructionIndustrial.projectsSubtitle',
                  'Obras recientes con entrega segura y respaldo tecnico.'
                )
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={scrollToForm}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold shadow-sm transition hover:-translate-y-0.5"
            style={{ backgroundColor: projectsButtonColor, color: projectsButtonText }}
          >
            {resolveValue(
              appearance?.industrial_projects_cta,
              text('publicPage.constructionIndustrial.projectsCta', 'Solicitar visita tecnica')
            )}
          </button>
        </div>
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-4 text-sm" style={{ color: projectsTextColor }}>
            {text('publicPage.constructionIndustrial.projectsEmpty', 'Coordina una visita tecnica para revisar necesidades y proximos proyectos.')}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => {
              const videoId = getYouTubeId(project.video_url);
              const coverImage = project.images?.[0];
              const coverUrl = videoId
                ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                : coverImage;
              return (
                <button
                  key={project.id || `${project.title}-${index}`}
                  type="button"
                  onClick={() => setActiveProjectIndex(index)}
                  className="overflow-hidden rounded-2xl border border-slate-200 text-left shadow-sm transition hover:-translate-y-0.5"
                  style={{ backgroundColor: projectsCardBg }}
                >
                  <div className="relative">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={project.title || text('publicPage.constructionIndustrial.projectAlt', 'Proyecto en terreno')}
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-44 w-full items-center justify-center bg-slate-200 text-sm text-slate-600">
                        {text('publicPage.constructionIndustrial.projectAlt', 'Proyecto en terreno')}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />
                    <div className="absolute bottom-3 left-3 space-y-1 text-xs text-white">
                      <p className="font-semibold">{project.title || text('publicPage.constructionIndustrial.projectType', 'Obra industrial')}</p>
                      <p>{project.location || coverageLabel}</p>
                      <p className="text-emerald-200">{project.result || text('publicPage.constructionIndustrial.projectResult', 'Entrega segura')}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {sections.media}
      </section>

      <section
        id="section-location"
        className="rounded-3xl border border-slate-200 px-6 py-6 shadow-sm"
        style={{ backgroundColor: coverageBg }}
      >
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
              {text('publicPage.constructionIndustrial.coverageKicker', 'Cobertura')}
            </p>
            <h2 className="text-2xl font-semibold" style={{ color: coverageTitleColor }}>
              {resolveValue(
                appearance?.industrial_coverage_title,
                text('publicPage.constructionIndustrial.coverageTitle', 'Cobertura y ubicacion')
              )}
            </h2>
            <p className="text-sm" style={{ color: coverageTextColor }}>
              {resolveValue(
                appearance?.industrial_coverage_subtitle,
                text(
                  'publicPage.constructionIndustrial.coverageSubtitle',
                  'Atendemos faenas e instalaciones con coordinacion previa.'
                )
              )}
            </p>
            <div
              className="rounded-2xl border border-slate-200 px-4 py-4 text-sm"
              style={{ backgroundColor: 'transparent', color: coverageTextColor }}
            >
              <p className="font-semibold" style={{ color: coverageTitleColor }}>
                {company.address || coverageLabel}
              </p>
              {company.commune || company.region ? (
                <p style={{ color: coverageTextColor }}>
                  {[company.commune, company.region].filter(Boolean).join(', ')}
                </p>
              ) : null}
              <p className="mt-3 text-xs" style={{ color: coverageTextColor }}>
                {resolveValue(
                  appearance?.industrial_coverage_note,
                  text('publicPage.constructionIndustrial.coverageNote', 'Coordinamos acceso, seguridad y planificacion en terreno.')
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs" style={{ color: coverageTextColor }}>
              <span className="rounded-full border border-slate-200 px-3 py-1" style={{ backgroundColor: coverageChipBg, color: coverageChipText }}>
                {resolveValue(
                  appearance?.industrial_coverage_chip_1,
                  text('publicPage.constructionIndustrial.coverageChip1', 'Industrial')
                )}
              </span>
              <span className="rounded-full border border-slate-200 px-3 py-1" style={{ backgroundColor: coverageChipBg, color: coverageChipText }}>
                {resolveValue(
                  appearance?.industrial_coverage_chip_2,
                  text('publicPage.constructionIndustrial.coverageChip2', 'Comercial')
                )}
              </span>
              <span className="rounded-full border border-slate-200 px-3 py-1" style={{ backgroundColor: coverageChipBg, color: coverageChipText }}>
                {resolveValue(
                  appearance?.industrial_coverage_chip_3,
                  text('publicPage.constructionIndustrial.coverageChip3', 'Obras')
                )}
              </span>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {sections.location ?? (
              <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-slate-500">
                {text('publicPage.constructionIndustrial.coverageMapFallback', 'Mapa disponible al coordinar.')}
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        id="section-contact"
        ref={formRef}
        className="rounded-3xl border border-slate-200 px-6 py-6 shadow-lg"
        style={{ backgroundColor: formBg }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
              {text('publicPage.constructionIndustrial.formKicker', 'Cotizacion')}
            </p>
            <h2 className="text-2xl font-semibold" style={{ color: formTitleColor }}>
              {resolveValue(
                appearance?.industrial_form_title,
                text('publicPage.constructionIndustrial.formTitle', 'Coordina tu obra o visita tecnica')
              )}
            </h2>
            <p className="text-sm" style={{ color: formTextColor }}>
              {resolveValue(
                appearance?.industrial_form_subtitle,
                text('publicPage.constructionIndustrial.formSubtitle', 'Respondemos en menos de 24 horas.')
              )}
            </p>
          </div>
          {contactActions}
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {text('publicPage.constructionIndustrial.form.name', 'Nombre completo')}
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value.slice(0, 100) }))}
              maxLength={100}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder={resolveValue(
                appearance?.industrial_form_name_placeholder,
                text('publicPage.constructionIndustrial.form.namePlaceholder', 'Ej. Carla Ramirez')
              )}
              aria-label={text('publicPage.constructionIndustrial.form.name', 'Nombre completo')}
              aria-required="true"
            />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {text('publicPage.constructionIndustrial.form.phone', 'WhatsApp')}
            </span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.slice(0, 20) }))}
              maxLength={20}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder={resolveValue(
                appearance?.industrial_form_phone_placeholder,
                text('publicPage.constructionIndustrial.form.phonePlaceholder', '+56 9 1234 5678')
              )}
              aria-label={text('publicPage.constructionIndustrial.form.phone', 'WhatsApp')}
              aria-required="true"
            />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {text('publicPage.constructionIndustrial.form.location', 'Comuna o ubicacion')}
            </span>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value.slice(0, 120) }))}
              maxLength={120}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder={resolveValue(
                appearance?.industrial_form_location_placeholder,
                text('publicPage.constructionIndustrial.form.locationPlaceholder', 'Ej. Quilicura, Parque Industrial')
              )}
              aria-label={text('publicPage.constructionIndustrial.form.location', 'Comuna o ubicacion')}
            />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {text('publicPage.constructionIndustrial.form.serviceType', 'Tipo de servicio')}
            </span>
            <input
              type="text"
              value={form.serviceType}
              onChange={(e) => setForm((prev) => ({ ...prev, serviceType: e.target.value.slice(0, 120) }))}
              maxLength={120}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder={
                availableServices[0]?.name ||
                resolveValue(
                  appearance?.industrial_form_service_placeholder,
                  text('publicPage.constructionIndustrial.form.servicePlaceholder', 'Obra gruesa, mantencion, emergencia...')
                )
              }
              list="services-list"
              aria-label={text('publicPage.constructionIndustrial.form.serviceType', 'Tipo de servicio')}
            />
            {availableServices.length > 0 ? (
              <datalist id="services-list">
                {availableServices.map((service) => (
                  <option key={service.id} value={service.name} />
                ))}
              </datalist>
            ) : null}
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {text('publicPage.constructionIndustrial.form.urgency', 'Urgencia')}
            </span>
            <select
              value={form.urgency}
              onChange={(e) => setForm((prev) => ({ ...prev, urgency: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              aria-label={text('publicPage.constructionIndustrial.form.urgency', 'Urgencia')}
            >
              <option value="">
                {resolveValue(
                  appearance?.industrial_form_urgency_placeholder,
                  text('publicPage.constructionIndustrial.form.urgencyPlaceholder', 'Selecciona una opcion')
                )}
              </option>
              <option value={text('publicPage.constructionIndustrial.form.urgencyHigh', 'Alta (24-48h)')}>
                {text('publicPage.constructionIndustrial.form.urgencyHigh', 'Alta (24-48h)')}
              </option>
              <option value={text('publicPage.constructionIndustrial.form.urgencyMedium', 'Media (3-5 dias)')}>
                {text('publicPage.constructionIndustrial.form.urgencyMedium', 'Media (3-5 dias)')}
              </option>
              <option value={text('publicPage.constructionIndustrial.form.urgencyLow', 'Programado')}>
                {text('publicPage.constructionIndustrial.form.urgencyLow', 'Programado')}
              </option>
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {text('publicPage.constructionIndustrial.form.description', 'Descripcion o requerimiento')}
            </span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value.slice(0, 500) }))}
              maxLength={500}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder={resolveValue(
                appearance?.industrial_form_description_placeholder,
                text('publicPage.constructionIndustrial.form.descriptionPlaceholder', 'Metros aprox., materialidad o requerimientos de seguridad.')
              )}
              aria-label={text('publicPage.constructionIndustrial.form.description', 'Descripcion o requerimiento')}
            />
            <p className="mt-1 text-xs text-slate-500">
              {form.description.length}/500 {text('common.characters', 'caracteres')}
            </p>
          </label>

          {errorMessage ? (
            <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              <p className="font-semibold">{text('common.error', 'Error')}</p>
              <p>{errorMessage}</p>
            </div>
          ) : null}

          {status === 'success' ? (
            <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-5 space-y-4" role="status" aria-live="polite">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-2xl" aria-hidden="true">OK</div>
                <div className="flex-1 space-y-2">
                  <p className="text-base font-semibold text-emerald-800">
                    {text('publicPage.constructionIndustrial.form.successTitle', 'Solicitud enviada correctamente')}
                  </p>
                  <p className="text-sm text-emerald-700">
                    {text('publicPage.constructionIndustrial.form.successMessage', 'Te contactaremos en menos de 24 horas.')}
                  </p>
                  {submittedRequestId && (
                    <p className="text-xs text-emerald-600 font-mono">
                      {text('publicPage.constructionIndustrial.form.requestId', 'ID de solicitud: {{id}}').replace('{{id}}', submittedRequestId.slice(0, 8))}
                    </p>
                  )}
                </div>
              </div>
              {company?.whatsapp && (
                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-emerald-200">
                  <button
                    type="button"
                    onClick={handleWhatsAppContact}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                    aria-label={text('publicPage.constructionIndustrial.form.whatsappCta', 'Contactar por WhatsApp')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    {text('publicPage.constructionIndustrial.form.whatsappCta', 'Contactar por WhatsApp')}
                  </button>
                  <p className="text-xs text-emerald-600 self-center">
                    {text('publicPage.constructionIndustrial.form.whatsappHint', 'Respuesta mas rapida por WhatsApp')}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <AnimatedButton
              type="submit"
              disabled={status === 'sending' || status === 'success'}
              className="rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              style={{ backgroundColor: formButtonColor, color: formButtonText, fontFamily: theme.fontButton }}
              ariaLabel={resolveValue(
                appearance?.industrial_form_cta,
                text('publicPage.constructionIndustrial.form.submit', 'Solicitar visita tecnica')
              )}
            >
              {status === 'sending'
                ? text('publicPage.constructionIndustrial.form.sending', 'Enviando...')
                : status === 'success'
                ? text('publicPage.constructionIndustrial.form.submitted', 'Solicitud enviada')
                : resolveValue(
                    appearance?.industrial_form_cta,
                    text('publicPage.constructionIndustrial.form.submit', 'Solicitar visita tecnica')
                  )}
            </AnimatedButton>
            <p className="text-xs" style={{ fontFamily: theme.fontBody, color: formTextColor }}>
              {text('publicPage.constructionIndustrial.form.privacy', 'Tus datos estan protegidos.')}
            </p>
          </div>
        </form>
      </section>

      <footer
        className="rounded-2xl border border-slate-200 px-6 py-6"
        style={{ backgroundColor: footerBg, color: footerTextColor }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold">{company.name}</p>
            {company.address ? <p className="text-xs">{company.address}</p> : null}
            <p className="text-xs">{coverageLabel}</p>
            {company.whatsapp ? (
              <a
                href={`tel:${company.whatsapp}`}
                className="text-xs hover:opacity-90"
                style={{ color: footerLinkColor }}
              >
                {company.whatsapp}
              </a>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 text-xs">
            {navItems.map((item) => (
              <a key={item.id} href={`#section-${item.id}`} className="hover:opacity-90">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {floatingCta && (
        <div className="fixed bottom-4 inset-x-4 sm:hidden z-40 drop-shadow-xl safe-area-inset-bottom">
          {floatingCta}
        </div>
      )}

      <AnimatedModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        ariaLabel={
          activeModal === 'about'
            ? text('publicPage.constructionIndustrial.modal.aboutTitle', 'Descripcion de la empresa')
            : text('publicPage.constructionIndustrial.modal.missionTitle', 'Mision y vision')
        }
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {activeModal === 'about'
              ? text('publicPage.constructionIndustrial.modal.aboutTitle', 'Descripcion de la empresa')
              : text('publicPage.constructionIndustrial.modal.missionTitle', 'Mision y vision')}
          </h3>
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            aria-label={text('publicPage.constructionIndustrial.modal.close', 'Cerrar')}
          >
            X
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          {activeModal === 'about' ? sections.highlight : sections.missionVision}
        </div>
      </AnimatedModal>

      <AnimatedModal
        isOpen={activeProjectIndex !== null}
        onClose={() => setActiveProjectIndex(null)}
        ariaLabel={text('publicPage.constructionIndustrial.modal.projectTitle', 'Detalle del proyecto')}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {activeProject?.title || text('publicPage.constructionIndustrial.projectType', 'Obra industrial')}
          </h3>
          <button
            type="button"
            onClick={() => setActiveProjectIndex(null)}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            aria-label={text('publicPage.constructionIndustrial.modal.close', 'Cerrar')}
          >
            X
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          {activeProjectVideoId ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <iframe
                title={activeProject?.title || 'Video proyecto'}
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${activeProjectVideoId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : null}
          {!activeProjectVideoId && activeProject?.images?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeProject.images.map((image, idx) => (
                <img
                  key={`${image}-${idx}`}
                  src={image}
                  alt={activeProject?.title || 'Proyecto'}
                  className="h-40 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          ) : null}
          <div className="text-sm text-slate-600">
            {activeProject?.location ? <p className="font-semibold">{activeProject.location}</p> : null}
            {activeProject?.result ? <p className="mt-2">{activeProject.result}</p> : null}
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}
