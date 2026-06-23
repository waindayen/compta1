import { collection, doc, getDoc, setDoc, getDocs, query, where, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface PaymentLimitConfig {
  id?: string;
  agentId: string;
  agentEmail?: string;
  maxPaymentAmount: number;
  currency: string;
  updatedAt: string;
  updatedBy?: string;
  isGlobalLimit?: boolean;
}

export class PaymentLimitService {
  private static COLLECTION = 'payment_limits';
  private static GLOBAL_LIMIT_ID = 'global_limit';

  static async getGlobalLimit(): Promise<PaymentLimitConfig | null> {
    try {
      const docRef = doc(db, this.COLLECTION, this.GLOBAL_LIMIT_ID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as PaymentLimitConfig;
      }
      
      // Si aucune limite globale n'existe, créer une par défaut
      const defaultLimit: PaymentLimitConfig = {
        agentId: 'global',
        maxPaymentAmount: 100000, // 100,000 par défaut
        currency: 'XAF',
        updatedAt: new Date().toISOString(),
        isGlobalLimit: true
      };
      
      await setDoc(docRef, defaultLimit);
      return {
        id: this.GLOBAL_LIMIT_ID,
        ...defaultLimit
      };
    } catch (error) {
      console.error('Error getting global payment limit:', error);
      return null;
    }
  }

  static async getAgentLimit(agentId: string): Promise<PaymentLimitConfig | null> {
    try {
      // Vérifier d'abord si l'agent a une limite spécifique
      const agentLimitsRef = collection(db, this.COLLECTION);
      const q = query(agentLimitsRef, where('agentId', '==', agentId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as PaymentLimitConfig;
      }
      
      // Si aucune limite spécifique n'existe, retourner la limite globale
      return this.getGlobalLimit();
    } catch (error) {
      console.error('Error getting agent payment limit:', error);
      return null;
    }
  }

  static async setGlobalLimit(amount: number, currency: string = 'XAF', updatedBy?: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, this.GLOBAL_LIMIT_ID);
      await setDoc(docRef, {
        agentId: 'global',
        maxPaymentAmount: amount,
        currency,
        updatedAt: new Date().toISOString(),
        updatedBy,
        isGlobalLimit: true
      });
    } catch (error) {
      console.error('Error setting global payment limit:', error);
      throw new Error('Failed to set global payment limit');
    }
  }

  static async setAgentLimit(agentId: string, amount: number, agentEmail?: string, currency: string = 'XAF', updatedBy?: string): Promise<void> {
    try {
      // Vérifier si une limite existe déjà pour cet agent
      const agentLimitsRef = collection(db, this.COLLECTION);
      const q = query(agentLimitsRef, where('agentId', '==', agentId));
      const querySnapshot = await getDocs(q);
      
      const limitData: Omit<PaymentLimitConfig, 'id'> = {
        agentId,
        agentEmail,
        maxPaymentAmount: amount,
        currency,
        updatedAt: new Date().toISOString(),
        updatedBy,
        isGlobalLimit: false
      };
      
      if (!querySnapshot.empty) {
        // Mettre à jour la limite existante
        const docId = querySnapshot.docs[0].id;
        await setDoc(doc(db, this.COLLECTION, docId), limitData, { merge: true });
      } else {
        // Créer une nouvelle limite
        await addDoc(collection(db, this.COLLECTION), limitData);
      }
    } catch (error) {
      console.error('Error setting agent payment limit:', error);
      throw new Error('Failed to set agent payment limit');
    }
  }

  static async getAllAgentLimits(): Promise<PaymentLimitConfig[]> {
    try {
      const limitsRef = collection(db, this.COLLECTION);
      const q = query(limitsRef, where('isGlobalLimit', '==', false));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PaymentLimitConfig[];
    } catch (error) {
      console.error('Error getting all agent payment limits:', error);
      return [];
    }
  }

  static async deleteAgentLimit(limitId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, limitId));
    } catch (error) {
      console.error('Error deleting agent payment limit:', error);
      throw new Error('Failed to delete agent payment limit');
    }
  }

  static async checkPaymentLimit(agentId: string, amount: number): Promise<boolean> {
    try {
      const limit = await this.getAgentLimit(agentId);
      if (!limit) {
        // Si aucune limite n'est trouvée, utiliser la limite globale
        const globalLimit = await this.getGlobalLimit();
        if (!globalLimit) {
          return true; // Aucune limite définie, autoriser le paiement
        }
        return amount <= globalLimit.maxPaymentAmount;
      }
      return amount <= limit.maxPaymentAmount;
    } catch (error) {
      console.error('Error checking payment limit:', error);
      return false; // En cas d'erreur, refuser le paiement par sécurité
    }
  }
}