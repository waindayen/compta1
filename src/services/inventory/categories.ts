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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryData {
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: any;
  updated_at: any;
}

const COLLECTION_NAME = 'product_categories';

export async function getCategories(activeOnly: boolean = false): Promise<ProductCategory[]> {
  try {
    let q;

    if (activeOnly) {
      q = query(collection(db, COLLECTION_NAME), where('is_active', '==', true));
    } else {
      q = query(collection(db, COLLECTION_NAME));
    }

    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        is_active: data.is_active,
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });

    categories.sort((a, b) => a.name.localeCompare(b.name));

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Erreur lors du chargement des catégories');
  }
}

export async function getCategoryById(id: string): Promise<ProductCategory | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      is_active: data.is_active,
      created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    throw new Error('Erreur lors du chargement de la catégorie');
  }
}

export async function createCategory(data: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
  try {
    const categoryData: any = {
      name: data.name,
      color: data.color,
      icon: data.icon,
      is_active: data.is_active,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    if (data.description !== undefined && data.description !== null) {
      categoryData.description = data.description;
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), categoryData);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating category:', error);

    if (error?.code === 'permission-denied') {
      throw new Error('Vous n\'avez pas la permission de créer une catégorie. Seuls les Managers et Admins peuvent effectuer cette action.');
    }

    if (error?.code === 'unauthenticated') {
      throw new Error('Vous devez être connecté pour créer une catégorie.');
    }

    const errorMessage = error?.message || 'Erreur lors de la création de la catégorie';
    throw new Error(errorMessage);
  }
}

export async function updateCategory(id: string, data: Partial<Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = {
      ...data,
      updated_at: serverTimestamp()
    };

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating category:', error);
    throw new Error('Erreur lors de la mise à jour de la catégorie');
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw new Error('Erreur lors de la suppression de la catégorie');
  }
}
