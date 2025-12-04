import { Page, Route } from '@playwright/test';

type MockDocument = {
  data: Record<string, any>;
  createTime: string;
  updateTime: string;
};

type MockCollections = Record<string, Record<string, MockDocument>>;

export type MockState = {
  collections: MockCollections;
  currentUser?: { id: string; email: string };
};

const FIRESTORE_BASE =
  'projects/demo-test/databases/(default)/documents';

const nowIso = () => new Date().toISOString();

const encodeValue = (value: any): any => {
  if (value === null) return { nullValue: null };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((v) => encodeValue(v)) } };
  }
  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }
  switch (typeof value) {
    case 'string':
      return { stringValue: value };
    case 'boolean':
      return { booleanValue: value };
    case 'number':
      return Number.isInteger(value)
        ? { integerValue: value.toString() }
        : { doubleValue: value };
    case 'object':
      return { mapValue: { fields: encodeFields(value) } };
    default:
      return { stringValue: String(value) };
  }
};

const decodeValue = (value: any): any => {
  if (!value || typeof value !== 'object') return value;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return parseInt(value.integerValue, 10);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return new Date(value.timestampValue);
  if ('nullValue' in value) return null;
  if (value.arrayValue) {
    return (value.arrayValue.values || []).map((v: any) => decodeValue(v));
  }
  if (value.mapValue) {
    return decodeFields(value.mapValue.fields || {});
  }
  return value;
};

const encodeFields = (data: Record<string, any>): Record<string, any> =>
  Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)]));

const decodeFields = (fields: Record<string, any>): Record<string, any> =>
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));

const docName = (collection: string, id: string) => `${FIRESTORE_BASE}/${collection}/${id}`;

const buildDocument = (collection: string, id: string, doc: MockDocument) => ({
  name: docName(collection, id),
  fields: encodeFields(doc.data),
  createTime: doc.createTime,
  updateTime: doc.updateTime,
});

const ensureCollection = (state: MockState, collection: string) => {
  state.collections[collection] = state.collections[collection] || {};
  return state.collections[collection];
};

const defaultState = (): MockState => {
  const createdAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const scheduleSlotA = {
    days_of_week: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    start_time: '09:00',
    end_time: '12:00',
    status: 'ACTIVE',
    company_id: 'company-services',
  };
  const scheduleSlotB = {
    days_of_week: ['TUESDAY', 'THURSDAY'],
    start_time: '15:00',
    end_time: '18:00',
    status: 'ACTIVE',
    company_id: 'company-services',
  };

  const now = nowIso();
  const build = (data: Record<string, any>): MockDocument => ({
    data,
    createTime: now,
    updateTime: now,
  });

  const collections: MockCollections = {
    users: {
      'u-entrepreneur': build({
        email: 'founder@demo.com',
        status: 'ACTIVE',
        role: 'ENTREPRENEUR',
        company_id: 'company-services',
      }),
      'u-product-owner': build({
        email: 'seller@demo.com',
        status: 'ACTIVE',
        role: 'ENTREPRENEUR',
        company_id: 'company-products',
      }),
      'u-force-reset': build({
        email: 'force@demo.com',
        status: 'FORCE_PASSWORD_CHANGE',
        role: 'ENTREPRENEUR',
        company_id: 'company-services',
      }),
      'u-admin': build({
        email: 'admin@demo.com',
        status: 'ACTIVE',
        role: 'SUPERADMIN',
      }),
    },
    companies: {
      'company-services': build({
        name: 'Servicios Demo',
        slug: 'servicios-demo',
        industry: 'Tecnología',
        sector: 'Servicios',
        business_type: 'SERVICES',
        setup_completed: true,
        whatsapp: '56911111111',
        booking_message: 'Agenda tu demo',
        subscription_plan: 'PRO',
        address: 'Av. Principal 123',
        commune: 'Santiago',
        latitude: -33.45,
        longitude: -70.66,
        created_at: createdAt,
        updated_at: createdAt,
      }),
      'company-products': build({
        name: 'Productos Demo',
        slug: 'productos-demo',
        industry: 'Retail',
        sector: 'Ventas',
        business_type: 'PRODUCTS',
        setup_completed: true,
        whatsapp: '56922222222',
        booking_message: 'Consulta por productos',
        subscription_plan: 'STANDARD',
        address: 'Calle Falsa 123',
        commune: 'Providencia',
        latitude: -33.45,
        longitude: -70.66,
        created_at: createdAt,
        updated_at: createdAt,
      }),
    },
    scheduleSlots: {
      'slot-a': build(scheduleSlotA),
      'slot-b': build(scheduleSlotB),
    },
    services: {
      'service-a': build({
        company_id: 'company-services',
        name: 'Sesión de consultoría',
        description: 'Asesoría express para tu negocio',
        price: 50000,
        image_url: 'https://placehold.co/600x400',
        estimated_duration_minutes: 60,
        status: 'ACTIVE',
      }),
    },
    serviceSchedules: {
      'svc-sched-a': build({
        service_id: 'service-a',
        schedule_slot_id: 'slot-a',
      }),
    },
    products: {
      'product-a': build({
        company_id: 'company-products',
        name: 'Producto destacado',
        description: 'Producto de ejemplo',
        price: 19990,
        image_url: 'https://placehold.co/400',
        status: 'ACTIVE',
        stock: 10,
      }),
    },
    accessRequests: {
      'req-1': build({
        full_name: 'Ana Demo',
        email: 'ana@demo.com',
        business_name: 'Ana SPA',
        whatsapp: '+56912345678',
        status: 'PENDING',
        plan: 'STANDARD',
        created_at: createdAt,
      }),
    },
    publicPageEvents: {
      'ev-1': build({
        company_id: 'company-services',
        event_type: 'PAGE_VIEW',
        created_at: createdAt,
      }),
      'ev-2': build({
        company_id: 'company-products',
        event_type: 'PRODUCT_ORDER_CLICK',
        created_at: createdAt,
      }),
    },
    appointmentRequests: {},
    productOrderRequests: {},
    companyAppearances: {},
  };

  return { collections };
};

const parseCollectionAndId = (name: string) => {
  const segments = name.split('/');
  const collection = segments[segments.length - 2];
  const id = segments[segments.length - 1];
  return { collection, id };
};

const handleRunQuery = async (route: Route, state: MockState) => {
  const body = route.request().postDataJSON?.() as any;
  const query = body?.structuredQuery;
  const collectionId = query?.from?.[0]?.collectionId;
  const coll = state.collections[collectionId] || {};

  let docs = Object.entries(coll);

  const filter = query?.where?.fieldFilter;
  if (filter?.field?.fieldPath) {
    const field = filter.field.fieldPath;
    const op = filter.op;
    docs = docs.filter(([, doc]) => {
      const value = doc.data[field];
      if (op === 'EQUAL') {
        return value === decodeValue(filter.value);
      }
      if (op === 'IN') {
        const list = decodeValue(filter.value) as any[];
        return list?.includes?.(value);
      }
      return true;
    });
  }

  const orderBy = query?.orderBy?.[0];
  if (orderBy?.field?.fieldPath) {
    const field = orderBy.field.fieldPath;
    const direction = orderBy.direction === 'DESCENDING' ? -1 : 1;
    docs.sort(([, a], [, b]) => {
      const va = (a.data as any)[field];
      const vb = (b.data as any)[field];
      if (va === vb) return 0;
      return va > vb ? direction : -direction;
    });
  }

  const limit = query?.limit?.value;
  if (limit) {
    docs = docs.slice(0, limit);
  }

  const response = docs.map(([id, doc]) => ({
    document: buildDocument(collectionId, id, doc),
    readTime: nowIso(),
  }));

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: response.map((r) => JSON.stringify(r)).join('\n'),
  });
};

const handleBatchGet = async (route: Route, state: MockState) => {
  const body = route.request().postDataJSON?.() as any;
  const docs = (body?.documents || []) as string[];
  const responses = docs.map((docNameStr: string) => {
    const { collection, id } = parseCollectionAndId(docNameStr);
    const doc = state.collections[collection]?.[id];
    if (!doc) {
      return { missing: docNameStr, readTime: nowIso() };
    }
    return {
      found: buildDocument(collection, id, doc),
      readTime: nowIso(),
    };
  });

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: responses.map((r) => JSON.stringify(r)).join('\n'),
  });
};

const handleCommit = async (route: Route, state: MockState) => {
  const body = route.request().postDataJSON?.() as any;
  const writes = body?.writes || [];

  writes.forEach((write: any) => {
    if (write.update) {
      const { collection, id } = parseCollectionAndId(write.update.name);
      const coll = ensureCollection(state, collection);
      const decoded = decodeFields(write.update.fields || {});
      const existing = coll[id];
      const merged = existing ? { ...existing.data, ...decoded } : decoded;
      const timestamp = nowIso();
      coll[id] = {
        data: merged,
        createTime: existing?.createTime || timestamp,
        updateTime: timestamp,
      };
    } else if (write.delete) {
      const { collection, id } = parseCollectionAndId(write.delete);
      delete ensureCollection(state, collection)[id];
    }
  });

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      writeResults: writes.map(() => ({ updateTime: nowIso() })),
      commitTime: nowIso(),
    }),
  });
};

const handleIdentity = async (route: Route, state: MockState) => {
  const url = new URL(route.request().url());
  const path = url.pathname;
  const body = route.request().method() === 'POST'
    ? (route.request().postDataJSON?.() as any)
    : null;

  if (path.includes('signInWithPassword')) {
    const user = Object.entries(state.collections.users).find(
      ([, doc]) => doc.data.email === body.email,
    );
    if (!user) {
      await route.fulfill({ status: 400, body: JSON.stringify({ error: 'USER_NOT_FOUND' }) });
      return;
    }
    const [userId, doc] = user;
    state.currentUser = { id: userId, email: doc.data.email };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        idToken: `token-${userId}`,
        refreshToken: `refresh-${userId}`,
        expiresIn: '3600',
        localId: userId,
        email: doc.data.email,
        registered: true,
      }),
    });
    return;
  }

  if (path.includes('accounts:update')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ idToken: 'updated-token', refreshToken: 'refresh', expiresIn: '3600' }),
    });
    return;
  }

  if (path.includes('token')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id_token: 'refreshed-token',
        refresh_token: 'refresh',
        expires_in: 3600,
      }),
    });
    return;
  }

  await route.fulfill({ status: 200, body: '{}' });
};

const handleStorage = async (route: Route) => {
  const url = new URL(route.request().url());
  if (route.request().method() === 'POST') {
    const name = url.searchParams.get('name') || 'upload';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name,
        bucket: 'mock-bucket',
        downloadTokens: 'token',
        mediaLink: `https://firebasestorage.googleapis.com/v0/b/mock-bucket/o/${encodeURIComponent(
          name,
        )}?alt=media&token=token`,
      }),
    });
    return;
  }

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      downloadTokens: 'token',
      mediaLink: route.request().url(),
    }),
  });
};

const handleFunctions = async (route: Route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true }),
  });
};

const handleFirestore = async (route: Route, state: MockState) => {
  const url = new URL(route.request().url());
  if (url.pathname.endsWith(':runQuery')) {
    await handleRunQuery(route, state);
    return;
  }
  if (url.pathname.endsWith(':batchGet')) {
    await handleBatchGet(route, state);
    return;
  }
  if (url.pathname.endsWith(':commit')) {
    await handleCommit(route, state);
    return;
  }

  await route.fulfill({ status: 200, body: '{}' });
};

export const setupFirebaseMocks = async (page: Page, overrides?: Partial<MockState>) => {
  const baseState = defaultState();
  const state: MockState = overrides
    ? {
        ...baseState,
        ...overrides,
        collections: { ...baseState.collections, ...(overrides.collections || {}) },
      }
    : baseState;

  await page.route('https://identitytoolkit.googleapis.com/**', (route) =>
    handleIdentity(route, state),
  );
  await page.route('https://securetoken.googleapis.com/**', (route) =>
    handleIdentity(route, state),
  );
  await page.route('https://firestore.googleapis.com/**', (route) =>
    handleFirestore(route, state),
  );
  await page.route('https://firebasestorage.googleapis.com/**', (route) =>
    handleStorage(route),
  );
  await page.route(/https:\/\/[a-zA-Z0-9-]+-us-central1-[a-zA-Z0-9-]+\.cloudfunctions\.net\/.*/, (route) =>
    handleFunctions(route),
  );
  await page.route(/https:\/\/[a-zA-Z0-9-]+-[a-zA-Z0-9-]+\.cloudfunctions\.net\/.*/, (route) =>
    handleFunctions(route),
  );

  return state;
};
