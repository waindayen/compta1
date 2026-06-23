import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ServerTimeService } from './serverTime';

export interface ContactConfig {
  whatsappNumber: string;
  businessHours: {
    start: string;
    end: string;
  };
  bannerText: {
    title: string;
    subtitle: string;
    description: string;
  };
  isEnabled: boolean;
}

const DEFAULT_CONFIG: ContactConfig = {
  whatsappNumber: '+33612345678',
  businessHours: {
    start: '09:00',
    end: '18:00'
  },
  bannerText: {
    title: 'Besoin d\'aide ?',
    subtitle: 'Notre équipe est là pour vous',
    description: 'Contactez-nous directement via WhatsApp pour une réponse rapide'
  },
  isEnabled: true
};

export class ContactService {
  private static CONFIG_DOC = 'contact_config';

  static async getConfig(): Promise<ContactConfig> {
    try {
      const docRef = doc(db, 'site_config', this.CONFIG_DOC);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          ...DEFAULT_CONFIG,
          ...docSnap.data()
        } as ContactConfig;
      }
      
      await this.saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error getting contact config:', error);
      return DEFAULT_CONFIG;
    }
  }

  static async saveConfig(config: ContactConfig): Promise<void> {
    try {
      const docRef = doc(db, 'site_config', this.CONFIG_DOC);
      await setDoc(docRef, {
        ...config,
        lastUpdated: ServerTimeService.getServerTimeISO()
      });
    } catch (error) {
      console.error('Error saving contact config:', error);
      throw new Error('Failed to save contact configuration');
    }
  }

  static isWithinBusinessHours(config: ContactConfig): boolean {
    if (!config.isEnabled) return false;
    
    const now = ServerTimeService.getServerTime();
    const [startHour, startMinute] = config.businessHours.start.split(':').map(Number);
    const [endHour, endMinute] = config.businessHours.end.split(':').map(Number);
    
    const start = new Date();
    start.setHours(startHour, startMinute, 0);
    
    const end = new Date();
    end.setHours(endHour, endMinute, 0);
    
    return now >= start && now <= end;
  }
}