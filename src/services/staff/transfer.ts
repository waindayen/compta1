import { collection, doc, runTransaction, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CommissionService } from '../admin/commission';
import { ServerTimeService } from '../serverTime';

export class StaffTransferService {
  private static STAFF_WALLET_COLLECTION = 'staff_wallets';
  private static STAFF_COMMISSION_WALLET_COLLECTION = 'staff_commission_wallets';
  private static AGENT_WALLET_COLLECTION = 'agent_wallets';
  private static AGENT_COMMISSION_WALLET_COLLECTION = 'agent_commission_wallets';
  private static STAFF_TRANSACTIONS_COLLECTION = 'staff_transactions';
  private static AGENT_TRANSACTIONS_COLLECTION = 'agent_transactions';
  private static TRANSFER_FEE_RATE = 0; // Pas de frais pour les transferts entre staffs

  /**
   * Récupère les transactions de transfert récentes pour un staff
   */
  static async getRecentTransferTransactions(staffId: string, limitValue: number = 5): Promise<any[]> {
    try {
      const transactionsRef = collection(db, this.STAFF_TRANSACTIONS_COLLECTION);
      const q = query(
        transactionsRef,
        where('walletId', '==', staffId),
        where('referenceType', 'in', ['transfer', 'agent_transfer']),
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

  static async transferCreditByEmail(
    fromStaffId: string,
    toStaffEmail: string,
    amount: number
  ): Promise<void> {
    try {
      if (!fromStaffId || !toStaffEmail || !amount) {
        throw new Error('Paramètres manquants');
      }

      if (amount <= 0) {
        throw new Error('Le montant doit être supérieur à 0');
      }

      // Trouver l'ID du staff destinataire par son email
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

      if (fromStaffId === toStaffId) {
        throw new Error('Impossible de transférer à soi-même');
      }

      // Récupérer le taux de commission pour les transferts entre staffs
      const commissionRate = await CommissionService.getCommissionRate('staff_transfer');
      const feeAmount = 0; // Pas de frais pour les transferts entre staffs
      const totalDebit = amount; // Pas de frais ajoutés
      const now = ServerTimeService.getServerTimeISO();

      await runTransaction(db, async (transaction) => {
        // Récupérer les portefeuilles source et destination
        const fromWalletRef = doc(db, this.STAFF_WALLET_COLLECTION, fromStaffId);
        const fromCommissionWalletRef = doc(db, this.STAFF_COMMISSION_WALLET_COLLECTION, fromStaffId);
        const toWalletRef = doc(db, this.STAFF_WALLET_COLLECTION, toStaffId);
        const toCommissionWalletRef = doc(db, this.STAFF_COMMISSION_WALLET_COLLECTION, toStaffId);

        const [fromWalletDoc, fromCommissionWalletDoc, toWalletDoc, toCommissionWalletDoc] = await Promise.all([
          transaction.get(fromWalletRef),
          transaction.get(fromCommissionWalletRef),
          transaction.get(toWalletRef),
          transaction.get(toCommissionWalletRef)
        ]);

        if (!fromWalletDoc.exists()) {
          throw new Error('Portefeuille source non trouvé');
        }

        if (!fromCommissionWalletDoc.exists()) {
          throw new Error('Portefeuille commission source non trouvé');
        }

        if (!toWalletDoc.exists()) {
          throw new Error('Portefeuille destination non trouvé');
        }

        if (!toCommissionWalletDoc.exists()) {
          throw new Error('Portefeuille commission destination non trouvé');
        }

        const fromBalance = fromWalletDoc.data().balance || 0;
        const fromCommissionBalance = fromCommissionWalletDoc.data().balance || 0;
        const toBalance = toWalletDoc.data().balance || 0;
        const toCommissionBalance = toCommissionWalletDoc.data().balance || 0;

        // Vérifier le solde
        if (fromBalance < totalDebit) {
          throw new Error(`Solde insuffisant. Vous avez besoin de ${totalDebit} mais votre solde est de ${fromBalance}`);
        }


        // Créer la transaction de débit
        const debitTransactionRef = doc(collection(db, this.STAFF_TRANSACTIONS_COLLECTION));
        const debitTransaction = {
          walletId: fromStaffId,
          type: 'debit',
          amount: totalDebit,
          referenceType: 'transfer',
          status: 'completed',
          createdAt: now,
          updatedAt: now,
          transferTo: toStaffId,
          transferAmount: amount,
          feeAmount: 0
        };
        transaction.set(debitTransactionRef, debitTransaction);

        // Créer la transaction de crédit
        const creditTransactionRef = doc(collection(db, this.STAFF_TRANSACTIONS_COLLECTION));
        const creditTransaction = {
          walletId: toStaffId,
          type: 'credit',
          amount,
          referenceType: 'transfer',
          status: 'completed',
          createdAt: now,
          updatedAt: now,
          transferFrom: fromStaffId
        };
        transaction.set(creditTransactionRef, creditTransaction);

        // Créer la transaction de commission
        const commissionTransactionRef = doc(collection(db, this.STAFF_TRANSACTIONS_COLLECTION));
        const commissionTransaction = {
          walletId: toStaffId,
          type: 'commission',
          amount: 0, // Pas de commission pour les transferts entre staffs
          referenceType: 'transfer_fee',
          status: 'completed',
          createdAt: now,
          updatedAt: now,
          transferFrom: fromStaffId
        };
        // Ne pas créer de transaction de commission si le montant est 0
        if (feeAmount > 0) {
          transaction.set(staffCommissionTransactionRef, staffCommissionTransaction);
        }

        // Mettre à jour les soldes
        transaction.update(fromWalletRef, {
          balance: fromBalance - totalDebit,
          updatedAt: now
        });

        transaction.update(toWalletRef, {
          balance: toBalance + amount,
          updatedAt: now
        });

        // Ne pas mettre à jour le portefeuille de commission s'il n'y a pas de frais
        if (feeAmount > 0) {
          transaction.update(toCommissionWalletRef, {
            balance: toCommissionBalance + feeAmount,
            updatedAt: now
          });
        }
      });
    } catch (error) {
      console.error('Error transferring credit:', error);
      throw error instanceof Error ? error : new Error('Erreur lors du transfert');
    }
  }

  static async transferToAgentByEmail(
    fromStaffId: string,
    toAgentEmail: string,
    amount: number
  ): Promise<void> {
    try {
      if (!fromStaffId || !toAgentEmail || !amount) {
        throw new Error('Paramètres manquants');
      }

      if (amount <= 0) {
        throw new Error('Le montant doit être supérieur à 0');
      }

      // Trouver l'ID de l'agent par son email
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('email', '==', toAgentEmail),
        where('role', '==', 'agentuser')
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Aucun agent trouvé avec cet email');
      }

      const toAgentId = querySnapshot.docs[0].id;

      // Récupérer le taux de commission pour les transferts staff-agent
      const commissionRate = await CommissionService.getCommissionRate('staff_transfer');
      const commissionAmount = Math.round(amount * commissionRate * 100) / 100; // Arrondir à 2 décimales
      const now = ServerTimeService.getServerTimeISO();

      await runTransaction(db, async (transaction) => {
        // Récupérer les portefeuilles
        const fromWalletRef = doc(db, this.STAFF_WALLET_COLLECTION, fromStaffId);
        const fromCommissionWalletRef = doc(db, this.STAFF_COMMISSION_WALLET_COLLECTION, fromStaffId);
        const toWalletRef = doc(db, this.AGENT_WALLET_COLLECTION, toAgentId);
        const toCommissionWalletRef = doc(db, this.AGENT_COMMISSION_WALLET_COLLECTION, toAgentId);

        const [fromWalletDoc, fromCommissionWalletDoc, toWalletDoc, toCommissionWalletDoc] = await Promise.all([
          transaction.get(fromWalletRef),
          transaction.get(fromCommissionWalletRef),
          transaction.get(toWalletRef),
          transaction.get(toCommissionWalletRef)
        ]);

        if (!fromWalletDoc.exists()) {
          throw new Error('Portefeuille staff non trouvé');
        }

        if (!fromCommissionWalletDoc.exists()) {
          throw new Error('Portefeuille commission staff non trouvé');
        }

        if (!toWalletDoc.exists()) {
          throw new Error('Portefeuille agent non trouvé');
        }

        if (!toCommissionWalletDoc.exists()) {
          throw new Error('Portefeuille commission agent non trouvé');
        }

        const fromBalance = fromWalletDoc.data().balance || 0;
        const fromCommissionBalance = fromCommissionWalletDoc.data().balance || 0;
        const toBalance = toWalletDoc.data().balance || 0;
        const toCommissionBalance = toCommissionWalletDoc.data().balance || 0;

        // Vérifier si le staff a assez de solde pour le montant
        if (fromBalance < amount) {
          throw new Error('Solde insuffisant pour effectuer le transfert');
        }


        // Créer la transaction de débit pour le staff (montant uniquement)
        const staffDebitTransactionRef = doc(collection(db, this.STAFF_TRANSACTIONS_COLLECTION));
        const staffDebitTransaction = {
          walletId: fromStaffId,
          type: 'debit',
          amount,
          referenceType: 'agent_transfer',
          status: 'completed',
          createdAt: now,
          updatedAt: now,
          transferTo: toAgentId
        };
        transaction.set(staffDebitTransactionRef, staffDebitTransaction);

        // Créer la transaction de crédit pour l'agent
        const agentCreditTransactionRef = doc(collection(db, this.AGENT_TRANSACTIONS_COLLECTION));
        const agentCreditTransaction = {
          walletId: toAgentId,
          type: 'credit',
          amount,
          referenceType: 'staff_transfer',
          status: 'completed',
          createdAt: now,
          updatedAt: now,
          transferFrom: fromStaffId
        };
        transaction.set(agentCreditTransactionRef, agentCreditTransaction);

        // Créer la transaction de commission pour le staff
        const commissionTransactionRef = doc(collection(db, this.STAFF_TRANSACTIONS_COLLECTION));
        const commissionTransaction = {
          walletId: fromStaffId,
          type: 'commission',
          amount: commissionAmount,
          referenceType: 'agent_transfer',
          status: 'completed',
          createdAt: now,
          updatedAt: now,
          transferTo: toAgentId
        };
        transaction.set(commissionTransactionRef, commissionTransaction);

        // Mettre à jour les soldes
        // Le staff est débité uniquement du montant transféré
        transaction.update(fromWalletRef, {
          balance: fromBalance - amount,
          updatedAt: now
        });

        // L'agent reçoit le montant complet
        transaction.update(toWalletRef, {
          balance: toBalance + amount,
          updatedAt: now
        });

        // Le portefeuille commission du staff reçoit la commission
        transaction.update(fromCommissionWalletRef, {
          balance: fromCommissionBalance + commissionAmount,
          updatedAt: now
        });
      });
    } catch (error) {
      console.error('Error transferring to agent:', error);
      throw error instanceof Error ? error : new Error('Erreur lors du transfert');
    }
  }
}