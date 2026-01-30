import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createMenuCategory, getMenuCategories, updateMenuCategory, deleteMenuCategory } from '../menu';

// Mock firebase config first to avoid initialization
vi.mock('../../config/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
  functions: {},
}));

vi.mock('firebase/firestore', () => {
  const docs = [
    {
      id: 'cat-1',
      data: () => ({
        company_id: 'c1',
        name: 'Entradas',
        order: 0,
        created_at: { toDate: () => new Date('2024-01-01') },
        updated_at: { toDate: () => new Date('2024-01-02') },
      }),
    },
  ];
  return {
    collection: vi.fn(),
    doc: vi.fn(),
    where: vi.fn(),
    query: vi.fn(),
    Timestamp: { now: () => 'now' },
    addDoc: vi.fn(async () => ({ id: 'new-cat' })),
    updateDoc: vi.fn(async () => {}),
    deleteDoc: vi.fn(async () => {}),
    getDocs: vi.fn(async () => ({ docs })),
    getDoc: vi.fn(),
    initializeFirestore: vi.fn(() => ({})),
  };
});

describe('menu service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists menu categories mapped with dates', async () => {
    const list = await getMenuCategories('c1');
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Entradas');
    expect(list[0].created_at instanceof Date).toBe(true);
  });

  it('creates a menu category', async () => {
    const id = await createMenuCategory({
      company_id: 'c1',
      name: 'Platos',
      order: 1,
      active: true,
    } as any);
    expect(id).toBe('new-cat');
  });

  it('updates and deletes a menu category without throwing', async () => {
    await expect(updateMenuCategory('cat-1', { name: 'Editada' })).resolves.toBeUndefined();
    await expect(deleteMenuCategory('cat-1')).resolves.toBeUndefined();
  });
});
