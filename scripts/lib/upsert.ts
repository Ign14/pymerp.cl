import type admin from 'firebase-admin';
import { Timestamp, FieldValue } from './firebaseAdmin';

type Firestore = admin.firestore.Firestore;

export type UpsertResult = {
  id: string;
  created: boolean;
};

export async function upsertBySlugAndCategory(
  db: Firestore,
  collectionName: string,
  slug: string,
  categoryId: string,
  data: Record<string, any>
): Promise<UpsertResult> {
  const collection = db.collection(collectionName);
  const existingSnap = await collection.where('slug', '==', slug).where('category_id', '==', categoryId).limit(1).get();
  const targetRef = existingSnap.empty ? collection.doc(slug) : existingSnap.docs[0].ref;
  const existingData = existingSnap.empty ? null : existingSnap.docs[0].data();

  await targetRef.set(
    {
      ...data,
      slug,
      category_id: categoryId,
      created_at: existingData?.created_at || Timestamp.now(),
      updated_at: Timestamp.now(),
    },
    { merge: true }
  );

  return { id: targetRef.id, created: existingSnap.empty };
}

export async function batchSet(
  db: Firestore,
  collectionName: string,
  docs: Array<{ id: string; data: Record<string, any> }>
) {
  const BATCH_SIZE = 450;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const slice = docs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    slice.forEach((docItem) => {
      const ref = db.collection(collectionName).doc(docItem.id);
      batch.set(ref, docItem.data, { merge: true });
    });
    await batch.commit();
  }
}

export async function deleteDemoDocs(db: Firestore, collectionName: string, companyId: string) {
  const collection = db.collection(collectionName);
  const snapshot = await collection
    .where('company_id', '==', companyId)
    .where('created_by_demo_seed', '==', true)
    .get();

  if (snapshot.empty) return;

  const BATCH_SIZE = 450;
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    docs.slice(i, i + BATCH_SIZE).forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
  }
}

export function withAudit<T extends Record<string, any>>(data: T): T {
  return {
    ...data,
    created_by_demo_seed: true,
    updated_at: Timestamp.now(),
    created_at: data.created_at || Timestamp.now(),
  };
}

export function mergeTimestamps<T extends Record<string, any>>(data: T, existing?: Record<string, any>): T {
  return {
    ...data,
    created_at: existing?.created_at || data.created_at || Timestamp.now(),
    updated_at: Timestamp.now(),
  };
}
