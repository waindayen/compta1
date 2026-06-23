import { collection, doc, runTransaction, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ServerTimeService } from '../serverTime';

export class AgentTransferService {
  private static AGENT_WALLET_COLLECTION = 'agent_wallets';
  private static STAFF_WALLET_COLLECTION = 'staff_wallets';
  private static STAFF_COMMISSION_WALLET_COLLECTION = 'staff_commission_wallets';
  private static AGENT_TRANSACTIONS_COLLECTION = 'agent_transactions';
  private static STAFF_TRANSACTIONS_COLLECTION = 'staff_transactions';
  private static TRANSFER_FEE_RATE = 0.02; // 2% de frais

  /**
   * Récupère les transactions de transfert récentes pour un agent
   */
  static async getRecentTransferTransactions(agentId: string, limitValue: number = 5): Promise<any[]> {
    try {
      const transactionsRef = collection(db, this.AGENT_TRANSACTIONS_COLLECTION);
      const q = query(
        transactionsRef,
        where('walletId', '==', agentId),
        where('referenceType', '==', 'staff_transfer'),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(limitValue)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting recent transfer transactions:', error);
      return [];
    }
  }

  static async transferToStaffByEmail(
    fromAgentId: string,
    toStaffEmail: string,
    amount: number
  ): Promise<void> {
    try {
      if (!fromAgentId || !toStaffEmail || !amount) {
        throw new Error('Paramètres manquants');
      }

      if (amount <= 0) {
        throw new Error('Le montant doit être supérieur à 0');
      }

      // Trouver l'ID du staff par son email
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('email', '==', toStaffEmail),
        where('role', '==', 'staffuser')
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Aucun staff trouvé avec cet email');
      }

      const toStaffId = querySnapshot.docs[0].id;

      // Calculer les frais
      const feeAmount = Math.round(amount * this.TRANSFER_FEE_RATE * 100) / 100; // Arrondir à 2 décimales
      const totalDebit = amount + feeAmount;
      const now = ServerTimeService.getServerTimeISO();

      await runTransaction(db, async (transaction) => {
        // Récupérer les portefeuilles
        const fromWalletRef = doc(db, this.AGENT_WALLET_COLLECTION, fromAgentId);
        const toWalletRef = doc(db, this.STAFF_WALLET_COLLECTION, toStaffId);
        const toCommissionWalletRef = doc(db, this.STAFF_COMMISSION_WALLET_COLLECTION, toStaffId);

        const [fromWalletDoc, toWalletDoc, toCommissionWalletDoc] = await Promise.all([
          transaction.get(fromWalletRef),
          transaction.get(toWalletRef),
          transaction.get(toCommissionWalletRef)
        ]);

        if (!fromWalletDoc.exists()) {
          throw new Error('Portefeuille agent non trouvé');
        }

        if (!toWalletDoc.exists()) {
          throw new Error('Portefeuille staff non trouvé');
        }

        if (!toCommissionWalletDoc.exists()) {
          throw new Error('Portefeuille commission staff non trouvé');
        }

        const fromBalance = fromWalletDoc.data().balance || 0;
        const toBalance = toWalletDoc.data().balance || 0;
        const toCommissionBalance = toCommissionWalletDoc.data().balance || 0;

        // Vérifier le solde (montant + frais)
        if (fromBalance < totalDebit) {
          throw new Error(`Solde insuffisant. Le montant total avec les frais est de ${totalDebit} (transfert: ${amount} + frais: ${feeAmount})`);
        }


        // Créer la transaction de débit pour l'agent (montant + frais)
        const agentDebitTransactionRef = doc(collection(db, this.AGENT_TRANSACTIONS_COLLECTION));
        const agentDebitTransaction = {
          walletId: fromAgentId,
          type: 'debit',
          amount: totalDebit,
          referenceType: 'staff_transfer',
          status: 'completed',
          createdAt: now,
          updatedAt: now,
          transferTo: toStaffId,
          transferAmount: amount,
          feeAmount
        };
        transaction.set(agentDebitTransactionRef, agentDebitTransaction);

        // Créer la transaction de crédit pour le staff (montant uniquement)
        const staffCreditTransactionRef = doc(collection(db, this.STAFF_TRANSACTIONS_COLLECTION));
        const staffCreditTransaction = {
          walletId: toStaffId,
          type: 'credit',
          amount,
          referenceType: 'agent_transfer',
          status: 'completed',
          createdAt: now,
          updatedAt: now,
          transferFrom: fromAgentId
        };
        transaction.set(staffCreditTransactionRef, staffCreditTransaction);

        // Créer la transaction de commission pour le staff
        const staffCommissionTransactionRef = doc(collection(db, this.STAFF_TRANSACTIONS_COLLECTION));
        const staffCommissionTransaction = {
          walletId: toStaffId,
          type: 'commission',
          amount: feeAmount,
          referenceType: 'transfer_fee',
          status: 'completed',
          createdAt: now,
          updatedAt: now,
          transferFrom: fromAgentId
        };
        transaction.set(staffCommissionTransactionRef, staffCommissionTransaction);

        // Mettre à jour les soldes
        transaction.update(fromWalletRef, {
          balance: fromBalance - totalDebit,
          updatedAt: now
        });

        transaction.update(toWalletRef, {
          balance: toBalance + amount,
          updatedAt: now
        });

        transaction.update(toCommissionWalletRef, {
          balance: toCommissionBalance + feeAmount,
          updatedAt: now
        });
      });
    } catch (error) {
      console.error('Error transferring to staff:', error);
      throw error instanceof Error ? error : new Error('Erreur lors du transfert');
    }
  }
}