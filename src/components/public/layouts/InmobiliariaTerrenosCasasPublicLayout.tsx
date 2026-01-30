import { Fragment, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { PublicLayoutShell } from '../../../pages/public/layouts/PublicLayoutShell';
import { type PublicLayoutProps, type PublicLayoutSections } from '../../../pages/public/layouts/types';
import { isModuleEnabled, resolveCategoryId } from '../../../config/categories';
import { createLead } from '../../../services/leads';
import { createPropertyBooking, getProperties } from '../../../services/rentals';
import { createAppointment } from '../../../services/appointments';
import { sanitizeText, isValidEmail, isValidPhone } from '../../../services/validation';
import { AppointmentStatus, type Property } from '../../../types';
import { useDebounce } from '../../../hooks/useDebounce';
import { RateLimiter } from '../../../utils/security';

type LeadIntent = 'consult' | 'visit';

type LeadFormState = {
  propertyId?: string;
  intent: LeadIntent;
  name: string;
  whatsapp: string;
  email: string;
  message: string;
  preferredDate: string;
  preferredTime: string;
};

const formatCurrency = (value?: number | null): string => {
  if (typeof value !== 'number') return '—';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
};

const getPropertyType = (property: Property): string => {
  return (
    (property as any)?.type ||
    (property as any)?.property_type ||
    (property as any)?.operation_type ||
    (property as any)?.category ||
    'Propiedad'
  );
};

const getPropertyCommune = (property: Property): string => {
  if ((property as any)?.commune) return (property as any).commune;
  if ((property as any)?.comuna) return (property as any).comuna;
  if (property.address && property.address.includes(',')) {
    return property.address.split(',').slice(-1)[0].trim();
  }
  return (property as any)?.region || '';
};

const getPropertyPrice = (property: Property): number | null => {
  const raw =
    property.price_per_night ??
    (property as any)?.price ??
    (property as any)?.price_sale ??
    (property as any)?.price_monthly ??
    (property as any)?.rent ??
    null;
  return typeof raw === 'number' ? raw : null;
};

const getThumbnail = (property: Property): string | null => {
  const photos = (property as any)?.photos || (property as any)?.images;
  if (Array.isArray(photos) && photos[0]) {
    return photos[0];
  }
  return (property as any)?.thumbnail_url || null;
};

const addMinutesToTime = (time: string, minutes: number): string => {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return '01:00';
  }
  const [hours, mins] = time.split(':').map((v) => parseInt(v, 10));
  const total = hours * 60 + mins + minutes;
  const nextHours = Math.floor((total % (24 * 60)) / 60)
    .toString()
    .padStart(2, '0');
  const nextMins = Math.floor(total % 60)
    .toString()
    .padStart(2, '0');
  return `${nextHours}:${nextMins}`;
};

export function InmobiliariaTerrenosCasasPublicLayout(props: PublicLayoutProps) {
  const { company, theme, sections, contactActions, floatingCta, onWhatsAppClick } = props;
  const { t } = useTranslation();
  const categoryId = resolveCategoryId(company);
  const allowPropertyBookings = isModuleEnabled(categoryId, 'property-bookings');
  const allowAppointmentsLite = isModuleEnabled(categoryId, 'appointments-lite');

  const [properties, setProperties] = useState<Property[]>(props.properties ?? []);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadFormState>({
    propertyId: undefined,
    intent: 'consult',
    name: '',
    whatsapp: '',
    email: '',
    message: '',
    preferredDate: '',
    preferredTime: '',
  });
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState({ type: 'all', price: 'all', commune: 'all' });
  const [locationSearch, setLocationSearch] = useState('');
  const detailModalRef = useRef<HTMLDivElement>(null);
  const leadModalRef = useRef<HTMLDivElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const rateLimiterRef = useRef(new RateLimiter(3, 60000)); // 3 intentos por minuto

  useEffect(() => {
    setProperties(props.properties ?? []);
  }, [props.properties]);

    useEffect(() => {
      const load = async () => {
        if (properties.length > 0 || !company?.id) return;
        setLoadingProperties(true);
        try {
        const data = await getProperties(company.id);
        const active = data.filter((prop) => !prop.status || prop.status === 'ACTIVE');
        setProperties(active);
      } catch {
        toast.error(t('publicPage.inmoLayout.loadError'));
      } finally {
        setLoadingProperties(false);
      }
      };
      load();
    }, [company?.id]);

  const priceBands = useMemo(() => {
    const values = properties
      .map((p) => getPropertyPrice(p))
      .filter((v): v is number => typeof v === 'number')
      .sort((a, b) => a - b);
    if (values.length === 0) return null;
    const lowIdx = Math.floor(values.length / 3);
    const midIdx = Math.floor((values.length * 2) / 3);
    return {
      low: values[lowIdx] ?? values[0],
      mid: values[midIdx] ?? values[values.length - 1],
    };
  }, [properties]);

  const propertyTypes = useMemo(() => {
    const uniques = new Set<string>();
    properties.forEach((prop) => uniques.add(getPropertyType(prop)));
    return Array.from(uniques);
  }, [properties]);

  const communes = useMemo(() => {
    const uniques = new Set<string>();
    properties.forEach((prop) => {
      const commune = getPropertyCommune(prop);
      if (commune) uniques.add(commune);
    });
    return Array.from(uniques).sort();
  }, [properties]);

  // Debounce para búsqueda de ubicación
  const debouncedLocationSearch = useDebounce(locationSearch, 300);

  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      const typeMatches = filters.type === 'all' || getPropertyType(prop) === filters.type;
      const commune = getPropertyCommune(prop);
      const communeMatches = filters.commune === 'all' || commune === filters.commune;
      const price = getPropertyPrice(prop);

      // Filtro de búsqueda por ubicación (debounced)
      const locationMatches = !debouncedLocationSearch || 
        (prop.address?.toLowerCase().includes(debouncedLocationSearch.toLowerCase()) || 
         commune?.toLowerCase().includes(debouncedLocationSearch.toLowerCase()));

      if (!priceBands || filters.price === 'all') {
        return typeMatches && communeMatches && locationMatches;
      }

      if (!price) return false;
      const priceMatches = 
        filters.price === 'low' ? price <= priceBands.low :
        filters.price === 'mid' ? price > priceBands.low && price <= priceBands.mid :
        price > priceBands.mid;
      
      return typeMatches && communeMatches && locationMatches && priceMatches;
    });
  }, [filters.commune, filters.price, filters.type, priceBands, properties, debouncedLocationSearch]);

  const openLeadModal = (intent: LeadIntent, property?: Property | null) => {
    setSelectedProperty(property ?? null);
    setShowDetailModal(false);
    setLeadForm((prev) => ({
      ...prev,
      intent,
      propertyId: property?.id ?? undefined,
    }));
    setShowLeadModal(true);
  };

  const openDetail = useCallback((property: Property) => {
    // Guardar elemento activo antes de abrir modal
    lastFocusedElementRef.current = document.activeElement as HTMLElement;
    setSelectedProperty(property);
    setShowDetailModal(true);
  }, []);

  const closeDetail = useCallback(() => {
    setShowDetailModal(false);
    // Restaurar focus después de un pequeño delay
    setTimeout(() => {
      if (lastFocusedElementRef.current) {
        lastFocusedElementRef.current.focus();
      }
    }, 100);
  }, []);

  // Manejar Escape key y focus trap en modal de detalle
  useEffect(() => {
    if (!showDetailModal) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDetail();
      }
    };

    const handleTab = (e: KeyboardEvent) => {
      if (!detailModalRef.current) return;
      const focusableElements = detailModalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    // Focus en el primer elemento focusable del modal
    setTimeout(() => {
      const firstFocusable = detailModalRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
    };
  }, [showDetailModal, closeDetail]);

  // Manejar Escape key y focus trap en modal de lead
  useEffect(() => {
    if (!showLeadModal) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setShowLeadModal(false);
      }
    };

    const handleTab = (e: KeyboardEvent) => {
      if (!leadModalRef.current) return;
      const focusableElements = leadModalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    // Focus en el primer input del formulario
    setTimeout(() => {
      const firstInput = leadModalRef.current?.querySelector('input') as HTMLElement;
      firstInput?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
    };
  }, [showLeadModal, isSubmitting]);

  const handleSubmitLead = async () => {
    if (!company?.id) return;

    // Rate limiting: usar IP o combinación de datos
    const rateLimitKey = `lead_${company.id}_${leadForm.whatsapp.replace(/\D/g, '')}`;
    if (!rateLimiterRef.current.isAllowed(rateLimitKey)) {
      toast.error(t('publicPage.inmoLayout.form.rateLimitExceeded'));
      return;
    }

    // Validación y sanitización con límites estrictos
    const trimmedName = sanitizeText(leadForm.name, 100); // Límite: 100 caracteres
    const phone = leadForm.whatsapp.replace(/\D/g, '');
    const email = leadForm.email.trim();
    const message = leadForm.message ? sanitizeText(leadForm.message, 500) : ''; // Límite: 500 caracteres

    // Validaciones básicas
    if (!trimmedName || trimmedName.length < 2) {
      toast.error(t('publicPage.inmoLayout.form.validationNameMin'));
      return;
    }

    if (trimmedName.length > 100) {
      toast.error(t('publicPage.inmoLayout.form.validationNameMax'));
      return;
    }

    if (!phone) {
      toast.error(t('publicPage.inmoLayout.form.validationBasic'));
      return;
    }

    if (!isValidPhone(phone)) {
      toast.error(t('publicPage.inmoLayout.form.validationPhone'));
      return;
    }

    if (email && !isValidEmail(email)) {
      toast.error(t('publicPage.inmoLayout.form.validationEmail'));
      return;
    }

    if (email && email.length > 254) {
      toast.error(t('publicPage.inmoLayout.form.validationEmailMax'));
      return;
    }

    if (message && message.length > 500) {
      toast.error(t('publicPage.inmoLayout.form.validationMessageMax'));
      return;
    }

    const visitDate = leadForm.preferredDate ? new Date(`${leadForm.preferredDate}T${leadForm.preferredTime || '10:00'}`) : null;

    setIsSubmitting(true);
    try {
      const targetProperty = selectedProperty || properties.find((p) => p.id === leadForm.propertyId) || null;
      await createLead({
        company_id: company.id,
        intent: leadForm.intent,
        property_id: targetProperty?.id,
        property_title: targetProperty?.title,
        name: trimmedName,
        whatsapp: phone,
        email: email || undefined,
        message: message || undefined,
        preferred_date: visitDate || undefined,
        preferred_time: leadForm.preferredTime || undefined,
        source: 'public-inmobiliaria',
      });

      if (leadForm.intent === 'visit' && visitDate) {
        if (allowPropertyBookings && targetProperty?.id) {
          try {
            const checkOut = new Date(visitDate.getTime() + 45 * 60000);
            await createPropertyBooking({
              company_id: company.id,
              property_id: targetProperty.id,
              guest_name: trimmedName,
              guest_phone: phone,
              guest_email: email || undefined,
              check_in: visitDate,
              check_out: checkOut,
              guests: 1,
              status: 'PENDING',
              total_price: 0,
            });
          } catch {
            toast.error(t('publicPage.inmoLayout.form.bookingFallback'));
          }
        }

        if (allowAppointmentsLite) {
          try {
            const startTime = leadForm.preferredTime || '10:00';
            const endTime = addMinutesToTime(startTime, 45);
            await createAppointment({
              company_id: company.id,
              service_id: targetProperty?.id || 'property-visit',
              professional_id: 'unassigned',
              client_name: trimmedName,
              client_phone: phone,
              client_email: email || undefined,
              appointment_date: visitDate,
              start_time: startTime,
              end_time: endTime,
              status: AppointmentStatus.REQUESTED,
              notes: `Visita a propiedad ${targetProperty?.title || ''}${message ? ` · ${message}` : ''}`,
            });
          } catch {
            toast.error(t('publicPage.inmoLayout.form.appointmentFallback'));
          }
        }
      }

      toast.success(t('publicPage.inmoLayout.form.success'));
      setShowLeadModal(false);
      setLeadForm((prev) => ({
        ...prev,
        message: '',
        preferredDate: '',
        preferredTime: '',
      }));
    } catch {
      toast.error(t('publicPage.inmoLayout.form.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const heroBlock = (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-100 via-white to-emerald-100" />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            {t('publicPage.inmoLayout.heroBadge')}
          </div>
          <h1
            className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl"
            style={{ fontFamily: theme.fontTitle }}
          >
            {company.name}
          </h1>
          <p className="max-w-2xl text-base text-slate-700 sm:text-lg" style={{ fontFamily: theme.fontBody }}>
            {company.description || t('publicPage.inmoLayout.heroSubtitle')}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openLeadModal('visit', selectedProperty)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              🏡 {t('publicPage.inmoLayout.primaryCta')}
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('inmo-properties');
                if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {t('publicPage.inmoLayout.secondaryCta')}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            {company.address && <span className="rounded-full bg-white/70 px-3 py-1">{company.address}</span>}
            {company.region && <span className="rounded-full bg-white/70 px-3 py-1">{company.region}</span>}
          </div>
        </div>
        {props.appearance?.banner_url ? (
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white/70 shadow-xl">
            <img src={props.appearance.banner_url} alt={company.name} className="h-full w-full object-cover" loading="lazy" />
          </div>
        ) : null}
      </div>
    </div>
  );

  const propertyGrid = (
    <div id="inmo-properties" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t('publicPage.inmoLayout.propertiesKicker')}</p>
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: theme.fontTitle }}>
            {t('publicPage.inmoLayout.propertiesTitle', { count: filteredProperties.length || 0 })}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="all">{t('publicPage.inmoLayout.filters.typeAll')}</option>
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={filters.price}
            onChange={(e) => setFilters((prev) => ({ ...prev, price: e.target.value }))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="all">{t('publicPage.inmoLayout.filters.priceAll')}</option>
            <option value="low">{t('publicPage.inmoLayout.filters.priceLow')}</option>
            <option value="mid">{t('publicPage.inmoLayout.filters.priceMid')}</option>
            <option value="high">{t('publicPage.inmoLayout.filters.priceHigh')}</option>
          </select>
          <select
            value={filters.commune}
            onChange={(e) => setFilters((prev) => ({ ...prev, commune: e.target.value }))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            aria-label={t('publicPage.inmoLayout.filters.communeAll')}
          >
            <option value="all">{t('publicPage.inmoLayout.filters.communeAll')}</option>
            {communes.map((commune) => (
              <option key={commune} value={commune}>
                {commune}
              </option>
            ))}
          </select>
          <input
            type="search"
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            placeholder={t('publicPage.inmoLayout.filters.locationPlaceholder')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            aria-label={t('publicPage.inmoLayout.filters.locationPlaceholder')}
          />
        </div>
      </div>

      {loadingProperties ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center" role="status" aria-live="polite">
          <div className="text-4xl mb-3" aria-hidden="true">🔍</div>
          <p className="text-base font-semibold text-slate-800 mb-2">
            {t('publicPage.inmoLayout.emptyTitle')}
          </p>
          <p className="text-sm text-slate-600 mb-4">
            {t('publicPage.inmoLayout.emptySubtitle')}
          </p>
          {(filters.type !== 'all' || filters.price !== 'all' || filters.commune !== 'all' || debouncedLocationSearch) && (
            <button
              type="button"
              onClick={() => {
                setFilters({ type: 'all', price: 'all', commune: 'all' });
                setLocationSearch('');
              }}
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline"
            >
              {t('publicPage.inmoLayout.clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredProperties.map((property) => {
            const price = getPropertyPrice(property);
            const commune = getPropertyCommune(property);
            const thumb = getThumbnail(property);
            return (
              <div
                key={property.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                style={{ backgroundColor: theme.cardColor }}
                onClick={() => openDetail(property)}
              >
                {thumb ? (
                  <div className="h-40 w-full overflow-hidden">
                    <img src={thumb} alt={property.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
                    {property.title}
                  </div>
                )}
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="line-clamp-2 text-lg font-semibold text-slate-900" style={{ color: theme.titleColor }}>
                      {property.title}
                    </h3>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      {getPropertyType(property)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600" style={{ color: theme.textColor }}>
                    {property.description || t('publicPage.inmoLayout.propertyFallback')}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {commune && <span className="rounded-full bg-slate-100 px-2 py-1">{commune}</span>}
                    {property.address && <span className="truncate">{property.address}</span>}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-lg font-bold text-emerald-700">{formatCurrency(price)}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLeadModal('consult', property);
                        }}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        {t('publicPage.inmoLayout.actions.consult')}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLeadModal('visit', property);
                        }}
                        className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {t('publicPage.inmoLayout.actions.visit')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const detailModal =
    showDetailModal && selectedProperty ? (
      <div 
        className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4 py-6 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeDetail();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="property-detail-title"
        aria-describedby="property-detail-description"
      >
        <div 
          ref={detailModalRef}
          className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          tabIndex={-1}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t('publicPage.inmoLayout.detail.title')}</p>
              <h3 id="property-detail-title" className="text-xl font-bold text-slate-900">{selectedProperty.title}</h3>
            </div>
            <button
              type="button"
              onClick={closeDetail}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              aria-label={t('common.close')}
            >
              ✕
            </button>
          </div>
          <div className="grid gap-6 px-5 py-4 sm:grid-cols-5">
            <div className="sm:col-span-3 space-y-3">
              {getThumbnail(selectedProperty) ? (
                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <img
                    src={getThumbnail(selectedProperty) as string}
                    alt={selectedProperty.title}
                    className="h-56 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : null}
              <p id="property-detail-description" className="text-sm text-slate-700" style={{ color: theme.textColor }}>
                {selectedProperty.description || t('publicPage.inmoLayout.propertyFallback')}
              </p>
              {(getPropertyCommune(selectedProperty) || selectedProperty.address) && (
                <div>
                  <p className="text-xs font-semibold text-slate-600">{t('publicPage.inmoLayout.detail.location')}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                    {getPropertyCommune(selectedProperty) && (
                      <span className="rounded-full bg-slate-100 px-3 py-1">{getPropertyCommune(selectedProperty)}</span>
                    )}
                    {selectedProperty.address && <span className="rounded-full bg-slate-100 px-3 py-1">{selectedProperty.address}</span>}
                  </div>
                </div>
              )}
            </div>
            <div className="sm:col-span-2 space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {t('publicPage.inmoLayout.detail.price')}
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">{formatCurrency(getPropertyPrice(selectedProperty))}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {getPropertyType(selectedProperty)}
                </span>
              </div>
              {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600">{t('publicPage.inmoLayout.detail.amenities')}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedProperty.amenities.map((item) => (
                      <span key={item} className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => openLeadModal('consult', selectedProperty)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  💬 {t('publicPage.inmoLayout.actions.consult')}
                </button>
                <button
                  type="button"
                  onClick={() => openLeadModal('visit', selectedProperty)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  📅 {t('publicPage.inmoLayout.actions.visit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
    : null;

  const leadModal = !showLeadModal
    ? null
    : (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) setShowLeadModal(false);
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-form-title"
      >
        <div 
          ref={leadModalRef}
          className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          tabIndex={-1}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t('publicPage.inmoLayout.form.pretitle')}</p>
              <h3 id="lead-form-title" className="text-xl font-bold text-slate-900">{t('publicPage.inmoLayout.form.title')}</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowLeadModal(false)}
              disabled={isSubmitting}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('common.close')}
            >
              ✕
            </button>
          </div>
          <div className="space-y-4 px-5 py-4">
            {selectedProperty && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {t('publicPage.inmoLayout.form.selected', { title: selectedProperty.title })}
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">{t('publicPage.inmoLayout.form.name')}</label>
                <input
                  type="text"
                  value={leadForm.name}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 100); // Límite de caracteres
                    setLeadForm((prev) => ({ ...prev, name: value }));
                  }}
                  maxLength={100}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                  aria-label={t('publicPage.inmoLayout.form.name')}
                  aria-required="true"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {leadForm.name.length}/100 {t('common.characters')}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">{t('publicPage.inmoLayout.form.whatsapp')}</label>
                <input
                  type="tel"
                  value={leadForm.whatsapp}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 20); // Límite de caracteres
                    setLeadForm((prev) => ({ ...prev, whatsapp: value }));
                  }}
                  maxLength={20}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                  placeholder="+569..."
                  aria-label={t('publicPage.inmoLayout.form.whatsapp')}
                  aria-required="true"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">{t('publicPage.inmoLayout.form.email')}</label>
              <input
                type="email"
                value={leadForm.email}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 254); // Límite de caracteres para email
                  setLeadForm((prev) => ({ ...prev, email: value }));
                }}
                maxLength={254}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                placeholder="cliente@email.com"
                aria-label={t('publicPage.inmoLayout.form.email')}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">{t('publicPage.inmoLayout.form.date')}</label>
                <input
                  type="date"
                  value={leadForm.preferredDate}
                  onChange={(e) => setLeadForm((prev) => ({ ...prev, preferredDate: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">{t('publicPage.inmoLayout.form.time')}</label>
                <input
                  type="time"
                  value={leadForm.preferredTime}
                  onChange={(e) => setLeadForm((prev) => ({ ...prev, preferredTime: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">{t('publicPage.inmoLayout.form.message')}</label>
              <textarea
                rows={3}
                value={leadForm.message}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 500); // Límite de caracteres
                  setLeadForm((prev) => ({ ...prev, message: value }));
                }}
                maxLength={500}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                placeholder={t('publicPage.inmoLayout.form.messagePlaceholder') as string}
                aria-label={t('publicPage.inmoLayout.form.message')}
              />
              <p className="mt-1 text-xs text-slate-500">
                {leadForm.message.length}/500 {t('common.characters')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
            <div className="text-xs text-slate-500">{t('publicPage.inmoLayout.form.privacy')}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowLeadModal(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitLead}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? t('publicPage.inmoLayout.form.sending') : t('publicPage.inmoLayout.form.submit')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  const mergedSections: PublicLayoutSections = {
    ...sections,
    hero: heroBlock,
    properties: propertyGrid,
    highlight: sections.highlight ?? sections.hero,
  };

  const mobileCta =
    floatingCta ||
    (onWhatsAppClick ? (
      <button
        type="button"
        onClick={onWhatsAppClick}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-white shadow-lg transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-500"
        aria-label={t('publicPage.inmoLayout.actions.consult')}
      >
        💬 {t('publicPage.inmoLayout.actions.consult')}
      </button>
    ) : null);

  return (
    <Fragment>
      <PublicLayoutShell
        {...props}
        sections={mergedSections}
        contactActions={contactActions}
        floatingCta={mobileCta}
      />
      {detailModal}
      {leadModal}
    </Fragment>
  );
}
