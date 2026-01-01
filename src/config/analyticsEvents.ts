import { GAEventAction, GAEventCategory } from './analytics';

export type AnalyticsEventName =
  | 'appointments.manualCreated'
  | 'appointments.publicRequested'
  | 'appointments.confirmed'
  | 'products.orderSubmitted'
  | 'companies.setupCompleted'
  | 'contact.whatsappClick';

type AnalyticsEventDefinition = {
  action: GAEventAction | string;
  category: GAEventCategory;
  defaultParams?: Record<string, any>;
  requiredParams?: string[];
};

export const ANALYTICS_EVENTS: Record<AnalyticsEventName, AnalyticsEventDefinition> = {
  'appointments.manualCreated': {
    action: 'manual_appointment_created',
    category: GAEventCategory.CONVERSION,
    requiredParams: ['professional_id', 'service_id'],
  },
  'appointments.publicRequested': {
    action: 'public_appointment_requested',
    category: GAEventCategory.CONVERSION,
    requiredParams: ['company_id', 'service_id'],
  },
  'appointments.confirmed': {
    action: 'appointment_confirmed',
    category: GAEventCategory.BUSINESS,
    requiredParams: ['company_id'],
  },
  'products.orderSubmitted': {
    action: GAEventAction.PRODUCT_ORDER,
    category: GAEventCategory.CONVERSION,
    requiredParams: ['company_id'],
  },
  'companies.setupCompleted': {
    action: GAEventAction.COMPANY_SETUP,
    category: GAEventCategory.BUSINESS,
  },
  'contact.whatsappClick': {
    action: GAEventAction.WHATSAPP_CLICK,
    category: GAEventCategory.NAVIGATION,
    requiredParams: ['company_id'],
  },
};

export function buildAnalyticsEvent(
  name: AnalyticsEventName,
  params?: Record<string, any>
): { action: GAEventAction | string; params: Record<string, any> } {
  const definition = ANALYTICS_EVENTS[name];
  const mergedParams = {
    ...definition.defaultParams,
    ...params,
    category: definition.category,
  };
  return {
    action: definition.action,
    params: mergedParams,
  };
}
