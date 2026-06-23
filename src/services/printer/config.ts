import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ServerTimeService } from '../serverTime';

export interface PrinterConfig {
  enabled: boolean;
  deviceName: string;
  deviceAddress: string;
  paperWidth: number; // en mm (58 ou 80)
  characterPerLine: number;
  protocol?: 'escpos' | 'tspl'; // Protocole d'impression
  lastConnected?: string;
  lastSyncedAt?: string; // Timestamp de la dernière synchronisation
}

const DEFAULT_CONFIG: PrinterConfig = {
  enabled: false,
  deviceName: '',
  deviceAddress: '',
  paperWidth: 58,
  characterPerLine: 32,
  protocol: 'escpos'
};

export class PrinterConfigService {
  private static CONFIG_DOC = 'printer_config';

  static async getConfig(userId: string): Promise<PrinterConfig> {
    try {
      console.log('Récupération de la configuration d\'imprimante pour:', userId);
      const docRef = doc(db, 'users', userId, 'settings', this.CONFIG_DOC);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('Configuration trouvée:', docSnap.data());
        return {
          ...DEFAULT_CONFIG,
          ...docSnap.data(),
          lastSyncedAt: ServerTimeService.getServerTimeISO() // Mettre à jour le timestamp de synchronisation
        } as PrinterConfig;
      }
      
      console.log('Aucune configuration trouvée, utilisation des valeurs par défaut');
      await this.saveConfig(userId, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error getting printer config:', error);
      return DEFAULT_CONFIG;
    }
  }

  static async saveConfig(userId: string, config: PrinterConfig): Promise<void> {
    try {
      console.log('Sauvegarde de la configuration d\'imprimante pour:', userId, config);
      const docRef = doc(db, 'users', userId, 'settings', this.CONFIG_DOC);
      await setDoc(docRef, {
        ...config,
        lastUpdated: ServerTimeService.getServerTimeISO(),
        lastSyncedAt: ServerTimeService.getServerTimeISO() // Mettre à jour le timestamp de synchronisation
      });
      console.log('Configuration sauvegardée avec succès');
    } catch (error) {
      console.error('Error saving printer config:', error);
      throw new Error('Failed to save printer configuration');
    }
  }

  static async enablePrinter(userId: string, enable: boolean): Promise<void> {
    try {
      console.log(`${enable ? 'Activation' : 'Désactivation'} de l'imprimante pour:`, userId);
      const config = await this.getConfig(userId);
      await this.saveConfig(userId, {
        ...config,
        enabled: enable
      });
      console.log('Statut de l\'imprimante mis à jour avec succès');
    } catch (error) {
      console.error('Error updating printer status:', error);
      throw new Error('Failed to update printer status');
    }
  }

  static async deletePrinterConfig(userId: string): Promise<void> {
    try {
      console.log('Suppression de la configuration d\'imprimante pour:', userId);
      const config = await this.getConfig(userId);
      await this.saveConfig(userId, {
        ...DEFAULT_CONFIG,
        enabled: config.enabled // Conserver l'état d'activation
      });
      console.log('Configuration de l\'imprimante réinitialisée avec succès');
    } catch (error) {
      console.error('Error deleting printer config:', error);
      throw new Error('Failed to delete printer configuration');
    }
  }
}