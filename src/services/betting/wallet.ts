import { doc, getDoc, runTransaction, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export class BettingWalletService {
  static async placeBet(userId: string, betAmount: number, odds: number): Promise<boolean> {
    if (!userId || !betAmount || !odds) {
      console.error('Invalid parameters:', { userId, betAmount, odds });
      throw new Error('Paramètres invalides');
    }

    try {
      const walletRef = doc(db, 'agent_wallets', userId);
      const commissionWalletRef = doc(db, 'agent_commission_wallets', userId);

      return await runTransaction(db, async (transaction) => {
        // Vérifier les deux portefeuilles
        const [walletDoc, commissionWalletDoc] = await Promise.all([
          transaction.get(walletRef),
          transaction.get(commissionWalletRef)
        ]);
        
        if (!walletDoc.exists()) {
          console.error('Main wallet not found for user:', userId);
          throw new Error('Portefeuille principal non trouvé');
        }

        if (!commissionWalletDoc.exists()) {
          console.error('Commission wallet not found for user:', userId);
          throw new Error('Portefeuille de commission non trouvé');
        }

        const currentBalance = walletDoc.data().balance || 0;
        if (currentBalance < betAmount) {
          throw new Error('Solde insuffisant');
        }

        const commissionAmount = betAmount * 0.02; // 2% commission
        const currentCommissionBalance = commissionWalletDoc.data().balance || 0;

        // Mettre à jour le solde principal
        transaction.update(walletRef, {
          balance: currentBalance - betAmount,
          updatedAt: new Date().toISOString()
        });

        // Mettre à jour le solde des commissions
        transaction.update(commissionWalletRef, {
          balance: currentCommissionBalance + commissionAmount,
          updatedAt: new Date().toISOString()
        });

        // Créer la transaction de débit
        const debitTransactionRef = doc(collection(db, 'agent_transactions'));
        const debitTransaction = {
          walletId: userId,
          type: 'debit',
          amount: betAmount,
          referenceType: 'bet',
          status: 'completed',
          currency: 'XAF',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        transaction.set(debitTransactionRef, debitTransaction);

        // Créer la transaction de commission
        const commissionTransactionRef = doc(collection(db, 'agent_transactions'));
        const commissionTransaction = {
          walletId: userId,
          type: 'commission',
          amount: commissionAmount,
          referenceType: 'bet',
          status: 'completed',
          currency: 'XAF',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        transaction.set(commissionTransactionRef, commissionTransaction);

        return true;
      });
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  static async getBalance(userId: string): Promise<number> {
    try {
      if (!userId) {
        console.error('Invalid userId');
        return 0;
      }

      const walletDoc = await getDoc(doc(db, 'agent_wallets', userId));
      if (!walletDoc.exists()) {
        console.error('Wallet not found for user:', userId);
        return 0;
      }
      return walletDoc.data().balance || 0;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }
}