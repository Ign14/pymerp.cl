export interface AppearanceTheme {
  bgColor: string;
  cardColor: string;
  buttonColor: string;
  buttonTextColor: string;
  titleColor: string;
  subtitleColor: string;
  textColor: string;
  fontTitle: string;
  fontBody: string;
  fontButton: string;
}

export interface BookingForm {
  client_name: string;
  client_whatsapp: string;
  client_comment: string;
}

export interface OrderForm {
  client_name: string;
  client_whatsapp: string;
  client_comment: string;
}
