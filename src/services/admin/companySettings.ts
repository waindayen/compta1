import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface CompanySettings {
  id?: string;
  managerId: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogoUrl?: string;
  taxRate: number;
  socialSecurityRate: number;
  insuranceRate: number;
  otherDeductionRate?: number;
  otherDeductionName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CompanySettingsService {
  private static settingsCollection = collection(db, 'company_settings');

  static async getSettings(managerId: string): Promise<CompanySettings | null> {
    const q = query(
      this.settingsCollection,
      where('managerId', '==', managerId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const docData = snapshot.docs[0];
    const data = docData.data();

    return {
      id: docData.id,
      managerId: data.managerId,
      companyName: data.companyName,
      companyAddress: data.companyAddress,
      companyPhone: data.companyPhone,
      companyEmail: data.companyEmail,
      companyLogoUrl: data.companyLogoUrl,
      taxRate: data.taxRate,
      socialSecurityRate: data.socialSecurityRate,
      insuranceRate: data.insuranceRate,
      otherDeductionRate: data.otherDeductionRate || 0,
      otherDeductionName: data.otherDeductionName || '',
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  }

  static async createOrUpdateSettings(
    managerId: string,
    settings: Omit<CompanySettings, 'id' | 'managerId' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const existingSettings = await this.getSettings(managerId);
    const now = Timestamp.now();

    const settingsData: any = {
      managerId,
      companyName: settings.companyName,
      companyAddress: settings.companyAddress,
      companyPhone: settings.companyPhone,
      companyEmail: settings.companyEmail,
      companyLogoUrl: settings.companyLogoUrl || '',
      taxRate: settings.taxRate,
      socialSecurityRate: settings.socialSecurityRate,
      insuranceRate: settings.insuranceRate,
      otherDeductionRate: settings.otherDeductionRate || 0,
      otherDeductionName: settings.otherDeductionName || '',
      updatedAt: now
    };

    if (existingSettings?.id) {
      const settingsRef = doc(db, 'company_settings', existingSettings.id);
      await updateDoc(settingsRef, settingsData);
    } else {
      settingsData.createdAt = now;
      await addDoc(this.settingsCollection, settingsData);
    }
  }

  static getDefaultSettings(managerId: string): CompanySettings {
    return {
      managerId,
      companyName: 'Votre Entreprise',
      companyAddress: '123 Rue Example, Ville',
      companyPhone: '+225 XX XX XX XX XX',
      companyEmail: 'contact@entreprise.com',
      companyLogoUrl: '',
      taxRate: 15.0,
      socialSecurityRate: 5.0,
      insuranceRate: 2.0,
      otherDeductionRate: 0,
      otherDeductionName: ''
    };
  }
}
