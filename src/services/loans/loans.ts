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
import { Loan } from './types';

const COLLECTION = 'loans';

const calculateMonthlyPayment = (
  amount: number,
  interestRate: number,
  term: number,
  termUnit: string
): number => {
  const monthlyRate = interestRate / 100 / 12;
  let months = term;

  if (termUnit === 'days') months = term / 30;
  else if (termUnit === 'weeks') months = term / 4;
  else if (termUnit === 'years') months = term * 12;

  if (monthlyRate === 0) return amount / months;

  const payment =
    (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return Math.round(payment * 100) / 100;
};

const calculateEndDate = (
  startDate: Date,
  term: number,
  termUnit: string
): Date => {
  const endDate = new Date(startDate);

  switch (termUnit) {
    case 'days':
      endDate.setDate(endDate.getDate() + term);
      break;
    case 'weeks':
      endDate.setDate(endDate.getDate() + term * 7);
      break;
    case 'months':
      endDate.setMonth(endDate.getMonth() + term);
      break;
    case 'years':
      endDate.setFullYear(endDate.getFullYear() + term);
      break;
  }

  return endDate;
};

export const createLoan = async (
  data: Omit<Loan, 'id' | 'createdAt' | 'updatedAt' | 'monthlyPayment' | 'totalAmount' | 'totalPaid' | 'remainingBalance' | 'endDate'>,
  userId: string
): Promise<string> => {
  try {
    const monthlyPayment = calculateMonthlyPayment(
      data.amount,
      data.interestRate,
      data.term,
      data.termUnit
    );

    const totalAmount = monthlyPayment * (data.termUnit === 'months' ? data.term :
      data.termUnit === 'days' ? data.term / 30 :
      data.termUnit === 'weeks' ? data.term / 4 :
      data.term * 12);

    const endDate = calculateEndDate(data.startDate, data.term, data.termUnit);

    const nextPaymentDate = new Date(data.startDate);
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalPaid: 0,
      remainingBalance: Math.round(totalAmount * 100) / 100,
      endDate: Timestamp.fromDate(endDate),
      nextPaymentDate: Timestamp.fromDate(nextPaymentDate),
      startDate: Timestamp.fromDate(data.startDate),
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating loan:', error);
    throw new Error('Échec de création du prêt');
  }
};

export const updateLoan = async (
  loanId: string,
  data: Partial<Loan>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, loanId);
    const updateData: any = {
      ...data,
      updatedAt: serverTimestamp()
    };

    if (data.startDate) {
      updateData.startDate = Timestamp.fromDate(data.startDate);
    }
    if (data.endDate) {
      updateData.endDate = Timestamp.fromDate(data.endDate);
    }
    if (data.nextPaymentDate) {
      updateData.nextPaymentDate = Timestamp.fromDate(data.nextPaymentDate);
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating loan:', error);
    throw new Error('Échec de mise à jour du prêt');
  }
};

export const approveLoan = async (
  loanId: string,
  userId: string
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, loanId);
    await updateDoc(docRef, {
      status: 'approved',
      approvedBy: userId,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error approving loan:', error);
    throw new Error('Échec d\'approbation du prêt');
  }
};

export const activateLoan = async (loanId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, loanId);
    await updateDoc(docRef, {
      status: 'active',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error activating loan:', error);
    throw new Error('Échec d\'activation du prêt');
  }
};

export const completeLoan = async (loanId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, loanId);
    await updateDoc(docRef, {
      status: 'completed',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error completing loan:', error);
    throw new Error('Échec de clôture du prêt');
  }
};

export const markLoanAsDefaulted = async (loanId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, loanId);
    await updateDoc(docRef, {
      status: 'defaulted',
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking loan as defaulted:', error);
    throw new Error('Échec de marquage du prêt comme défaillant');
  }
};

export const deleteLoan = async (loanId: string): Promise<void> => {
  try {
    const loanDoc = await getDoc(doc(db, COLLECTION, loanId));
    if (!loanDoc.exists()) {
      throw new Error('Prêt non trouvé');
    }

    const loan = loanDoc.data() as Loan;
    if (loan.status === 'active' && loan.totalPaid > 0) {
      throw new Error('Impossible de supprimer un prêt actif avec des paiements');
    }

    const docRef = doc(db, COLLECTION, loanId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting loan:', error);
    throw error;
  }
};

export const getLoan = async (loanId: string): Promise<Loan | null> => {
  try {
    const docRef = doc(db, COLLECTION, loanId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        nextPaymentDate: data.nextPaymentDate?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Loan;
    }
    return null;
  } catch (error) {
    console.error('Error getting loan:', error);
    throw new Error('Échec de récupération du prêt');
  }
};

export const getAllLoans = async (): Promise<Loan[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION));

    const loans = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        nextPaymentDate: data.nextPaymentDate?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Loan;
    });

    return loans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting loans:', error);
    throw new Error('Échec de récupération des prêts');
  }
};

export const getLoansByBorrower = async (borrowerId: string): Promise<Loan[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('borrowerId', '==', borrowerId)
    );
    const querySnapshot = await getDocs(q);

    const loans = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        nextPaymentDate: data.nextPaymentDate?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Loan;
    });

    return loans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting borrower loans:', error);
    throw new Error('Échec de récupération des prêts de l\'emprunteur');
  }
};

export const getLoansByStatus = async (status: Loan['status']): Promise<Loan[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', status)
    );
    const querySnapshot = await getDocs(q);

    const loans = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        nextPaymentDate: data.nextPaymentDate?.toDate(),
        approvedAt: data.approvedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Loan;
    });

    return loans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('Error getting loans by status:', error);
    throw new Error('Échec de récupération des prêts par statut');
  }
};
