import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface TransactionTrace {
  id: string;
  type: 'agent_transaction' | 'staff_transaction';
  walletId: string;
  userEmail?: string;
  userName?: string;
  transactionType: 'credit' | 'debit' | 'commission';
  amount: number;
  currency: string;
  referenceType: string;
  referenceId?: string;
  status: string;
  createdAt: string;
  transferTo?: string;
  transferFrom?: string;
  transferAmount?: number;
  feeAmount?: number;
  reason?: string;
  // Informations sur l'autre partie du transfert
  counterpartyEmail?: string;
  counterpartyName?: string;
  // Direction du transfert pour clarifier
  transferDirection?: 'envoi' | 'reception';
}

export interface TraceabilityFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  transactionType?: 'all' | 'credit' | 'debit' | 'commission';
  referenceType?: 'all' | 'transfer' | 'agent_transfer' | 'staff_transfer' | 'payout' | 'admin_credit';
}

export class TransactionTraceabilityService {
  static async getTransactionHistory(filters: TraceabilityFilters): Promise<TransactionTrace[]> {
    try {
      console.log('Fetching transaction history with filters:', filters);
      
      const transactions: TransactionTrace[] = [];
      
      // Récupérer uniquement les transactions de transfert des agents
      const agentTransferTransactions = await this.getAgentTransferTransactions(filters);
      transactions.push(...agentTransferTransactions);
      
      // Récupérer uniquement les transactions de transfert des staffs
      const staffTransferTransactions = await this.getStaffTransferTransactions(filters);
      transactions.push(...staffTransferTransactions);
      
      // Trier par date décroissante
      transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Enrichir avec les informations des contreparties pour les transferts
      const enrichedTransactions = await this.enrichWithCounterpartyInfo(transactions);
      
      console.log('Transaction history fetched:', enrichedTransactions.length);
      return enrichedTransactions;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw new Error('Erreur lors de la récupération de l\'historique des transactions');
    }
  }

  private static async getAgentTransferTransactions(filters: TraceabilityFilters): Promise<TransactionTrace[]> {
    try {
      const transactionsRef = collection(db, 'agent_transactions');
      // Filtrer uniquement les transactions de transfert
      let q = query(
        transactionsRef, 
        where('referenceType', 'in', ['staff_transfer', 'agent_transfer', 'transfer']),
        limit(200)
      );
      
      const snapshot = await getDocs(q);
      const transactions: TransactionTrace[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Vérifier que c'est bien une transaction de transfert
        if (!['staff_transfer', 'agent_transfer', 'transfer'].includes(data.referenceType)) continue;
        
        // Appliquer les filtres côté client
        if (filters.userId && data.walletId !== filters.userId) continue;
        
        // Filtrer par date côté client si nécessaire
        if (filters.startDate || filters.endDate) {
          const transactionDate = new Date(data.createdAt);
          if (filters.startDate && transactionDate < new Date(filters.startDate)) continue;
          if (filters.endDate && transactionDate > new Date(filters.endDate + 'T23:59:59')) continue;
        }
        
        // Récupérer les informations utilisateur
        const userInfo = await this.getUserInfo(data.walletId);
        
        transactions.push({
          id: doc.id,
          type: 'agent_transaction',
          walletId: data.walletId,
          userEmail: userInfo?.email,
          userName: userInfo?.name,
          transactionType: data.type,
          amount: data.amount || 0,
          currency: data.currency || 'XAF',
          referenceType: data.referenceType || '',
          referenceId: data.referenceId,
          status: data.status || '',
          createdAt: data.createdAt,
          transferTo: data.transferTo,
          transferFrom: data.transferFrom,
          transferAmount: data.transferAmount,
          feeAmount: data.feeAmount,
          reason: data.reason,
          transferDirection: this.determineTransferDirection(data)
        });
      }
      
      // Trier côté client par date décroissante
      transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return transactions;
    } catch (error) {
      console.error('Error fetching agent transactions:', error);
      return [];
    }
  }

  private static async getStaffTransferTransactions(filters: TraceabilityFilters): Promise<TransactionTrace[]> {
    try {
      const transactionsRef = collection(db, 'staff_transactions');
      // Filtrer uniquement les transactions de transfert
      let q = query(
        transactionsRef, 
        where('referenceType', 'in', ['transfer', 'agent_transfer', 'staff_transfer', 'transfer_fee']),
        limit(200)
      );
      
      const snapshot = await getDocs(q);
      const transactions: TransactionTrace[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Vérifier que c'est bien une transaction de transfert
        if (!['transfer', 'agent_transfer', 'staff_transfer', 'transfer_fee'].includes(data.referenceType)) continue;
        
        // Appliquer les filtres côté client
        if (filters.userId && data.walletId !== filters.userId) continue;
        
        // Filtrer par date côté client si nécessaire
        if (filters.startDate || filters.endDate) {
          const transactionDate = new Date(data.createdAt);
          if (filters.startDate && transactionDate < new Date(filters.startDate)) continue;
          if (filters.endDate && transactionDate > new Date(filters.endDate + 'T23:59:59')) continue;
        }
        
        // Récupérer les informations utilisateur
        const userInfo = await this.getUserInfo(data.walletId);
        
        transactions.push({
          id: doc.id,
          type: 'staff_transaction',
          walletId: data.walletId,
          userEmail: userInfo?.email,
          userName: userInfo?.name,
          transactionType: data.type,
          amount: data.amount || 0,
          currency: data.currency || 'XAF',
          referenceType: data.referenceType || '',
          referenceId: data.referenceId,
          status: data.status || '',
          createdAt: data.createdAt,
          transferTo: data.transferTo,
          transferFrom: data.transferFrom,
          transferAmount: data.transferAmount,
          feeAmount: data.feeAmount,
          reason: data.reason,
          transferDirection: this.determineTransferDirection(data)
        });
      }
      
      // Trier côté client par date décroissante
      transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return transactions;
    } catch (error) {
      console.error('Error fetching staff transactions:', error);
      return [];
    }
  }

  private static async enrichWithCounterpartyInfo(transactions: TransactionTrace[]): Promise<TransactionTrace[]> {
    const enrichedTransactions = [...transactions];
    
    for (const transaction of enrichedTransactions) {
      try {
        // Pour les transferts, récupérer les informations de la contrepartie
        if (transaction.transferTo) {
          const counterpartyInfo = await this.getUserInfo(transaction.transferTo);
          if (counterpartyInfo) {
            transaction.counterpartyEmail = counterpartyInfo.email;
            transaction.counterpartyName = counterpartyInfo.name;
          }
        } else if (transaction.transferFrom) {
          const counterpartyInfo = await this.getUserInfo(transaction.transferFrom);
          if (counterpartyInfo) {
            transaction.counterpartyEmail = counterpartyInfo.email;
            transaction.counterpartyName = counterpartyInfo.name;
          }
        }
      } catch (error) {
        console.error('Error enriching transaction with counterparty info:', error);
        // Continue sans bloquer les autres transactions
      }
    }
    
    return enrichedTransactions;
  }

  private static determineTransferDirection(transactionData: any): 'envoi' | 'reception' | undefined {
    // Pour les transactions de transfert, déterminer la direction
    if (['staff_transfer', 'agent_transfer', 'transfer', 'transfer_fee'].includes(transactionData.referenceType)) {
      if (transactionData.type === 'debit' && transactionData.transferTo) {
        return 'envoi';
      } else if (transactionData.type === 'credit' && transactionData.transferFrom) {
        return 'reception';
      } else if (transactionData.type === 'commission' && transactionData.transferFrom) {
        return 'reception'; // Commission reçue lors d'un transfert
      } else if (transactionData.type === 'commission' && transactionData.transferTo) {
        return 'envoi'; // Commission gagnée lors d'un envoi
      }
    }
    return undefined;
  }

  private static async getUserInfo(userId: string): Promise<{ email: string; name: string } | null> {
    try {
      const userRef = collection(db, 'users');
      const q = query(userRef, where('__name__', '==', userId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        return {
          email: userData.email || 'Email non disponible',
          name: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`
            : userData.firstName || userData.lastName || 'Nom non disponible'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  static async getAllUsers(): Promise<Array<{ id: string; email: string; name: string; role: string }>> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', 'in', ['agentuser', 'staffuser']));
      const snapshot = await getDocs(q);
      
      const users: Array<{ id: string; email: string; name: string; role: string }> = [];
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          email: userData.email || 'Email non disponible',
          name: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`
            : userData.firstName || userData.lastName || 'Nom non disponible',
          role: userData.role || ''
        });
      });
      
      return users.sort((a, b) => a.email.localeCompare(b.email));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }
}