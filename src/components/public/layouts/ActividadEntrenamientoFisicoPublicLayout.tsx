import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import AnimatedButton from '../../animations/AnimatedButton';
import { PublicLayoutShell } from '../../../pages/public/layouts/PublicLayoutShell';
import { type PublicLayoutProps, type PublicLayoutSections } from '../../../pages/public/layouts/types';
import { DAY_OF_WEEK_KEYS } from '../../../pages/public/constants';
import { isModuleEnabled, resolveCategoryId } from '../../../config/categories';
import { BusinessType, type Professional, type ScheduleSlot, type Service } from '../../../types';

type UpcomingSlot = {
  id: string;
  dayLabel: string;
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
  const entries: UpcomingSlot[] = [];

  schedules.forEach((slot) => {
    if (slot.status === 'INACTIVE') return;
    (slot.days_of_week || []).forEach((dayKey) => {
      const nextDate = getNextOccurrence(dayKey, slot.start_time);
      if (!nextDate) return;

      const dayLabel = nextDate.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
      entries.push({
        id: `${slot.id}-${dayKey}`,
        dayLabel,
        timeRange: slot.end_time ? `${slot.start_time} - ${slot.end_time}` : slot.start_time,
        date: nextDate,
      });
    });
  });

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, limit);
}

function FitnessServiceCard({
  service,
  onBookService,
  onServiceClick,
  theme,
  bookLabel,
  priceLabel,
  durationLabel,
  activeLabel,
  unavailableLabel,
  locale,
}: {
  service: Service;
  onBookService?: (service: Service) => void;
  onServiceClick?: (service: Service) => void;
  theme: PublicLayoutProps['theme'];
  bookLabel: string;
  priceLabel: string;
  durationLabel?: string;
  unavailableLabel: string;
  activeLabel: string;
  locale: string;
}) {
  const [isTapping, setIsTapping] = useState(false);
  const isActive = service.status !== 'INACTIVE';
  const badgeText = isActive ? durationLabel || activeLabel : unavailableLabel;
  const formattedPrice = service.hide_price
    ? priceLabel
    : `$ ${service.price.toLocaleString(locale || 'es-CL')}`;

  const handleCardClick = useCallback(() => {
    if (onServiceClick) {
      setIsTapping(true);
      setTimeout(() => setIsTapping(false), 200);
      onServiceClick(service);
    }
  }, [onServiceClick, service]);

  const handleBookClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookService && isActive) {
      setIsTapping(true);
      setTimeout(() => setIsTapping(false), 200);
      onBookService(service);
    }
  }, [onBookService, service, isActive]);

  return (
    <article
      key={service.id}
      onClick={handleCardClick}
      className={`group flex h-full flex-col rounded-2xl border border-slate-200 bg-white/80 shadow-sm transition-all cursor-pointer ${
        isTapping ? 'scale-95' : 'hover:-translate-y-1 hover:shadow-lg'
      }`}
      style={{ color: theme.textColor }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`${service.name} - ${bookLabel}`}
    >
      <div
        className="flex-1 space-y-3 p-4"
        style={{ background: `linear-gradient(135deg, ${theme.cardColor}, #ffffff)` }}
      >
        <div className="flex items-center justify-between gap-2">
          <h3
            className="text-lg font-bold leading-tight"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {service.name}
          </h3>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {badgeText}
          </span>
        </div>
        {service.description && (
          <p className="line-clamp-3 text-sm opacity-80">{service.description}</p>
        )}
        <div className="flex items-center justify-between text-sm font-semibold">
          <span style={{ color: theme.buttonColor }}>{formattedPrice}</span>
          {service.estimated_duration_minutes && (
            <span className="text-xs text-slate-600">{durationLabel}</span>
          )}
        </div>
      </div>
      <div className="border-t border-slate-100 bg-white/90 p-3" onClick={handleBookClick}>
        <AnimatedButton
          onClick={handleBookClick}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:shadow-md disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
          disabled={!isActive}
          ariaLabel={`${bookLabel} ${service.name}`}
        >
          {bookLabel}
        </AnimatedButton>
      </div>
    </article>
  );
}

function TrainerCard({ professional, theme, fallback }: { professional: Professional; theme: PublicLayoutProps['theme']; fallback: string }) {
  const [isTapping, setIsTapping] = useState(false);
  const initials = professional.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const specialties = professional.specialties?.filter(Boolean) ?? [];

  const handleClick = useCallback(() => {
    setIsTapping(true);
    setTimeout(() => setIsTapping(false), 200);
  }, []);

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm transition-all cursor-pointer ${
        isTapping ? 'scale-95' : 'hover:-translate-y-0.5 hover:shadow-md'
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${professional.name} - ${specialties.length > 0 ? specialties.join(', ') : fallback}`}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-inner flex-shrink-0"
        style={{ backgroundColor: theme.buttonColor }}
        aria-hidden
      >
        {initials || 'PT'}
      </div>
      <div className="flex-1 min-w-0">
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

export function ActividadEntrenamientoFisicoPublicLayout(props: PublicLayoutProps) {
  const {
    company,
    services = [],
    professionals = [],
    schedules = [],
    sections,
    theme,
    onBookService,
    onWhatsAppClick,
    onServiceClick,
    contactActions,
    floatingCta,
  } = props;
  const { t, i18n } = useTranslation();

  // Validación robusta para evitar fallos si falta data
  const categoryId = useMemo(() => {
    try {
      return resolveCategoryId(company);
    } catch (error) {
      console.warn('Error resolving category ID:', error);
      return null;
    }
  }, [company]);

  const primaryService = useMemo(() => {
    if (!services || !Array.isArray(services) || services.length === 0) {
      return null;
    }
    return services[0];
  }, [services]);

  const isServicesBusiness = useMemo(() => {
    if (!company) return false;
    return company.business_type === BusinessType.SERVICES || company.businessMode === 'BOTH';
  }, [company]);

  const showProfessionals = useMemo(() => {
    if (!isServicesBusiness || !categoryId) return false;
    try {
      return isModuleEnabled(categoryId, 'professionals') && professionals && professionals.length > 0;
    } catch (error) {
      console.warn('Error checking professionals module:', error);
      return false;
    }
  }, [isServicesBusiness, categoryId, professionals]);

  const hasPrimaryAction = useMemo(() => {
    return Boolean((onBookService && primaryService) || onWhatsAppClick);
  }, [onBookService, primaryService, onWhatsAppClick]);

  const handlePrimaryCta = () => {
    if (!hasPrimaryAction) return;
    if (onBookService && primaryService) {
      onBookService(primaryService);
    } else {
      onWhatsAppClick?.();
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isBookingSlot, setIsBookingSlot] = useState(false);

  // Memoizar slots con validación robusta para evitar fallos si falta data
  const upcomingSlots = useMemo(() => {
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return [];
    }
    try {
      return getUpcomingSlots(schedules, 6, i18n.language);
    } catch (error) {
      console.warn('Error calculating upcoming slots:', error);
      return [];
    }
  }, [schedules, i18n.language]);

  const handleSlotBook = useCallback(async (slot: UpcomingSlot) => {
    if (!onBookService || !primaryService || isBookingSlot) return;
    
    setIsBookingSlot(true);
    setSelectedSlotId(slot.id);
    
    try {
      // Pequeño delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 150));
      onBookService(primaryService);
      toast.success(t('publicPage.fitnessLayout.slotSelected', { 
        day: slot.dayLabel, 
        time: slot.timeRange 
      }), { duration: 2000 });
    } catch (error) {
      toast.error(t('publicPage.fitnessLayout.slotError'));
    } finally {
      setTimeout(() => {
        setIsBookingSlot(false);
        setSelectedSlotId(null);
      }, 500);
    }
  }, [onBookService, primaryService, isBookingSlot, t]);

  const heroBlock = (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr] lg:items-center">
      <div className="space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
          🏋️ {t('publicPage.fitnessLayout.heroKicker')}
        </span>
        <div className="space-y-2">
          <h1
            className="text-3xl font-black leading-tight sm:text-4xl"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {company.name}
          </h1>
          <p className="max-w-2xl text-sm text-slate-700 sm:text-base" style={{ fontFamily: theme.fontBody }}>
            {company.description ||
              t('publicPage.fitnessLayout.heroSubtitle', { city: company.commune || company.sector || t('publicPage.fitnessLayout.cityFallback') })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AnimatedButton
            onClick={handlePrimaryCta}
            ariaLabel={t('publicPage.fitnessLayout.primaryCta')}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg transition"
            style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
            disabled={!hasPrimaryAction}
          >
            {t('publicPage.fitnessLayout.primaryCta')}
          </AnimatedButton>
          <button
            type="button"
            onClick={() => scrollToSection('fitness-schedule')}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span aria-hidden>⏱️</span>
            {t('publicPage.fitnessLayout.secondaryCta')}
          </button>
        </div>
        <div
          className="flex flex-wrap gap-2 text-xs sm:text-sm"
          aria-label={t('publicPage.fitnessLayout.sectionNavLabel')}
        >
          <button
            type="button"
            onClick={() => scrollToSection('fitness-classes')}
            className="rounded-full border border-emerald-200 bg-white/80 px-3 py-1 font-semibold text-emerald-800 shadow-sm"
          >
            {t('publicPage.fitnessLayout.sectionNavClasses')}
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('fitness-schedule')}
            className="rounded-full border border-sky-200 bg-white/80 px-3 py-1 font-semibold text-sky-800 shadow-sm"
          >
            {t('publicPage.fitnessLayout.sectionNavSchedule')}
          </button>
          {showProfessionals && (
            <button
              type="button"
              onClick={() => scrollToSection('fitness-trainers')}
              className="rounded-full border border-amber-200 bg-white/80 px-3 py-1 font-semibold text-amber-800 shadow-sm"
            >
              {t('publicPage.fitnessLayout.sectionNavTrainers')}
            </button>
          )}
        </div>
      </div>
      {props.appearance?.banner_url && (
        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-emerald-100 bg-white/60 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/60 via-transparent to-sky-100/70" aria-hidden />
          <img
            src={props.appearance.banner_url}
            alt={company.name}
            className="relative h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );

  const servicesSection = (
    <section id="fitness-classes" className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t('publicPage.fitnessLayout.servicesKicker')}</p>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
            {t('publicPage.fitnessLayout.servicesTitle')}
          </h2>
          <p className="text-sm text-slate-600">{t('publicPage.fitnessLayout.servicesSubtitle')}</p>
        </div>
        {services.length > 0 && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {t('publicPage.fitnessLayout.servicesBadge')}
          </span>
        )}
      </div>
      {services.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <FitnessServiceCard
              key={service.id}
              service={service}
              theme={theme}
              onBookService={onBookService}
              onServiceClick={onServiceClick}
              bookLabel={t('publicPage.fitnessLayout.book')}
              priceLabel={t('publicPage.fitnessLayout.priceOnRequest')}
              durationLabel={
                service.estimated_duration_minutes
                  ? t('publicPage.fitnessLayout.duration', { minutes: service.estimated_duration_minutes })
                  : undefined
              }
              unavailableLabel={t('publicPage.fitnessLayout.unavailable')}
              activeLabel={t('publicPage.fitnessLayout.activeService')}
              locale={i18n.language}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center space-y-2">
          <p className="text-3xl" aria-hidden="true">🏋️</p>
          <p className="text-sm font-semibold text-slate-700">{t('publicPage.fitnessLayout.noServicesTitle')}</p>
          <p className="text-xs text-slate-600">{t('publicPage.fitnessLayout.noServices')}</p>
          {onWhatsAppClick && (
            <button
              type="button"
              onClick={onWhatsAppClick}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition"
            >
              💬 {t('publicPage.fitnessLayout.contactCta')}
            </button>
          )}
        </div>
      )}
    </section>
  );

  const teamSection = showProfessionals ? (
    <section
      id="fitness-trainers"
      className="space-y-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm sm:p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t('publicPage.fitnessLayout.teamKicker')}</p>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
            {t('publicPage.fitnessLayout.teamTitle')}
          </h2>
        </div>
      </div>
      {professionals.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {professionals.map((professional) => (
            <TrainerCard
              key={professional.id}
              professional={professional}
              theme={theme}
              fallback={t('publicPage.fitnessLayout.teamFallback')}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center space-y-2">
          <p className="text-3xl" aria-hidden="true">👥</p>
          <p className="text-sm font-semibold text-slate-700">{t('publicPage.fitnessLayout.noTrainersTitle')}</p>
          <p className="text-xs text-slate-600">{t('publicPage.fitnessLayout.noTrainers')}</p>
          {onWhatsAppClick && (
            <button
              type="button"
              onClick={onWhatsAppClick}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition"
            >
              💬 {t('publicPage.fitnessLayout.contactCta')}
            </button>
          )}
        </div>
      )}
    </section>
  ) : null;

  const scheduleSection = (
    <section
      id="fitness-schedule"
      className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t('publicPage.fitnessLayout.scheduleKicker')}</p>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl" style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}>
            {t('publicPage.fitnessLayout.scheduleTitle')}
          </h2>
          <p className="text-sm text-slate-600">{t('publicPage.fitnessLayout.scheduleSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={handlePrimaryCta}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600"
          disabled={!hasPrimaryAction}
        >
          <span aria-hidden>📅</span>
          {t('publicPage.fitnessLayout.primaryCta')}
        </button>
      </div>

      {upcomingSlots.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          {upcomingSlots.map((slot, index) => {
            const isSelected = selectedSlotId === slot.id;
            const isProcessing = isBookingSlot && isSelected;
            
            return (
              <div
                key={slot.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 rounded-xl border transition-all ${
                  isSelected 
                    ? 'border-emerald-400 bg-emerald-50/50 shadow-md' 
                    : 'border-slate-100 bg-white shadow-sm hover:shadow-md'
                } px-3 py-3 sm:py-3`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className={`flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0 transition-all ${
                      index % 2 === 0 ? 'bg-emerald-500' : 'bg-sky-500'
                    } ${isSelected ? 'scale-110 ring-2 ring-emerald-300' : ''}`}
                    aria-hidden
                  >
                    {slot.dayLabel}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold truncate" style={{ color: theme.titleColor }}>
                      {slot.timeRange}
                    </p>
                    <p className="text-xs text-slate-600">{t('publicPage.fitnessLayout.scheduleCtaHelper')}</p>
                  </div>
                </div>
                <AnimatedButton
                  onClick={() => handleSlotBook(slot)}
                  className="w-full sm:w-auto rounded-full px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                  style={{ 
                    backgroundColor: isSelected ? theme.buttonColor : theme.buttonColor, 
                    color: theme.buttonTextColor, 
                    fontFamily: theme.fontButton 
                  }}
                  ariaLabel={t('publicPage.fitnessLayout.scheduleCta')}
                  disabled={!hasPrimaryAction || isBookingSlot}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('publicPage.fitnessLayout.booking')}
                    </span>
                  ) : (
                    t('publicPage.fitnessLayout.scheduleCta')
                  )}
                </AnimatedButton>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center space-y-2">
          <p className="text-3xl" aria-hidden="true">📅</p>
          <p className="text-sm font-semibold text-slate-700">{t('publicPage.fitnessLayout.scheduleEmptyTitle')}</p>
          <p className="text-xs text-slate-600">{t('publicPage.fitnessLayout.scheduleEmpty')}</p>
          {onWhatsAppClick && (
            <button
              type="button"
              onClick={onWhatsAppClick}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition"
            >
              💬 {t('publicPage.fitnessLayout.contactCta')}
            </button>
          )}
        </div>
      )}
    </section>
  );

  const mergedSections: PublicLayoutSections = {
    ...sections,
    hero: heroBlock,
    highlight: sections.highlight,
    services: servicesSection,
    schedule: scheduleSection,
    team: teamSection ?? undefined,
  };

  const mobileCta =
    isServicesBusiness && hasPrimaryAction ? (
      <button
        type="button"
        onClick={handlePrimaryCta}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-white shadow-lg transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-500"
        aria-label={t('publicPage.fitnessLayout.primaryCta')}
      >
        🏃 {t('publicPage.fitnessLayout.primaryCta')}
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
