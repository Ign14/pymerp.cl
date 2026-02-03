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
import type { Service } from '../../../types';

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

  const heroImage = projectAssets[0] || appearance?.banner_url || (company as any)?.background_url || '';

  const isElectrical = useMemo(() => {
    const raw = `${company.industry || ''} ${company.sector || ''}`.toLowerCase();
    const normalized = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized.includes('electric') || normalized.includes('electr');
  }, [company.industry, company.sector]);

  const heroTitle = isElectrical
    ? text(
        'publicPage.constructionIndustrial.heroTitleElectrical',
        'Soluciones electricas para obras, industria y agricultura'
      )
    : text(
        'publicPage.constructionIndustrial.heroTitleGeneral',
        'Soluciones para obras y mantenciones en terreno'
      );

  const coverageLabel = company.region || company.commune || company.sector || text(
    'publicPage.constructionIndustrial.coverageFallback',
    'Cobertura a coordinar'
  );

  const heroSubtitle = text(
    'publicPage.constructionIndustrial.heroSubtitle',
    '{{service}} - {{region}}'
  )
    .replace('{{service}}', company.sector || company.industry || text('publicPage.constructionIndustrial.heroSubtitleService', 'Servicios tecnicos'))
    .replace('{{region}}', coverageLabel);

  const servicePlaceholders = isElectrical ? PLACEHOLDER_SERVICES : FALLBACK_SERVICES;

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

  const navItems = [
    { id: 'services', label: text('publicPage.constructionIndustrial.nav.services', 'Servicios') },
    { id: 'projects', label: text('publicPage.constructionIndustrial.nav.projects', 'Proyectos') },
    { id: 'location', label: text('publicPage.constructionIndustrial.nav.coverage', 'Cobertura') },
    { id: 'contact', label: text('publicPage.constructionIndustrial.nav.quote', 'Cotizar') },
  ];

  return (
    <div className="space-y-10 pb-10">
      <header className="sticky top-0 z-30 h-[72px] border-b border-white/10 bg-[#0e1624]">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            {appearance?.logo_url ? (
              <img src={appearance.logo_url} alt={company.name} className="h-10 w-10 rounded-md object-contain" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-sm font-semibold text-white">
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
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e1624]/85 via-[#0e1624]/70 to-[#0e1624]/90" />
        <div className="relative z-10 grid gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-16">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-400">
              {text('publicPage.constructionIndustrial.heroKicker', 'Industrial / Obras')}
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl" style={{ fontFamily: theme.fontTitle }}>
              {heroTitle}
            </h1>
            <p className="text-lg text-slate-200">{heroSubtitle}</p>
            <div className="flex flex-wrap gap-2">
              {[
                text('publicPage.constructionIndustrial.badge.response', 'Respuesta < 24h'),
                text('publicPage.constructionIndustrial.badge.onSite', 'Visita tecnica en terreno'),
                text('publicPage.constructionIndustrial.badge.compliance', 'Cumplimiento normativo'),
              ].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200"
                >
                  {badge}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={scrollToForm}
                className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
              >
                {text('publicPage.constructionIndustrial.heroCtaPrimary', 'Solicitar visita tecnica')}
              </button>
              <button
                type="button"
                onClick={onWhatsAppClick ?? handleWhatsAppContact}
                className="rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {text('publicPage.constructionIndustrial.heroCtaSecondary', 'Cotizar por WhatsApp')}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <aside className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">
              {text('publicPage.constructionIndustrial.heroCard.title', 'Ficha tecnica rapida')}
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <div className="flex items-center justify-between">
                <span>{text('publicPage.constructionIndustrial.heroCard.clients', 'Tipo de clientes')}</span>
                <span className="font-semibold text-white">
                  {text('publicPage.constructionIndustrial.heroCard.clientsValue', 'Industrial / Comercial / Obras')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{text('publicPage.constructionIndustrial.heroCard.coverage', 'Cobertura')}</span>
                <span className="font-semibold text-white">{coverageLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{text('publicPage.constructionIndustrial.heroCard.response', 'Tiempo de respuesta')}</span>
                <span className="font-semibold text-amber-300">
                  {text('publicPage.constructionIndustrial.heroCard.responseValue', 'Menos de 24h')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{text('publicPage.constructionIndustrial.heroCard.services', 'Servicios activos')}</span>
                <span className="font-semibold text-white">{availableServices.length || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{text('publicPage.constructionIndustrial.heroCard.attention', 'Atencion')}</span>
                <span className="font-semibold text-white">
                  {text('publicPage.constructionIndustrial.heroCard.attentionValue', 'Coordinacion previa')}
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

      <section className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            text('publicPage.constructionIndustrial.trust.safety', 'Seguridad y calidad'),
            text('publicPage.constructionIndustrial.trust.field', 'Ejecucion en terreno'),
            text('publicPage.constructionIndustrial.trust.planning', 'Planificacion tecnica'),
            text('publicPage.constructionIndustrial.trust.warranty', 'Garantia y respaldo'),
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white">OK</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="section-services" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
              {text('publicPage.constructionIndustrial.servicesKicker', 'Especialidades')}
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {text('publicPage.constructionIndustrial.servicesTitle', 'Especialidades tecnicas')}
            </h2>
            <p className="text-sm text-slate-600">
              {text('publicPage.constructionIndustrial.servicesSubtitle', 'Obra nueva, mantencion o emergencia. Coordinamos cuadrillas en terreno.')}
            </p>
          </div>
          <button
            type="button"
            onClick={scrollToForm}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
          >
            {text('publicPage.constructionIndustrial.servicesCta', 'Solicitar visita tecnica')}
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
                  <div key={service.id} className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{service.name}</h3>
                        <ul className="mt-3 space-y-1 text-sm text-slate-600">
                          {bullets.map((bullet, idx) => (
                            <li key={`${service.id}-bullet-${idx}`}>- {bullet}</li>
                          ))}
                        </ul>
                      </div>
                      <button
                        type="button"
                        onClick={scrollToForm}
                        className="mt-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                      >
                        {text('publicPage.constructionIndustrial.servicesMiniCta', 'Cotizar')}
                      </button>
                    </div>
                  </div>
                );
              })
            : servicePlaceholders.map((service) => (
                <div key={service.title} className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{service.title}</h3>
                      <ul className="mt-3 space-y-1 text-sm text-slate-600">
                        {service.bullets.map((bullet) => (
                          <li key={bullet}>- {bullet}</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={scrollToForm}
                      className="mt-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                    >
                      {text('publicPage.constructionIndustrial.servicesMiniCta', 'Cotizar')}
                    </button>
                  </div>
                </div>
              ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
          {text('publicPage.constructionIndustrial.processKicker', 'Proceso')}
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">
          {text('publicPage.constructionIndustrial.processTitle', 'Como trabajamos')}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            text('publicPage.constructionIndustrial.process.step1', '1. Levantamiento / visita tecnica'),
            text('publicPage.constructionIndustrial.process.step2', '2. Cotizacion y planificacion'),
            text('publicPage.constructionIndustrial.process.step3', '3. Ejecucion segura'),
            text('publicPage.constructionIndustrial.process.step4', '4. Entrega y respaldo'),
          ].map((step) => (
            <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-700">
              {step}
            </div>
          ))}
        </div>
      </section>

      <section id="section-projects" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
              {text('publicPage.constructionIndustrial.projectsKicker', 'Proyectos')}
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {text('publicPage.constructionIndustrial.projectsTitle', 'Proyectos realizados')}
            </h2>
            <p className="text-sm text-slate-600">
              {text('publicPage.constructionIndustrial.projectsSubtitle', 'Obras recientes con entrega segura y respaldo tecnico.')}
            </p>
          </div>
          <button
            type="button"
            onClick={scrollToForm}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
          >
            {text('publicPage.constructionIndustrial.projectsCta', 'Solicitar visita tecnica')}
          </button>
        </div>
        {projectAssets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
            {text('publicPage.constructionIndustrial.projectsEmpty', 'Coordina una visita tecnica para revisar necesidades y proximos proyectos.')}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projectAssets.map((asset, index) => (
              <div key={`${asset}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <div className="relative">
                  <img src={asset} alt={text('publicPage.constructionIndustrial.projectAlt', 'Proyecto en terreno')} className="h-44 w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />
                  <div className="absolute bottom-3 left-3 space-y-1 text-xs text-white">
                    <p className="font-semibold">
                      {text('publicPage.constructionIndustrial.projectType', 'Obra industrial')}
                    </p>
                    <p>{coverageLabel}</p>
                    <p className="text-emerald-200">
                      {text('publicPage.constructionIndustrial.projectResult', 'Entrega segura')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {sections.media}
      </section>

      <section id="section-location" className="rounded-3xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
              {text('publicPage.constructionIndustrial.coverageKicker', 'Cobertura')}
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {text('publicPage.constructionIndustrial.coverageTitle', 'Cobertura y ubicacion')}
            </h2>
            <p className="text-sm text-slate-600">
              {text('publicPage.constructionIndustrial.coverageSubtitle', 'Atendemos faenas e instalaciones con coordinacion previa.')}
            </p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{company.address || coverageLabel}</p>
              {company.commune || company.region ? (
                <p className="text-slate-600">
                  {[company.commune, company.region].filter(Boolean).join(', ')}
                </p>
              ) : null}
              <p className="mt-3 text-xs text-slate-500">
                {text('publicPage.constructionIndustrial.coverageNote', 'Coordinamos acceso, seguridad y planificacion en terreno.')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                {text('publicPage.constructionIndustrial.coverageChip1', 'Industrial')}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                {text('publicPage.constructionIndustrial.coverageChip2', 'Comercial')}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                {text('publicPage.constructionIndustrial.coverageChip3', 'Obras')}
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

      <section id="section-contact" ref={formRef} className="rounded-3xl border border-slate-200 bg-white/95 px-6 py-6 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">
              {text('publicPage.constructionIndustrial.formKicker', 'Cotizacion')}
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {text('publicPage.constructionIndustrial.formTitle', 'Coordina tu obra o visita tecnica')}
            </h2>
            <p className="text-sm text-slate-600">
              {text('publicPage.constructionIndustrial.formSubtitle', 'Respondemos en menos de 24 horas.')}
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
              placeholder={text('publicPage.constructionIndustrial.form.namePlaceholder', 'Ej. Carla Ramirez')}
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
              placeholder={text('publicPage.constructionIndustrial.form.phonePlaceholder', '+56 9 1234 5678')}
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
              placeholder={text('publicPage.constructionIndustrial.form.locationPlaceholder', 'Ej. Quilicura, Parque Industrial')}
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
                text('publicPage.constructionIndustrial.form.servicePlaceholder', 'Obra gruesa, mantencion, emergencia...')
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
              <option value="">{text('publicPage.constructionIndustrial.form.urgencyPlaceholder', 'Selecciona una opcion')}</option>
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
              placeholder={text('publicPage.constructionIndustrial.form.descriptionPlaceholder', 'Metros aprox., materialidad o requerimientos de seguridad.')}
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
              style={{ backgroundColor: '#10b981', color: '#ffffff', fontFamily: theme.fontButton }}
              ariaLabel={text('publicPage.constructionIndustrial.form.submit', 'Solicitar visita tecnica')}
            >
              {status === 'sending'
                ? text('publicPage.constructionIndustrial.form.sending', 'Enviando...')
                : status === 'success'
                ? text('publicPage.constructionIndustrial.form.submitted', 'Solicitud enviada')
                : text('publicPage.constructionIndustrial.form.submit', 'Solicitar visita tecnica')}
            </AnimatedButton>
            <p className="text-xs text-slate-500" style={{ fontFamily: theme.fontBody }}>
              {text('publicPage.constructionIndustrial.form.privacy', 'Tus datos estan protegidos.')}
            </p>
          </div>
        </form>
      </section>

      <footer className="rounded-2xl border border-slate-200 bg-[#0e1624] px-6 py-6 text-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">{company.name}</p>
            {company.address ? <p className="text-xs">{company.address}</p> : null}
            <p className="text-xs">{coverageLabel}</p>
            {company.whatsapp ? (
              <a href={`tel:${company.whatsapp}`} className="text-xs text-emerald-300 hover:text-emerald-200">
                {company.whatsapp}
              </a>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 text-xs">
            {navItems.map((item) => (
              <a key={item.id} href={`#section-${item.id}`} className="hover:text-white">
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
    </div>
  );
}
