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
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LoanPayment, Loan } from './types';
import { getLoan } from './loans';

const COLLECTION = 'loan_payments';

export const recordPayment = async (
  data: Omit<LoanPayment, 'id' | 'createdAt'>,
  userId: string
): Promise<string> => {
  try {
    return await runTransaction(db, async (transaction) => {
      const loanRef = doc(db, 'loans', data.loanId);
      const loanDoc = await transaction.get(loanRef);

      if (!loanDoc.exists()) {
        throw new Error('Prêt non trouvé');
      }

      const loan = loanDoc.data() as Loan;

      if (loan.status !== 'active' && loan.status !== 'approved') {
        throw new Error('Le prêt n\'est pas actif');
      }

      const newTotalPaid = loan.totalPaid + data.amount;
      const newRemainingBalance = loan.totalAmount - newTotalPaid;

      const paymentRef = doc(collection(db, COLLECTION));
      transaction.set(paymentRef, {
        ...data,
        paymentDate: Timestamp.fromDate(data.paymentDate),
        receivedBy: userId,
        createdAt: serverTimestamp()
      });

      const updateData: any = {
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance,
        updatedAt: serverTimestamp()
      };

      if (loan.status === 'approved') {
        updateData.status = 'active';
      }

      if (newRemainingBalance <= 0) {
        updateData.status = 'completed';
        updateData.nextPaymentDate = null;
      } else {
        const nextPayment = new Date(data.paymentDate);
        nextPayment.setMonth(nextPayment.getMonth() + 1);
        updateData.nextPaymentDate = Timestamp.fromDate(nextPayment);
      }

      transaction.update(loanRef, updateData);

      return paymentRef.id;
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

export const deletePayment = async (paymentId: string): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const paymentRef = doc(db, COLLECTION, paymentId);
      const paymentDoc = await transaction.get(paymentRef);

      if (!paymentDoc.exists()) {
        throw new Error('Paiement non trouvé');
      }

      const payment = paymentDoc.data() as LoanPayment;
      const loanRef = doc(db, 'loans', payment.loanId);
      const loanDoc = await transaction.get(loanRef);

      if (!loanDoc.exists()) {
        throw new Error('Prêt non trouvé');
      }

      const loan = loanDoc.data() as Loan;
      const newTotalPaid = loan.totalPaid - payment.amount;
      const newRemainingBalance = loan.totalAmount - newTotalPaid;

      transaction.delete(paymentRef);

      transaction.update(loanRef, {
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance,
        status: newRemainingBalance > 0 ? 'active' : 'completed',
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    throw error;
  }
};

export const getPayment = async (paymentId: string): Promise<LoanPayment | null> => {
  try {
    const docRef = doc(db, COLLECTION, paymentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        paymentDate: data.paymentDate?.toDate(),
        createdAt: data.createdAt?.toDate()
      } as LoanPayment;
    }
    return null;
  } catch (error) {
    console.error('Error getting payment:', error);
    throw new Error('Échec de récupération du paiement');
  }
};

export const getPaymentsByLoan = async (loanId: string): Promise<LoanPayment[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('loanId', '==', loanId)
    );
    const querySnapshot = await getDocs(q);

    const payments = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        paymentDate: data.paymentDate?.toDate(),
        createdAt: data.createdAt?.toDate()
      } as LoanPayment;
    });

    return payments.sort((a, b) => {
      const aDate = a.paymentDate instanceof Date ? a.paymentDate.getTime() : 0;
      const bDate = b.paymentDate instanceof Date ? b.paymentDate.getTime() : 0;
      return bDate - aDate;
    });
  } catch (error) {
    console.error('Error getting loan payments:', error);
    throw new Error('Échec de récupération des paiements du prêt');
  }
};

export const getPaymentsByBorrower = async (borrowerId: string): Promise<LoanPayment[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('borrowerId', '==', borrowerId)
    );
    const querySnapshot = await getDocs(q);

    const payments = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        paymentDate: data.paymentDate?.toDate(),
        createdAt: data.createdAt?.toDate()
      } as LoanPayment;
    });

    return payments.sort((a, b) => {
      const aDate = a.paymentDate instanceof Date ? a.paymentDate.getTime() : 0;
      const bDate = b.paymentDate instanceof Date ? b.paymentDate.getTime() : 0;
      return bDate - aDate;
    });
  } catch (error) {
    console.error('Error getting borrower payments:', error);
    throw new Error('Échec de récupération des paiements de l\'emprunteur');
  }
};

export const getAllPayments = async (): Promise<LoanPayment[]> => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('paymentDate', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        paymentDate: data.paymentDate?.toDate(),
        createdAt: data.createdAt?.toDate()
      } as LoanPayment;
    });
  } catch (error) {
    console.error('Error getting all payments:', error);
    throw new Error('Échec de récupération des paiements');
  }
};

export const getPaymentsByDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<LoanPayment[]> => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('paymentDate', '>=', Timestamp.fromDate(startDate)),
      where('paymentDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('paymentDate', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        paymentDate: data.paymentDate?.toDate(),
        createdAt: data.createdAt?.toDate()
      } as LoanPayment;
    });
  } catch (error) {
    console.error('Error getting payments by date range:', error);
    throw new Error('Échec de récupération des paiements par période');
  }
};
