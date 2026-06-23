import { collection, query, where, orderBy, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Bet } from './types';

export class BetRepository {
  private static COLLECTION = 'bets';

  static async createBet(bet: Omit<Bet, 'id'>): Promise<string> {
    try {
      // Ajouter les timestamps
      const betData = {
        ...bet,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), betData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating bet:', error);
      throw error;
    }
  }

  static async getUserBets(userId: string): Promise<Bet[]> {
    try {
      const betsRef = collection(db, this.COLLECTION);
      const q = query(
        betsRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bet[];
    } catch (error) {
      console.error('Error fetching user bets:', error);
      throw error;
    }
  }
}