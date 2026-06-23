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
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Supplier } from './types';

const COLLECTION_NAME = 'suppliers';

export const suppliersService = {
  async getAll(): Promise<Supplier[]> {
    const q = query(collection(db, COLLECTION_NAME));
    const snapshot = await getDocs(q);
    const suppliers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Supplier[];

    suppliers.sort((a, b) => a.name.localeCompare(b.name));

    return suppliers;
  },

  async getById(id: string): Promise<Supplier | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Supplier;
  },

  async getActive(): Promise<Supplier[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    const suppliers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Supplier[];

    suppliers.sort((a, b) => a.name.localeCompare(b.name));

    return suppliers;
  },

  async create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = Timestamp.now();

      const supplierData: any = {
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        status: supplier.status,
        createdAt: now,
        updatedAt: now
      };

      if (supplier.contactPerson) {
        supplierData.contactPerson = supplier.contactPerson;
      }
      if (supplier.address) {
        supplierData.address = supplier.address;
      }
      if (supplier.city) {
        supplierData.city = supplier.city;
      }
      if (supplier.country) {
        supplierData.country = supplier.country;
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), supplierData);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating supplier:', error);

      if (error?.code === 'permission-denied') {
        throw new Error('Vous n\'avez pas la permission de créer un fournisseur. Seuls les Managers et Admins peuvent effectuer cette action.');
      }

      if (error?.code === 'unauthenticated') {
        throw new Error('Vous devez être connecté pour créer un fournisseur.');
      }

      const errorMessage = error?.message || 'Erreur lors de la création du fournisseur';
      throw new Error(errorMessage);
    }
  },

  async update(id: string, updates: Partial<Supplier>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async activate(id: string): Promise<void> {
    await this.update(id, { status: 'active' });
  },

  async deactivate(id: string): Promise<void> {
    await this.update(id, { status: 'inactive' });
  }
};
