export interface AppearanceTheme {
  bgColor: string;
  cardColor: string;
  bgOpacity: number;
  cardOpacity: number;
  buttonColor: string;
  buttonTextColor: string;
  titleColor: string;
  subtitleColor: string;
  textColor: string;
  fontTitle: string;
  fontBody: string;
  fontButton: string;
  cardLayout?: 1 | 2 | 3; // Layout premium para tarjetas (1: Grid Clásico, 2: Lista Circular, 3: Carrusel Fullscreen)
  // Personalización del calendario
  calendarCardColor?: string;
  calendarCardOpacity?: number;
  calendarTextColor?: string;
  calendarTitleColor?: string;
  calendarButtonColor?: string;
  calendarButtonTextColor?: string;
  calendarAvailableDayColor?: string;
  calendarLowSlotsColor?: string;
  calendarNoSlotsColor?: string;
  calendarSelectedDayColor?: string;
}

export interface BookingForm {
  client_name: string;
  client_whatsapp: string;
  client_email?: string;
  client_rut?: string;
  client_comment: string;
}

export interface OrderForm {
  client_name: string;
  client_whatsapp: string;
  client_comment: string;
  delivery_type?: 'PICKUP' | 'DELIVERY'; // Retiro en local o Domicilio
  delivery_address?: string; // Dirección de entrega
  delivery_location?: string; // URL de ubicación (Google Maps)
  delivery_notes?: string; // Notas adicionales de entrega
}
