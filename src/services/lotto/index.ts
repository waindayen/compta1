import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AgentWalletService } from './agent/wallet';
import { CommissionService } from './admin/commission';
import { CancellationFeeService } from './admin/cancellationFee';
import { LottoRecurrenceService } from './lotto/recurrence';
import { DateService } from '../dateService';

export type LottoStatus = 'pending' | 'active' | 'completed';

export interface LottoEvent {
  id?: string;
  eventName: string;
  startDate: string;
  endDate: string;
  ticketPrice: number;
  currency: string;
  frequency: string;
  numbersToSelect: number;
  gridsPerTicket: number;
  createdAt?: string;
  status?: LottoStatus;
  prizeCalculated?: boolean;
  winningNumbers?: number[];
  isEnabled?: boolean;
}

export interface LottoParticipation {
  id?: string;
  lottoId: string;
  userId: string;
  selectedNumbers: number[];
  purchaseDate: string;
  ticketPrice: number;
  currency: string;
  status?: 'active' | 'cancelled';
  isWinner?: boolean;
  winAmount?: number;
  paid?: boolean;
  paidAt?: string;
  drawEndDate: string;
  matchedNumbers?: number;
  lottoEventName?: string;
  commissionAmount?: number;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationFee?: number;
}

const COLLECTION_NAME = 'lottos';
const PARTICIPATIONS_COLLECTION = 'lotto_participations';
const CANCELLATION_WINDOW_MINUTES = 15;

export class LottoService {
  static async createLotto(data: Omit<LottoEvent, 'id' | 'createdAt' | 'status'>): Promise<string> {
    try {
      const now = DateService.now();
      const startDate = DateService.parse(data.startDate);
      const endDate = DateService.parse(data.endDate);

      if (DateService.isInPast(startDate)) {
        console.log('La date de début est dans le passé, utilisation de la date actuelle');
        startDate.setTime(now.getTime());
      }

      if (startDate >= endDate) {
        throw new Error('La date de début doit être antérieure à la date de fin');
      }

      let initialStatus: LottoStatus = 'pending';
      if (now >= startDate && now < endDate) {
        initialStatus = 'active';
      } else if (now >= endDate) {
        initialStatus = 'completed';
      }

      const lottoData = {
        ...data,
        startDate: DateService.toISOString(startDate),
        createdAt: DateService.nowISO(),
        status: initialStatus,
        prizeCalculated: false,
        isEnabled: true
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), lottoData);
      
      // Si c'est un lotto récurrent et qu'il est déjà terminé, vérifier la récurrence
      if (data.frequency !== 'once' && initialStatus === 'completed') {
        try {
          // Attendre un peu pour s'assurer que le document est bien créé
          setTimeout(async () => {
            await LottoRecurrenceService.checkAndCreateRecurringLottos();
          }, 1000);
        } catch (recurrenceError) {
          console.error('Error checking recurrence after creating lotto:', recurrenceError);
          // Ne pas bloquer la création du lotto si la vérification de récurrence échoue
        }
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating lotto:', error);
      throw error instanceof Error ? error : new Error('Failed to create lotto event');
    }
  }

  static async getAllLottos(): Promise<LottoEvent[]> {
    try {
      console.log('Fetching all lottos...');
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      const lottos: LottoEvent[] = [];
      const now = DateService.now();
      
      querySnapshot.forEach((doc) => {
        lottos.push({
          id: doc.id,
          ...doc.data()
        } as LottoEvent);
      });

      const updatedLottos = await Promise.all(lottos.map(async (lotto) => {
        const startDate = DateService.parse(lotto.startDate);
        const endDate = DateService.parse(lotto.endDate);
        let newStatus = lotto.status;

        try {
          if (now >= startDate && now < endDate && lotto.status === 'pending') {
            newStatus = 'active';
            await this.updateLottoStatus(lotto.id!, 'active');
          } else if (now >= endDate && lotto.status !== 'completed') {
            newStatus = 'completed';
            await this.updateLottoStatus(lotto.id!, 'completed');
            
            // Si c'est un lotto récurrent qui vient de se terminer, vérifier la récurrence
            if (lotto.frequency !== 'once') {
              try {
                // Vérifier la récurrence en arrière-plan
                setTimeout(async () => {
                  await LottoRecurrenceService.checkAndCreateRecurringLottos();
                }, 1000);
              } catch (recurrenceError) {
                console.error(`Error checking recurrence for lotto ${lotto.id}:`, recurrenceError);
                // Ne pas bloquer la mise à jour du statut si la vérification de récurrence échoue
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to update status for lotto ${lotto.id}:`, error);
        }

        return {
          ...lotto,
          status: newStatus
        };
      }));

      console.log('Successfully fetched lottos:', updatedLottos.length);
      return updatedLottos;
    } catch (error) {
      console.error('Error fetching lottos:', error);
      throw new Error('Erreur lors du chargement des lottos. Veuillez réessayer.');
    }
  }

  static async getLotto(id: string): Promise<LottoEvent | null> {
    try {
      console.log('Fetching lotto:', id);
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log('Lotto not found:', id);
        return null;
      }

      const lotto = {
        id: docSnap.id,
        ...docSnap.data()
      } as LottoEvent;

      console.log('Successfully fetched lotto:', lotto);
      return lotto;
    } catch (error) {
      console.error('Error fetching lotto:', error);
      throw new Error('Erreur lors du chargement du lotto. Veuillez réessayer.');
    }
  }

  static async updateLottoStatus(id: string, status: LottoStatus): Promise<void> {
    try {
      console.log('Updating lotto status:', { id, status });
      const now = DateService.nowISO();
      const lottoRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(lottoRef, {
        status,
        updatedAt: now
      });
      console.log('Successfully updated lotto status');
      
      // Si le lotto est marqué comme terminé, vérifier la récurrence
      if (status === 'completed') {
        const lottoSnap = await getDoc(lottoRef);
        if (lottoSnap.exists()) {
          const lotto = lottoSnap.data() as LottoEvent;
          if (lotto.frequency !== 'once') {
            try {
              // Vérifier la récurrence en arrière-plan
              setTimeout(async () => {
                await LottoRecurrenceService.checkAndCreateRecurringLottos();
              }, 1000);
            } catch (recurrenceError) {
              console.error(`Error checking recurrence for lotto ${id}:`, recurrenceError);
              // Ne pas bloquer la mise à jour du statut si la vérification de récurrence échoue
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating lotto status:', error);
      throw new Error('Erreur lors de la mise à jour du statut. Veuillez réessayer.');
    }
  }

  static async updateLotto(id: string, data: Partial<LottoEvent>): Promise<void> {
    try {
      console.log('Updating lotto:', id);
      
      const lottoRef = doc(db, COLLECTION_NAME, id);
      const lottoSnap = await getDoc(lottoRef);
      
      if (!lottoSnap.exists()) {
        throw new Error('Lotto non trouvé');
      }
      
      const lotto = lottoSnap.data() as LottoEvent;
      
      if (lotto.status !== 'pending') {
        throw new Error('Seuls les lottos en attente peuvent être modifiés');
      }
      
      await updateDoc(lottoRef, {
        ...data,
        updatedAt: DateService.nowISO()
      });
      
      console.log('Successfully updated lotto');
    } catch (error) {
      console.error('Error updating lotto:', error);
      throw error instanceof Error ? error : new Error('Erreur lors de la mise à jour du lotto');
    }
  }

  static async toggleLottoStatus(id: string, isEnabled: boolean): Promise<void> {
    try {
      console.log('Toggling lotto status:', { id, isEnabled });
      const now = DateService.nowISO();
      const lottoRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(lottoRef, {
        isEnabled,
        updatedAt: now
      });
      console.log('Successfully toggled lotto status');
    } catch (error) {
      console.error('Error toggling lotto status:', error);
      throw new Error('Erreur lors de la modification du statut. Veuillez réessayer.');
    }
  }

  static async deleteLotto(id: string): Promise<void> {
    try {
      console.log('Deleting lotto:', id);
      
      const lottoRef = doc(db, COLLECTION_NAME, id);
      const lottoSnap = await getDoc(lottoRef);
      
      if (!lottoSnap.exists()) {
        throw new Error('Lotto non trouvé');
      }
      
      const lotto = lottoSnap.data() as LottoEvent;
      
      if (lotto.status !== 'pending') {
        throw new Error('Seuls les lottos en attente peuvent être supprimés');
      }
      
      const participationsRef = collection(db, PARTICIPATIONS_COLLECTION);
      const q = query(participationsRef, where('lottoId', '==', id));
      const participationsSnap = await getDocs(q);
      
      if (!participationsSnap.empty) {
        throw new Error('Impossible de supprimer un lotto avec des participations');
      }
      
      await deleteDoc(lottoRef);
      console.log('Successfully deleted lotto');
    } catch (error) {
      console.error('Error deleting lotto:', error);
      throw error instanceof Error ? error : new Error('Erreur lors de la suppression du lotto');
    }
  }

  static async participate(data: Omit<LottoParticipation, 'id' | 'purchaseDate'>): Promise<string> {
    try {
      console.log('Creating participation:', data);
      const lotto = await this.getLotto(data.lottoId);
      if (!lotto) {
        throw new Error('Lotto non trouvé');
      }

      if (lotto.isEnabled === false) {
        throw new Error('Ce lotto est actuellement désactivé');
      }

      const now = DateService.now();
      const startDate = DateService.parse(lotto.startDate);
      const endDate = DateService.parse(lotto.endDate);

      if (now < startDate) {
        throw new Error('Ce lotto n\'a pas encore commencé');
      }

      if (now >= endDate) {
        throw new Error('Ce lotto est terminé');
      }

      if (data.selectedNumbers.length !== lotto.numbersToSelect) {
        throw new Error(`Vous devez sélectionner exactement ${lotto.numbersToSelect} numéros`);
      }

      const uniqueNumbers = new Set(data.selectedNumbers);
      if (uniqueNumbers.size !== data.selectedNumbers.length) {
        throw new Error('Les numéros doivent être uniques');
      }

      if (data.selectedNumbers.some(n => n < 1 || n > 50)) {
        throw new Error('Les numéros doivent être entre 1 et 50');
      }

      const commissionRate = await CommissionService.getCommissionRate('lotto_submission');
      const commissionAmount = data.ticketPrice * commissionRate;

      await AgentWalletService.deductAmount(data.userId, data.ticketPrice);

      const nowISO = DateService.nowISO();
      const participationData = {
        ...data,
        purchaseDate: nowISO,
        status: 'active',
        lottoEventName: lotto.eventName,
        drawEndDate: lotto.endDate,
        commissionAmount
      };

      const docRef = await addDoc(collection(db, PARTICIPATIONS_COLLECTION), participationData);
      console.log('Successfully created participation:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating participation:', error);
      throw error instanceof Error ? error : new Error('Erreur lors de la participation. Veuillez réessayer.');
    }
  }

  static async getUserParticipations(userId: string): Promise<LottoParticipation[]> {
    try {
      console.log('Fetching participations for user:', userId);
      const q = query(
        collection(db, PARTICIPATIONS_COLLECTION), 
        where('userId', '==', userId),
        where('status', '!=', 'cancelled')
      );
      const querySnapshot = await getDocs(q);
      
      const participations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LottoParticipation[];

      console.log('Successfully fetched participations:', participations.length);
      return participations;
    } catch (error) {
      console.error('Error fetching participations:', error);
      throw new Error('Erreur lors du chargement des participations. Veuillez réessayer.');
    }
  }

  static async cancelParticipation(participationId: string, cancelledBy: string): Promise<void> {
    try {
      console.log('Cancelling participation:', { participationId, cancelledBy });

      // First check the participation status outside the transaction
      const participationRef = doc(db, PARTICIPATIONS_COLLECTION, participationId);
      const participationDoc = await getDoc(participationRef);

      if (!participationDoc.exists()) {
        throw new Error('Ticket non trouvé');
      }

      const participation = participationDoc.data() as LottoParticipation;

      // Check ticket status before starting transaction
      if (participation.status === 'cancelled') {
        throw new Error('Ce ticket est déjà annulé');
      }

      if (participation.paid) {
        throw new Error('Impossible d\'annuler un ticket déjà payé');
      }

      const purchaseTime = DateService.parse(participation.purchaseDate);
      const now = DateService.now();
      const minutesSincePurchase = DateService.diffInMinutes(now, purchaseTime);

      if (minutesSincePurchase > CANCELLATION_WINDOW_MINUTES) {
        throw new Error(`Le délai d'annulation de ${CANCELLATION_WINDOW_MINUTES} minutes est dépassé`);
      }

      // Get cancellation fee configuration
      const feeConfig = await CancellationFeeService.getConfig();
      const cancellationFeePercentage = feeConfig.enabled ? feeConfig.percentage / 100 : 0;
      const cancellationFee = participation.ticketPrice * cancellationFeePercentage;
      const refundAmount = participation.ticketPrice - cancellationFee;
      const nowISO = DateService.nowISO();

      await runTransaction(db, async (transaction) => {
        // Get the lotto to check if it's still active
        const lottoRef = doc(db, COLLECTION_NAME, participation.lottoId);
        const lottoDoc = await transaction.get(lottoRef);
        
        if (!lottoDoc.exists()) {
          throw new Error('Lotto non trouvé');
        }

        const lotto = lottoDoc.data() as LottoEvent;
        const endDate = DateService.parse(lotto.endDate);

        if (now >= endDate) {
          throw new Error('Impossible d\'annuler un ticket après la fin du lotto');
        }

        // Get user role
        const userRef = doc(db, 'users', cancelledBy);
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error('Utilisateur non trouvé');
        }

        const userRole = userDoc.data().role;

        if (!['agentuser', 'staffuser', 'adminuser'].includes(userRole)) {
          throw new Error('Vous n\'avez pas les droits pour annuler ce ticket');
        }

        // Get agent wallet
        const walletRef = doc(db, 'agent_wallets', participation.userId);
        const walletDoc = await transaction.get(walletRef);

        if (!walletDoc.exists()) {
          throw new Error('Portefeuille non trouvé');
        }

        const currentBalance = walletDoc.data().balance;

        // Create refund transaction
        const refundTransactionRef = doc(collection(db, 'agent_transactions'));
        const refundTransaction = {
          walletId: participation.userId,
          type: 'credit',
          amount: refundAmount,
          referenceType: 'refund',
          referenceId: participationId,
          status: 'completed',
          createdAt: DateService.toISOString(now),
          updatedAt: DateService.toISOString(now)
        };

        transaction.set(refundTransactionRef, refundTransaction);

        // Update wallet balance
        transaction.update(walletRef, {
          balance: currentBalance + refundAmount,
          updatedAt: nowISO
        });

        // Update participation status
        transaction.update(participationRef, {
          status: 'cancelled',
          cancelledBy,
          cancelledAt: nowISO,
          cancellationFee: cancellationFee
        });
      });

      console.log('Participation cancelled successfully');
    } catch (error) {
      console.error('Error cancelling participation:', error);
      throw error instanceof Error ? error : new Error('Erreur lors de l\'annulation du ticket');
    }
  }
}