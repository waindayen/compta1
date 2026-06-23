import { collection, doc, getDoc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface CommissionConfig {
  id?: string;
  betType: string;
  percentage: number;
  updatedAt: string;
}

// Types de commissions disponibles
export type CommissionType = 
  | 'simple'           // Paris simples
  | 'combine'          // Paris combinés
  | 'lotto_submission' // Soumission de ticket lotto
  | 'lotto_payment'    // Paiement de gains lotto
  | 'staff_transfer'   // Transfert entre staffs
  | 'agent_transfer';  // Transfert entre agent et staff

const DEFAULT_COMMISSIONS: Array<Omit<CommissionConfig, 'id'>> = [
  {
    betType: 'simple',
    percentage: 5,
    updatedAt: new Date().toISOString()
  },
  {
    betType: 'combine',
    percentage: 7,
    updatedAt: new Date().toISOString()
  },
  {
    betType: 'lotto_submission',
    percentage: 2,
    updatedAt: new Date().toISOString()
  },
  {
    betType: 'lotto_payment',
    percentage: 1,
    updatedAt: new Date().toISOString()
  },
  {
    betType: 'staff_transfer',
    percentage: 2,
    updatedAt: new Date().toISOString()
  },
  {
    betType: 'agent_transfer',
    percentage: 1.5,
    updatedAt: new Date().toISOString()
  }
];

export class CommissionService {
  private static COLLECTION = 'commission_config';

  static async initializeDefaultCommissions(): Promise<void> {
    try {
      const batch = writeBatch(db);
      let hasChanges = false;

      for (const commission of DEFAULT_COMMISSIONS) {
        const docRef = doc(db, this.COLLECTION, commission.betType);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          console.log(`Initializing commission for ${commission.betType}`);
          batch.set(docRef, commission);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await batch.commit();
        console.log('Default commissions initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing default commissions:', error);
    }
  }

  static async getCommissions(): Promise<CommissionConfig[]> {
    try {
      // Initialiser les commissions par défaut si nécessaire
      await this.initializeDefaultCommissions();
      
      const querySnapshot = await getDocs(collection(db, this.COLLECTION));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommissionConfig[];
    } catch (error) {
      console.error('Error getting commissions:', error);
      return DEFAULT_COMMISSIONS.map(commission => ({
        id: commission.betType,
        ...commission
      }));
    }
  }

  static async getCommission(betType: CommissionType): Promise<CommissionConfig | null> {
    try {
      const docRef = doc(db, this.COLLECTION, betType);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as CommissionConfig;
      }

      // Si la commission n'existe pas, créer avec la valeur par défaut
      const defaultCommission = DEFAULT_COMMISSIONS.find(c => c.betType === betType);
      if (defaultCommission) {
        await setDoc(docRef, defaultCommission);
        return {
          id: betType,
          ...defaultCommission
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting commission:', error);
      const defaultCommission = DEFAULT_COMMISSIONS.find(c => c.betType === betType);
      return defaultCommission ? {
        id: betType,
        ...defaultCommission
      } : null;
    }
  }

  static async updateCommission(betType: CommissionType, percentage: number): Promise<void> {
    try {
      if (percentage < 0 || percentage > 100) {
        throw new Error('Le pourcentage doit être entre 0 et 100');
      }

      const docRef = doc(db, this.COLLECTION, betType);
      await setDoc(docRef, {
        betType,
        percentage,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating commission:', error);
      throw new Error('Erreur lors de la mise à jour de la commission');
    }
  }

  static async getCommissionRate(betType: CommissionType): Promise<number> {
    try {
      const commission = await this.getCommission(betType);
      if (!commission) {
        const defaultCommission = DEFAULT_COMMISSIONS.find(c => c.betType === betType);
        return defaultCommission ? defaultCommission.percentage / 100 : 0;
      }
      return commission.percentage / 100;
    } catch (error) {
      console.error('Error getting commission rate:', error);
      const defaultCommission = DEFAULT_COMMISSIONS.find(c => c.betType === betType);
      return defaultCommission ? defaultCommission.percentage / 100 : 0;
    }
  }
}