import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import AnimatedButton from '../../animations/AnimatedButton';
import { PublicLayoutShell } from '../../../pages/public/layouts/PublicLayoutShell';
import { type PublicLayoutProps, type PublicLayoutSections } from '../../../pages/public/layouts/types';
import { DAY_OF_WEEK_KEYS } from '../../../pages/public/constants';
import { isModuleEnabled, resolveCategoryId } from '../../../config/categories';
import { BusinessType, type Professional, type Service } from '../../../types';
import { useDebounce } from '../../../hooks/useDebounce';
import { filterServicesBySearch, buildSearchText } from '../../../utils/serviceSearch';
import { getOccupiedSlotsForDateRange, isSlotOccupied, type CalendarInventoryEntry } from '../../../services/calendarInventory';
import { formatLocalDate } from '../../../utils/date';

type ScheduleStrip = {
  label: string;
  hours: string;
  accent: 'emerald' | 'sky';
};

type SortOption = 'relevance' | 'priceAsc' | 'priceDesc' | 'durationAsc' | 'durationDesc' | 'nameAsc';
type AvailabilityFilter = 'all' | 'active' | 'inactive';

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase();
}

function BarberServiceCard({
  service,
  theme,
  onBook,
  onServiceClick,
  isAvailable,
  availabilityLabel,
  unavailableLabel,
  priceLabel,
}: {
  service: Service;
  theme: PublicLayoutProps['theme'];
  onBook?: (service: Service) => void;
  onServiceClick?: (service: Service) => void;
  isAvailable: boolean;
  availabilityLabel: string;
  unavailableLabel: string;
  priceLabel: string;
}) {
  const hasDuration = service.estimated_duration_minutes && service.estimated_duration_minutes > 0;

  const handleBookClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (onBook && isAvailable) {
      onBook(service);
    }
  };

  const accentColor = theme.buttonColor || '#2563eb';
  const availableBadgeBg = accentColor + '18';
  const availableBadgeText = accentColor;
  const unavailableBadgeBg = theme.textColor ? theme.textColor + '18' : 'rgba(148, 163, 184, 0.15)';
  const unavailableBadgeText = theme.subtitleColor || theme.textColor || '#64748b';
  const cardShadow = `0 4px 20px ${accentColor}12`;
  const hoverShadow = `0 12px 32px ${accentColor}20`;
  const cardGradientEnd = theme.cardColor ? theme.cardColor + 'e8' : '#fafbfc';
  const cardGradient = `linear-gradient(165deg, ${theme.cardColor || '#ffffff'} 0%, ${cardGradientEnd} 100%)`;

  return (
    <article
      key={service.id}
      onClick={() => onServiceClick?.(service)}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border-0 shadow-lg transition-all duration-300 hover:-translate-y-1.5"
      style={{
        color: theme.textColor,
        backgroundColor: theme.cardColor || '#ffffff',
        borderLeft: `4px solid ${isAvailable ? accentColor : 'transparent'}`,
        boxShadow: cardShadow,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = hoverShadow;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = cardShadow;
      }}
    >
      <div
        className="absolute right-3 top-3 rounded-full px-3 py-1.5 text-xs font-semibold"
        style={{
          backgroundColor: isAvailable ? availableBadgeBg : unavailableBadgeBg,
          color: isAvailable ? availableBadgeText : unavailableBadgeText,
          border: `1px solid ${isAvailable ? accentColor + '40' : unavailableBadgeText + '30'}`,
        }}
      >
        {isAvailable ? availabilityLabel : unavailableLabel}
      </div>

      <div
        className="flex-1 space-y-3 p-4 pt-5"
        style={{
          background: cardGradient,
        }}
      >
        <h3
          className="line-clamp-2 text-lg font-bold leading-tight"
          style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
        >
          {service.name}
        </h3>
        {service.description && (
          <p
            className="line-clamp-3 text-sm leading-relaxed"
            style={{
              color: theme.descriptionColor || theme.textColor || '#6b7280',
              opacity: 0.9,
            }}
          >
            {service.description}
          </p>
        )}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span
            className="text-base font-bold"
            style={{ color: accentColor, fontFamily: theme.fontTitle }}
          >
            {priceLabel}
          </span>
          {hasDuration && (
            <span
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                color: theme.subtitleColor || theme.textColor || '#64748b',
                backgroundColor: theme.textColor ? `${theme.textColor}0c` : 'rgba(100, 116, 139, 0.12)',
              }}
              title={`Duración: ${service.estimated_duration_minutes} minutos`}
            >
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {service.estimated_duration_minutes} min
            </span>
          )}
        </div>
      </div>

      <div
        className="border-t p-3"
        style={{
          borderTopColor: theme.cardColor ? `${theme.cardColor}99` : 'rgba(148, 163, 184, 0.25)',
          backgroundColor: theme.cardColor || '#ffffff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatedButton
          onClick={handleBookClick}
          disabled={!isAvailable}
          className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
            isAvailable ? 'hover:opacity-95 hover:scale-[1.02]' : 'opacity-55 cursor-not-allowed'
          }`}
          style={{
            backgroundColor: isAvailable ? accentColor : '#9ca3af',
            color: theme.buttonTextColor || '#ffffff',
            fontFamily: theme.fontButton,
            boxShadow: isAvailable ? `0 4px 14px ${accentColor}40` : 'none',
          }}
          ariaLabel={isAvailable ? `Agendar ${service.name}` : `${service.name} no disponible`}
        >
          {isAvailable ? 'Agendar' : 'No disponible'}
        </AnimatedButton>
      </div>
    </article>
  );
}

function TeamCard({
  professional,
  theme,
  fallbackSpecialty,
}: {
  professional: Professional;
  theme: PublicLayoutProps['theme'];
  fallbackSpecialty: string;
}) {
  const initials = getInitials(professional.name);
  const specialties = professional.specialties?.filter(Boolean) ?? [];
  const accentColor = theme.buttonColor || '#2563eb';

  return (
    <div
      className="flex items-center gap-4 rounded-xl border-0 p-4 shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        backgroundColor: theme.cardColor || '#ffffff',
        boxShadow: `0 4px 16px ${accentColor}10`,
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-inner"
        style={{
          backgroundColor: accentColor,
          boxShadow: `0 2px 8px ${accentColor}50`,
        }}
        aria-hidden
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold" style={{ color: theme.titleColor }}>
          {professional.name}
        </p>
        <p className="truncate text-xs font-medium" style={{ color: theme.subtitleColor || theme.textColor || '#64748b', opacity: 0.9 }}>
          {specialties.length > 0 ? specialties.join(' • ') : fallbackSpecialty}
        </p>
      </div>
    </div>
  );
}

export function BarberiasPublicLayout(props: PublicLayoutProps) {
  const {
    company,
    services = [],
    professionals = [],
    schedules = [],
    serviceSchedules = [],
    sections,
    contactActions,
    appearance,
    theme,
    variant,
    floatingCta,
    onBookService,
    onWhatsAppClick,
    onServiceClick,
    hideHeroLogoOnMobile,
  } = props;
  const { t, i18n } = useTranslation();
  const [ctaState, setCtaState] = useState<'idle' | 'sent'>('idle');
  const [lastTrackedService, setLastTrackedService] = useState<string | null>(null);
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false);
  const [pickerProfessionalId, setPickerProfessionalId] = useState<string>(''); // '' = cualquiera
  const [isMobileCtaMinimized, setIsMobileCtaMinimized] = useState(false);
  const lastMobileCtaAtRef = useRef(0);
  const mobileCtaIdleTimerRef = useRef<number | null>(null);
  const pickerGestureStartRef = useRef<{ x: number; y: number } | null>(null);
  const pickerGestureMovedRef = useRef(false);
  const lastPickerSelectAtRef = useRef(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByAvailability, setFilterByAvailability] = useState<AvailabilityFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const ITEMS_PER_PAGE = 12;
  const [occupiedSlots, setOccupiedSlots] = useState<CalendarInventoryEntry[]>([]);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);

  const activeScheduleIds = useMemo(() => {
    return new Set(schedules.filter((slot) => slot.status !== 'INACTIVE').map((slot) => slot.id));
  }, [schedules]);

  const serviceScheduleMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    serviceSchedules.forEach((schedule) => {
      if (!map.has(schedule.service_id)) {
        map.set(schedule.service_id, new Set());
      }
      map.get(schedule.service_id)?.add(schedule.schedule_slot_id);
    });
    return map;
  }, [serviceSchedules]);

  const isServiceAvailable = useCallback(
    (service: Service) => {
      if (service.status === 'INACTIVE') return false;
      if (activeScheduleIds.size === 0 || serviceScheduleMap.size === 0) {
        return service.status === 'ACTIVE' || !service.status;
      }
      const slotIds = serviceScheduleMap.get(service.id);
      if (!slotIds) return false;
      const candidateSlots = [...slotIds]
        .filter((slotId) => activeScheduleIds.has(slotId))
        .map((slotId) => schedules.find((slot) => slot.id === slotId))
        .filter(Boolean) as typeof schedules;
      if (candidateSlots.length === 0) return false;

      if (!availabilityLoaded || occupiedSlots.length === 0) {
        return true;
      }

      const professionalsForService =
        service.professional_ids && service.professional_ids.length > 0
          ? service.professional_ids
          : ['unassigned'];

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30);

      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayKey = DAY_OF_WEEK_KEYS[date.getDay()];
        const dateStr = formatLocalDate(date);
        const occupiedForDate = occupiedSlots.filter((slot) => slot.date === dateStr);
        for (const slot of candidateSlots) {
          if (!slot.days_of_week?.includes(dayKey)) continue;
          for (const professionalId of professionalsForService) {
            const relevantOccupied = occupiedForDate.filter(
              (item) => item.professional_id === professionalId || item.professional_id === 'unassigned'
            );
            if (!isSlotOccupied(slot, relevantOccupied)) {
              return true;
            }
          }
        }
      }

      return false;
    },
    [activeScheduleIds, serviceScheduleMap, schedules, availabilityLoaded, occupiedSlots]
  );

  const categoryId = resolveCategoryId(company);
  const showTeam =
    company.business_type === BusinessType.SERVICES &&
    isModuleEnabled(categoryId, 'professionals') &&
    professionals.length > 0;
  const hasServices = company.business_type === BusinessType.SERVICES && services.length > 0;
  const hasPrimaryAction = (hasServices && onBookService) || onWhatsAppClick;
  const cityLabel = company.commune || company.sector || t('publicPage.barberLayout.cityFallback');

  const dayLabels = useMemo(() => {
    return DAY_OF_WEEK_KEYS.reduce<Record<string, string>>((acc, key) => {
      acc[key] = t(`publicPage.barberLayout.days.${key.toLowerCase()}`, key);
      return acc;
    }, {});
  }, [t]);

  const scheduleStrips: ScheduleStrip[] = useMemo(() => {
    const strips: ScheduleStrip[] = [];
    const weekdayHours =
      company.weekday_open_time && company.weekday_close_time
        ? `${company.weekday_open_time} - ${company.weekday_close_time}`
        : t('publicPage.barberLayout.flexibleHours');
    const weekendHours =
      company.weekend_open_time && company.weekend_close_time
        ? `${company.weekend_open_time} - ${company.weekend_close_time}`
        : t('publicPage.barberLayout.flexibleHours');

    (company.weekday_days ?? []).forEach((day) => {
      strips.push({
        label: dayLabels[day] ?? day,
        hours: weekdayHours,
        accent: 'sky',
      });
    });

    (company.weekend_days ?? []).forEach((day) => {
      strips.push({
        label: dayLabels[day] ?? day,
        hours: weekendHours,
        accent: 'emerald',
      });
    });

    return strips;
  }, [
    company.weekday_days,
    company.weekday_open_time,
    company.weekday_close_time,
    company.weekend_days,
    company.weekend_open_time,
    company.weekend_close_time,
    dayLabels,
    t,
  ]);

  useEffect(() => {
    let isMounted = true;
    if (!company?.id || schedules.length === 0) {
      setOccupiedSlots([]);
      setAvailabilityLoaded(false);
      return;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    getOccupiedSlotsForDateRange(company.id, startDate, endDate)
      .then((data) => {
        if (isMounted) {
          setOccupiedSlots(data);
          setAvailabilityLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setOccupiedSlots([]);
          setAvailabilityLoaded(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [company?.id, schedules.length]);

  const filteredServices = useMemo(() => {
    // Primero filtrar por búsqueda
    const searchFiltered = filterServicesBySearch(services, debouncedSearchTerm);
    
    // Luego filtrar por disponibilidad
    if (filterByAvailability === 'all') {
      return searchFiltered;
    }
    
    return searchFiltered.filter((service) => {
      const isAvailable = isServiceAvailable(service);
      return filterByAvailability === 'active' ? isAvailable : !isAvailable;
    });
  }, [services, debouncedSearchTerm, filterByAvailability, isServiceAvailable]);

  const sortedServices = useMemo(() => {
    const normalizedSearch = debouncedSearchTerm.trim().toLowerCase();
    
    const relevanceScore = (service: Service) => {
      let score = 0;
      if (normalizedSearch) {
        const text = buildSearchText(service);
        if (text.includes(normalizedSearch)) score += 30;
        if (service.name.toLowerCase().includes(normalizedSearch)) score += 20;
        if (service.description?.toLowerCase().includes(normalizedSearch)) score += 10;
      }
      const isAvailable = isServiceAvailable(service);
      if (isAvailable) score += 10;
      if (!isAvailable) score -= 25;
      return score;
    };

    const sorted = [...filteredServices];
    
    switch (sortBy) {
      case 'priceAsc':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'priceDesc':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'durationAsc':
        return sorted.sort((a, b) => (a.estimated_duration_minutes || 0) - (b.estimated_duration_minutes || 0));
      case 'durationDesc':
        return sorted.sort((a, b) => (b.estimated_duration_minutes || 0) - (a.estimated_duration_minutes || 0));
      case 'nameAsc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, i18n.language));
      case 'relevance':
      default:
        return sorted.sort((a, b) => relevanceScore(b) - relevanceScore(a));
    }
  }, [filteredServices, sortBy, debouncedSearchTerm, i18n.language, isServiceAvailable]);

  // Paginación
  const totalPages = Math.ceil(sortedServices.length / ITEMS_PER_PAGE);
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedServices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedServices, currentPage]);

  // Resetear página cuando cambian filtros/búsqueda/ordenamiento
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterByAvailability, sortBy]);

  const handlePrimaryCta = useCallback(() => {
    if (hasServices && onBookService) {
      // Tracking solo si no se ha trackeado recientemente el mismo servicio
      const firstService = services[0];
      if (firstService && lastTrackedService !== firstService.id) {
        setLastTrackedService(firstService.id);
        // El tracking se hace en PublicPage.handleBookService, no duplicar aquí
      }
      onBookService(firstService);
    } else {
      onWhatsAppClick?.();
    }

    setCtaState('sent');
    setTimeout(() => setCtaState('idle'), 1200);
  }, [hasServices, onBookService, services, onWhatsAppClick, lastTrackedService]);

  const bookableServices = useMemo(() => {
    if (!hasServices) return [];
    return services.filter((s) => isServiceAvailable(s));
  }, [hasServices, services, isServiceAvailable]);

  const pickerProfessionals = useMemo(() => {
    if (!showTeam || professionals.length === 0) return [];
    // Si algún servicio no define professional_ids, asumimos que cualquiera puede atenderlo.
    const hasUnscopedService = bookableServices.some((s) => !s.professional_ids || s.professional_ids.length === 0);
    if (hasUnscopedService) return professionals;
    const allowed = new Set<string>();
    for (const s of bookableServices) {
      (s.professional_ids || []).forEach((id) => allowed.add(id));
    }
    return professionals.filter((p) => allowed.has(p.id));
  }, [showTeam, professionals, bookableServices]);

  const pickerFilteredServices = useMemo(() => {
    if (!pickerProfessionalId) return bookableServices;
    return bookableServices.filter((s) => {
      if (!s.professional_ids || s.professional_ids.length === 0) return true;
      return s.professional_ids.includes(pickerProfessionalId);
    });
  }, [bookableServices, pickerProfessionalId]);

  const openServicePicker = useCallback(() => {
    if (!hasServices || !onBookService) {
      onWhatsAppClick?.();
      return;
    }
    setIsServicePickerOpen(true);
  }, [hasServices, onBookService, onWhatsAppClick]);

  const closeServicePicker = useCallback(() => {
    setIsServicePickerOpen(false);
  }, []);

  const handleMobileCtaPress = useCallback(() => {
    if (isMobileCtaMinimized) {
      setIsMobileCtaMinimized(false);
      return;
    }
    // iOS: evitar doble firing (touchend + click)
    const now = Date.now();
    if (now - lastMobileCtaAtRef.current < 450) return;
    lastMobileCtaAtRef.current = now;
    openServicePicker();
  }, [isMobileCtaMinimized, openServicePicker]);

  useEffect(() => {
    if (company.business_type !== BusinessType.SERVICES || !hasPrimaryAction) return;
    if (isServicePickerOpen) {
      setIsMobileCtaMinimized(false);
      return;
    }

    const resetIdleTimer = () => {
      setIsMobileCtaMinimized(false);
      if (mobileCtaIdleTimerRef.current) {
        window.clearTimeout(mobileCtaIdleTimerRef.current);
      }
      mobileCtaIdleTimerRef.current = window.setTimeout(() => {
        setIsMobileCtaMinimized(true);
      }, 5000);
    };

    resetIdleTimer();
    const handleScroll = () => resetIdleTimer();
    const handleTouchMove = () => resetIdleTimer();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      if (mobileCtaIdleTimerRef.current) {
        window.clearTimeout(mobileCtaIdleTimerRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [company.business_type, hasPrimaryAction, isServicePickerOpen]);

  const beginPickerGesture = useCallback((x: number, y: number) => {
    pickerGestureStartRef.current = { x, y };
    pickerGestureMovedRef.current = false;
  }, []);

  const movePickerGesture = useCallback((x: number, y: number) => {
    const start = pickerGestureStartRef.current;
    if (!start) return;
    const dx = Math.abs(x - start.x);
    const dy = Math.abs(y - start.y);
    // Umbral pequeño para distinguir scroll vs tap (especialmente iOS)
    if (dx > 10 || dy > 10) {
      pickerGestureMovedRef.current = true;
    }
  }, []);

  const canCommitPickerTap = useCallback(() => {
    // Evitar taps durante scroll/drag y evitar doble firing (pointer + click)
    if (pickerGestureMovedRef.current) return false;
    const now = Date.now();
    if (now - lastPickerSelectAtRef.current < 450) return false;
    lastPickerSelectAtRef.current = now;
    return true;
  }, []);

  const heroBlock = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="space-y-3">
        {(appearance?.hero_kicker || t('publicPage.barberLayout.heroKicker')) && (
          <p 
            className="text-xs uppercase tracking-[0.35em]"
            style={{ color: theme.subtitleColor || theme.textColor || '#64748b' }}
          >
            {appearance?.hero_kicker || t('publicPage.barberLayout.heroKicker')}
          </p>
        )}
        <h1
          className="text-3xl font-bold leading-tight sm:text-4xl"
          style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
        >
          {appearance?.hero_title || company.name}
        </h1>
        <p 
          className="max-w-2xl text-sm sm:text-base" 
          style={{ 
            fontFamily: theme.fontBody,
            color: theme.textColor || '#374151'
          }}
        >
          {appearance?.hero_description || company.description ||
            t('publicPage.barberLayout.heroDescription', {
              city: cityLabel,
            })}
        </p>
      </div>
      {appearance?.logo_url && (
        <div className={`relative w-full sm:w-auto sm:flex-shrink-0 items-center justify-center ${hideHeroLogoOnMobile ? 'hidden sm:flex' : 'flex'}`}>
          <img
            src={appearance.logo_url}
            alt={company.name}
            className="w-full max-w-[180px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[320px] h-auto object-contain transition duration-500 ease-out"
            loading="lazy"
            style={{ 
              maxHeight: 'clamp(100px, 18vw, 320px)',
              width: 'auto',
            }}
          />
        </div>
      )}
    </div>
  );

  const accentColor = theme.buttonColor || '#2563eb';
  const sectionBorder = theme.cardColor ? `${theme.cardColor}99` : 'rgba(148, 163, 184, 0.3)';
  const sectionBg = theme.cardColor || '#ffffff';
  const badgeBg = `${accentColor}18`;
  const badgeText = accentColor;
  const hideEmptyServicesCard = ['restaurantes', 'bares', 'foodtruck', 'restaurantes_comida_rapida'].includes(
    categoryId || ''
  );
  const hideScheduleSection = ['restaurantes', 'bares', 'foodtruck', 'restaurantes_comida_rapida'].includes(
    categoryId || ''
  );

  const servicesSection =
    hasServices && onBookService ? (
      <section
        className="space-y-4 rounded-2xl border-0 p-4 shadow-lg sm:p-5"
        style={{
          backgroundColor: sectionBg,
          boxShadow: `0 4px 24px ${accentColor}0f`,
          borderLeft: `4px solid ${accentColor}`,
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p 
              className="text-xs uppercase tracking-[0.25em]"
              style={{ color: theme.subtitleColor || theme.textColor || '#64748b' }}
            >
              {t('publicPage.barberLayout.servicesKicker')}
            </p>
            <h2
              className="text-xl font-bold sm:text-2xl"
              style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
            >
              {t('publicPage.barberLayout.servicesTitle')}
            </h2>
          </div>
          <span
            className="rounded-full px-4 py-2 text-xs font-bold"
            style={{
              backgroundColor: badgeBg,
              color: badgeText,
              border: `1px solid ${badgeText}40`,
              boxShadow: `0 2px 8px ${badgeText}20`,
            }}
          >
            {t('publicPage.barberLayout.availableToday')}
          </span>
        </div>
        
        {/* Barra de búsqueda */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('publicPage.barberLayout.searchPlaceholder')}
            className="w-full rounded-xl border px-4 py-3 pl-10 pr-10 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-0"
            style={{ 
              fontFamily: theme.fontBody, 
              color: theme.textColor,
              borderColor: sectionBorder,
              backgroundColor: theme.bgColor || '#ffffff',
              '--tw-ring-color': theme.buttonColor || '#2563eb'
            } as React.CSSProperties}
          />
          <div 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex-shrink-0 flex items-center justify-center pointer-events-none"
            style={{ color: theme.textColor || '#94a3b8' }}
          >
            <svg className="w-5 h-5 min-w-[20px] min-h-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition hover:bg-opacity-20"
              style={{ 
                color: theme.textColor || '#94a3b8',
                backgroundColor: theme.textColor ? `${theme.textColor}10` : undefined
              }}
              aria-label="Limpiar búsqueda"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filtros y ordenamiento */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'inactive'] as AvailabilityFilter[]).map((filter) => {
              const isActive = filterByAvailability === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setFilterByAvailability((prev) => (prev === filter ? 'all' : filter))}
                  className="rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? accentColor : (theme.cardColor ? `${theme.cardColor}e6` : '#f8fafc'),
                    color: isActive ? (theme.buttonTextColor || '#ffffff') : (theme.textColor || '#1e293b'),
                    border: isActive ? 'none' : `1px solid ${sectionBorder}`,
                    boxShadow: isActive ? `0 2px 10px ${accentColor}35` : 'none',
                  }}
                >
                  {t(`publicPage.barberLayout.filterAvailability.${filter}`)}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <label 
              htmlFor="sort-services" 
              className="text-xs font-semibold"
              style={{ color: theme.textColor || '#64748b' }}
            >
              {t('publicPage.barberLayout.orderBy')}
            </label>
            <select
              id="sort-services"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm focus:outline-none"
              style={{ 
                fontFamily: theme.fontBody,
                borderColor: sectionBorder,
                backgroundColor: theme.bgColor || '#ffffff',
                color: theme.textColor || '#1e293b'
              }}
            >
              <option value="relevance">{t('publicPage.barberLayout.orderOptions.relevance')}</option>
              <option value="priceAsc">{t('publicPage.barberLayout.orderOptions.priceLow')}</option>
              <option value="priceDesc">{t('publicPage.barberLayout.orderOptions.priceHigh')}</option>
              <option value="durationAsc">{t('publicPage.barberLayout.orderOptions.durationShort')}</option>
              <option value="durationDesc">{t('publicPage.barberLayout.orderOptions.durationLong')}</option>
              <option value="nameAsc">{t('publicPage.barberLayout.orderOptions.name')}</option>
            </select>
          </div>
        </div>

        {paginatedServices.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {paginatedServices.map((service) => {
                const isAvailable = isServiceAvailable(service);
                return (
                  <BarberServiceCard
                    key={service.id}
                    service={service}
                    theme={theme}
                    onBook={onBookService}
                    onServiceClick={onServiceClick}
                    isAvailable={isAvailable}
                    availabilityLabel={t('publicPage.barberLayout.available')}
                    unavailableLabel={t('publicPage.barberLayout.unavailable')}
                    priceLabel={
                      service.hide_price
                        ? t('publicPage.barberLayout.priceOnRequest')
                        : t('publicPage.barberLayout.price', { value: service.price.toLocaleString(i18n.language) })
                    }
                  />
                );
              })}
            </div>
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-3 pt-4">
                {currentPage < totalPages ? (
                  <AnimatedButton
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="rounded-full px-6 py-3 text-sm font-semibold shadow-md transition"
                    style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
                    ariaLabel={t('publicPage.barberLayout.loadMore')}
                  >
                    {t('publicPage.barberLayout.loadMore')}
                  </AnimatedButton>
                ) : (
                  <p 
                    className="text-sm" 
                    style={{ 
                      fontFamily: theme.fontBody,
                      color: theme.textColor || '#64748b'
                    }}
                  >
                    {t('publicPage.barberLayout.noMoreServices')}
                  </p>
                )}
              </div>
            )}
          </>
        ) : (searchTerm || filterByAvailability !== 'all') ? (
          <div 
            className="rounded-xl border border-dashed px-6 py-8 text-center"
            style={{
              borderColor: sectionBorder,
              backgroundColor: theme.bgColor ? `${theme.bgColor}80` : '#f8fafc'
            }}
          >
            <div className="space-y-2 flex flex-col items-center">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center mb-2" style={{ color: theme.textColor || '#94a3b8' }}>
                <svg className="w-8 h-8 min-w-[32px] min-h-[32px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p 
                className="text-sm font-medium"
                style={{ color: theme.textColor || '#374151' }}
              >
                {t('publicPage.barberLayout.noSearchResults')}
              </p>
            </div>
          </div>
        ) : null}
      </section>
    ) : hideEmptyServicesCard ? null : (
      <section 
        className="rounded-2xl border border-dashed p-6 text-center shadow-sm"
        style={{
          borderColor: sectionBorder,
          backgroundColor: sectionBg
        }}
      >
        <div className="space-y-3">
          <div className="text-4xl mb-2">✂️</div>
          <h3 
            className="text-lg font-semibold" 
            style={{ color: theme.titleColor }}
          >
            {t('publicPage.barberLayout.noServicesTitle')}
          </h3>
          <p 
            className="text-sm mb-4"
            style={{ color: theme.textColor || '#64748b' }}
          >
            {t('publicPage.barberLayout.noServices')}
          </p>
          {onWhatsAppClick && (
            <AnimatedButton
              onClick={onWhatsAppClick}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition"
              style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
              ariaLabel={t('publicPage.barberLayout.contactCta')}
            >
              💬 {t('publicPage.barberLayout.contactCta')}
            </AnimatedButton>
          )}
        </div>
      </section>
    );

  const teamSection = showTeam ? (
    <section
      className="space-y-4 rounded-2xl border-0 p-4 shadow-lg sm:p-5"
      style={{
        backgroundColor: sectionBg,
        boxShadow: `0 4px 24px ${accentColor}0f`,
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p 
            className="text-xs uppercase tracking-[0.25em]"
            style={{ color: theme.subtitleColor || theme.textColor || '#64748b' }}
          >
            {t('publicPage.barberLayout.teamKicker')}
          </p>
          <h2
            className="text-xl font-bold sm:text-2xl"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {t('publicPage.barberLayout.teamTitle')}
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {professionals.map((professional) => (
          <TeamCard
            key={professional.id}
            professional={professional}
            theme={theme}
            fallbackSpecialty={t('publicPage.barberLayout.defaultSpecialty')}
          />
        ))}
      </div>
    </section>
  ) : hasServices && professionals.length === 0 ? (
    <section 
      className="rounded-2xl border border-dashed p-6 text-center shadow-sm"
      style={{
        borderColor: sectionBorder,
        backgroundColor: sectionBg
      }}
    >
      <div className="space-y-3">
        <div className="text-4xl mb-2">👥</div>
        <h3 
          className="text-lg font-semibold" 
          style={{ color: theme.titleColor }}
        >
          {t('publicPage.barberLayout.noProfessionalsTitle')}
        </h3>
        <p 
          className="text-sm mb-4"
          style={{ color: theme.textColor || '#64748b' }}
        >
          {t('publicPage.barberLayout.noProfessionals')}
        </p>
        {onWhatsAppClick && (
          <AnimatedButton
            onClick={onWhatsAppClick}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition"
            style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
            ariaLabel={t('publicPage.barberLayout.contactCta')}
          >
            💬 {t('publicPage.barberLayout.contactCta')}
          </AnimatedButton>
        )}
      </div>
    </section>
  ) : null;

  const scheduleSection = hideScheduleSection ? null : (
    <section
      className="space-y-3 rounded-2xl border-0 p-4 shadow-lg sm:p-5"
      style={{
        backgroundColor: sectionBg,
        boxShadow: `0 4px 24px ${accentColor}0f`,
        borderLeft: `4px solid ${accentColor}`,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p 
            className="text-xs uppercase tracking-[0.25em]"
            style={{ color: theme.subtitleColor || theme.textColor || '#64748b' }}
          >
            {t('publicPage.barberLayout.scheduleKicker')}
          </p>
          <h2
            className="text-xl font-bold sm:text-2xl"
            style={{ color: theme.titleColor, fontFamily: theme.fontTitle }}
          >
            {t('publicPage.barberLayout.scheduleTitle')}
          </h2>
        </div>
        <span 
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: theme.cardColor ? `${theme.cardColor}80` : '#f1f5f9',
            color: theme.textColor || '#374151'
          }}
        >
          {t('publicPage.barberLayout.scheduleCtaLabel')}
        </span>
      </div>

      {scheduleStrips.length > 0 ? (
        <div className="space-y-2">
          {scheduleStrips.map((strip, index) => {
            const accentColor = theme.buttonColor || (strip.accent === 'emerald' ? '#059669' : '#0284c7');
            return (
              <div
                key={`${strip.label}-${index}`}
                className="flex items-center justify-between gap-3 rounded-xl border-0 px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md"
                style={{
                  backgroundColor: theme.cardColor || '#ffffff',
                  borderLeft: `4px solid ${accentColor}`,
                  boxShadow: `0 2px 12px ${accentColor}15`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 0 3px ${accentColor}30`,
                    }}
                    aria-hidden
                  />
                  <span className="text-sm font-bold" style={{ color: theme.titleColor }}>
                    {strip.label}
                  </span>
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: theme.textColor || '#374151', opacity: 0.9 }}
                >
                  {strip.hours}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div 
          className="rounded-xl border border-dashed px-3 py-4 text-center"
          style={{
            borderColor: sectionBorder,
            backgroundColor: theme.bgColor ? `${theme.bgColor}80` : '#f8fafc'
          }}
        >
          <div className="space-y-2">
            <div className="text-2xl mb-1">🕐</div>
            <p 
              className="text-sm font-medium"
              style={{ color: theme.textColor || '#374151' }}
            >
              {t('publicPage.barberLayout.noSchedule')}
            </p>
            {onWhatsAppClick && (
              <button
                type="button"
                onClick={onWhatsAppClick}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition"
                style={{
                  backgroundColor: badgeBg,
                  color: badgeText,
                  borderColor: badgeText
                }}
              >
                💬 {t('publicPage.barberLayout.contactCta')}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="pt-2">
        <AnimatedButton
          onClick={handlePrimaryCta}
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-md transition hover:shadow-lg sm:w-auto"
          style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, fontFamily: theme.fontButton }}
          ariaLabel={t('publicPage.barberLayout.primaryCta')}
        >
          {t('publicPage.barberLayout.primaryCta')}
        </AnimatedButton>
      </div>
    </section>
  );

  const mergedSections: PublicLayoutSections = {
    ...sections,
    hero: heroBlock,
    services: servicesSection,
    schedule: scheduleSection,
    team: teamSection ?? undefined,
  };

  const mobileCta =
    company.business_type === BusinessType.SERVICES && hasPrimaryAction ? (
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] sm:hidden supports-[backdrop-filter]:backdrop-blur-sm"
        style={{
          backgroundColor: theme.bgColor ? `${theme.bgColor}F0` : 'rgba(255, 255, 255, 0.95)',
          borderTopColor: sectionBorder,
          transform: isMobileCtaMinimized ? 'translateY(calc(100% - 0.9rem))' : 'translateY(0)',
          transition: 'transform 0.35s ease',
          willChange: 'transform',
        }}
        onClick={(event) => {
          if (!isMobileCtaMinimized) return;
          event.preventDefault();
          event.stopPropagation();
          setIsMobileCtaMinimized(false);
        }}
        onTouchStart={(event) => {
          if (!isMobileCtaMinimized) return;
          event.preventDefault();
          event.stopPropagation();
          setIsMobileCtaMinimized(false);
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            type="button"
            onClick={handleMobileCtaPress}
            onPointerUp={(e) => {
              // Safari iOS: asegurar respuesta al toque
              e.preventDefault();
              handleMobileCtaPress();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleMobileCtaPress();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full px-4 py-3.5 shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 font-semibold text-base touch-manipulation"
            style={{
              backgroundColor: theme.buttonColor || '#10b981',
              color: theme.buttonTextColor || '#ffffff',
              '--tw-ring-color': theme.buttonColor || '#10b981',
              touchAction: 'manipulation'
            } as React.CSSProperties}
            aria-label={t('publicPage.barberLayout.primaryCta')}
          >
            {ctaState === 'sent' ? (
              <>
                <span className="text-lg">✓</span>
                <span>{t('publicPage.barberLayout.ctaSent')}</span>
              </>
            ) : (
              <>
                <span className="text-lg">{theme.serviceCtaEmoji || '✂️'}</span>
                <span>{t('publicPage.barberLayout.primaryCta')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    ) : (
      floatingCta
    );

  return (
    <>
      <PublicLayoutShell
        {...props}
        variant={variant}
        sections={mergedSections}
        contactActions={contactActions}
        floatingCta={mobileCta}
      />

      {/* Selector de servicios (mobile): se abre desde el CTA inferior */}
      {isServicePickerOpen && hasServices && onBookService && (
        <div
          className="fixed inset-0 z-[60] sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Seleccionar servicio para agendar"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={closeServicePicker}
            onTouchEnd={(e) => {
              e.preventDefault();
              closeServicePicker();
            }}
            aria-label="Cerrar selector de servicios"
          />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl border-t shadow-2xl overflow-hidden"
            style={{
              backgroundColor: theme.cardColor || '#ffffff',
              borderTopColor: sectionBorder,
              WebkitOverflowScrolling: 'touch',
            } as React.CSSProperties}
          >
            <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.25em] opacity-70" style={{ color: theme.textColor }}>
                  Agendar
                </p>
                <p className="text-base font-bold truncate" style={{ color: theme.titleColor }}>
                  Selecciona un servicio
                </p>
              </div>
              <button
                type="button"
                onClick={closeServicePicker}
                className="h-10 w-10 rounded-full flex items-center justify-center border"
                style={{
                  borderColor: sectionBorder,
                  color: theme.textColor,
                  backgroundColor: theme.bgColor ? `${theme.bgColor}40` : 'rgba(255,255,255,0.6)',
                }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {pickerProfessionals.length > 0 && (
              <div className="px-4 pb-3">
                <label className="block text-xs font-semibold mb-1" style={{ color: theme.textColor }}>
                  Filtrar por profesional
                </label>
                <select
                  value={pickerProfessionalId}
                  onChange={(e) => setPickerProfessionalId(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  style={{
                    borderColor: sectionBorder,
                    backgroundColor: theme.bgColor ? `${theme.bgColor}20` : 'rgba(255,255,255,0.8)',
                    color: theme.textColor,
                  }}
                >
                  <option value="">Cualquiera</option>
                  {pickerProfessionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              className="px-4 pb-4 overflow-y-auto overscroll-contain"
              style={{
                maxHeight: pickerProfessionals.length > 0 ? 'calc(85vh - 150px)' : 'calc(85vh - 90px)',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
              }}
              onTouchStart={(e) => {
                const t = e.touches[0];
                if (t) beginPickerGesture(t.clientX, t.clientY);
              }}
              onTouchMove={(e) => {
                const t = e.touches[0];
                if (t) movePickerGesture(t.clientX, t.clientY);
              }}
              onPointerDown={(e) => beginPickerGesture(e.clientX, e.clientY)}
              onPointerMove={(e) => movePickerGesture(e.clientX, e.clientY)}
            >
              {pickerFilteredServices.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-4 text-center text-sm opacity-80" style={{ borderColor: sectionBorder, color: theme.textColor }}>
                  No hay servicios disponibles para este profesional.
                </div>
              ) : (
                <div className="space-y-2">
                  {pickerFilteredServices.map((service) => {
                    const duration = service.estimated_duration_minutes ? `${service.estimated_duration_minutes} min` : null;
                    const showPrice = !service.hide_price && service.price > 0;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        className="w-full text-left rounded-2xl border p-3 flex items-center justify-between gap-3 active:scale-[0.99] transition touch-manipulation"
                        style={{
                          borderColor: sectionBorder,
                          backgroundColor: theme.bgColor ? `${theme.bgColor}12` : 'rgba(255,255,255,0.75)',
                          color: theme.textColor,
                          touchAction: 'pan-y',
                        } as React.CSSProperties}
                        onClick={() => {
                          if (!canCommitPickerTap()) return;
                          closeServicePicker();
                          onBookService(service, pickerProfessionalId || null);
                        }}
                        onPointerUp={(e) => {
                          // Si fue un tap (no scroll), capturarlo acá para iOS.
                          e.preventDefault();
                          if (!canCommitPickerTap()) return;
                          closeServicePicker();
                          onBookService(service, pickerProfessionalId || null);
                        }}
                        aria-label={`Agendar ${service.name}`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold truncate" style={{ color: theme.titleColor }}>
                            {service.name}
                          </p>
                          <p className="text-xs opacity-80 mt-0.5" style={{ color: theme.descriptionColor || theme.textColor }}>
                            {[duration, showPrice ? `$${service.price.toLocaleString()}` : service.hide_price ? 'Precio a consultar' : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-semibold" style={{ color: theme.buttonColor }}>
                            Agendar
                          </span>
                          <span aria-hidden>›</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
