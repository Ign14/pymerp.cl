import { auth } from '../config/firebase';
import { env } from '../config/env';

const getFunctionUrl = (functionName: string): string => {
  const { projectId, functionsRegion } = env.firebase;
  return `https://${functionsRegion}-${projectId}.cloudfunctions.net/${functionName}`;
};

export const resetUserPassword = async (email: string, password: string) => {
  const url = getFunctionUrl('setUserPassword');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al resetear contraseña');
  }

  const data = await response.json();
  if (data.success !== true && !data.created) {
    throw new Error(data.error || 'Error al resetear contraseña');
  }

  return data;
};

export const setCompanyClaim = async (uid: string, companyId: string) => {
  // HTTP function path
  const url = getFunctionUrl('setCompanyClaimHttp');
  const user = auth.currentUser;
  const idToken = user ? await user.getIdToken() : null;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ uid, companyId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al establecer claim de compañía');
  }

  const data = await response.json();
  if (data.success !== true) {
    throw new Error(data.error || 'Error al establecer claim de compañía');
  }

  return data;
};

export const deleteUserAccount = async (params: { email: string; companyId?: string; userId?: string }) => {
  const url = getFunctionUrl('deleteUserAccountHttp');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al eliminar cuenta');
  }

  const data = await response.json();
  if (data.success !== true) {
    throw new Error(data.error || 'Error al eliminar cuenta');
  }

  return data;
};
