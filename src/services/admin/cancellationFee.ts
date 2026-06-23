import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ServerTimeService } from '../serverTime';

export interface CancellationFeeConfig {
  percentage: number;
  enabled: boolean;
  updatedAt: string;
  updatedBy?: string;
}

const DEFAULT_CONFIG: CancellationFeeConfig = {
  percentage: 5, // 5% par défaut
  enabled: false, // Désactivé par défaut
  updatedAt: ServerTimeService.getServerTimeISO()
};

export class CancellationFeeService {
  private static CONFIG_DOC = 'cancellation_fee_config';

  static async getConfig(): Promise<CancellationFeeConfig> {
    try {
      const docRef = doc(db, 'site_config', this.CONFIG_DOC);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          ...DEFAULT_CONFIG,
          ...docSnap.data()
        } as CancellationFeeConfig;
      }
      
      // Si aucune configuration n'existe, créer la configuration par défaut
      await this.saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error getting cancellation fee config:', error);
      return DEFAULT_CONFIG;
    }
  }

  static async saveConfig(config: CancellationFeeConfig): Promise<void> {
    try {
      const docRef = doc(db, 'site_config', this.CONFIG_DOC);
      await setDoc(docRef, {
        ...config,
        updatedAt: ServerTimeService.getServerTimeISO()
      });
    } catch (error) {
      console.error('Error saving cancellation fee config:', error);
      throw new Error('Failed to save cancellation fee configuration');
    }
  }
}