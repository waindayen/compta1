import { collection, query, where, orderBy, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ServerTimeService } from '../serverTime';

export interface CreditHistoryEntry {
  id?: string;
  adminId: string;
  adminEmail?: string;
  recipientId: string;
  recipientEmail?: string;
  recipientType: 'agent' | 'staff';
  amount: number;
  currency: string;
  createdAt: string;
  notes?: string;
}

export class CreditHistoryService {
  private static COLLECTION = 'wallet_credit_history';

  static async addCreditHistory(entry: Omit<CreditHistoryEntry, 'id' | 'createdAt'>): Promise<string> {
    try {
      const now = ServerTimeService.getServerTimeISO();
      const docRef = await addDoc(collection(db, this.COLLECTION), {
        ...entry,
        createdAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding credit history:', error);
      throw error instanceof Error ? error : new Error('Failed to add credit history');
    }
  }

  static async getCreditHistory(filters?: {
    adminId?: string;
    recipientId?: string;
    recipientType?: 'agent' | 'staff';
    startDate?: string;
    endDate?: string;
  }): Promise<CreditHistoryEntry[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION),
        orderBy('createdAt', 'desc')
      );

      // Apply filters if provided
      if (filters) {
        if (filters.adminId) {
          q = query(q, where('adminId', '==', filters.adminId));
        }
        if (filters.recipientId) {
          q = query(q, where('recipientId', '==', filters.recipientId));
        }
        if (filters.recipientType) {
          q = query(q, where('recipientType', '==', filters.recipientType));
        }
        if (filters.startDate) {
          q = query(q, where('createdAt', '>=', filters.startDate));
        }
        if (filters.endDate) {
          q = query(q, where('createdAt', '<=', filters.endDate));
        }
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CreditHistoryEntry[];
    } catch (error) {
      console.error('Error getting credit history:', error);
      throw error instanceof Error ? error : new Error('Failed to get credit history');
    }
  }
}