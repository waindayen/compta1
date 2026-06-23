import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LottoEvent, LottoParticipation } from './types';

export interface LottoDraw {
  id?: string;
  lottoId: string;
  drawDate: string;
  winningNumbers: number[];
  prizes: {
    numbers: number;
    amount: number;
  }[];
  totalPrizePool: number;
  winners: {
    userId: string;
    matchedNumbers: number;
    prize: number;
  }[];
}

export class LottoDrawService {
  static async performDraw(lottoId: string, prizeDistribution: { [key: number]: number }): Promise<LottoDraw> {
    try {
      // Générer les numéros gagnants (6 numéros uniques entre 1 et 49)
      const winningNumbers: number[] = [];
      while (winningNumbers.length < 6) {
        const num = Math.floor(Math.random() * 49) + 1;
        if (!winningNumbers.includes(num)) {
          winningNumbers.push(num);
        }
      }
      winningNumbers.sort((a, b) => a - b);

      // Récupérer toutes les participations pour ce lotto
      const participationsRef = collection(db, 'lotto_participations');
      const q = query(participationsRef, where('lottoId', '==', lottoId));
      const participationsSnapshot = await getDocs(q);
      const participations = participationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LottoParticipation[];

      // Calculer les gains pour chaque participant
      const winners = participations.map(participation => {
        const matchedNumbers = participation.selectedNumbers.filter(num => 
          winningNumbers.includes(num)
        ).length;

        const prizePercentage = prizeDistribution[matchedNumbers] || 0;
        const prize = (participation.ticketPrice * participations.length * prizePercentage) / 100;

        return {
          userId: participation.userId,
          matchedNumbers,
          prize
        };
      }).filter(winner => winner.prize > 0);

      // Calculer le total des gains
      const totalPrizePool = participations.reduce((total, p) => total + p.ticketPrice, 0);

      // Créer l'objet du tirage
      const draw: LottoDraw = {
        lottoId,
        drawDate: new Date().toISOString(),
        winningNumbers,
        prizes: Object.entries(prizeDistribution).map(([numbers, percentage]) => ({
          numbers: parseInt(numbers),
          amount: (totalPrizePool * percentage) / 100
        })),
        totalPrizePool,
        winners
      };

      // Sauvegarder le tirage
      const drawRef = await addDoc(collection(db, 'lotto_draws'), draw);

      // Mettre à jour le statut du lotto
      const lottoRef = doc(db, 'lottos', lottoId);
      await updateDoc(lottoRef, { status: 'completed' });

      return {
        ...draw,
        id: drawRef.id
      };
    } catch (error) {
      console.error('Error performing draw:', error);
      throw new Error('Failed to perform lotto draw');
    }
  }

  static async getDrawResult(lottoId: string): Promise<LottoDraw | null> {
    try {
      const drawsRef = collection(db, 'lotto_draws');
      const q = query(drawsRef, where('lottoId', '==', lottoId));
      const drawSnapshot = await getDocs(q);

      if (drawSnapshot.empty) {
        return null;
      }

      const drawDoc = drawSnapshot.docs[0];
      return {
        id: drawDoc.id,
        ...drawDoc.data()
      } as LottoDraw;
    } catch (error) {
      console.error('Error getting draw result:', error);
      throw new Error('Failed to get draw result');
    }
  }
}