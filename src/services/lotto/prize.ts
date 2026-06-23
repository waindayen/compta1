import { collection, addDoc, getDocs, query, where, updateDoc, doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LottoEvent, LottoParticipation } from './types';
import { ServerTimeService } from '../serverTime';

export interface LottoPrize {
  id?: string;
  lottoId: string;
  calculationDate: string;
  winningNumbers: number[];
  jackpotAmount: number;
  prizeDistribution: {
    numbers: number;
    amount: number;
  }[];
  winners: {
    userId: string;
    matchedNumbers: number;
    prize: number;
  }[];
}

export interface ApprovalRequest {
  id?: string;
  lottoId: string;
  draw: any;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  reason?: string;
  votes?: ApprovalVote[];
  history?: ApprovalHistory[];
  request_type?: string;
  winningNumbers?: number[]; // Stocker les numéros gagnants dans la demande
  isWinningNumbersLocked?: boolean; // Indiquer si les numéros sont verrouillés
}

export interface ApprovalVote {
  id?: string;
  requestId: string;
  managerId: string;
  managerEmail?: string;
  decision: 'approve' | 'reject';
  comment?: string | null;
  createdAt: string;
}

export interface ApprovalHistory {
  id?: string;
  requestId: string;
  userId: string;
  userEmail?: string;
  action: 'created' | 'approved' | 'rejected' | 'commented' | 'processed';
  details?: any;
  createdAt: string;
}

export class LottoPrizeService {
  /**
   * Vérifie si un lotto a déjà une demande d'approbation en cours
   */
  static async hasExistingApprovalRequest(lottoId: string): Promise<boolean> {
    try {
      const approvalsRef = collection(db, 'approval_requests');
      const q = query(
        approvalsRef,
        where('lottoId', '==', lottoId),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking existing approval request:', error);
      return false;
    }
  }

  /**
   * Vérifie si les numéros gagnants sont déjà définis pour un lotto
   */
  static async areWinningNumbersLocked(lottoId: string): Promise<{ locked: boolean; numbers?: number[] }> {
    try {
      // Vérifier d'abord si le lotto a déjà des numéros gagnants calculés
      const lottoRef = doc(db, 'lottos', lottoId);
      const lottoSnap = await getDoc(lottoRef);
      
      if (lottoSnap.exists()) {
        const lottoData = lottoSnap.data() as LottoEvent;
        if (lottoData.winningNumbers && lottoData.winningNumbers.length > 0) {
          return { locked: true, numbers: lottoData.winningNumbers };
        }
      }

      // Vérifier s'il y a une demande d'approbation avec des numéros gagnants
      const approvalsRef = collection(db, 'approval_requests');
      const q = query(
        approvalsRef,
        where('lottoId', '==', lottoId),
        where('isWinningNumbersLocked', '==', true)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const requestData = snapshot.docs[0].data() as ApprovalRequest;
        return { 
          locked: true, 
          numbers: requestData.winningNumbers || requestData.draw?.winningNumbers 
        };
      }
      
      return { locked: false };
    } catch (error) {
      console.error('Error checking winning numbers lock:', error);
      return { locked: false };
    }
  }

  static async calculatePrizes(
    lottoId: string,
    winningNumbers: number[],
    jackpotAmount: number,
    prizeDistribution: { numbers: number; amount: number }[]
  ): Promise<LottoPrize> {
    try {
      // Vérifier si les numéros gagnants sont verrouillés
      const lockStatus = await this.areWinningNumbersLocked(lottoId);
      if (lockStatus.locked && lockStatus.numbers) {
        // Vérifier si les numéros fournis correspondent aux numéros verrouillés
        const providedSorted = [...winningNumbers].sort((a, b) => a - b);
        const lockedSorted = [...lockStatus.numbers].sort((a, b) => a - b);
        
        if (JSON.stringify(providedSorted) !== JSON.stringify(lockedSorted)) {
          throw new Error('Les numéros gagnants ne peuvent pas être modifiés car ils sont déjà verrouillés');
        }
      }

      const participationsRef = collection(db, 'lotto_participations');
      const q = query(
        participationsRef, 
        where('lottoId', '==', lottoId),
        where('status', '==', 'active')
      );
      const participationsSnapshot = await getDocs(q);
      const participations = participationsSnapshot.docs;

      const batch = writeBatch(db);
      const winnersCount = new Map<number, number>();
      const winners: { userId: string; matchedNumbers: number; prize: number }[] = [];

      participations.forEach(doc => {
        const participation = doc.data() as LottoParticipation;
        const matchedNumbers = participation.selectedNumbers.filter(num => 
          winningNumbers.includes(num)
        ).length;

        const prizeLevel = prizeDistribution.find(p => p.numbers === matchedNumbers);
        const prizeAmount = prizeLevel ? prizeLevel.amount : 0;

        winnersCount.set(matchedNumbers, (winnersCount.get(matchedNumbers) || 0) + 1);

        if (prizeAmount > 0) {
          winners.push({
            userId: participation.userId,
            matchedNumbers,
            prize: prizeAmount
          });

          batch.update(doc.ref, {
            isWinner: true,
            winAmount: prizeAmount,
            matchedNumbers,
            status: 'completed'
          });
        } else {
          batch.update(doc.ref, {
            isWinner: false,
            winAmount: 0,
            matchedNumbers,
            status: 'completed',
            isLost: true
          });
        }
      });

      const lottoRef = doc(db, 'lottos', lottoId);
      batch.update(lottoRef, {
        prizeCalculated: true,
        winningNumbers,
        status: 'completed'
      });

      await batch.commit();

      const prizeResult: LottoPrize = {
        lottoId,
        calculationDate: ServerTimeService.getServerTimeISO(),
        winningNumbers,
        jackpotAmount,
        prizeDistribution,
        winners
      };

      const prizeRef = await addDoc(collection(db, 'lotto_prizes'), prizeResult);

      return {
        ...prizeResult,
        id: prizeRef.id
      };
    } catch (error) {
      console.error('Error calculating prizes:', error);
      throw new Error('Failed to calculate prizes');
    }
  }

  static async getPrizeResult(lottoId: string): Promise<LottoPrize | null> {
    try {
      const prizesRef = collection(db, 'lotto_prizes');
      const q = query(prizesRef, where('lottoId', '==', lottoId));
      const prizeSnapshot = await getDocs(q);

      if (prizeSnapshot.empty) {
        return null;
      }

      const prizeDoc = prizeSnapshot.docs[0];
      return {
        id: prizeDoc.id,
        ...prizeDoc.data()
      } as LottoPrize;
    } catch (error) {
      console.error('Error getting prize result:', error);
      throw new Error('Failed to get prize result');
    }
  }

  static async calculateMatchingStats(lottoId: string, winningNumbers: number[]): Promise<{ [key: number]: number }> {
    try {
      const participationsRef = collection(db, 'lotto_participations');
      const q = query(
        participationsRef, 
        where('lottoId', '==', lottoId),
        where('status', '==', 'active')
      );
      const participationsSnapshot = await getDocs(q);
      
      const stats: { [key: number]: number } = {};
      
      participationsSnapshot.docs.forEach(doc => {
        const participation = doc.data();
        const matchedNumbers = participation.selectedNumbers.filter((num: number) => 
          winningNumbers.includes(num)
        ).length;
        
        stats[matchedNumbers] = (stats[matchedNumbers] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Error calculating matching stats:', error);
      throw new Error('Failed to calculate matching statistics');
    }
  }

  static async createApprovalRequest(request: Omit<ApprovalRequest, 'id' | 'votes'>): Promise<string> {
    try {
      // Vérifier s'il y a déjà une demande d'approbation en cours pour ce lotto
      const hasExisting = await this.hasExistingApprovalRequest(request.lottoId);
      if (hasExisting) {
        throw new Error('Une demande d\'approbation est déjà en cours pour ce lotto. Veuillez attendre qu\'elle soit traitée avant d\'en créer une nouvelle.');
      }

      // Vérifier si les numéros gagnants sont déjà verrouillés
      const lockStatus = await this.areWinningNumbersLocked(request.lottoId);
      if (lockStatus.locked) {
        throw new Error('Les numéros gagnants sont déjà définis pour ce lotto et ne peuvent plus être modifiés.');
      }

      // Marquer les numéros gagnants comme verrouillés dans la demande
      const requestData = {
        ...request,
        request_type: 'prize_calculation',
        winningNumbers: request.draw?.winningNumbers,
        isWinningNumbersLocked: true
      };

      const docRef = await addDoc(collection(db, 'approval_requests'), {
        ...requestData
      });
      const now = ServerTimeService.getServerTimeISO();
      
      await addDoc(collection(db, 'approval_history'), {
        requestId: docRef.id,
        userId: request.requestedBy,
        action: 'created',
        details: {
          lottoId: request.lottoId,
          requestType: 'prize_calculation',
          winningNumbers: request.draw?.winningNumbers,
          message: 'Demande de calcul de gains créée avec numéros gagnants verrouillés'
        },
        createdAt: now
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating approval request:', error);
      throw error instanceof Error ? error : new Error('Erreur lors de la création de la demande d\'approbation');
    }
  }

  static async getApprovalRequests(): Promise<ApprovalRequest[]> {
    try {
      const approvalsRef = collection(db, 'approval_requests');
      const approvalsSnapshot = await getDocs(approvalsRef);
      
      const requests = await Promise.all(approvalsSnapshot.docs.map(async (approvalDoc) => {
        const requestData = approvalDoc.data() as ApprovalRequest;
        
        // Get votes for this request
        const votesRef = collection(db, 'approval_votes');
        const votesQuery = query(votesRef, where('requestId', '==', approvalDoc.id));
        const votesSnapshot = await getDocs(votesQuery);
        
        const votes = await Promise.all(votesSnapshot.docs.map(async (voteDoc) => {
          const voteData = voteDoc.data() as ApprovalVote;
          
          // Get manager email
          const managerRef = doc(db, 'users', voteData.managerId);
          const managerSnap = await getDoc(managerRef);
          const managerEmail = managerSnap.exists() ? managerSnap.data().email : 'Unknown';
          
          return {
            ...voteData,
            id: voteDoc.id,
            managerEmail
          };
        }));
        
        return {
          ...requestData,
          id: approvalDoc.id,
          votes
        };
      }));
      
      return requests;
    } catch (error) {
      console.error('Error getting approval requests:', error);
      throw new Error('Failed to get approval requests');
    }
  }

  static async getApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
    try {
      const requestRef = doc(db, 'approval_requests', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        return null;
      }
      
      const requestData = requestSnap.data() as ApprovalRequest;
      
      const votesRef = collection(db, 'approval_votes');
      const votesQuery = query(votesRef, where('requestId', '==', requestId));
      const votesSnapshot = await getDocs(votesQuery);
      
      const votes = await Promise.all(votesSnapshot.docs.map(async (voteDoc) => {
        const voteData = voteDoc.data() as ApprovalVote;
        
        const managerRef = doc(db, 'users', voteData.managerId);
        const managerSnap = await getDoc(managerRef);
        const managerEmail = managerSnap.exists() ? managerSnap.data().email : 'Unknown';
        
        return {
          ...voteData,
          id: voteDoc.id,
          managerEmail
        };
      }));
      
      const historyRef = collection(db, 'approval_history');
      const historyQuery = query(historyRef, where('requestId', '==', requestId));
      const historySnapshot = await getDocs(historyQuery);
      
      const history = await Promise.all(historySnapshot.docs.map(async (historyDoc) => {
        const historyData = historyDoc.data() as ApprovalHistory;
        
        const userRef = doc(db, 'users', historyData.userId);
        const userSnap = await getDoc(userRef);
        const userEmail = userSnap.exists() ? userSnap.data().email : 'Unknown';
        
        return {
          ...historyData,
          id: historyDoc.id,
          userEmail
        };
      }));
      
      return {
        ...requestData,
        id: requestId,
        votes,
        history
      };
    } catch (error) {
      console.error('Error getting approval request:', error);
      throw new Error('Failed to get approval request');
    }
  }

  static async voteOnRequest(
    requestId: string, 
    managerId: string, 
    decision: 'approve' | 'reject', 
    comment?: string
  ): Promise<void> {
    try {
      const requestRef = doc(db, 'approval_requests', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Approval request not found');
      }
      
      const requestData = requestSnap.data() as ApprovalRequest;
      if (requestData.status !== 'pending') {
        throw new Error('This request has already been processed');
      }
      const now = ServerTimeService.getServerTimeISO();
      
      const votesRef = collection(db, 'approval_votes');
      const existingVoteQuery = query(
        votesRef, 
        where('requestId', '==', requestId),
        where('managerId', '==', managerId)
      );
      const existingVoteSnap = await getDocs(existingVoteQuery);
      
      const voteData: Omit<ApprovalVote, 'id'> = {
        requestId,
        managerId,
        decision,
        comment: comment || null,
        createdAt: now
      };
      
      if (!existingVoteSnap.empty) {
        const voteRef = doc(db, 'approval_votes', existingVoteSnap.docs[0].id);
        await updateDoc(voteRef, voteData);
      } else {
        await addDoc(collection(db, 'approval_votes'), voteData);
      }
      
      await addDoc(collection(db, 'approval_history'), {
        requestId,
        userId: managerId,
        action: decision === 'approve' ? 'approved' : 'rejected',
        details: { comment: comment || null },
        createdAt: now
      });
      
      const allVotesQuery = query(votesRef, where('requestId', '==', requestId));
      const allVotesSnap = await getDocs(allVotesQuery);
      
      const votes = allVotesSnap.docs.map(doc => doc.data() as ApprovalVote);
      const approvalCount = votes.filter(v => v.decision === 'approve').length;
      const rejectionCount = votes.filter(v => v.decision === 'reject').length;
      
      if (rejectionCount > 0) {
        // Si rejeté, déverrouiller les numéros gagnants
        await updateDoc(requestRef, {
          status: 'rejected',
          rejectedAt: now,
          rejectedBy: managerId,
          reason: 'Rejected by at least one manager',
          isWinningNumbersLocked: false
        });
        
        await updateDoc(requestRef, {
          status: 'rejected',
          rejectedAt: now,
          rejectedBy: managerId,
          reason: 'Rejected by at least one manager'
        });
        
        await addDoc(collection(db, 'approval_history'), {
          requestId,
          userId: managerId,
          action: 'processed',
          details: {
            finalStatus: 'rejected',
            reason: 'Rejected by at least one manager',
            message: 'Numéros gagnants déverrouillés suite au rejet'
          },
          createdAt: now
        });
      } else if (approvalCount >= 2) {
        await updateDoc(requestRef, {
          status: 'approved',
          approvedAt: now,
          approvedBy: managerId
        });
        
        await addDoc(collection(db, 'approval_history'), {
          requestId,
          userId: managerId,
          action: 'processed',
          details: {
            finalStatus: 'approved',
            reason: 'Approved by at least two managers',
            message: 'Numéros gagnants confirmés et gains calculés'
          },
          createdAt: now
        });
        
        // Vérifier le type de demande et traiter en conséquence
        if (requestData.request_type === 'prize_calculation') {
          await this.processPrizeCalculation(requestId);
        }
      }
    } catch (error) {
      console.error('Error voting on request:', error);
      throw error;
    }
  }

  static async approveRequest(requestId: string, approverId: string): Promise<void> {
    try {
      await this.voteOnRequest(requestId, approverId, 'approve');
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  }

  static async rejectRequest(requestId: string, rejectorId: string, reason: string): Promise<void> {
    try {
      await this.voteOnRequest(requestId, rejectorId, 'reject', reason);
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }

  static async processPrizeCalculation(requestId: string): Promise<void> {
    try {
      const requestRef = doc(db, 'approval_requests', requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) {
        throw new Error('Approval request not found');
      }
      
      const request = requestSnap.data() as ApprovalRequest;
      
      if (request.status !== 'approved') {
        throw new Error('Cannot process unapproved request');
      }
      
      const lottoId = request.lottoId;
      const drawData = request.draw;
      
      await this.calculatePrizes(
        lottoId,
        drawData.winningNumbers,
        drawData.jackpotAmount,
        drawData.prizeDistribution
      );
      
      await updateDoc(requestRef, {
        processed: true,
        processedAt: ServerTimeService.getServerTimeISO()
      });
      
      await addDoc(collection(db, 'approval_history'), {
        requestId,
        userId: request.approvedBy || '',
        action: 'processed',
        details: {
          lottoId,
          winningNumbers: drawData.winningNumbers,
          message: 'Gains calculés et distribués avec succès'
        },
        createdAt: ServerTimeService.getServerTimeISO()
      });
    } catch (error) {
      console.error('Error processing prize calculation:', error);
      throw error;
    }
  }

  static async getApprovalHistory(requestId: string): Promise<ApprovalHistory[]> {
    try {
      const historyRef = collection(db, 'approval_history');
      const q = query(
        historyRef,
        where('requestId', '==', requestId)
      );
      
      const snapshot = await getDocs(q);
      
      const history = await Promise.all(snapshot.docs.map(async (historyDoc) => {
        const historyData = historyDoc.data() as ApprovalHistory;
        
        const userRef = doc(db, 'users', historyData.userId);
        const userSnap = await getDoc(userRef);
        const userEmail = userSnap.exists() ? userSnap.data().email : 'Unknown';
        
        return {
          ...historyData,
          id: historyDoc.id,
          userEmail
        };
      }));
      
      return history.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting approval history:', error);
      throw new Error('Failed to get approval history');
    }
  }
}