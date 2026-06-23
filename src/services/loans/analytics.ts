import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loan, Borrower, LoanSummary, BorrowerStats } from './types';

export const getLoanSummary = async (): Promise<LoanSummary> => {
  try {
    const loansSnapshot = await getDocs(collection(db, 'loans'));
    const loans = loansSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as Loan;
    });

    const totalLoans = loans.length;
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const completedLoans = loans.filter(l => l.status === 'completed').length;
    const defaultedLoans = loans.filter(l => l.status === 'defaulted').length;

    const totalDisbursed = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalCollected = loans.reduce((sum, loan) => sum + loan.totalPaid, 0);
    const outstandingBalance = loans
      .filter(l => l.status === 'active' || l.status === 'approved')
      .reduce((sum, loan) => sum + loan.remainingBalance, 0);
    const expectedRevenue = loans
      .filter(l => l.status === 'active' || l.status === 'approved')
      .reduce((sum, loan) => sum + loan.totalAmount, 0);

    return {
      totalLoans,
      activeLoans,
      completedLoans,
      defaultedLoans,
      totalDisbursed: Math.round(totalDisbursed * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
      expectedRevenue: Math.round(expectedRevenue * 100) / 100
    };
  } catch (error) {
    console.error('Error getting loan summary:', error);
    throw new Error('Échec de récupération du résumé des prêts');
  }
};

export const getBorrowerStats = async (): Promise<BorrowerStats> => {
  try {
    const borrowersSnapshot = await getDocs(collection(db, 'borrowers'));
    const borrowers = borrowersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Borrower[];

    const loansSnapshot = await getDocs(collection(db, 'loans'));
    const loans = loansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Loan[];

    const totalBorrowers = borrowers.length;
    const activeBorrowers = borrowers.filter(b => b.status === 'active').length;
    const blacklistedBorrowers = borrowers.filter(b => b.status === 'blacklisted').length;
    const totalLoansIssued = loans.length;
    const averageLoanAmount = loans.length > 0
      ? loans.reduce((sum, loan) => sum + loan.amount, 0) / loans.length
      : 0;
    const defaultRate = totalLoansIssued > 0
      ? (loans.filter(l => l.status === 'defaulted').length / totalLoansIssued) * 100
      : 0;

    return {
      totalBorrowers,
      activeBorrowers,
      blacklistedBorrowers,
      totalLoansIssued,
      averageLoanAmount: Math.round(averageLoanAmount * 100) / 100,
      defaultRate: Math.round(defaultRate * 100) / 100
    };
  } catch (error) {
    console.error('Error getting borrower stats:', error);
    throw new Error('Échec de récupération des statistiques des emprunteurs');
  }
};
