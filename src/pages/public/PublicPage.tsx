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
  createAppointmentRequest,
  createProductOrderRequest,
} from '../../services/firestore';
import {
  BusinessType,
  CartItem,
  Company,
  CompanyAppearance,
  EventType,
  Product,
  ScheduleSlot,
  Service,
} from '../../types';
import { env } from '../../config/env';
import LoadingSpinner from '../../components/animations/LoadingSpinner';
import SEO, { createLocalBusinessSchema } from '../../components/SEO';
import { useAnalytics } from '../../hooks/useAnalytics';
import { GAEventAction } from '../../config/analytics';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { PublicHeader } from './components/PublicHeader';
import { MissionVisionCard } from './components/MissionVisionCard';
import { OperatingHoursCard } from './components/OperatingHoursCard';
import { LocationMapCard } from './components/LocationMapCard';
import { ServicesSection } from './components/ServicesSection';
import { ProductsSection } from './components/ProductsSection';
import { ContactActions } from './components/ContactActions';
import { BookingModal } from './components/BookingModal';
import { CartModal } from './components/CartModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { AppearanceTheme, BookingForm, OrderForm } from './types';
import { DAY_NAMES_ES, DAY_OF_WEEK_KEYS } from './constants';

const defaultTheme: AppearanceTheme = {
  bgColor: '#ffffff',
  cardColor: '#ffffff',
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
  const { trackConversion, trackClick } = useAnalytics();
  const { handleError } = useErrorHandler();

  const [company, setCompany] = useState<Company | null>(null);
  const [appearance, setAppearance] = useState<CompanyAppearance | null>(null);
  const [services, setServices] = useState<Service[]>([]);
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
    client_comment: '',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderForm>({
    client_name: '',
    client_whatsapp: '',
    client_comment: '',
  });

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

  const theme = useMemo<AppearanceTheme>(() => ({
    bgColor: appearance?.background_color || defaultTheme.bgColor,
    cardColor: appearance?.card_color || defaultTheme.cardColor,
    buttonColor: appearance?.button_color || defaultTheme.buttonColor,
    buttonTextColor: appearance?.button_text_color || defaultTheme.buttonTextColor,
    titleColor: appearance?.title_color || defaultTheme.titleColor,
    subtitleColor: appearance?.subtitle_color || defaultTheme.subtitleColor,
    textColor: appearance?.text_color || defaultTheme.textColor,
    fontTitle: appearance?.font_title || defaultTheme.fontTitle,
    fontBody: appearance?.font_body || defaultTheme.fontBody,
    fontButton: appearance?.font_button || defaultTheme.fontButton,
  }), [appearance]);

  const trackPageView = async (companyId: string) => {
    try {
      await createPublicPageEvent(companyId, EventType.PAGE_VIEW);
    } catch (error) {
      handleError(error, { customMessage: 'Error tracking page view', showToast: false });
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
        const appearanceData = await getCompanyAppearance(companyData.id, companyData.business_type);
        setAppearance(appearanceData);
      }

      if (companyData.business_type === BusinessType.SERVICES) {
        const servicesData = await getServices(companyData.id);
        setServices(servicesData.filter((service) => service.status === 'ACTIVE'));
      } else if (companyData.business_type === BusinessType.PRODUCTS) {
        const productsData = await getProducts(companyData.id);
        setProducts(productsData.filter((product) => product.status === 'ACTIVE'));
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
    setBookingForm({ client_name: '', client_whatsapp: '', client_comment: '' });
  };

  const handleSubmitBooking = async () => {
    if (!selectedService || !selectedDate || !selectedSchedule || !company) {
      toast.error('Completa todos los campos');
      return;
    }

    if (!bookingForm.client_name || !bookingForm.client_whatsapp) {
      toast.error('Completa nombre y WhatsApp');
      return;
    }

    try {
      const scheduleSlot = availableSchedules.find((s) => s.id === selectedSchedule);
      if (!scheduleSlot) {
        toast.error('Horario no encontrado');
        return;
      }

      const dateDayName = DAY_NAMES_ES[DAY_OF_WEEK_KEYS[selectedDate.getDay()]];
      const message = `Hola, quiero agendar el servicio ${selectedService.name} el día ${selectedDate.toLocaleDateString('es-CL')} en el horario ${dateDayName} ${scheduleSlot.start_time}-${scheduleSlot.end_time}.\n\nMi nombre es ${bookingForm.client_name} y mi WhatsApp es ${bookingForm.client_whatsapp}.\n\nComentarios: ${bookingForm.client_comment || 'Ninguno'}.`;

      await createAppointmentRequest({
        company_id: company.id,
        service_id: selectedService.id,
        date: selectedDate.toISOString().split('T')[0],
        schedule_slot_id: selectedSchedule,
        client_name: bookingForm.client_name,
        client_whatsapp: bookingForm.client_whatsapp.replace(/\D/g, ''),
        client_comment: bookingForm.client_comment,
      });

      const url = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      trackConversion()(GAEventAction.SERVICE_BOOKING, selectedService.price, {
        service_id: selectedService.id,
        service_name: selectedService.name,
        company_id: company.id,
        company_name: company.name,
      });

      resetBookingState();
      toast.success('Redirigiendo a WhatsApp...');
    } catch (error) {
      toast.error('Error al procesar la solicitud');
      handleError(error);
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }

    trackClick('add_to_cart')({
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      company_id: company?.id,
    });

    toast.success('Producto agregado al carrito');
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      );
    }
  };

  const handleSubmitOrder = async () => {
    if (!company) return;

    if (!orderForm.client_name || !orderForm.client_whatsapp) {
      toast.error('Completa nombre y WhatsApp');
      return;
    }

    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    try {
      const items = cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
      }));

      const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      const message = `Hola, quiero consultar disponibilidad de estos productos:\n\n${cart
        .map((item) => `${item.product.name} x ${item.quantity}`)
        .join('\n')}\n\nTotal estimado: $${total.toLocaleString()}\n\nMi nombre es ${
        orderForm.client_name
      } y mi WhatsApp es ${orderForm.client_whatsapp}.\n\nComentarios: ${
        orderForm.client_comment || 'Ninguno'
      }.`;

      await createProductOrderRequest({
        company_id: company.id,
        items,
        total_estimated: total,
        client_name: orderForm.client_name,
        client_whatsapp: orderForm.client_whatsapp.replace(/\D/g, ''),
        client_comment: orderForm.client_comment,
      });

      createPublicPageEvent(company.id, EventType.PRODUCT_ORDER_CLICK);

      trackConversion()(GAEventAction.PRODUCT_ORDER, total, {
        product_count: cart.length,
        total_items: cart.reduce((sum, item) => sum + item.quantity, 0),
        company_id: company.id,
        company_name: company.name,
      });

      const url = `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      setShowCart(false);
      setCart([]);
      setOrderForm({ client_name: '', client_whatsapp: '', client_comment: '' });
      toast.success('Redirigiendo a WhatsApp...');
    } catch (error) {
      toast.error('Error al procesar la solicitud');
      handleError(error);
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
      <div style={{ backgroundColor: theme.bgColor }} className="min-h-screen">
        <PublicHeader company={company} appearance={appearance} theme={theme} />

        <main
          id="main-content"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
          style={{ color: theme.textColor, fontFamily: theme.fontBody }}
        >
          <MissionVisionCard company={company} theme={theme} />
          <OperatingHoursCard company={company} theme={theme} />
          <LocationMapCard company={company} theme={theme} googleMapsApiKey={googleMapsApiKey} />

          {company.business_type === BusinessType.SERVICES && (
            <ServicesSection
              services={services}
              theme={theme}
              onPreview={(url) => setPreviewUrl(url || null)}
              onBook={handleBookService}
            />
          )}

          {company.business_type === BusinessType.PRODUCTS && (
            <ProductsSection
              products={products}
              theme={theme}
              layout={appearance?.layout}
              cartCount={cart.length}
              onAddToCart={addToCart}
              onPreview={(url) => setPreviewUrl(url || null)}
              onOpenCart={() => setShowCart(true)}
            />
          )}

          <ContactActions
            theme={theme}
            onWhatsApp={handleWhatsAppClick}
            onOpenCart={() => setShowCart(true)}
            cartItems={totalCartItems}
            showCartCta={company.business_type === BusinessType.PRODUCTS}
          />
        </main>

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
          theme={theme}
        />

        <CartModal
          isOpen={showCart}
          cart={cart}
          orderForm={orderForm}
          onClose={() => setShowCart(false)}
          onQuantityChange={updateCartQuantity}
          onRemove={removeFromCart}
          onFormChange={(field, value) => setOrderForm({ ...orderForm, [field]: value })}
          onSubmit={handleSubmitOrder}
          theme={theme}
        />

        <ImagePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
      </div>
    </>
  );
}
