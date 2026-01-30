import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getEvents,
  getEventReservations,
  createEvent,
  sumConfirmedQty,
} from '../events';

// Mock firebase config first to avoid initialization
vi.mock('../../config/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
  functions: {},
}));

vi.mock('firebase/firestore', () => {
  const docs: any = [
    {
      id: 'ev-1',
      data: () => ({
        company_id: 'company-1',
        title: 'Evento demo',
        start_date: { toDate: () => new Date('2024-01-01T10:00:00Z') },
        created_at: { toDate: () => new Date('2024-01-01T09:00:00Z') },
        updated_at: { toDate: () => new Date('2024-01-01T09:00:00Z') },
      }),
    },
  ];
  const reservations = [
    {
      id: 'res-1',
      data: () => ({
        status: 'CONFIRMED',
        tickets: 2,
        created_at: { toDate: () => new Date() },
        updated_at: { toDate: () => new Date() },
      }),
    },
    {
      id: 'res-2',
      data: () => ({
        status: 'PENDING',
        tickets: 5,
        created_at: { toDate: () => new Date() },
        updated_at: { toDate: () => new Date() },
      }),
    },
  ];

  const collection = vi.fn((_: any, name: string) => name);
  const query = vi.fn((col: string) => {
    if (col === 'event_reservations') return { __reservations: true };
    return { __events: true };
  });

  return {
    collection,
    doc: vi.fn(),
    where: vi.fn(),
    query,
    Timestamp: { now: () => 'now', fromDate: (d: Date) => `ts:${d.toISOString()}` },
    addDoc: vi.fn(async () => ({ id: 'new-event' })),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDocs: vi.fn(async (q: any) => {
      if ((q as any)?.__reservations) {
        return { docs: reservations };
      }
      return { docs };
    }),
    getDoc: vi.fn(),
    initializeFirestore: vi.fn(() => ({})),
  };
});

describe('events service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps events from firestore', async () => {
    const list = await getEvents('company-1');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('ev-1');
    expect(list[0].title).toBe('Evento demo');
    expect(list[0].start_date instanceof Date).toBe(true);
  });

  it('creates event with scoped company and timestamps', async () => {
    const id = await createEvent({
      company_id: 'company-1',
      title: 'Nuevo',
      description: '',
      start_date: new Date('2024-02-01T10:00:00Z'),
      end_date: undefined,
      location: '',
      capacity: 10,
      status: 'DRAFT',
    });
    expect(id).toBe('new-event');
  });

  it('sums confirmed tickets only', async () => {
    const res = await getEventReservations('company-1', 'ev-1');
    expect(sumConfirmedQty(res)).toBe(2);
  });
});
