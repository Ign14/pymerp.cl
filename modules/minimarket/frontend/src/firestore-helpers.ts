import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Obtiene el company_id de la empresa con el slug dado (misma lógica que dashboard).
 * Útil para cargar productos de ejemplo, ej. slug "demo23" → empresa de http://localhost:4173/demo23
 */
export async function getCompanyIdBySlug(slug: string): Promise<string | null> {
  const q = query(
    collection(db, 'companies'),
    where('slug', '==', slug),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].id;
}
