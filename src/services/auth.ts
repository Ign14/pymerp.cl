import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUser, getUserByEmail, createUser, updateUser } from './firestore';
import { UserRole, UserStatus } from '../types';
import { logger } from '../utils/logger';

/**
 * Registra un nuevo usuario en Firebase Authentication y Firestore
 * 
 * @param email - Email del usuario a registrar
 * @param password - Contraseña del usuario (mínimo 6 caracteres requeridos por Firebase)
 * @param role - Rol del usuario (default: ENTREPRENEUR)
 * @returns Objeto con el usuario de Firebase y el ID en Firestore
 * @throws {FirebaseError} auth/email-already-in-use - El email ya está registrado
 * @throws {FirebaseError} auth/weak-password - La contraseña es muy débil
 * 
 * @example
 * ```typescript
 * const { firebaseUser, firestoreUserId } = await signUp(
 *   'user@example.com',
 *   'password123',
 *   UserRole.ENTREPRENEUR
 * );
 * ```
 */
export const signUp = async (email: string, password: string, role: UserRole = UserRole.ENTREPRENEUR) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firestoreUser = await createUser(
    {
      email,
      status: UserStatus.ACTIVE,
      role,
    },
    userCredential.user.uid
  );
  return { firebaseUser: userCredential.user, firestoreUserId: firestoreUser };
};

/**
 * Autentica un usuario con email y contraseña
 * 
 * @param email - Email del usuario
 * @param password - Contraseña del usuario
 * @returns Usuario autenticado de Firebase
 * @throws {FirebaseError} auth/user-not-found - Usuario no existe
 * @throws {FirebaseError} auth/wrong-password - Contraseña incorrecta
 * @throws {FirebaseError} auth/too-many-requests - Demasiados intentos fallidos
 * 
 * @example
 * ```typescript
 * const user = await signIn('user@example.com', 'password123');
 * console.log(user.uid);
 * ```
 */
export const signIn = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logOut = async () => {
  await signOut(auth);
};

export const changePassword = async (newPassword: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  await updatePassword(user, newPassword);
  
  // Update Firestore user status
  const firestoreUser = await getUserByEmail(user.email!);
  if (firestoreUser) {
    await updateUser(firestoreUser.id, { status: UserStatus.ACTIVE });
  }
};

/**
 * Obtiene los datos de Firestore del usuario actualmente autenticado
 * 
 * Intenta primero obtener el usuario por UID (preferido), si falla intenta por email.
 * Si el usuario existe con otro ID, crea una copia usando el UID para compatibilidad con reglas de seguridad.
 * 
 * @returns Usuario de Firestore o null si no está autenticado o no existe en Firestore
 * 
 * @example
 * ```typescript
 * const user = await getCurrentFirestoreUser();
 * if (user) {
 *   console.log(user.role); // 'ENTREPRENEUR' | 'SUPERADMIN'
 *   console.log(user.company_id); // ID de la empresa si tiene
 * }
 * ```
 */
export const getCurrentFirestoreUser = async (): Promise<any> => {
  const user = auth.currentUser;
  if (!user || !user.email) return null;

  // Prefer deterministic document IDs (uid) to align with security rules
  try {
    const userByUid = await getUser(user.uid);
    if (userByUid) {
      return userByUid;
    }
  } catch (error) {
    logger.warn('No se pudo leer usuario por UID, intentando por email:', error);
  }

  let userByEmail = null;
  try {
    userByEmail = await getUserByEmail(user.email);
  } catch (error) {
    logger.error('No se pudo leer usuario por email:', error);
  }

  // If the user document exists but uses a different ID, replicate it under uid
  if (userByEmail) {
    try {
      const data: any = {
        email: userByEmail.email,
        status: userByEmail.status,
        role: userByEmail.role,
      };
      if (userByEmail.company_id) {
        data.company_id = userByEmail.company_id;
      }
      await createUser(data, user.uid);
      return { ...userByEmail, id: user.uid };
    } catch (error) {
      logger.error('Error sincronizando usuario con UID:', error);
    }
  }

  return userByEmail;
};
