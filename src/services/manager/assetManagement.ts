import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';

export interface Asset {
  id?: string;
  managerId: string;
  name: string;
  category: 'furniture' | 'electronics' | 'vehicles' | 'equipment' | 'software' | 'other';
  purchaseDate: Date;
  purchasePrice: number;
  currentValue: number;
  status: 'good' | 'maintenance' | 'repair' | 'outofservice';
  location: string;
  serialNumber?: string;
  supplier?: string;
  warrantyExpiry?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const assetCategories = [
  { value: 'furniture', label: 'Mobilier' },
  { value: 'electronics', label: 'Électronique' },
  { value: 'vehicles', label: 'Véhicules' },
  { value: 'equipment', label: 'Équipements' },
  { value: 'software', label: 'Logiciels' },
  { value: 'other', label: 'Autres' }
];

export const assetStatuses = [
  { value: 'good', label: 'Bon état', color: 'green' },
  { value: 'maintenance', label: 'En maintenance', color: 'yellow' },
  { value: 'repair', label: 'En réparation', color: 'orange' },
  { value: 'outofservice', label: 'Hors service', color: 'red' }
];

export class AssetManagementService {
  private static assetsCollection = collection(db, 'assets');

  static async createAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const assetData = {
      ...asset,
      purchaseDate: Timestamp.fromDate(asset.purchaseDate),
      warrantyExpiry: asset.warrantyExpiry ? Timestamp.fromDate(asset.warrantyExpiry) : null,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(this.assetsCollection, assetData);
    return docRef.id;
  }

  static async updateAsset(id: string, updates: Partial<Omit<Asset, 'id' | 'createdAt' | 'managerId'>>): Promise<void> {
    const assetRef = doc(db, 'assets', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.purchaseDate) {
      updateData.purchaseDate = Timestamp.fromDate(updates.purchaseDate);
    }

    if (updates.warrantyExpiry) {
      updateData.warrantyExpiry = Timestamp.fromDate(updates.warrantyExpiry);
    }

    await updateDoc(assetRef, updateData);
  }

  static async deleteAsset(id: string): Promise<void> {
    const assetRef = doc(db, 'assets', id);
    await deleteDoc(assetRef);
  }

  static async getAssetsByManager(managerId: string): Promise<Asset[]> {
    const q = query(
      this.assetsCollection,
      where('managerId', '==', managerId)
    );

    const snapshot = await getDocs(q);
    const assets = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        name: data.name,
        category: data.category,
        purchaseDate: data.purchaseDate.toDate(),
        purchasePrice: data.purchasePrice,
        currentValue: data.currentValue,
        status: data.status,
        location: data.location,
        serialNumber: data.serialNumber,
        supplier: data.supplier,
        warrantyExpiry: data.warrantyExpiry?.toDate(),
        notes: data.notes,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });

    assets.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime());

    return assets;
  }

  static async getAssetsByCategory(managerId: string, category: string): Promise<Asset[]> {
    const q = query(
      this.assetsCollection,
      where('managerId', '==', managerId),
      where('category', '==', category)
    );

    const snapshot = await getDocs(q);
    const assets = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        name: data.name,
        category: data.category,
        purchaseDate: data.purchaseDate.toDate(),
        purchasePrice: data.purchasePrice,
        currentValue: data.currentValue,
        status: data.status,
        location: data.location,
        serialNumber: data.serialNumber,
        supplier: data.supplier,
        warrantyExpiry: data.warrantyExpiry?.toDate(),
        notes: data.notes,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });

    assets.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime());

    return assets;
  }

  static async getAssetsSummary(managerId: string): Promise<{
    totalAssets: number;
    totalValue: number;
    totalPurchaseValue: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const assets = await this.getAssetsByManager(managerId);

    const totalPurchaseValue = assets.reduce((sum, asset) => sum + asset.purchasePrice, 0);
    const totalValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);

    const byCategory = assets.reduce((acc, asset) => {
      if (!acc[asset.category]) {
        acc[asset.category] = 0;
      }
      acc[asset.category] += 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = assets.reduce((acc, asset) => {
      if (!acc[asset.status]) {
        acc[asset.status] = 0;
      }
      acc[asset.status] += 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAssets: assets.length,
      totalValue,
      totalPurchaseValue,
      byCategory,
      byStatus
    };
  }

  static calculateDepreciation(purchasePrice: number, purchaseDate: Date, usefulLifeYears: number = 5): number {
    const now = new Date();
    const ageInYears = (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    if (ageInYears >= usefulLifeYears) {
      return 0;
    }

    const annualDepreciation = purchasePrice / usefulLifeYears;
    const totalDepreciation = annualDepreciation * ageInYears;
    const currentValue = purchasePrice - totalDepreciation;

    return Math.max(currentValue, 0);
  }
}
