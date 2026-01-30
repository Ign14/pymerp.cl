import { describe, expect, it, vi, beforeEach } from 'vitest';
import { UserRole, UserStatus, type User } from '../../types';

const signOutMock = vi.fn();
const getUser = vi.fn();
const getUserByEmail = vi.fn();
const createUser = vi.fn();
const updateUser = vi.fn();

vi.mock('../../config/firebase', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
  GoogleAuthProvider: vi.fn(() => ({
    setCustomParameters: vi.fn(),
  })),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock('../firestore', () => ({
  getUser: (...args: unknown[]) => getUser(...args),
  getUserByEmail: (...args: unknown[]) => getUserByEmail(...args),
  createUser: (...args: unknown[]) => createUser(...args),
  updateUser: (...args: unknown[]) => updateUser(...args),
}));

import { ensureFirestoreUserFromAuth, AuthFlowError } from '../auth';

const baseUser: any = {
  uid: 'uid-123',
  email: 'demo@example.com',
  displayName: 'Demo User',
  photoURL: 'https://example.com/avatar.png',
};

describe('ensureFirestoreUserFromAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna usuario provisionado y actualiza proveedores cuando existe', async () => {
    const firestoreUser: User = {
      id: 'uid-123',
      email: 'demo@example.com',
      status: UserStatus.ACTIVE,
      role: UserRole.ENTREPRENEUR,
      created_at: new Date(),
      auth_providers: ['password'],
    };
    getUser.mockResolvedValueOnce(firestoreUser);

    const result = await ensureFirestoreUserFromAuth(baseUser);

    expect(result.id).toBe('uid-123');
    expect(updateUser).toHaveBeenCalledWith(
      'uid-123',
      expect.objectContaining({
        auth_providers: expect.arrayContaining(['google', 'password']),
      })
    );
  });

  it('lanza USER_NOT_PROVISIONED y hace signOut cuando no existe doc y auto provisión está deshabilitada', async () => {
    getUser.mockResolvedValueOnce(null);
    getUserByEmail.mockResolvedValueOnce(null);

    await expect(ensureFirestoreUserFromAuth(baseUser, { allowAutoProvision: false })).rejects.toMatchObject({
      code: 'USER_NOT_PROVISIONED',
    });
    expect(signOutMock).toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('auto-provisiona usuario cuando se habilita el flag', async () => {
    getUser.mockResolvedValueOnce(null);
    getUserByEmail.mockResolvedValueOnce(null);
    createUser.mockResolvedValueOnce('uid-123');

    const result = await ensureFirestoreUserFromAuth(baseUser, { allowAutoProvision: true });

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'demo@example.com',
        role: UserRole.ENTREPRENEUR,
        status: UserStatus.ACTIVE,
      }),
      'uid-123'
    );
    expect(result.id).toBe('uid-123');
  });

  it('mapea errores de popup a AuthFlowError', async () => {
    getUser.mockResolvedValueOnce({
      id: 'uid-123',
      email: 'demo@example.com',
      status: UserStatus.ACTIVE,
      role: UserRole.ENTREPRENEUR,
      created_at: new Date(),
    });
    const popupError = new Error('blocked') as any;
    popupError.code = 'auth/popup-blocked';
    updateUser.mockRejectedValueOnce(popupError);

    await expect(ensureFirestoreUserFromAuth(baseUser).catch((err) => { throw err; })).rejects.toBeInstanceOf(AuthFlowError);
  });
});
