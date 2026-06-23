import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from './types';

const COLLECTION_NAME = 'products';

export const productsService = {
  async getAll(): Promise<Product[]> {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        sku: data.sku || '',
        category: data.category || '',
        unit: data.unit || '',
        minStock: data.minStock || 0,
        maxStock: data.maxStock || 0,
        currentStock: data.currentStock || 0,
        unitPrice: data.unitPrice || 0,
        supplierId: data.supplierId || '',
        description: data.description,
        barcode: data.barcode,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Product;
    });

    products.sort((a, b) => a.name.localeCompare(b.name));

    return products;
  },

  async getById(id: string): Promise<Product | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || '',
      sku: data.sku || '',
      category: data.category || '',
      unit: data.unit || '',
      minStock: data.minStock || 0,
      maxStock: data.maxStock || 0,
      currentStock: data.currentStock || 0,
      unitPrice: data.unitPrice || 0,
      supplierId: data.supplierId || '',
      description: data.description,
      barcode: data.barcode,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Product;
  },

  async getBySku(sku: string): Promise<Product | null> {
    const q = query(collection(db, COLLECTION_NAME), where('sku', '==', sku));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      sku: data.sku || '',
      category: data.category || '',
      unit: data.unit || '',
      minStock: data.minStock || 0,
      maxStock: data.maxStock || 0,
      currentStock: data.currentStock || 0,
      unitPrice: data.unitPrice || 0,
      supplierId: data.supplierId || '',
      description: data.description,
      barcode: data.barcode,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Product;
  },

  async getByCategory(category: string): Promise<Product[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('category', '==', category)
    );
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        sku: data.sku || '',
        category: data.category || '',
        unit: data.unit || '',
        minStock: data.minStock || 0,
        maxStock: data.maxStock || 0,
        currentStock: data.currentStock || 0,
        unitPrice: data.unitPrice || 0,
        supplierId: data.supplierId || '',
        description: data.description,
        barcode: data.barcode,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Product;
    });

    products.sort((a, b) => a.name.localeCompare(b.name));

    return products;
  },

  async getLowStock(): Promise<Product[]> {
    const allProducts = await this.getAll();
    return allProducts.filter(p => p.currentStock <= p.minStock);
  },

  async getOutOfStock(): Promise<Product[]> {
    const allProducts = await this.getAll();
    return allProducts.filter(p => p.currentStock === 0);
  },

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();

      const productData: any = {
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        minStock: product.minStock,
        maxStock: product.maxStock,
        currentStock: product.currentStock,
        unitPrice: product.unitPrice,
        supplierId: product.supplierId,
        createdAt: now,
        updatedAt: now
      };

      if (product.description) {
        productData.description = product.description;
      }
      if (product.barcode) {
        productData.barcode = product.barcode;
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), productData);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating product:', error);

      if (error?.code === 'permission-denied') {
        throw new Error('Vous n\'avez pas la permission de créer un produit. Seuls les Managers et Admins peuvent effectuer cette action.');
      }

      if (error?.code === 'unauthenticated') {
        throw new Error('Vous devez être connecté pour créer un produit.');
      }

      const errorMessage = error?.message || 'Erreur lors de la création du produit';
      throw new Error(errorMessage);
    }
  },

  async update(id: string, updates: Partial<Product>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  },

  async updateStock(id: string, quantity: number): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Product not found');
    }

    const currentStock = docSnap.data().currentStock || 0;
    await updateDoc(docRef, {
      currentStock: currentStock + quantity,
      updatedAt: Timestamp.now()
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async getTotalValue(): Promise<number> {
    const products = await this.getAll();
    return products.reduce((total, product) => {
      return total + (product.currentStock * product.unitPrice);
    }, 0);
  },

  async getCategories(): Promise<string[]> {
    const products = await this.getAll();
    const categories = new Set(products.map(p => p.category));
    return Array.from(categories).sort();
  }
};
