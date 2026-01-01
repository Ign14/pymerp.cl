import { describe, it, expect } from 'vitest';
import { buildAnalyticsEvent, ANALYTICS_EVENTS } from '../analyticsEvents';
import { GAEventCategory } from '../analytics';

describe('analyticsEvents', () => {
  it('builds manual appointment created event with category and params', () => {
    const { action, params } = buildAnalyticsEvent('appointments.manualCreated', {
      professional_id: 'pro-1',
      service_id: 'svc-1',
    });

    expect(action).toBe('manual_appointment_created');
    expect(params.category).toBe(GAEventCategory.CONVERSION);
    expect(params.professional_id).toBe('pro-1');
    expect(params.service_id).toBe('svc-1');
  });

  it('exposes all defined events', () => {
    expect(Object.keys(ANALYTICS_EVENTS)).toEqual(
      expect.arrayContaining([
        'appointments.manualCreated',
        'appointments.publicRequested',
        'products.orderSubmitted',
        'contact.whatsappClick',
      ])
    );
  });
});
