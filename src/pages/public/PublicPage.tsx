import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  getCompanyAppearance,
  getCompanyBySlug,
  getProducts,
  getScheduleSlots,
  getServiceSchedules,
  getServices,
  createPublicPageEvent,
  createProductOrderRequest,
} from '../../services/firestore';
import { getMenuCategories } from '../../services/menu';
import { createAppointment } from '../../services/appointments';
import { createCalendarInventoryEntry, isInventorySlotAvailable } from '../../services/calendarInventory';
import { formatLocalDate } from '../../utils/date';
import { listProfessionals } from '../../services/professionals';
import {
  AppointmentStatus,
  BusinessType,
  CartItem,
  Company,
  CompanyAppearance,
  EventType,
  MenuCategory,
  Product,
  ServiceSchedule,
  ScheduleSlot,
  Service,
  Professional,
} from '../../types';
import { env } from '../../config/env';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import SEO, { createLocalBusinessSchema } from '../../components/SEO';
import { useAnalytics } from '../../hooks/useAnalytics';
import { GAEventAction } from '../../config/analytics';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { logger } from '../../utils/logger';
import { sanitizeText, isValidPhone, isValidEmail } from '../../services/validation';
import { PublicHeader } from './components/PublicHeader';
import { DescriptionCard } from './components/DescriptionCard';
import { MissionVisionCard } from './components/MissionVisionCard';
import { OperatingHoursCard } from './components/OperatingHoursCard';
import { LocationMapCard } from './components/LocationMapCard';
import { ServicesSection } from './components/ServicesSection';
import { ProductsSection } from './components/ProductsSection';
import { ContactActions } from './components/ContactActions';
import { MobileMenuModal } from './components/MobileMenuModal';
import { BookingModalV2 } from './components/BookingModalV2';
import { CartModal } from './components/CartModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { VideoCard } from './components/VideoCard';
import { VideoModal } from './components/VideoModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { AppearanceTheme, BookingForm, OrderForm } from './types';
import { resolvePublicLayout } from '../../services/publicPage';
import { getLayoutRenderer } from './layouts/layoutRegistry';
import type { PublicLayoutSections } from './layouts/types';

const toRgba = (color: string, alpha: number): string => {
  const safeAlpha = Math.min(1, Math.max(0, alpha));
  const hex = color?.trim();
  if (!hex) return `rgba(255,255,255,${safeAlpha})`;
  // Already rgba or rgb
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    return hex.replace(/rgba?\(([^)]+)\)/, (_, values) => {
      const parts = values.split(',').map((v: string) => v.trim());
      const [r, g, b] = parts;
      return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
    });
  }
  // Expand short hex #abc to #aabbcc
  const normalized = hex.replace('#', '');
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
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
};

const defaultTheme: AppearanceTheme = {
  bgColor: '#ffffff',
  bgOpacity: 1,
  cardColor: '#ffffff',
  cardOpacity: 1,
  buttonColor: '#2563eb',
  buttonTextColor: '#ffffff',
  titleColor: '#111827',
  subtitleColor: '#4b5563',
  textColor: '#4b5563',
  descriptionColor: '#4b5563',
  fontTitle: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
  fontBody: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
  fontButton: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
};

export default function PublicPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { trackConversion, trackClick, trackNamedEvent } = useAnalytics();
  const { handleError } = useErrorHandler();
  const { t } = useTranslation();
  
  // Modo preview para mostrar indicadores de edición
  const isPreviewMode = searchParams.get('preview') === 'true';

  const isMobile = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || ''),
    []
  );

  const [company, setCompany] = useState<Company | null>(null);
  const [appearance, setAppearance] = useState<CompanyAppearance | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [serviceProfessionals, setServiceProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [serviceSchedules, setServiceSchedules] = useState<ServiceSchedule[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [availableSchedules, setAvailableSchedules] = useState<ScheduleSlot[]>([]);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    client_name: '',
    client_whatsapp: '',
    client_email: '',
    client_rut: '',
    client_comment: '',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderForm>({
    client_name: '',
    client_whatsapp: '',
    client_comment: '',
    delivery_type: 'PICKUP',
    delivery_address: '',
    delivery_location: '',
    delivery_notes: '',
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ id: string; link: string } | null>(null);
  const showWhatsAppFab = Boolean(appearance?.show_whatsapp_fab && company?.whatsapp);
  const showCartFab = Boolean(appearance?.show_cart_fab && company?.business_type === BusinessType.PRODUCTS);
  const showCallFab = Boolean(appearance?.show_call_fab && company?.whatsapp);

  // Agregar clase al body para deshabilitar dark mode global en páginas públicas
  useEffect(() => {
    document.body.classList.add('public-page-mode');
    
    // DEBUG: Log para verificar que se aplicó la clase
    console.log('✅ public-page-mode clase agregada al body');
    
    return () => {
      document.body.classList.remove('public-page-mode');
    };
  }, []);

  useEffect(() => {
    if (slug) {
      loadData(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (company?.id) {
      trackPageView(company.id);
    }
  }, [company]);

  // Show video modal on page load if placement is MODAL
  useEffect(() => {
    if (company?.video_enabled && company.video_placement === 'MODAL' && company.video_url) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setShowVideoModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [company?.video_enabled, company?.video_placement, company?.video_url]);

  const theme = useMemo<AppearanceTheme>(() => {
    const bgBase = appearance?.background_color || defaultTheme.bgColor;
    const cardBase = appearance?.card_color || defaultTheme.cardColor;
    const bgOpacity = appearance?.background_opacity ?? defaultTheme.bgOpacity;
    const cardOpacity = appearance?.card_opacity ?? defaultTheme.cardOpacity;
    const calendarCardBase = appearance?.calendar_card_color || appearance?.card_color || '#ffffff';
    const calendarCardOpacity = appearance?.calendar_card_opacity ?? 100;
    return {
      bgColor: toRgba(bgBase, bgOpacity),
      bgOpacity,
      cardColor: toRgba(cardBase, cardOpacity),
      cardOpacity,
      buttonColor: appearance?.button_color || defaultTheme.buttonColor,
      buttonTextColor: appearance?.button_text_color || defaultTheme.buttonTextColor,
      titleColor: appearance?.title_color || defaultTheme.titleColor,
      subtitleColor: appearance?.subtitle_color || defaultTheme.subtitleColor,
      textColor: appearance?.text_color || defaultTheme.textColor,
      descriptionColor: appearance?.subtitle_color || appearance?.text_color || defaultTheme.descriptionColor,
      fontTitle: appearance?.font_title || defaultTheme.fontTitle,
      fontBody: appearance?.font_body || defaultTheme.fontBody,
      fontButton: appearance?.font_button || defaultTheme.fontButton,
      cardLayout: appearance?.card_layout || 1, // Default layout 1
      productListImagePosition: appearance?.product_list_image_position || 'left', // Posición de imagen en lista
      // Personalización del calendario
      calendarCardColor: toRgba(calendarCardBase, calendarCardOpacity / 100),
      calendarCardOpacity: calendarCardOpacity,
      calendarTextColor: appearance?.calendar_text_color || appearance?.text_color || defaultTheme.textColor,
      calendarTitleColor: appearance?.calendar_title_color || appearance?.title_color || defaultTheme.titleColor,
      calendarButtonColor: appearance?.calendar_button_color || appearance?.button_color || defaultTheme.buttonColor,
      calendarButtonTextColor: appearance?.calendar_button_text_color || appearance?.button_text_color || defaultTheme.buttonTextColor,
      calendarAvailableDayColor: appearance?.calendar_available_day_color || '#22c55e',
      calendarLowSlotsColor: appearance?.calendar_low_slots_color || '#eab308',
      calendarNoSlotsColor: appearance?.calendar_no_slots_color || '#ef4444',
      calendarSelectedDayColor: appearance?.calendar_selected_day_color || appearance?.button_color || defaultTheme.buttonColor,
    };
  }, [appearance]);

  // Estilos inline para el contenedor
  const backgroundContainerStyle = useMemo(() => {
    return {
      position: 'relative',
      minHeight: '100vh',
      backgroundColor: 'transparent', // Asegurar que no haya fondo azul
    } as React.CSSProperties;
  }, []);

  const trackPageView = async (companyId: string) => {
    try {
      await createPublicPageEvent(companyId, EventType.PAGE_VIEW);
    } catch (error) {
      // Silently fail - don't show error to user for analytics
    }
  };

  const loadData = async (companySlug: string) => {
    console.log('🔍 [DEBUG] loadData iniciado para slug:', companySlug);
    setLoading(true);
    try {
      console.log('📡 [DEBUG] Consultando Firestore para slug:', companySlug);
      const companyData = await getCompanyBySlug(companySlug);
      
      if (!companyData) {
        console.error('❌ [DEBUG] Empresa NO encontrada para slug:', companySlug);
        setLoading(false);
        return;
      }

      console.log('✅ [DEBUG] Empresa encontrada:', {
        id: companyData.id,
        name: companyData.name,
        business_type: companyData.business_type,
      });
      
      setCompany(companyData);

      const loadAppearance = async () => {
        console.log('🎨 [DEBUG] Cargando appearance para company_id:', companyData.id);
        const preferred = companyData.business_type as BusinessType | undefined;
        const candidates: BusinessType[] = preferred
          ? [preferred, preferred === BusinessType.SERVICES ? BusinessType.PRODUCTS : BusinessType.SERVICES]
          : [BusinessType.SERVICES, BusinessType.PRODUCTS];

        console.log('🔎 [DEBUG] Probando contexts:', candidates);
        
        for (const context of candidates) {
          try {
            console.log(`  → Probando context: ${context}`);
            const appearanceData = await getCompanyAppearance(companyData.id, context);
            if (appearanceData) {
              console.log(`  ✅ Appearance encontrado en context: ${context}`);
              return appearanceData;
            }
            console.log(`  ⚠️ No encontrado en context: ${context}`);
          } catch (error) {
            console.error(`  ❌ Error en context ${context}:`, error);
            // Try next context
          }
        }
        console.warn('⚠️ [DEBUG] No se encontró appearance en ningún context');
        return null;
      };

      const appearancePromise = loadAppearance();

      if (companyData.business_type === BusinessType.SERVICES) {
        const [appearanceResult, servicesResult, professionalsResult] = await Promise.allSettled([
          appearancePromise,
          getServices(companyData.id),
          listProfessionals(companyData.id),
        ]);

        if (appearanceResult.status === 'fulfilled' && appearanceResult.value) {
          setAppearance(appearanceResult.value);
        }

        if (servicesResult.status === 'fulfilled') {
          const activeServices = servicesResult.value.filter((service) =>
            !service.status || service.status === 'ACTIVE'
          );
          setServices(activeServices);

          if (activeServices.length > 0) {
            const [schedulesData, scheduleGroups] = await Promise.all([
              getScheduleSlots(companyData.id),
              Promise.all(activeServices.map((service) => getServiceSchedules(service.id))),
            ]);
            setSchedules(schedulesData);
            setServiceSchedules(scheduleGroups.flat());
          }
        } else {
          handleError(servicesResult.reason);
        }

        if (professionalsResult.status === 'fulfilled') {
          setProfessionals(professionalsResult.value);
        } else {
          handleError(professionalsResult.reason);
        }
      } else if (companyData.business_type === BusinessType.PRODUCTS) {
        const [appearanceResult, productsResult] = await Promise.allSettled([
          appearancePromise,
          Promise.all([getProducts(companyData.id), getMenuCategories(companyData.id)]),
        ]);

        if (appearanceResult.status === 'fulfilled' && appearanceResult.value) {
          setAppearance(appearanceResult.value);
        }

        if (productsResult.status === 'fulfilled') {
          const [productsData, categoriesData] = productsResult.value;
          const activeProducts = productsData.filter(
            (product) => !product.status || product.status === 'ACTIVE'
          );
          const activeCategories = categoriesData.filter((category) => category.active !== false);
          setProducts(activeProducts);
          setMenuCategories(activeCategories);
        } else {
          handleError(productsResult.reason);
        }
      } else if (companyData.business_type) {
        try {
          const appearanceData = await appearancePromise;
          console.log('🎨 Appearance data (primera carga):', appearanceData ? 'CARGADO ✅' : 'NULL ❌');
          if (appearanceData) {
            console.log('  Colors:', {
              card: appearanceData.card_color,
              text: appearanceData.text_color,
              button: appearanceData.button_color,
              hero_card: appearanceData.menu_hero_card_color,
              hero_opacity: appearanceData.menu_hero_card_opacity,
            });
            setAppearance(appearanceData);
          } else {
            console.warn('⚠️ No se encontró appearance data - usando valores por defecto');
          }
        } catch (error) {
          console.error('❌ Error cargando appearance:', error);
          // Continue without appearance
        }
      } else {
        const appearanceData = await appearancePromise;
        console.log('🎨 Appearance data (sin business_type):', appearanceData ? 'CARGADO ✅' : 'NULL ❌');
        if (appearanceData) {
          console.log('  Colors:', {
            card: appearanceData.card_color,
            text: appearanceData.text_color,
          });
          setAppearance(appearanceData);
        } else {
          console.warn('⚠️ No se encontró appearance data');
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    if (company?.whatsapp) {
      const message = company.booking_message || 'Hola, quiero contactarte';
      const url = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      if (company?.id) {
        createPublicPageEvent(company.id, EventType.WHATSAPP_CLICK);
        trackNamedEvent('contact.whatsappClick', {
          company_id: company.id,
          company_name: company.name,
        });
        trackConversion()(GAEventAction.WHATSAPP_CLICK, undefined, {
          company_id: company.id,
          company_name: company.name,
        });
      }
    }
  };

  const handleBookService = async (service: Service, preferredProfessionalId?: string | null) => {
    if (!company?.id) return;

    setSelectedService(service);
    setSelectedDate(null);
    setSelectedSchedule(null);
    const prosForService =
      service.professional_ids && service.professional_ids.length > 0
        ? professionals.filter((pro) => service.professional_ids?.includes(pro.id))
        : professionals;
    setServiceProfessionals(prosForService);
    setSelectedProfessionalId(preferredProfessionalId || prosForService[0]?.id || null);
    setShowBookingModal(true);
    setIsBookingLoading(true);

    try {
      const serviceSchedules = await getServiceSchedules(service.id);
      const allSlots = await getScheduleSlots(company.id);
      const available = allSlots.filter(
        (slot) => slot.status === 'ACTIVE' && serviceSchedules.some((schedule) => schedule.schedule_slot_id === slot.id)
      );
      setAvailableSchedules(available);
      createPublicPageEvent(company.id, EventType.SERVICE_BOOK_CLICK);
    } catch (error) {
      toast.error('No pudimos cargar los horarios');
      handleError(error);
      setShowBookingModal(false);
    } finally {
      setIsBookingLoading(false);
    }
  };

  const resetBookingState = () => {
    setShowBookingModal(false);
    setIsBookingLoading(false);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedSchedule(null);
    setServiceProfessionals([]);
    setSelectedProfessionalId(null);
    setBookingForm({ client_name: '', client_whatsapp: '', client_email: '', client_rut: '', client_comment: '' });
  };

  const handleSubmitBooking = async () => {
    if (!selectedService || !selectedDate || !selectedSchedule || !company) {
      toast.error('Completa todos los campos');
      return;
    }

    if (serviceProfessionals.length > 0 && !selectedProfessionalId) {
      toast.error('Selecciona un profesional');
      return;
    }

    const clientName = sanitizeText(bookingForm.client_name, 120);
    const clientWhatsapp = bookingForm.client_whatsapp.replace(/\D/g, '');
    const clientEmail = bookingForm.client_email?.trim() || '';
    const clientRut = sanitizeText(bookingForm.client_rut || '', 20);
    const notes = bookingForm.client_comment ? sanitizeText(bookingForm.client_comment, 600) : undefined;

    if (!clientName || !clientWhatsapp || !clientRut) {
      toast.error('Completa nombre, WhatsApp y RUT');
      return;
    }

    if (!isValidPhone(clientWhatsapp)) {
      toast.error('Ingresa un WhatsApp válido');
      return;
    }

    if (clientEmail && !isValidEmail(clientEmail)) {
      toast.error('Ingresa un correo válido');
      return;
    }

    try {
      const scheduleSlot = availableSchedules.find((s) => s.id === selectedSchedule);
      if (!scheduleSlot) {
        toast.error('Horario no encontrado');
        return;
      }

      const professionalId = selectedProfessionalId || 'unassigned';

      // Verificar disponibilidad del slot
      const slotAvailable = await isInventorySlotAvailable(
        company.id,
        professionalId,
        selectedDate,
        scheduleSlot.start_time,
        scheduleSlot.end_time
      );

      if (!slotAvailable) {
        toast.error('El horario ya no está disponible, elige otra opción');
        return;
      }

      // Crear Appointment con estado REQUESTED
      await createAppointment({
        company_id: company.id,
        service_id: selectedService.id,
        professional_id: professionalId,
        client_name: clientName,
        client_phone: clientWhatsapp,
        client_email: clientEmail || undefined,
        client_rut: clientRut || undefined,
        appointment_date: selectedDate,
        start_time: scheduleSlot.start_time,
        end_time: scheduleSlot.end_time,
        status: AppointmentStatus.REQUESTED,
        notes,
      });

      // Crear entrada en el inventario del calendario (fecha local para consistencia con el calendario)
      await createCalendarInventoryEntry({
        company_id: company.id,
        service_id: selectedService.id,
        professional_id: professionalId,
        schedule_slot_id: selectedSchedule,
        date: formatLocalDate(selectedDate),
        start_time: scheduleSlot.start_time,
        end_time: scheduleSlot.end_time,
        status: 'REQUESTED',
      });

      // Tracking de analytics
      trackConversion()(GAEventAction.SERVICE_BOOKING, selectedService.price, {
        service_id: selectedService.id,
        service_name: selectedService.name,
        company_id: company.id,
        company_name: company.name,
      });

      trackNamedEvent('appointments.publicRequested', {
        service_id: selectedService.id,
        professional_id: professionalId,
        company_id: company.id,
      });

      // Mensaje de confirmación amigable
      const dateFormatted = selectedDate.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const timeFormatted = `${scheduleSlot.start_time} - ${scheduleSlot.end_time}`;
      
      toast.success(
        `✅ ¡Cita solicitada exitosamente!\n\n📅 ${dateFormatted}\n🕐 ${timeFormatted}\n\nTe notificaremos cuando sea confirmada.`,
        { duration: 6000 }
      );

      resetBookingState();
    } catch (error) {
      toast.error('Error al procesar la solicitud. Por favor, intenta nuevamente.');
      handleError(error, { showToast: false });
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        )
      );
    } else {
      setCart([...cart, { product, quantity }]);
    }

    trackClick('add_to_cart')({
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      company_id: company?.id,
    });

    toast.success(`${quantity > 1 ? quantity + ' productos agregados' : 'Producto agregado'} al carrito`);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter((item) => item.product.id !== productId));
      toast.success('Producto eliminado del carrito');
    } else {
      const existing = cart.find((item) => item.product.id === productId);
      if (existing) {
        setCart(
          cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          )
        );
      } else {
        const product = products.find((p) => p.id === productId);
        if (product) {
          setCart([...cart, { product, quantity }]);
        }
      }
    }
  };

  const handleProductClick = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    setModalQuantity(existingItem ? existingItem.quantity : 0);
    setSelectedProduct(product);
  };

  const handleModalAddToCart = () => {
    if (selectedProduct && modalQuantity > 0) {
      const existingItem = cart.find((item) => item.product.id === selectedProduct.id);
      if (existingItem) {
        updateCartQuantity(selectedProduct.id, modalQuantity);
        toast.success('Carrito actualizado');
      } else {
        addToCart(selectedProduct, modalQuantity);
      }
      setSelectedProduct(null);
      setModalQuantity(0);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
    toast.success('Producto eliminado del carrito');
  };

  const handleSubmitOrder = async () => {
    if (!company) return;

    const clientName = sanitizeText(orderForm.client_name, 120);
    const clientWhatsapp = orderForm.client_whatsapp.replace(/\D/g, '');
    const clientComment = orderForm.client_comment ? sanitizeText(orderForm.client_comment, 400) : '';

    if (!clientName || !clientWhatsapp) {
      toast.error('Completa nombre y WhatsApp');
      return;
    }

    if (!isValidPhone(clientWhatsapp)) {
      toast.error('Ingresa un WhatsApp válido (9 a 20 dígitos)');
      return;
    }

    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    // Validar campos de entrega si está habilitado y el cliente eligió domicilio
    if (company.delivery_enabled && orderForm.delivery_type === 'DELIVERY') {
      if (!orderForm.delivery_address || orderForm.delivery_address.trim() === '') {
        toast.error('Por favor ingresa la dirección de entrega');
        return;
      }
    }

    const deliveryAddress = orderForm.delivery_address ? sanitizeText(orderForm.delivery_address, 200) : '';
    const deliveryLocation = orderForm.delivery_location ? sanitizeText(orderForm.delivery_location, 300) : '';
    const deliveryNotes = orderForm.delivery_notes ? sanitizeText(orderForm.delivery_notes, 300) : '';

    try {
      const items = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      
      // Verificar si algún producto tiene el precio oculto
      const hasHiddenPrices = cart.some((item) => item.product.hide_price === true);

      // Construir mensaje base
      let message = `Hola, quiero consultar disponibilidad de estos productos:\n\n${cart
        .map((item) => `${item.product.name} x ${item.quantity}`)
        .join('\n')}`;
      
      // Solo incluir el total estimado si ningún producto tiene el precio oculto
      if (!hasHiddenPrices) {
        message += `\n\nTotal estimado: $${total.toLocaleString()}`;
      }
      
      message += `\n\nMi nombre es ${clientName} y mi WhatsApp es ${clientWhatsapp}.`;

      // Agregar información de entrega si está habilitado
      if (company.delivery_enabled) {
        const deliveryType = orderForm.delivery_type === 'DELIVERY' ? '>> DOMICILIO <<' : '>> RETIRO EN LOCAL <<';
        message += `\n\n═══════════════════\n*TIPO DE ENTREGA:*\n${deliveryType}\n═══════════════════`;

        if (orderForm.delivery_type === 'DELIVERY') {
          message += `\n\n*DIRECCION DE ENTREGA:*\n${deliveryAddress}`;
          
          if (deliveryLocation) {
            message += `\n\n*UBICACION (Google Maps):*\n${deliveryLocation}`;
          }

          if (deliveryNotes) {
            message += `\n\n*NOTAS DE ENTREGA:*\n${deliveryNotes}`;
          }
        }
      }

      // Agregar comentarios adicionales
      if (clientComment) {
        message += `\n\n*COMENTARIOS:*\n${clientComment}`;
      }

      let orderId: string | null = null;
      try {
        orderId = await createProductOrderRequest({
          company_id: company.id,
          items,
          total_estimated: total,
          client_name: clientName,
          client_whatsapp: clientWhatsapp,
          client_comment: clientComment,
        });

        createPublicPageEvent(company.id, EventType.PRODUCT_ORDER_CLICK);

        trackConversion()(GAEventAction.PRODUCT_ORDER, total, {
          product_count: cart.length,
          total_items: cart.reduce((sum, item) => sum + item.quantity, 0),
          company_id: company.id,
          company_name: company.name,
        });

        trackNamedEvent('products.orderSubmitted', {
          product_count: cart.length,
          total_items: cart.reduce((sum, item) => sum + item.quantity, 0),
          company_id: company.id,
          company_name: company.name,
          total_estimated: total,
        });

        if (orderId) {
          const trackingLink = `${env.publicBaseUrl}/${company.slug || company.id}/tracking/${orderId}`;
          message += `\n\nRevisa el estado de tu pedido aquí:\n${trackingLink}`;
          setOrderSuccess({ id: orderId, link: trackingLink });
        }
      } catch (dbError) {
        logger.warn('No se pudo registrar el pedido en Firestore, continuando con WhatsApp.', dbError);
      }

      const url = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      setShowCart(false);
      setCart([]);
      setOrderForm({ client_name: '', client_whatsapp: '', client_comment: '' });
      toast.success('Redirigiendo a WhatsApp...');
    } catch (error) {
      logger.error('Error al procesar la solicitud de productos:', error);
      toast.error('Error al procesar la solicitud. Intentando abrir WhatsApp...');
      if (company?.whatsapp) {
        const fallback = `Hola, quiero consultar disponibilidad. Mi nombre es ${clientName}. WhatsApp: ${clientWhatsapp}. Comentarios: ${clientComment || 'Ninguno'}.`;
        window.open(`https://wa.me/${company.whatsapp}?text=${encodeURIComponent(fallback)}`, '_blank');
      }
      handleError(error, { showToast: false, context: { action: 'submitProductOrder' } });
    }
  };

  const metaTitle = company
    ? `${company.name} | ${company.sector || company.industry || 'PYM-ERP'}`
    : 'Ficha pública | PYM-ERP';
  const metaDescription =
    company?.description || company?.mission || company?.booking_message || 'Descubre servicios y productos locales en PYM-ERP.';
  const metaImage = appearance?.logo_url || appearance?.banner_url || '/logopymerp.png';
  const metaUrl =
    company?.slug ? `${env.publicBaseUrl}/${company.slug}` : typeof window !== 'undefined' ? window.location.href : '';

  const businessSchema = company
    ? createLocalBusinessSchema({
        name: company.name,
        description: metaDescription,
        image: metaImage,
        url: metaUrl,
        phone: company.whatsapp,
        priceRange: '$$',
        address: {
          street: company.address || '',
          city: (company as any).city || (company as any).comuna || '',
          region: (company as any).region || '',
          postalCode: (company as any).postal_code || '',
          country: 'CL',
        },
        geo:
          company.latitude && company.longitude
            ? {
                latitude: company.latitude,
                longitude: company.longitude,
              }
            : undefined,
      })
    : null;

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const hasHiddenPrices = cart.some((item) => item.product.hide_price === true);
  const googleMapsApiKey = env.googleMapsApiKey;

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Emprendimiento no encontrado</h1>
          <p className="text-gray-600 dark:text-gray-300">La página que buscas no existe.</p>
        </div>
      </div>
    );
  }

  const layoutInfo = resolvePublicLayout(company);
  const LayoutRenderer = getLayoutRenderer(layoutInfo.key);

  const resolveLabel = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const descriptionSection =
    company?.description && company?.show_description !== false ? (
      <DescriptionCard company={company} theme={theme} />
    ) : null;

  const missionVisionSection =
    (company?.mission || company?.vision) && company?.show_mission_vision !== false ? (
      <MissionVisionCard company={company} theme={theme} />
    ) : null;

  const hoursSection =
    (company?.weekday_days && company.weekday_days.length > 0) ||
    (company?.weekend_days && company.weekend_days.length > 0) ? (
      <OperatingHoursCard company={company} theme={theme} />
    ) : null;

  const locationSection =
    company?.address && googleMapsApiKey ? (
      <LocationMapCard company={company} theme={theme} googleMapsApiKey={googleMapsApiKey} />
    ) : null;

  const servicesSection =
    company.business_type === BusinessType.SERVICES && services.length > 0 ? (
      <ServicesSection
        services={services}
        theme={theme}
        onBook={handleBookService}
        onServiceClick={(service) => {
          setSelectedService(service);
          const prosForService =
            service.professional_ids && service.professional_ids.length > 0
              ? professionals.filter((pro) => service.professional_ids?.includes(pro.id))
              : professionals;
          setServiceProfessionals(prosForService);
        }}
      />
    ) : null;

  const productsSection =
    company.business_type === BusinessType.PRODUCTS && products.length > 0 ? (
      <ProductsSection
        products={products}
        categories={menuCategories}
        theme={theme}
        layout={appearance?.layout}
        cart={cart}
        onAddToCart={addToCart}
        onUpdateQuantity={updateCartQuantity}
        onOpenCart={() => setShowCart(true)}
        onProductClick={handleProductClick}
      />
    ) : null;

  const mediaSection =
    company?.video_enabled && company.video_placement !== 'MODAL' && company.video_url ? (
      <VideoCard company={company} theme={theme} />
    ) : null;

  const isBarberiasCategory =
    String(company?.category_id || company?.categoryId || '')
      .toLowerCase()
      .trim() === 'barberias';

  const contactActionsNode = (
    <ContactActions
      theme={theme}
      onWhatsApp={handleWhatsAppClick}
      onOpenCart={() => setShowCart(true)}
      cartItems={totalCartItems}
      showCartCta={company.business_type === BusinessType.PRODUCTS}
      showSocialIcons={isBarberiasCategory}
      socialIconsMode={appearance?.social_icons_mode === 'light' ? 'light' : 'dark'}
      socialUsernames={{
        facebook: appearance?.facebook_username,
        instagram: appearance?.instagram_username,
        tiktok: appearance?.tiktok_username,
      }}
      socialVisibility={{
        facebook: appearance?.show_facebook_icon,
        instagram: appearance?.show_instagram_icon,
        tiktok: appearance?.show_tiktok_icon,
      }}
    />
  );

  const sections: PublicLayoutSections = {
    highlight: descriptionSection,
    missionVision: missionVisionSection,
    services: servicesSection,
    products: productsSection,
    hours: hoursSection,
    location: locationSection,
    media: mediaSection,
  };

  const isIndustrialConstructionLayout = layoutInfo.key === 'construccionIndustrialShowcase';

  /* Orden del menú hamburguesa: Servicios → … → Horario → Ubicación → Acerca de (casi al final) → Contacto */
  const mobileSections = [
    servicesSection
      ? {
          id: 'services',
          label: resolveLabel('publicPage.mobileMenu.services', 'Servicios'),
          icon: '🛎️',
        }
      : null,
    isIndustrialConstructionLayout
      ? {
          id: 'projects',
          label: resolveLabel('publicPage.mobileMenu.projects', 'Proyectos'),
          icon: '🏗️',
          scrollToId: 'section-projects',
        }
      : null,
    productsSection
      ? {
          id: 'products',
          label: resolveLabel('publicPage.mobileMenu.products', 'Productos'),
          icon: '🛍️',
          scrollToId: 'section-products',
        }
      : null,
    hoursSection
      ? {
          id: 'hours',
          label: resolveLabel('publicPage.mobileMenu.hours', 'Horario'),
          icon: '🕒',
        }
      : null,
    locationSection
      ? {
          id: 'location',
          label: resolveLabel('publicPage.mobileMenu.location', 'Ubicación'),
          icon: '📍',
        }
      : null,
    mediaSection
      ? {
          id: 'media',
          label: resolveLabel('publicPage.mobileMenu.media', 'Video'),
          icon: '🎥',
        }
      : null,
    descriptionSection
      ? {
          id: 'highlight',
          label: resolveLabel('publicPage.mobileMenu.about', 'Acerca de'),
          icon: '📋',
        }
      : null,
    {
      id: 'contact',
      label: resolveLabel('publicPage.mobileMenu.contact', 'Contacto'),
      icon: '💬',
      scrollToId: 'section-contact',
    },
  ].filter(Boolean) as Array<{ id: string; label: string; icon?: string; scrollToId?: string }>;

  const mobileHeaderBg = isIndustrialConstructionLayout
    ? '#0e1624'
    : appearance?.card_color || theme.cardColor;
  const mobileHeaderText = isIndustrialConstructionLayout
    ? '#ffffff'
    : appearance?.text_color || theme.titleColor || theme.textColor;
  const mobileHeaderBorder = isIndustrialConstructionLayout
    ? '#ffffff'
    : appearance?.menu_button_color ||
      appearance?.button_color ||
      theme.buttonColor;

  const showStandardHeader = ['default', 'servicesShowcase', 'productsShowcase', 'beautyShowcase', 'propertyShowcase'].includes(
    layoutInfo.key
  );

  return (
    <>
      <SEO
        title={metaTitle}
        description={metaDescription}
        keywords={`${company.name}, ${company.sector || ''}, ${company.industry || ''}, ${
          (company as any).comuna || ''
        }, servicios, productos`}
        ogImage={metaImage}
        ogImageAlt={`${company.name} - ${company.sector || 'Negocio local'}`}
        ogType="website"
        ogUrl={metaUrl}
        canonical={metaUrl}
        schema={businessSchema || undefined}
        robots="index, follow"
      />
      
      {/* Banner de modo preview */}
      {isPreviewMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Modo Vista Previa: Los elementos configurables muestran indicadores azules</span>
          </div>
        </div>
      )}
      
      <div 
        className="min-h-screen relative background-container public-page-custom-theme" 
        style={{
          ...backgroundContainerStyle,
          paddingTop: isPreviewMode ? '2.5rem' : '0',
        }}
        data-orientation={company?.background_orientation?.toLowerCase() || 'horizontal'}
        data-fit={company?.background_fit || 'cover'}
        data-layout-variant={layoutInfo.key}
        data-layout-variant-style={layoutInfo.variant}
      >
        {/* Background Image Layer - Optimizado para máxima calidad e integridad */}
        {company?.background_enabled && company.background_url && (
          <>
            {/* Preload para evitar FOUC */}
            <img
              src={company.background_url}
              alt=""
              className="background-preload"
              loading="eager"
              decoding="async"
              aria-hidden="true"
            />
            
            {/* Capa de fondo con técnicas avanzadas */}
            <div
              className="fixed inset-0 -z-10"
              style={{
                backgroundImage: `url(${company.background_url})`,
                backgroundSize: company.background_fit || 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: company.background_orientation === 'VERTICAL' 
                  ? 'center top' 
                  : 'center center',
                backgroundAttachment: isMobile ? 'scroll' : 'fixed',
                opacity: (company.background_opacity ?? 100) / 100,
                // Técnicas avanzadas para preservar calidad e integridad
                imageRendering: 'high-quality' as any,
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)', // Force GPU acceleration
                willChange: 'transform',
                // Preservar aspect ratio y evitar distorsión
                objectFit: company.background_fit || 'cover',
                // Suavizar transiciones
                transition: 'opacity 0.3s ease-in-out',
                // Eliminar cualquier fondo azul en iOS
                backgroundColor: 'transparent',
                WebkitBackgroundColor: 'transparent',
              } as React.CSSProperties}
              aria-hidden="true"
            />
          </>
        )}
        
        {/* Background Color Fallback - Solo si no hay imagen de fondo */}
        {(!company?.background_enabled || !company.background_url) && (
          <div
            className="fixed inset-0 -z-20"
            style={{ backgroundColor: theme.bgColor }}
            aria-hidden="true"
          />
        )}

        <div
          className="fixed top-0 inset-x-0 z-40 sm:hidden flex items-center justify-center py-2 shadow-md safe-area-inset-top relative"
          style={{
            backgroundColor: mobileHeaderBg,
            color: mobileHeaderText,
            borderBottom: `1px solid ${mobileHeaderBorder}40`,
          }}
        >
          <div className="flex items-center justify-center flex-1">
            {appearance?.logo_url ? (
              <img
                src={appearance.logo_url}
                alt={`Logo de ${company.name}`}
                className="h-12 object-contain"
                loading="eager"
              />
            ) : (
              <span className="text-sm font-semibold">{company.name}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="absolute right-4 h-10 w-10 rounded-full flex items-center justify-center transition hover:opacity-80"
            aria-label="Abrir menú"
            style={{ color: mobileHeaderText }}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {showStandardHeader && <PublicHeader company={company} appearance={appearance} theme={theme} />}

        <main
          id="main-content"
          className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8 sm:py-10 lg:py-12 pt-[4.25rem] sm:pt-4 pb-24 sm:pb-10 lg:pb-12"
          style={{ color: theme.textColor, fontFamily: theme.fontBody }}
        >
          <LayoutRenderer
            layoutKey={layoutInfo.key}
            variant={layoutInfo.variant}
            company={company}
            appearance={appearance}
            theme={theme}
            services={services}
            products={products}
            professionals={professionals}
            schedules={schedules}
            serviceSchedules={serviceSchedules}
            menuCategories={menuCategories}
            cart={cart}
            cartItems={totalCartItems}
            cartTotal={cartTotal}
            hasHiddenPrices={hasHiddenPrices}
            hideHeroLogoOnMobile={appearance?.hide_hero_logo_on_mobile ?? true}
            sections={sections}
            contactActions={contactActionsNode}
            onOpenCart={() => setShowCart(true)}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
            onProductClick={handleProductClick}
            onBookService={handleBookService}
            onWhatsAppClick={handleWhatsAppClick}
            onServiceClick={(service) => {
              setSelectedService(service);
              const prosForService =
                service.professional_ids && service.professional_ids.length > 0
                  ? professionals.filter((pro) => service.professional_ids?.includes(pro.id))
                  : professionals;
              setServiceProfessionals(prosForService);
            }}
          />
        </main>

        {/* Floating Action Buttons (FABs) - Apilados verticalmente */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 items-end">
          {isPreviewMode && (showCallFab || showCartFab || showWhatsAppFab) && (
            <div className="mb-2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded shadow-lg">
              Botones Flotantes
            </div>
          )}
          
          {/* Botón de Llamadas - Arriba de todo */}
          {showCallFab && company?.whatsapp && (
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  window.location.href = `tel:${company.whatsapp}`;
                  if (company?.id) {
                    createPublicPageEvent(company.id, EventType.WHATSAPP_CLICK); // Reusar evento por ahora
                  }
                }}
                className="flex items-center justify-center h-14 w-14 rounded-full shadow-lg hover:opacity-90 transition transform hover:scale-105"
                style={{
                  backgroundColor: appearance?.fab_call_color || '#10b981',
                  opacity: appearance?.fab_call_opacity ?? 1,
                  color: '#ffffff',
                }}
                aria-label="Llamar por teléfono"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              {isPreviewMode && (
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition">
                  Botón Llamadas
                </div>
              )}
            </div>
          )}
          
          {/* Botón de Carrito - En medio */}
          {showCartFab && (
            <div className="relative group">
              <button
                type="button"
                onClick={() => setShowCart(true)}
                className="flex items-center justify-center h-14 w-14 rounded-full shadow-lg hover:opacity-90 transition transform hover:scale-105 relative"
                style={{
                  backgroundColor: appearance?.fab_cart_color || '#f59e0b',
                  opacity: appearance?.fab_cart_opacity ?? 1,
                  color: '#ffffff',
                }}
                aria-label={`Ver carrito con ${totalCartItems} artículos`}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalCartItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                    {totalCartItems}
                  </span>
                )}
              </button>
              {isPreviewMode && (
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition">
                  Botón Carrito
                </div>
              )}
            </div>
          )}
          
          {/* Botón de WhatsApp - Abajo */}
          {showWhatsAppFab && (
            <div className="relative group">
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="flex items-center justify-center h-14 w-14 rounded-full shadow-lg hover:opacity-90 transition transform hover:scale-105"
                style={{
                  backgroundColor: appearance?.fab_whatsapp_color || '#25D366',
                  opacity: appearance?.fab_whatsapp_opacity ?? 1,
                  color: '#ffffff',
                }}
                aria-label="Contactar por WhatsApp"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.52 3.48A11.82 11.82 0 0 0 12.07 0 11.86 11.86 0 0 0 1.07 12.17 11.7 11.7 0 0 0 3.5 20.5l-1 3.48 3.6-.94a11.93 11.93 0 0 0 5.94 1.52h.05A11.83 11.83 0 0 0 24 12.07 11.8 11.8 0 0 0 20.52 3.48ZM12.1 21a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-2.14.55.57-2.08-.24-.34a9.83 9.83 0 0 1-1.7-5.54A10.08 10.08 0 0 1 12.06 2a9.92 9.92 0 0 1 7.07 2.93 9.92 9.92 0 0 1 2.92 7.12A10 10 0 0 1 12.1 21Zm5.47-7.3c-.3-.15-1.77-.87-2.04-.97s-.47-.15-.67.15-.77.97-.94 1.17-.35.22-.64.07A8.14 8.14 0 0 1 10 11.8a9.18 9.18 0 0 1-1.65-2 .55.55 0 0 1 .13-.76c.13-.14.3-.37.45-.55a2.54 2.54 0 0 0 .3-.52.67.67 0 0 0-.03-.63c-.08-.15-.67-1.62-.92-2.22-.24-.58-.5-.5-.67-.51H6.8a1.3 1.3 0 0 0-.94.44 3.93 3.93 0 0 0-1.24 2.9c0 1.7 1.26 3.34 1.43 3.57.17.22 2.47 3.78 5.98 5.13a19.4 19.4 0 0 0 2.02.6 4.86 4.86 0 0 0 2.25.14c.69-.1 2.1-.86 2.4-1.7a3 3 0 0 0 .21-1.7c-.09-.14-.27-.22-.57-.37Z" />
                </svg>
              </button>
              {isPreviewMode && (
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition">
                  Botón WhatsApp
                </div>
              )}
            </div>
          )}
        </div>

        <MobileMenuModal
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          sections={mobileSections}
          theme={theme}
          appearance={appearance}
        />

        {/* BookingModalV2: modal de citas para TODAS las categorías con servicios, incluyendo
            BELLEZA (barberías, peluquerías, centros estética, uñas, tatuajes, masajes, agenda profesionales).
            No sustituir por BookingModal (v1) en páginas públicas. */}
        <BookingModalV2
          isOpen={showBookingModal}
          isLoading={isBookingLoading}
          theme={theme}
          serviceName={selectedService?.name}
          servicePrice={selectedService?.price}
          serviceDuration={selectedService?.estimated_duration_minutes}
          availableSchedules={availableSchedules}
          selectedDate={selectedDate}
          selectedSchedule={selectedSchedule}
          bookingForm={bookingForm}
          onClose={resetBookingState}
          onDateChange={(date, scheduleId) => {
            setSelectedDate(date);
            setSelectedSchedule(scheduleId);
          }}
          onScheduleChange={(scheduleId) => setSelectedSchedule(scheduleId)}
          onFormChange={(field, value) => setBookingForm({ ...bookingForm, [field]: value })}
          onSubmit={handleSubmitBooking}
          professionals={serviceProfessionals}
          selectedProfessionalId={selectedProfessionalId}
          onProfessionalChange={(id) => setSelectedProfessionalId(id)}
          requireProfessional={serviceProfessionals.length > 0}
          companyId={company?.id}
          companyAddress={company?.address}
        />

        <CartModal
          isOpen={showCart}
          cart={cart}
          orderForm={orderForm}
          deliveryEnabled={company?.delivery_enabled}
          onClose={() => setShowCart(false)}
          onQuantityChange={updateCartQuantity}
          onRemove={removeFromCart}
          onFormChange={(field, value) => setOrderForm({ ...orderForm, [field]: value })}
          onSubmit={handleSubmitOrder}
          theme={theme}
        />

        {orderSuccess && (
          <OrderSuccessModal
            isOpen={Boolean(orderSuccess)}
            onClose={() => setOrderSuccess(null)}
            orderCode={orderSuccess.id.slice(-6).toUpperCase()}
            trackingLink={orderSuccess.link}
          />
        )}

        <ImagePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />

        {/* Video Modal */}
        {company && (
          <VideoModal
            company={company}
            theme={theme}
            isOpen={showVideoModal}
            onClose={() => setShowVideoModal(false)}
          />
        )}

        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            theme={theme}
            quantity={modalQuantity}
            onClose={() => {
              setSelectedProduct(null);
              setModalQuantity(0);
            }}
            onIncrement={() => setModalQuantity(modalQuantity + 1)}
            onDecrement={() => setModalQuantity(Math.max(0, modalQuantity - 1))}
            onAddToCart={handleModalAddToCart}
          />
        )}

        {selectedService && !showBookingModal && (
          <ServiceDetailModal
            service={selectedService}
            professionals={serviceProfessionals.length > 0 ? serviceProfessionals : professionals}
            theme={theme}
            categoryId={company?.category_id ?? company?.categoryId}
            onClose={() => {
              setSelectedService(null);
              setServiceProfessionals([]);
            }}
            onBook={() => handleBookService(selectedService)}
          />
        )}
      </div>
    </>
  );
}
