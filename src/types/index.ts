export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FORCE_PASSWORD_CHANGE = 'FORCE_PASSWORD_CHANGE',
}

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ENTREPRENEUR = 'ENTREPRENEUR',
}

export enum AccessRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum BusinessType {
  SERVICES = 'SERVICES',
  PRODUCTS = 'PRODUCTS',
}

export enum EventType {
  PAGE_VIEW = 'PAGE_VIEW',
  WHATSAPP_CLICK = 'WHATSAPP_CLICK',
  SERVICE_BOOK_CLICK = 'SERVICE_BOOK_CLICK',
  PRODUCT_ORDER_CLICK = 'PRODUCT_ORDER_CLICK',
}

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  status: UserStatus;
  role: UserRole;
  company_id?: string;
  created_at: Date;
}

export interface AccessRequest {
  id: string;
  full_name: string;
  email: string;
  business_name: string;
  whatsapp: string;
  last_password_reset?: Date;
  plan?: string;
  status: AccessRequestStatus;
  created_at: Date;
  processed_at?: Date;
  processed_by_user_id?: string;
}

export interface Company {
  id: string;
  owner_user_id: string;
  name: string;
  rut: string;
  industry: string;
  sector?: string;
  seo_keyword?: string;
  whatsapp: string;
  address: string;
  status?: 'ACTIVE' | 'BLOCKED';
  latitude?: number;
  longitude?: number;
  description?: string;
  show_description?: boolean;
  mission?: string;
  vision?: string;
  show_mission_vision?: boolean;
  booking_message?: string;
  business_type?: BusinessType;
  subscription_plan?: 'BASIC' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  background_enabled?: boolean;
  background_url?: string;
  background_orientation?: 'HORIZONTAL' | 'VERTICAL';
  background_fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  background_opacity?: number; // 0-100
  video_enabled?: boolean;
  video_url?: string;
  video_placement?: 'MODAL' | 'HERO' | 'FOOTER';
  commune?: string;
  weekday_days?: string[];
  weekday_open_time?: string;
  weekday_close_time?: string;
  weekend_days?: string[];
  weekend_open_time?: string;
  weekend_close_time?: string;
  slug: string;
  setup_completed: boolean;
  created_at: Date;
  updated_at: Date;
  // Subscription limits
  subscription?: {
    maxProfessionals: number; // 1-60 based on plan
    currentProfessionals?: number;
  };
  // Notifications settings
  notifications?: {
    emailEnabled: boolean;
    toEmail?: string;
  };
  // Delivery settings
  delivery_enabled?: boolean; // Activar pedidos a domicilio
  // Categoría y módulos
  category_id?: string | null;
  categoryId?: string | null;
  menu_qr_table_count?: number;
  businessMode?: 'SERVICES' | 'PRODUCTS' | 'BOTH';
  region?: string;
  location?: { latitude: number; longitude: number };
  shortDescription?: string;
  comuna?: string;
  externalWebsiteUrl?: string;
  externalWebsiteEnabled?: boolean;
  publicSlug?: string;
  photos?: string[];
  social_links?: Record<string, string> | null;
  socialLinks?: Record<string, string> | null;
  categoryGroup?: string;
  fulfillment_config?: {
    enabled?: boolean;
    modes?: string[];
    delivery_fee?: number;
    minimum_order?: number;
    delivery_time_minutes?: number;
    preparation_time_minutes?: number;
    title?: string;
    description?: string;
    note?: string;
  };
}

export interface CompanyAppearance {
  id: string;
  company_id: string;
  context: BusinessType;
  logo_url?: string;
  banner_url?: string;
  logo_position?: 'left' | 'center' | 'right'; // Posición del logo en el header
  background_color?: string;
  menu_background_color?: string;
  menu_background_image?: string;
  card_color?: string;
  menu_card_color?: string;
  background_opacity?: number;
  card_opacity?: number;
  menu_hero_card_opacity?: number;
  menu_hero_card_color?: string;
  menu_hero_logo_card_opacity?: number;
  menu_hero_logo_card_color?: string;
  button_color?: string;
  button_text_color?: string;
  menu_button_color?: string;
  menu_button_text_color?: string;
  title_color?: string;
  menu_title_color?: string;
  subtitle_color?: string;
  text_color?: string;
  menu_text_color?: string;
  font_title?: string;
  font_body?: string;
  font_button?: string;
  layout?: 'GRID' | 'LIST';
  card_layout?: 1 | 2 | 3; // Layout premium para tarjetas (1: Grid Clásico, 2: Lista Circular, 3: Carrusel Fullscreen)
  show_whatsapp_fab?: boolean;
  menu_category_image_default?: string;
  hero_kicker?: string;
  hero_title?: string;
  hero_description?: string;
  hero_card_color?: string;
  hero_card_opacity?: number;
  hero_background_image?: string;
  hero_title_color?: string;
  hero_text_color?: string;
  hero_primary_button_color?: string;
  hero_primary_button_text_color?: string;
  hero_secondary_button_color?: string;
  hero_secondary_button_text_color?: string;
  // Personalización del calendario de agenda
  calendar_card_color?: string; // Color de fondo de las tarjetas del calendario
  calendar_card_opacity?: number; // Opacidad de las tarjetas del calendario (0-100)
  calendar_text_color?: string; // Color del texto del calendario
  calendar_title_color?: string; // Color de los títulos del calendario
  calendar_button_color?: string; // Color de los botones del calendario
  calendar_button_text_color?: string; // Color del texto de los botones
  calendar_available_day_color?: string; // Color de borde para días con disponibilidad (verde)
  calendar_low_slots_color?: string; // Color de borde para días con pocos slots (amarillo)
  calendar_no_slots_color?: string; // Color de borde para días sin slots (rojo)
  calendar_selected_day_color?: string; // Color de fondo para el día seleccionado
}

export interface ScheduleSlot {
  id: string;
  company_id: string;
  days_of_week: string[];
  start_time: string;
  end_time: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Service {
  id: string;
  company_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  estimated_duration_minutes: number;
  status: 'ACTIVE' | 'INACTIVE';
  professional_ids?: string[];
  hide_price?: boolean; // Si es true, no mostrar precio y mostrar mensaje de consulta por WhatsApp
}

export interface ServiceSchedule {
  id: string;
  service_id: string;
  schedule_slot_id: string;
}

export interface Product {
  id: string;
  company_id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  weight?: number;
  kcal?: number;
  tags?: string[];
  stock?: number; // Cantidad disponible en inventario (opcional)
  status: 'ACTIVE' | 'INACTIVE';
  hide_price?: boolean; // Si es true, no mostrar precio y mostrar mensaje de consulta por WhatsApp
  menuCategoryId?: string;
  menuOrder?: number;
  isAvailable?: boolean;
}

export interface AppointmentRequest {
  id: string;
  company_id: string;
  service_id: string;
  date: string;
  schedule_slot_id: string;
  professional_id?: string;
  start_time?: string;
  end_time?: string;
  client_name: string;
  client_whatsapp: string;
  client_email?: string;
  client_rut?: string; // RUT del cliente (opcional)
  client_comment?: string;
  created_at: Date;
}

export interface ProductOrderRequest {
  id: string;
  company_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
  }>;
  total_estimated: number;
  client_name: string;
  client_whatsapp: string;
  client_comment?: string;
  created_at: Date;
  status?: 'REQUESTED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'PAID' | 'CANCELLED';
  order_type?: 'TABLE' | 'PICKUP' | 'DELIVERY';
  channel?: 'WHATSAPP' | 'MENU' | string;
  table_number?: string;
  payment_method?: string;
  delivery_type?: 'PICKUP' | 'DELIVERY' | 'TABLE';
  status_history?: Array<{
    from?: ProductOrderRequest['status'] | null;
    to: ProductOrderRequest['status'];
    created_at: Date;
  }>;
}

export interface PublicPageEvent {
  id: string;
  company_id: string;
  event_type: EventType;
  created_at: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// Professionals & Appointments System
export enum AppointmentStatus {
  REQUESTED = 'REQUESTED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export interface Professional {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  specialties?: string[];
  status: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
}

export interface Appointment {
  id: string;
  company_id: string;
  service_id: string;
  professional_id: string;
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_rut?: string; // RUT del cliente (opcional)
  appointment_date: Date;
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  status: AppointmentStatus;
  notes?: string;
  created_by_user_id?: string; // for manual appointments
  created_at: Date;
  updated_at: Date;
}

export interface ProfessionalAvailability {
  id: string;
  professional_id: string;
  company_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  is_available: boolean;
  created_at: Date;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  company_id: string;
  email_notifications_enabled: boolean;
  notification_email?: string;
  created_at: Date;
  updated_at: Date;
}

export type PublicLayoutVariantChoice = 'classic' | 'modern' | 'compact' | 'immersive' | 'minimal';

export interface MenuCategory {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  order?: number;
  active?: boolean;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FulfillmentConfig {
  enabled?: boolean;
  modes?: string[];
  delivery_fee?: number;
  minimum_order?: number;
  delivery_time_minutes?: number;
  preparation_time_minutes?: number;
  title?: string;
  description?: string;
  note?: string;
}

export interface PublicCompany extends Company {
  location?: { latitude: number; longitude: number };
}

export interface Event {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  start_date: Date | string;
  end_date?: Date | string;
  location?: string;
  capacity?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  created_at: Date;
  updated_at: Date;
}

export interface EventReservation {
  id: string;
  company_id: string;
  event_id: string;
  attendee_name?: string;
  attendee_email?: string;
  attendee_phone?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  tickets?: number;
  guests?: number;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  created_at: Date;
  updated_at: Date;
}

export interface Property {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  address?: string;
  location?: string;
  capacity?: number;
  amenities?: string[];
  price_per_night?: number;
  currency?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
}

export interface PropertyBooking {
  id: string;
  company_id: string;
  property_id: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  check_in?: Date | string;
  check_out?: Date | string;
  guests?: number;
  total_price?: number;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  created_at?: Date;
  updated_at?: Date;
}

export interface DeliveryRoute {
  id: string;
  company_id: string;
  name?: string;
  description?: string;
  notes?: string;
  driver?: string;
  vehicle?: string;
  orders?: string[];
  start_date?: Date | string;
  end_date?: Date | string;
  status?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentCollection {
  id: string;
  company_id: string;
  title?: string;
  client_name?: string;
  client_whatsapp?: string;
  payment_method?: string;
  amount?: number;
  due_date?: Date | string;
  paid_date?: Date | string;
  status?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DeliveryLocation {
  id: string;
  company_id: string;
  driver_id?: string;
  client_name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: Date | string;
  status?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClinicResource {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  type?: string;
  notes?: string;
  quantity?: number;
  active?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
}

export interface Lead {
  id: string;
  company_id: string;
  intent?: string;
  name?: string;
  whatsapp?: string;
  email?: string;
  message?: string;
  property_id?: string;
  property_title?: string;
  preferred_date?: Date | string;
  preferred_time?: string;
  source?: string;
  created_at: Date;
  updated_at: Date;
}
