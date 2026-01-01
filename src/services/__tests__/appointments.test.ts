import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSubscriptionLimits } from '../appointments';

// Mock firestore
vi.mock('../../config/firebase', () => ({
  db: {},
  functions: {},
}));

vi.mock('./firestore', () => ({
  getCompany: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((date) => date),
  },
  onSnapshot: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(),
}));

describe('Appointments Service - Subscription Limits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports getSubscriptionLimits function', () => {
    expect(typeof getSubscriptionLimits).toBe('function');
  });

  // Note: Full integration tests would require Firebase emulator
  // These are just smoke tests to ensure functions are exported
});

