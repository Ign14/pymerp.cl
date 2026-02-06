/**
 * Auth para app Minimarket: hash compatible con dashboard (mismo salt)
 * y login contra Firestore minimarket_access_accounts.
 */
import {
  collection,
  getDocs,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';

const SALT = 'pymerp_minimarket_access_v1';
const SESSION_KEY = 'pymerp_minimarket_session';
const TOKEN_KEY = 'pymerp_minimarket_token';
const WELCOME_DONE_KEY_PREFIX = 'pymerp_minimarket_welcome_done_';

export type MinimarketSession = {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  fullName: string;
  source: 'firestore' | 'api';
};

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(SALT + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getSession(): MinimarketSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MinimarketSession;
  } catch {
    return null;
  }
}

export function setSession(session: MinimarketSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Login contra Firestore: busca cuenta por email (ACTIVE) y verifica password. */
export async function loginWithFirestore(
  email: string,
  password: string
): Promise<MinimarketSession | null> {
  const q = query(
    collection(db, 'minimarket_access_accounts'),
    where('email', '==', email.trim().toLowerCase()),
    where('status', '==', 'ACTIVE'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  const d = docSnap.data();
  const storedHash = d.password_hash as string | undefined;
  if (!storedHash) return null;
  const inputHash = await hashPassword(password);
  if (inputHash !== storedHash) return null;
  const session: MinimarketSession = {
    userId: docSnap.id,
    companyId: (d.company_id as string) ?? '',
    email: (d.email as string) ?? email,
    role: (d.role as string) ?? 'STAFF',
    fullName: (d.email as string) ?? email,
    source: 'firestore',
  };
  setSession(session);
  return session;
}

export function getWelcomeDoneKey(userId: string): string {
  return WELCOME_DONE_KEY_PREFIX + userId;
}

export function isWelcomeDone(userId: string): boolean {
  return localStorage.getItem(getWelcomeDoneKey(userId)) === 'true';
}

export function setWelcomeDone(userId: string): void {
  localStorage.setItem(getWelcomeDoneKey(userId), 'true');
}
