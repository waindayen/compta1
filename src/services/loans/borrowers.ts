import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Borrower } from './types';

const COLLECTION = 'borrowers';

export const createBorrower = async (
  data: Omit<Borrower, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string
): Promise<string> => {
  try {
    console.log('Creating borrower with data:', data);
    console.log('User ID:', userId);

    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('Borrower created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating borrower:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw new Error(`Échec de création de l'emprunteur: ${error.message}`);
  }
};

export const updateBorrower = async (
  borrowerId: string,
  data: Partial<Borrower>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, borrowerId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating borrower:', error);
    throw new Error('Échec de mise à jour de l\'emprunteur');
  }
};

export const deleteBorrower = async (borrowerId: string): Promise<void> => {
  try {
    const loansQuery = query(
      collection(db, 'loans'),
      where('borrowerId', '==', borrowerId),
      where('status', 'in', ['active', 'pending', 'approved'])
    );
    const loansSnapshot = await getDocs(loansQuery);

    if (!loansSnapshot.empty) {
      throw new Error('Impossible de supprimer un emprunteur avec des prêts actifs');
    }

    const docRef = doc(db, COLLECTION, borrowerId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting borrower:', error);
    throw error;
  }
};

export const getBorrower = async (borrowerId: string): Promise<Borrower | null> => {
  try {
    const docRef = doc(db, COLLECTION, borrowerId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Borrower;
    }
    return null;
  } catch (error) {
    console.error('Error getting borrower:', error);
    throw new Error('Échec de récupération de l\'emprunteur');
  }
};

export const getAllBorrowers = async (): Promise<Borrower[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION));

    const borrowers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Borrower;
    });

    return borrowers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting borrowers:', error);
    throw new Error('Échec de récupération des emprunteurs');
  }
};

export const getActiveBorrowers = async (): Promise<Borrower[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);

    const borrowers = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Borrower;
    });

    return borrowers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting active borrowers:', error);
    throw new Error('Échec de récupération des emprunteurs actifs');
  }
};

export const searchBorrowers = async (searchTerm: string): Promise<Borrower[]> => {
  try {
    const allBorrowers = await getAllBorrowers();
    const term = searchTerm.toLowerCase();

    return allBorrowers.filter(borrower =>
      borrower.firstName.toLowerCase().includes(term) ||
      borrower.lastName.toLowerCase().includes(term) ||
      borrower.phone.includes(term) ||
      borrower.email?.toLowerCase().includes(term) ||
      borrower.idNumber?.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error searching borrowers:', error);
    throw new Error('Échec de recherche des emprunteurs');
  }
};
