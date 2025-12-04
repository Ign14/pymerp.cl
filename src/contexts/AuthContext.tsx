import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getCurrentFirestoreUser } from '../services/auth';
import type { User } from '../types';
import { setCompanyClaim } from '../services/admin';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  firestoreUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  firestoreUser: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockUser = useMemo<User | null>(() => {
    if (env.app.environment !== 'e2e' && !env.e2eUser) return null;
    try {
      const key = typeof localStorage !== 'undefined' ? localStorage.getItem('e2e:user') || env.e2eUser : env.e2eUser;
      if (!key) return null;
      const mocks: Record<string, User> = {
        founder: {
          id: 'u-entrepreneur',
          email: 'founder@demo.com',
          role: 'ENTREPRENEUR' as User['role'],
          status: 'ACTIVE' as User['status'],
          company_id: 'company-services',
          created_at: new Date(),
        },
        seller: {
          id: 'u-product-owner',
          email: 'seller@demo.com',
          role: 'ENTREPRENEUR' as User['role'],
          status: 'ACTIVE' as User['status'],
          company_id: 'company-products',
          created_at: new Date(),
        },
        admin: {
          id: 'u-admin',
          email: 'admin@demo.com',
          role: 'SUPERADMIN' as User['role'],
          status: 'ACTIVE' as User['status'],
          created_at: new Date(),
        },
        force: {
          id: 'u-force-reset',
          email: 'force@demo.com',
          role: 'ENTREPRENEUR' as User['role'],
          status: 'FORCE_PASSWORD_CHANGE' as User['status'],
          company_id: 'company-services',
          created_at: new Date(),
        },
      };
      return mocks[key] || null;
    } catch (error) {
      logger.warn('E2E auth bypass falló:', error);
      return null;
    }
  }, []);

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(
    mockUser ? ({ uid: mockUser.id, email: mockUser.email } as FirebaseUser) : null
  );
  const [firestoreUser, setFirestoreUser] = useState<User | null>(mockUser);
  const [loading, setLoading] = useState(mockUser ? false : true);

  useEffect(() => {
    // E2E bypass: no suscribirse a Firebase si ya tenemos usuario mock
    if (mockUser) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setFirebaseUser(user);
        if (user) {
          try {
            const firestoreUserData = await getCurrentFirestoreUser();
            setFirestoreUser(firestoreUserData);
            // Garantizar claim company_id para Storage
            if (firestoreUserData?.company_id) {
              try {
                await setCompanyClaim(user.uid, firestoreUserData.company_id);
              } catch (claimErr) {
                logger.warn('No se pudo sincronizar claim de compañía:', claimErr);
              }
            }
          } catch (error) {
            logger.error('Error obteniendo usuario de Firestore:', error);
            setFirestoreUser(null);
          }
        } else {
          setFirestoreUser(null);
        }
      } catch (error) {
        logger.error('Error en AuthContext:', error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, firestoreUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
