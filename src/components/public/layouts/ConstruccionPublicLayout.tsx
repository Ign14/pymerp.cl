import { type FormEvent, useMemo, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import AnimatedButton from '../../animations/AnimatedButton';
import { PublicLayoutShell } from '../../../pages/public/layouts/PublicLayoutShell';
import { type PublicLayoutProps, type PublicLayoutSections } from '../../../pages/public/layouts/types';
import { isModuleEnabled, resolveCategoryId } from '../../../config/categories';
import { createWorkOrderLiteRequest } from '../../../services/workOrdersLite';
import { createLead } from '../../../services/leads';
import { sanitizeText, isValidEmail, isValidPhone } from '../../../services/validation';
import { RateLimiter } from '../../../utils/security';
import type { Service } from '../../../types';

type FormState = {
  name: string;
  phone: string;
  email: string;
  serviceType: string;
  description: string;
  preferredDate: string;
};

function ServiceListItem({ service, theme }: { service: Service; theme: PublicLayoutProps['theme'] }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="mt-1 h-9 w-9 shrink-0 rounded-lg text-sm font-bold text-white shadow-inner ring-2 ring-offset-2 ring-offset-white"
        style={{ backgroundColor: theme.buttonColor }}
        aria-hidden
      >
        <div className="flex h-full w-full items-center justify-center">{service.name.slice(0, 1).toUpperCase()}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
          {service.name}
        </p>
        <p className="line-clamp-2 text-sm text-slate-600">{service.description}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span className="font-semibold" style={{ color: theme.buttonColor }}>
            {service.status === 'INACTIVE' ? '—' : service.price ? `$${service.price?.toLocaleString()}` : '—'}
          </span>
          {service.estimated_duration_minutes ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5">
              {service.estimated_duration_minutes} min
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function ConstruccionPublicLayout(props: PublicLayoutProps) {
  const { company, services = [], appearance, theme, sections, contactActions, floatingCta, onWhatsAppClick } = props;
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>({
    name: '',
    phone: '',
    email: '',
    serviceType: '',
    description: '',
    preferredDate: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const rateLimiterRef = useRef(new RateLimiter(3, 60000)); // 3 intentos por minuto

  const categoryId = resolveCategoryId(company);
  const allowWorkOrders = isModuleEnabled(categoryId, 'work-orders-lite');

  const cityLabel = company.commune || company.sector || t('publicPage.constructionLayout.cityFallback');

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

    return Array.from(new Set(assets)).filter(Boolean).slice(0, 8);
  }, [appearance?.banner_url, company, services]);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!company?.id) return;
    setErrorMessage(null);

    // Rate limiting
    const rateLimitKey = `workorder_${company.id}_${form.phone.replace(/\D/g, '')}`;
    if (!rateLimiterRef.current.isAllowed(rateLimitKey)) {
      setErrorMessage(t('publicPage.constructionLayout.form.rateLimitExceeded'));
      setStatus('error');
      toast.error(t('publicPage.constructionLayout.form.rateLimitExceeded'));
      return;
    }

    // Validación y sanitización mejorada
    const trimmedName = sanitizeText(form.name, 100);
    const normalizedPhone = form.phone.replace(/\D/g, '');
    const email = form.email.trim();
    const normalizedService = form.serviceType ? sanitizeText(form.serviceType, 120) : undefined;
    const normalizedDescription = form.description ? sanitizeText(form.description, 500) : undefined;
    const preferredDate = form.preferredDate ? new Date(form.preferredDate) : undefined;

    // Validaciones estrictas
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage(t('publicPage.constructionLayout.form.validationNameMin'));
      setStatus('error');
      toast.error(t('publicPage.constructionLayout.form.validationNameMin'));
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMessage(t('publicPage.constructionLayout.form.validationNameMax'));
      setStatus('error');
      toast.error(t('publicPage.constructionLayout.form.validationNameMax'));
      return;
    }

    if (!normalizedPhone || !isValidPhone(normalizedPhone)) {
      setErrorMessage(t('publicPage.constructionLayout.form.validationPhone'));
      setStatus('error');
      toast.error(t('publicPage.constructionLayout.form.validationPhone'));
      return;
    }

    if (email && !isValidEmail(email)) {
      setErrorMessage(t('publicPage.constructionLayout.form.validationEmail'));
      setStatus('error');
      toast.error(t('publicPage.constructionLayout.form.validationEmail'));
      return;
    }

    if (email && email.length > 254) {
      setErrorMessage(t('publicPage.constructionLayout.form.validationEmailMax'));
      setStatus('error');
      toast.error(t('publicPage.constructionLayout.form.validationEmailMax'));
      return;
    }

    if (normalizedDescription && normalizedDescription.length > 500) {
      setErrorMessage(t('publicPage.constructionLayout.form.validationDescriptionMax'));
      setStatus('error');
      toast.error(t('publicPage.constructionLayout.form.validationDescriptionMax'));
      return;
    }

    setStatus('sending');

    try {
      let requestId: string;
      
      if (allowWorkOrders) {
        requestId = await createWorkOrderLiteRequest({
          company_id: company.id,
          requester_name: trimmedName,
          phone: normalizedPhone,
          email: email || undefined,
          service_type: normalizedService,
          description: normalizedDescription,
          preferred_date: preferredDate,
          preferred_time: undefined,
          source: 'public-construction',
        });
      } else {
        // Fallback a leads sin perder información
        const leadId = await createLead({
          company_id: company.id,
          intent: 'visit',
          name: trimmedName,
          whatsapp: normalizedPhone,
          email: email || undefined,
          message: normalizedDescription || 
            t('publicPage.constructionLayout.form.defaultMessage', { service: normalizedService ?? 'obra' }),
          preferred_date: preferredDate,
          preferred_time: undefined,
          property_id: undefined,
          property_title: normalizedService,
          source: 'public-construction',
        });
        requestId = leadId;
      }

      setSubmittedRequestId(requestId);
      setStatus('success');
      
      // Limpiar formulario después de éxito
      setForm({
        name: '',
        phone: '',
        email: '',
        serviceType: '',
        description: '',
        preferredDate: '',
      });

      // Scroll suave al mensaje de éxito
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (error: any) {
      console.error('Error submitting construction request:', error);
      setStatus('error');
      
      // Mensajes de error específicos
      const errorMessageKey = error?.message === 'INVALID_PHONE' 
        ? 'publicPage.constructionLayout.form.validationPhone'
        : error?.message === 'INVALID_EMAIL'
        ? 'publicPage.constructionLayout.form.validationEmail'
        : 'publicPage.constructionLayout.form.error';
      
      const errorMsg = t(errorMessageKey);
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleWhatsAppContact = useCallback(() => {
    if (!company?.whatsapp) {
      toast.error(t('common.errorWhatsAppNotConfigured'));
      return;
    }

    const message = company.booking_message || 
      t('publicPage.constructionLayout.form.whatsappDefaultMessage', { 
        name: form.name || t('publicPage.constructionLayout.form.namePlaceholder'),
        service: form.serviceType || t('publicPage.constructionLayout.form.servicePlaceholder')
      });
    
    const url = `https://wa.me/${company.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    try {
      const whatsappWindow = window.open(url, '_blank');
      if (!whatsappWindow || whatsappWindow.closed || typeof whatsappWindow.closed === 'undefined') {
        // Popup bloqueado, intentar navegación directa
        window.location.href = url;
      }
    } catch (error) {
      toast.error(t('common.errorOpeningWhatsApp'));
    }
  }, [company, form, t]);

  const hero = (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          {t('publicPage.constructionLayout.heroKicker')}
        </p>
        <div className="space-y-3">
          <h1
            className="text-3xl font-bold leading-tight sm:text-4xl"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {t('publicPage.constructionLayout.heroTitle', { name: company.name })}
          </h1>
          <p className="text-lg text-slate-700" style={{ color: theme.subtitleColor }}>
            {t('publicPage.constructionLayout.heroDescription', { city: cityLabel })}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AnimatedButton
            onClick={scrollToForm}
            className="rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5"
            style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
            ariaLabel={t('publicPage.constructionLayout.primaryCta')}
          >
            {t('publicPage.constructionLayout.primaryCta')}
          </AnimatedButton>
          <button
            type="button"
            onClick={() => {
              scrollToForm();
              setForm((prev) => ({ ...prev, serviceType: prev.serviceType || t('publicPage.constructionLayout.form.visitType') }));
              onWhatsAppClick?.();
            }}
            className="rounded-full border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            aria-label={t('publicPage.constructionLayout.secondaryCta')}
          >
            {t('publicPage.constructionLayout.secondaryCta')}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 shadow-sm">
            <p className="text-sm font-semibold text-amber-800">{t('publicPage.constructionLayout.quickQuote')}</p>
            <p className="text-sm text-amber-900/80">
              {t('publicPage.constructionLayout.quickQuoteDesc')}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">{t('publicPage.constructionLayout.onSite')}</p>
            <p className="text-sm text-slate-600">{t('publicPage.constructionLayout.onSiteDesc')}</p>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-xl ring-1 ring-slate-100">
        <div className="flex items-center gap-3">
          {appearance?.logo_url ? (
            <img src={appearance.logo_url} alt={company.name} className="h-12 w-12 rounded-full border border-slate-200 object-cover" />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-inner"
              style={{ backgroundColor: theme.buttonColor }}
            >
              {company.name?.slice(0, 2)?.toUpperCase() || 'OB'}
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{t('publicPage.constructionLayout.heroBadge')}</p>
            <p className="text-lg font-semibold" style={{ color: theme.titleColor }}>
              {company.name}
            </p>
            <p className="text-sm text-slate-600">{cityLabel}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span>{t('publicPage.constructionLayout.card.services')}</span>
            <span className="font-semibold">{availableServices.length || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t('publicPage.constructionLayout.card.response')}</span>
            <span className="font-semibold text-amber-700">{t('publicPage.constructionLayout.card.responseTime')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t('publicPage.constructionLayout.card.coverage')}</span>
            <span className="font-semibold">{company.region || t('publicPage.constructionLayout.card.coverageFallback')}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const servicesSection = (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            {t('publicPage.constructionLayout.servicesKicker')}
          </p>
          <h2 className="text-2xl font-semibold" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
            {t('publicPage.constructionLayout.servicesTitle')}
          </h2>
          <p className="text-sm text-slate-600">{t('publicPage.constructionLayout.servicesSubtitle')}</p>
        </div>
        {availableServices.length > 0 ? (
          <button
            type="button"
            onClick={scrollToForm}
            className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:inline-flex"
          >
            {t('publicPage.constructionLayout.ctaInline')}
          </button>
        ) : null}
      </div>
      {availableServices.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t('publicPage.constructionLayout.noServices')}
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {availableServices.map((service) => (
            <ServiceListItem key={service.id} service={service} theme={theme} />
          ))}
        </ul>
      )}
    </section>
  );

  const projectsSection = (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            {t('publicPage.constructionLayout.projectsKicker')}
          </p>
          <h2 className="text-2xl font-semibold" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
            {t('publicPage.constructionLayout.projectsTitle')}
          </h2>
          <p className="text-sm text-slate-600">{t('publicPage.constructionLayout.projectsSubtitle')}</p>
        </div>
      </div>
      {projectAssets.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {t('publicPage.constructionLayout.projectsEmpty')}
        </p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projectAssets.map((asset, index) => (
            <div
              key={`${asset}-${index}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/0 via-slate-900/0 to-slate-900/20 transition group-hover:from-slate-900/10" />
              <img src={asset} alt={t('publicPage.constructionLayout.projectAlt')} className="h-44 w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const contactSection = (
    <section ref={formRef} className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            {t('publicPage.constructionLayout.form.pretitle')}
          </p>
          <h2 className="text-2xl font-semibold" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
            {t('publicPage.constructionLayout.form.title')}
          </h2>
          <p className="text-sm text-slate-600">{t('publicPage.constructionLayout.form.subtitle')}</p>
        </div>
        {contactActions}
      </div>

      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="md:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {t('publicPage.constructionLayout.form.name')}
          </span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => {
              const value = e.target.value.slice(0, 100);
              setForm((prev) => ({ ...prev, name: value }));
            }}
            maxLength={100}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder={t('publicPage.constructionLayout.form.namePlaceholder')}
            aria-label={t('publicPage.constructionLayout.form.name')}
            aria-required="true"
          />
        </label>
        <label className="md:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {t('publicPage.constructionLayout.form.phone')}
          </span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => {
              const value = e.target.value.slice(0, 20);
              setForm((prev) => ({ ...prev, phone: value }));
            }}
            maxLength={20}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder={t('publicPage.constructionLayout.form.phonePlaceholder')}
            aria-label={t('publicPage.constructionLayout.form.phone')}
            aria-required="true"
          />
        </label>
        <label className="md:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {t('publicPage.constructionLayout.form.email')}
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => {
              const value = e.target.value.slice(0, 254);
              setForm((prev) => ({ ...prev, email: value }));
            }}
            maxLength={254}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder={t('publicPage.constructionLayout.form.emailPlaceholder')}
            aria-label={t('publicPage.constructionLayout.form.email')}
          />
        </label>
        <label className="md:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {t('publicPage.constructionLayout.form.serviceType')}
          </span>
          <input
            type="text"
            value={form.serviceType}
            onChange={(e) => {
              const value = e.target.value.slice(0, 120);
              setForm((prev) => ({ ...prev, serviceType: value }));
            }}
            maxLength={120}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder={
              availableServices[0]?.name ||
              t('publicPage.constructionLayout.form.servicePlaceholder')
            }
            list="services-list"
            aria-label={t('publicPage.constructionLayout.form.serviceType')}
          />
          {availableServices.length > 0 ? (
            <datalist id="services-list">
              {availableServices.map((service) => (
                <option key={service.id} value={service.name} />
              ))}
            </datalist>
          ) : null}
        </label>
        <label className="md:col-span-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {t('publicPage.constructionLayout.form.preferredDate')}
          </span>
          <input
            type="date"
            value={form.preferredDate}
            onChange={(e) => setForm((prev) => ({ ...prev, preferredDate: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </label>
        <label className="md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            {t('publicPage.constructionLayout.form.description')}
          </span>
          <textarea
            value={form.description}
            onChange={(e) => {
              const value = e.target.value.slice(0, 500);
              setForm((prev) => ({ ...prev, description: value }));
            }}
            maxLength={500}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder={t('publicPage.constructionLayout.form.descriptionPlaceholder')}
            aria-label={t('publicPage.constructionLayout.form.description')}
          />
          <p className="mt-1 text-xs text-slate-500">
            {form.description.length}/500 {t('common.characters')}
          </p>
        </label>

        {errorMessage ? (
          <div className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            <p className="font-semibold">{t('common.error')}</p>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {status === 'success' ? (
          <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-5 space-y-4" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-2xl" aria-hidden="true">✅</div>
              <div className="flex-1 space-y-2">
                <p className="text-base font-semibold text-emerald-800">
                  {t('publicPage.constructionLayout.form.successTitle')}
                </p>
                <p className="text-sm text-emerald-700">
                  {t('publicPage.constructionLayout.form.successMessage')}
                </p>
                {submittedRequestId && (
                  <p className="text-xs text-emerald-600 font-mono">
                    {t('publicPage.constructionLayout.form.requestId', { id: submittedRequestId.slice(0, 8) })}
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
                  aria-label={t('publicPage.constructionLayout.form.whatsappCta')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  {t('publicPage.constructionLayout.form.whatsappCta')}
                </button>
                <p className="text-xs text-emerald-600 self-center">
                  {t('publicPage.constructionLayout.form.whatsappHint')}
                </p>
              </div>
            )}
          </div>
        ) : null}

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <AnimatedButton
            type="submit"
            disabled={status === 'sending' || status === 'success'}
            className="rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
            ariaLabel={t('publicPage.constructionLayout.form.submit')}
          >
            {status === 'sending'
              ? t('publicPage.constructionLayout.form.sending')
              : status === 'success'
              ? t('publicPage.constructionLayout.form.submitted')
              : t('publicPage.constructionLayout.form.submit')}
          </AnimatedButton>
          <p className="text-xs text-slate-500" style={{ fontFamily: theme.fontBody }}>
            {t('publicPage.constructionLayout.form.privacy')}
          </p>
        </div>
      </form>
    </section>
  );

  const mediaSection = sections.media ? (
    <div className="space-y-6">
      {projectsSection}
      {sections.media}
    </div>
  ) : (
    projectsSection
  );

  const layoutSections: PublicLayoutSections = {
    ...sections,
    hero,
    services: servicesSection,
    media: mediaSection,
    contact: contactSection,
  };

  const floatingCtaNode =
    floatingCta ??
    (availableServices.length > 0 ? (
      <button
        type="button"
        onClick={scrollToForm}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5"
      >
        {t('publicPage.constructionLayout.primaryCta')}
      </button>
    ) : undefined);

  return (
    <PublicLayoutShell
      {...props}
      sections={layoutSections}
      contactActions={contactActions}
      floatingCta={floatingCtaNode}
    />
  );
}
