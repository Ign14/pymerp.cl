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
  mission?: string;
  vision?: string;
  booking_message?: string;
  business_type?: BusinessType;
  subscription_plan?: 'BASIC' | 'STANDARD' | 'PRO' | 'APPROVED25';
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
}

export interface CompanyAppearance {
  id: string;
  company_id: string;
  context: BusinessType;
  logo_url?: string;
  banner_url?: string;
  background_color?: string;
  card_color?: string;
  button_color?: string;
  button_text_color?: string;
  title_color?: string;
  subtitle_color?: string;
  text_color?: string;
  font_title?: string;
  font_body?: string;
  font_button?: string;
  layout?: 'GRID' | 'LIST';
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
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AppointmentRequest {
  id: string;
  company_id: string;
  service_id: string;
  date: string;
  schedule_slot_id: string;
  client_name: string;
  client_whatsapp: string;
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
