import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { errorHandler } from './errorHandler';

export interface DataDeletionResponse {
  status: 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  scheduledFor?: string;
  requestId?: string;
}

export const requestDataDeletion = async (): Promise<DataDeletionResponse> => {
  try {
    const callable = httpsCallable(functions, 'requestDataDeletion');
    const result = await callable({});
    return result.data as DataDeletionResponse;
  } catch (error: any) {
    errorHandler.handleFirestoreError(error, { op: 'requestDataDeletion' });
    throw error;
  }
};
