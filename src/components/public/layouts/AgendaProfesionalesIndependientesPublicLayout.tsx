import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AnimatedButton from '../../animations/AnimatedButton';
import { PublicLayoutShell } from '../../../pages/public/layouts/PublicLayoutShell';
import { type PublicLayoutProps, type PublicLayoutSections } from '../../../pages/public/layouts/types';
import { DAY_OF_WEEK_KEYS } from '../../../pages/public/constants';
import { isModuleEnabled, resolveCategoryId } from '../../../config/categories';
import { BusinessType, type Professional, type ScheduleSlot, type Service } from '../../../types';

type UpcomingSlot = {
  id: string;
  label: string;
  timeRange: string;
  date: Date;
};

function getNextOccurrence(dayKey: string, time: string): Date | null {
  const dayIndex = DAY_OF_WEEK_KEYS.indexOf(dayKey as (typeof DAY_OF_WEEK_KEYS)[number]);
  if (dayIndex === -1) return null;

  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours)) return null;

  const candidate = new Date(now);
  candidate.setHours(hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0);

  const diff = (dayIndex - now.getDay() + 7) % 7;
  const daysToAdd = diff === 0 && candidate <= now ? 7 : diff;
  candidate.setDate(now.getDate() + daysToAdd);

  return candidate;
}

function getUpcomingSlots(schedules: ScheduleSlot[], limit: number, locale: string): UpcomingSlot[] {
  const list: UpcomingSlot[] = [];
  schedules.forEach((slot) => {
    if (slot.status === 'INACTIVE') return;
    (slot.days_of_week || []).forEach((dayKey) => {
      const nextDate = getNextOccurrence(dayKey, slot.start_time);
      if (!nextDate) return;
      const label = nextDate.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
      list.push({
        id: `${slot.id}-${dayKey}`,
        label,
        timeRange: slot.end_time ? `${slot.start_time} - ${slot.end_time}` : slot.start_time,
        date: nextDate,
      });
    });
  });

  return list.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, limit);
}

function ServiceDetailCard({
  service,
  onBook,
  onServiceClick,
  theme,
  labels,
  locale,
}: {
  service: Service;
  onBook?: (service: Service) => void;
  onServiceClick?: (service: Service) => void;
  theme: PublicLayoutProps['theme'];
  labels: {
    book: string;
    duration: string;
    priceOnRequest: string;
    unavailable: string;
    mode: string;
  };
  locale: string;
}) {
  const isActive = service.status !== 'INACTIVE';
  const priceLabel = service.hide_price ? labels.priceOnRequest : `$ ${service.price.toLocaleString(locale || 'es-CL')}`;

  return (
    <article
      key={service.id}
      className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/85 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      onClick={() => onServiceClick?.(service)}
      style={{ color: theme.textColor }}
    >
      <div className="space-y-3 p-4" style={{ background: `linear-gradient(135deg, ${theme.cardColor}, #ffffff)` }}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3
              className="text-lg font-semibold leading-tight"
              style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
            >
              {service.name}
            </h3>
            <p className="text-xs text-slate-600">{labels.mode}</p>
          </div>
          <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
            {isActive ? labels.book : labels.unavailable}
          </span>
        </div>
        <p className="line-clamp-3 text-sm opacity-85">{service.description}</p>
        <div className="flex items-center justify-between text-sm font-semibold">
          <span style={{ color: theme.buttonColor }}>{priceLabel}</span>
          <span className="flex items-center gap-1 text-xs text-slate-600">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {service.estimated_duration_minutes ? labels.duration : '-'}
          </span>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-white/90 p-3" onClick={(e) => e.stopPropagation()}>
        <AnimatedButton
          onClick={() => onBook?.(service)}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:shadow-md disabled:opacity-50"
          style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
          disabled={!isActive}
          ariaLabel={`${labels.book} ${service.name}`}
        >
          {labels.book}
        </AnimatedButton>
      </div>
    </article>
  );
}

function ProfessionalBadge({ professional, theme, fallback }: { professional: Professional; theme: PublicLayoutProps['theme']; fallback: string }) {
  const initials = professional.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const specialties = professional.specialties?.filter(Boolean) ?? [];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: theme.buttonColor }}
        aria-hidden
      >
        {initials || 'PR'}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold" style={{ color: theme.titleColor }}>
          {professional.name}
        </p>
        <p className="truncate text-xs text-slate-600">
          {specialties.length > 0 ? specialties.join(' • ') : fallback}
        </p>
      </div>
    </div>
  );
}

export function AgendaProfesionalesIndependientesPublicLayout(props: PublicLayoutProps) {
  const {
    company,
    services = [],
    schedules = [],
    professionals = [],
    sections,
    theme,
    appearance,
    onBookService,
    onServiceClick,
    onWhatsAppClick,
    contactActions,
    floatingCta,
  } = props;
  const { t, i18n } = useTranslation();

  const categoryId = resolveCategoryId(company);
  const isServicesBusiness = company.business_type === BusinessType.SERVICES || company.businessMode === 'BOTH';
  const showProfessionals = isServicesBusiness && isModuleEnabled(categoryId, 'professionals') && professionals.length > 0;
  const hasPrimaryAction = Boolean((onBookService && services.length > 0) || onWhatsAppClick);

  const specialties = useMemo(() => services.map((s) => s.name).filter(Boolean).slice(0, 6), [services]);
  const upcomingSlots = useMemo(() => getUpcomingSlots(schedules || [], 6, i18n.language), [schedules, i18n.language]);

  const handlePrimaryCta = () => {
    if (!hasPrimaryAction) return;
    if (onBookService && services[0]) {
      onBookService(services[0]);
    } else {
      onWhatsAppClick?.();
    }
  };

  const heroBlock = (
    <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{t('publicPage.indieProsLayout.heroKicker')}</p>
        <h1
          className="text-3xl font-bold leading-tight sm:text-4xl"
          style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
        >
          {company.name}
        </h1>
        <p className="max-w-2xl text-sm text-slate-700 sm:text-base" style={{ fontFamily: theme.fontBody }}>
          {company.description ||
            t('publicPage.indieProsLayout.heroSubtitle', {
              city: company.commune || company.sector || t('publicPage.indieProsLayout.cityFallback'),
            })}
        </p>
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label={t('publicPage.indieProsLayout.specialties')}>
            {specialties.map((name) => (
              <span
                key={name}
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <AnimatedButton
            onClick={handlePrimaryCta}
            ariaLabel={t('publicPage.indieProsLayout.primaryCta')}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg transition"
            style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
            disabled={!hasPrimaryAction}
          >
            {t('publicPage.indieProsLayout.primaryCta')}
          </AnimatedButton>
          {company.whatsapp && (
            <button
              type="button"
              onClick={onWhatsAppClick}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span aria-hidden>💬</span>
              {t('publicPage.indieProsLayout.secondaryCta')}
            </button>
          )}
        </div>
      </div>
      {appearance?.banner_url && (
        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-slate-100 bg-white/60 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/10 via-transparent to-emerald-100/60" aria-hidden />
          <img src={appearance.banner_url} alt={company.name} className="relative h-full w-full object-cover" loading="lazy" />
        </div>
      )}
    </div>
  );

  const servicesSection = (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t('publicPage.indieProsLayout.servicesKicker')}</p>
          <h2
            className="text-xl font-bold text-slate-900 sm:text-2xl"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {t('publicPage.indieProsLayout.servicesTitle')}
          </h2>
          <p className="text-sm text-slate-600">{t('publicPage.indieProsLayout.servicesSubtitle')}</p>
        </div>
        {services.length > 0 && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {t('publicPage.indieProsLayout.servicesBadge')}
          </span>
        )}
      </div>
      {services.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <ServiceDetailCard
              key={service.id}
              service={service}
              theme={theme}
              onBook={onBookService}
              onServiceClick={onServiceClick}
              locale={i18n.language}
              labels={{
                book: t('publicPage.indieProsLayout.book'),
                duration: service.estimated_duration_minutes
                  ? t('publicPage.indieProsLayout.duration', { minutes: service.estimated_duration_minutes })
                  : t('publicPage.indieProsLayout.durationUnknown'),
                priceOnRequest: t('publicPage.indieProsLayout.priceOnRequest'),
                unavailable: t('publicPage.indieProsLayout.unavailable'),
                mode: t('publicPage.indieProsLayout.mode'),
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
          {t('publicPage.indieProsLayout.noServices')}
        </div>
      )}
    </section>
  );

  const scheduleSection = (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t('publicPage.indieProsLayout.scheduleKicker')}</p>
          <h2
            className="text-xl font-bold text-slate-900 sm:text-2xl"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {t('publicPage.indieProsLayout.scheduleTitle')}
          </h2>
          <p className="text-sm text-slate-600">{t('publicPage.indieProsLayout.scheduleSubtitle')}</p>
        </div>
        <AnimatedButton
          onClick={handlePrimaryCta}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 disabled:opacity-50"
          ariaLabel={t('publicPage.indieProsLayout.scheduleCta')}
          disabled={!hasPrimaryAction}
        >
          <span aria-hidden>📅</span>
          {t('publicPage.indieProsLayout.scheduleCta')}
        </AnimatedButton>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-2">
          {upcomingSlots.length > 0 ? (
            upcomingSlots.map((slot, index) => (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${
                      index % 2 === 0 ? 'bg-slate-900' : 'bg-emerald-600'
                    }`}
                    aria-hidden
                  >
                    {slot.label}
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: theme.titleColor }}>
                      {slot.timeRange}
                    </p>
                    <p className="text-xs text-slate-600">{t('publicPage.indieProsLayout.scheduleHelper')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                  disabled={!hasPrimaryAction}
                >
                  {t('publicPage.indieProsLayout.scheduleCta')}
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
              {t('publicPage.indieProsLayout.scheduleEmpty')}
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{t('publicPage.indieProsLayout.stepsKicker')}</p>
          <h3
            className="text-lg font-semibold text-slate-900"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {t('publicPage.indieProsLayout.stepsTitle')}
          </h3>
          <ol className="space-y-3 text-sm text-slate-700">
            {['service', 'date', 'time', 'client'].map((stepKey, idx) => (
              <li key={stepKey} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-semibold">{t(`publicPage.indieProsLayout.steps.${stepKey}.title`)}</p>
                  <p className="text-xs text-slate-600">{t(`publicPage.indieProsLayout.steps.${stepKey}.desc`)}</p>
                </div>
              </li>
            ))}
          </ol>
          <AnimatedButton
            onClick={handlePrimaryCta}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-60"
            ariaLabel={t('publicPage.indieProsLayout.primaryCta')}
            disabled={!hasPrimaryAction}
          >
            {t('publicPage.indieProsLayout.primaryCta')}
          </AnimatedButton>
        </div>
      </div>
    </section>
  );

  const trustSection = (
    <section className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t('publicPage.indieProsLayout.trustKicker')}</p>
          <h2
            className="text-xl font-bold text-slate-900 sm:text-2xl"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {t('publicPage.indieProsLayout.trustTitle')}
          </h2>
          <p className="text-sm text-slate-600">{t('publicPage.indieProsLayout.trustSubtitle')}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white px-3 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t('publicPage.indieProsLayout.credKicker')}
          </p>
          <p className="mt-2 text-sm font-semibold" style={{ color: theme.titleColor }}>
            {company.industry || company.sector || t('publicPage.indieProsLayout.credFallback')}
          </p>
          <p className="text-xs text-slate-600">{t('publicPage.indieProsLayout.credHelper')}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white px-3 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t('publicPage.indieProsLayout.locationKicker')}
          </p>
          <p className="mt-2 text-sm font-semibold" style={{ color: theme.titleColor }}>
            {company.address || t('publicPage.indieProsLayout.locationFallback')}
          </p>
          <p className="text-xs text-slate-600">{t('publicPage.indieProsLayout.locationHelper')}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white px-3 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {t('publicPage.indieProsLayout.faqKicker')}
          </p>
          <p className="mt-2 text-sm font-semibold" style={{ color: theme.titleColor }}>
            {t('publicPage.indieProsLayout.faqTitle')}
          </p>
          <p className="text-xs text-slate-600">{t('publicPage.indieProsLayout.faqHelper')}</p>
          {sections.faqs ? <div className="mt-2 text-xs text-slate-600">{sections.faqs}</div> : null}
        </div>
      </div>
    </section>
  );

  const teamSection = showProfessionals ? (
    <section className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t('publicPage.indieProsLayout.teamKicker')}</p>
          <h2
            className="text-xl font-bold text-slate-900 sm:text-2xl"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {t('publicPage.indieProsLayout.teamTitle')}
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {professionals.map((professional) => (
          <ProfessionalBadge
            key={professional.id}
            professional={professional}
            theme={theme}
            fallback={t('publicPage.indieProsLayout.teamFallback')}
          />
        ))}
      </div>
    </section>
  ) : null;

  const mergedSections: PublicLayoutSections = {
    ...sections,
    hero: heroBlock,
    services: servicesSection,
    schedule: scheduleSection,
    team: teamSection ?? undefined,
    highlight: sections.highlight ? (
      <div className="space-y-4">
        {trustSection}
        {sections.highlight}
      </div>
    ) : (
      trustSection
    ),
  };

  const mobileCta =
    isServicesBusiness && hasPrimaryAction ? (
      <button
        type="button"
        onClick={handlePrimaryCta}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-white shadow-lg transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        aria-label={t('publicPage.indieProsLayout.primaryCta')}
        disabled={!hasPrimaryAction}
      >
        📅 {t('publicPage.indieProsLayout.primaryCta')}
      </button>
    ) : (
      floatingCta
    );

  return (
    <PublicLayoutShell
      {...props}
      sections={mergedSections}
      contactActions={contactActions}
      floatingCta={mobileCta}
    />
  );
}
