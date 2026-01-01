import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
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
import { createAppointment } from '../../services/appointments';
import { createCalendarInventoryEntry, isInventorySlotAvailable } from '../../services/calendarInventory';
import { listProfessionals } from '../../services/professionals';
import {
  AppointmentStatus,
  BusinessType,
  CartItem,
  Company,
  CompanyAppearance,
  EventType,
  Product,
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
import { BookingModal } from './components/BookingModal';
import { CartModal } from './components/CartModal';
import { HorizontalCarousel } from './components/HorizontalCarousel';
import { FullscreenCarousel } from './components/FullscreenCarousel';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { VideoCard } from './components/VideoCard';
import { VideoModal } from './components/VideoModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { AppearanceTheme, BookingForm, OrderForm } from './types';

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
  fontTitle: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
  fontBody: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
  fontButton: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
};

export default function PublicPage() {
  const { slug } = useParams();
  const { trackConversion, trackClick, trackNamedEvent } = useAnalytics();
  const { handleError } = useErrorHandler();

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
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
  const showWhatsAppFab = Boolean(appearance?.show_whatsapp_fab && company?.whatsapp);

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
      fontTitle: appearance?.font_title || defaultTheme.fontTitle,
      fontBody: appearance?.font_body || defaultTheme.fontBody,
      fontButton: appearance?.font_button || defaultTheme.fontButton,
      cardLayout: appearance?.card_layout || 1, // Default layout 1
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
    setLoading(true);
    try {
      const companyData = await getCompanyBySlug(companySlug);
      if (!companyData) {
        setLoading(false);
        return;
      }

      setCompany(companyData);

      if (companyData.business_type) {
        try {
          const appearanceData = await getCompanyAppearance(companyData.id, companyData.business_type);
          setAppearance(appearanceData);
        } catch (error) {
          // Continue without appearance
        }
      }

      if (companyData.business_type === BusinessType.SERVICES) {
        try {
          const servicesData = await getServices(companyData.id);
          const activeServices = servicesData.filter((service) => 
            !service.status || service.status === 'ACTIVE'
          );
          setServices(activeServices);
        } catch (error) {
          handleError(error);
        }

        try {
          const professionalsData = await listProfessionals(companyData.id);
          setProfessionals(professionalsData);
        } catch (error) {
          handleError(error);
        }
      } else if (companyData.business_type === BusinessType.PRODUCTS) {
        try {
          const productsData = await getProducts(companyData.id);
          const activeProducts = productsData.filter((product) => 
            !product.status || product.status === 'ACTIVE'
          );
          setProducts(activeProducts);
        } catch (error) {
          handleError(error);
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

  const handleBookService = async (service: Service) => {
    if (!company?.id) return;

    setSelectedService(service);
    setSelectedDate(null);
    setSelectedSchedule(null);
    const prosForService =
      service.professional_ids && service.professional_ids.length > 0
        ? professionals.filter((pro) => service.professional_ids?.includes(pro.id))
        : professionals;
    setServiceProfessionals(prosForService);
    setSelectedProfessionalId(prosForService[0]?.id || null);

    try {
      const serviceSchedules = await getServiceSchedules(service.id);
      const allSlots = await getScheduleSlots(company.id);
      const available = allSlots.filter(
        (slot) => slot.status === 'ACTIVE' && serviceSchedules.some((schedule) => schedule.schedule_slot_id === slot.id)
      );
      setAvailableSchedules(available);
      setShowBookingModal(true);
      createPublicPageEvent(company.id, EventType.SERVICE_BOOK_CLICK);
    } catch (error) {
      toast.error('No pudimos cargar los horarios');
      handleError(error);
    }
  };

  const resetBookingState = () => {
    setShowBookingModal(false);
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

      // Crear entrada en el inventario del calendario
      await createCalendarInventoryEntry({
        company_id: company.id,
        service_id: selectedService.id,
        professional_id: professionalId,
        schedule_slot_id: selectedSchedule,
        date: selectedDate.toISOString().split('T')[0],
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
      handleError(error);
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

    toast.success(`${quantity > 1 ? `${quantity} productos agregados` : 'Producto agregado'} al carrito`);
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

      try {
        await createProductOrderRequest({
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
    company?.mission || company?.booking_message || 'Descubre servicios y productos locales en PYM-ERP.';
  const metaImage = appearance?.banner_url || appearance?.logo_url || '/logopymerp.png';
  const metaUrl = typeof window !== 'undefined' ? window.location.href : '';

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
  const googleMapsApiKey = env.googleMapsApiKey;

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />;
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Emprendimiento no encontrado</h1>
          <p className="text-gray-600">La página que buscas no existe.</p>
        </div>
      </div>
    );
  }

  const isHorizontalBackground = Boolean(company?.background_enabled && company.background_orientation !== 'VERTICAL');

  // Crear array de secciones para el carrusel (sin ContactActions)
  const contentSectionsArray = [
    // Video HERO - al inicio si placement es HERO
    company?.video_enabled && company.video_placement === 'HERO' && company.video_url ? (
      <VideoCard key="video-hero" company={company} theme={theme} />
    ) : null,
    company?.description && company?.show_description !== false ? (
      <DescriptionCard key="description" company={company} theme={theme} />
    ) : null,
    (company?.mission || company?.vision) && company?.show_mission_vision !== false ? (
      <MissionVisionCard key="mission" company={company} theme={theme} />
    ) : null,
    (company?.weekday_days && company.weekday_days.length > 0) || 
    (company?.weekend_days && company.weekend_days.length > 0) ? (
      <OperatingHoursCard key="hours" company={company} theme={theme} />
    ) : null,
    company?.address && googleMapsApiKey ? (
      <LocationMapCard key="location" company={company} theme={theme} googleMapsApiKey={googleMapsApiKey} />
    ) : null,
    ...(company.business_type === BusinessType.SERVICES && services.length > 0
      ? [
          <ServicesSection
            key="services"
            services={services}
            theme={theme}
            onBook={handleBookService}
            onServiceClick={(service) => {
              setSelectedService(service);
              // Cargar profesionales para este servicio
              const prosForService =
                service.professional_ids && service.professional_ids.length > 0
                  ? professionals.filter((pro) => service.professional_ids?.includes(pro.id))
                  : professionals;
              setServiceProfessionals(prosForService);
            }}
          />,
        ]
      : []),
    ...(company.business_type === BusinessType.PRODUCTS && products.length > 0
      ? [
          <ProductsSection
            key="products"
            products={products}
            theme={theme}
            layout={appearance?.layout}
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
            onOpenCart={() => setShowCart(true)}
            onProductClick={handleProductClick}
          />,
        ]
      : []),
    // Video FOOTER - al final si placement es FOOTER
    company?.video_enabled && company.video_placement === 'FOOTER' && company.video_url ? (
      <VideoCard key="video-footer" company={company} theme={theme} />
    ) : null,
  ].filter(Boolean); // Filtrar tarjetas vacías (null/undefined)

  // Versión vertical (sin carrusel)
  const contentSections = (
    <>
      {contentSectionsArray}
      <ContactActions
        theme={theme}
        onWhatsApp={handleWhatsAppClick}
        onOpenCart={() => setShowCart(true)}
        cartItems={totalCartItems}
        showCartCta={company.business_type === BusinessType.PRODUCTS}
      />
    </>
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
        schema={businessSchema || undefined}
        robots="index, follow"
      />
      <div 
        className="min-h-screen relative background-container" 
        style={backgroundContainerStyle}
        data-orientation={company?.background_orientation?.toLowerCase() || 'horizontal'}
        data-fit={company?.background_fit || 'cover'}
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

        <PublicHeader company={company} appearance={appearance} theme={theme} />

        <main
          id="main-content"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          style={{ color: theme.textColor, fontFamily: theme.fontBody }}
        >
          {/* Layout 3: Carrusel Fullscreen */}
          {theme.cardLayout === 3 ? (
            <FullscreenCarousel
              company={company}
              theme={theme}
              services={services}
              products={products}
              cart={cart}
              googleMapsApiKey={googleMapsApiKey}
              onBook={handleBookService}
              onServiceClick={(service) => {
                setSelectedService(service);
                const prosForService =
                  service.professional_ids && service.professional_ids.length > 0
                    ? professionals.filter((pro) => service.professional_ids?.includes(pro.id))
                    : professionals;
                setServiceProfessionals(prosForService);
              }}
              onAddToCart={addToCart}
              onUpdateQuantity={updateCartQuantity}
              onProductClick={handleProductClick}
              onOpenCart={() => setShowCart(true)}
            />
          ) : isHorizontalBackground ? (
            <>
              {contentSectionsArray.length > 0 && (
                <HorizontalCarousel theme={theme}>
                  {contentSectionsArray}
                </HorizontalCarousel>
              )}
              {/* Botón de contacto centrado al final */}
              <div className="mt-12 mb-8 flex justify-center">
                <ContactActions
                  theme={theme}
                  onWhatsApp={handleWhatsAppClick}
                  onOpenCart={() => setShowCart(true)}
                  cartItems={totalCartItems}
                  showCartCta={company.business_type === BusinessType.PRODUCTS}
                />
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {contentSections}
            </div>
          )}
        </main>

        {showWhatsAppFab && (
          <button
            type="button"
            onClick={handleWhatsAppClick}
            className="fixed bottom-6 right-6 z-40 flex items-center justify-center h-14 w-14 rounded-full shadow-lg text-white hover:opacity-90 transition"
            style={{ backgroundColor: '#25D366', color: '#ffffff' }}
            aria-label="Contactar por WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.52 3.48A11.82 11.82 0 0 0 12.07 0 11.86 11.86 0 0 0 1.07 12.17 11.7 11.7 0 0 0 3.5 20.5l-1 3.48 3.6-.94a11.93 11.93 0 0 0 5.94 1.52h.05A11.83 11.83 0 0 0 24 12.07 11.8 11.8 0 0 0 20.52 3.48ZM12.1 21a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-2.14.55.57-2.08-.24-.34a9.83 9.83 0 0 1-1.7-5.54A10.08 10.08 0 0 1 12.06 2a9.92 9.92 0 0 1 7.07 2.93 9.92 9.92 0 0 1 2.92 7.12A10 10 0 0 1 12.1 21Zm5.47-7.3c-.3-.15-1.77-.87-2.04-.97s-.47-.15-.67.15-.77.97-.94 1.17-.35.22-.64.07A8.14 8.14 0 0 1 10 11.8a9.18 9.18 0 0 1-1.65-2 .55.55 0 0 1 .13-.76c.13-.14.3-.37.45-.55a2.54 2.54 0 0 0 .3-.52.67.67 0 0 0-.03-.63c-.08-.15-.67-1.62-.92-2.22-.24-.58-.5-.5-.67-.51H6.8a1.3 1.3 0 0 0-.94.44 3.93 3.93 0 0 0-1.24 2.9c0 1.7 1.26 3.34 1.43 3.57.17.22 2.47 3.78 5.98 5.13a19.4 19.4 0 0 0 2.02.6 4.86 4.86 0 0 0 2.25.14c.69-.1 2.1-.86 2.4-1.7a3 3 0 0 0 .21-1.7c-.09-.14-.27-.22-.57-.37Z" />
            </svg>
          </button>
        )}

        <footer id="footer" className="text-center py-6 text-sm" style={{ color: theme.textColor }}>
          Desarrollado por{' '}
          <a
            href="https://www.pymerp.cl"
            className="text-blue-600 hover:underline"
            style={{ fontFamily: theme.fontBody }}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visitar sitio web de PymERP (se abre en nueva ventana)"
          >
            pymerp.cl
          </a>
        </footer>

        <BookingModal
          isOpen={showBookingModal}
          serviceName={selectedService?.name}
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
          enableEmailField
          emailLabel="Correo del cliente (opcional)"
          emailPlaceholder="cliente@correo.com"
          theme={theme}
          companyId={company?.id}
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
