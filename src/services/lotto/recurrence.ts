import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LottoEvent } from './types';
import { LottoService } from '.';
import { DateService } from '../dateService';

export class LottoRecurrenceService {
  private static COLLECTION_NAME = 'lottos';
  private static isProcessing = false;
  private static processingQueue: Promise<void> | null = null;

  /**
   * Vérifie et crée les lottos récurrents basés sur la fréquence configurée
   */
  static async checkAndCreateRecurringLottos(): Promise<void> {
    // Si un traitement est déjà en cours, attendre qu'il se termine
    if (this.isProcessing && this.processingQueue) {
      console.log('[Récurrence] Un traitement est déjà en cours, mise en file d\'attente...');
      return this.processingQueue;
    }

    // Marquer le traitement comme en cours
    this.isProcessing = true;

    // Créer une promesse pour le traitement actuel
    this.processingQueue = this._executeRecurrenceCheck();

    try {
      await this.processingQueue;
    } finally {
      // Libérer le verrou
      this.isProcessing = false;
      this.processingQueue = null;
    }
  }

  /**
   * Exécution réelle de la vérification de récurrence
   */
  private static async _executeRecurrenceCheck(): Promise<void> {
    console.log('[Récurrence] Début de la vérification...');
    const now = DateService.now();

    // Récupérer tous les lottos terminés avec une fréquence
    const lottosRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      lottosRef,
      where('status', '==', 'completed'),
      where('frequency', 'in', ['daily', 'weekly', 'yearly'])
    );

    const querySnapshot = await getDocs(q);
    const lottos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as LottoEvent[];

    console.log(`[Récurrence] Trouvé ${lottos.length} lottos récurrents terminés`);

    // Pour chaque lotto récurrent terminé, vérifier s'il faut créer un nouveau lotto
    for (const lotto of lottos) {
      await this.processRecurringLotto(lotto);
    }

    console.log('[Récurrence] Vérification terminée');
  }
  
  /**
   * Traite un lotto récurrent et crée le prochain si nécessaire
   */
  private static async processRecurringLotto(lotto: LottoEvent): Promise<void> {
    try {
      const now = DateService.now();
      const endDate = DateService.parse(lotto.endDate);
      
      // Vérifier si le lotto est terminé et si un nouveau lotto doit être créé
      if (now > endDate) {
        // Vérifier si un lotto récurrent a déjà été créé
        const nextLottoExists = await this.checkIfNextLottoExists(lotto);
        
        if (!nextLottoExists) {
          console.log(`Création d'un nouveau lotto récurrent pour ${lotto.eventName}`);
          await this.createNextRecurringLotto(lotto);
        }
      }
    } catch (error) {
      console.error(`Erreur lors du traitement du lotto récurrent ${lotto.id}:`, error);
    }
  }
  
  /**
   * Vérifie si un lotto récurrent a déjà été créé
   */
  private static async checkIfNextLottoExists(lotto: LottoEvent): Promise<boolean> {
    try {
      const { nextStartDate, nextEndDate } = this.calculateNextDates(lotto);
      const nextStartISO = nextStartDate.toISOString();
      const nextEndISO = nextEndDate.toISOString();

      console.log(`[Récurrence] Vérification pour: ${lotto.eventName}`);
      console.log(`[Récurrence] Recherche - Début: ${nextStartISO}, Fin: ${nextEndISO}`);

      const lottosRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        lottosRef,
        where('eventName', '==', lotto.eventName),
        where('frequency', '==', lotto.frequency),
        where('startDate', '==', nextStartISO)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.log(`[Récurrence] Lotto déjà existant pour ${lotto.eventName} à ${nextStartISO}`);
        return true;
      }

      console.log(`[Récurrence] Aucun doublon trouvé`);
      return false;
    } catch (error) {
      console.error(`[Récurrence] Erreur lors de la vérification:`, error);
      return true;
    }
  }
  
  /**
   * Crée le prochain lotto récurrent
   */
  private static async createNextRecurringLotto(lotto: LottoEvent): Promise<string> {
    try {
      const { nextStartDate, nextEndDate } = this.calculateNextDates(lotto);

      const startISO = DateService.toISOString(nextStartDate);
      const endISO = DateService.toISOString(nextEndDate);

      console.log(`[Récurrence] Création du lotto: ${lotto.eventName}`);
      console.log(`[Récurrence] Dates calculées - Début: ${startISO}, Fin: ${endISO}`);

      const newLottoData: Omit<LottoEvent, 'id' | 'createdAt' | 'status'> = {
        eventName: lotto.eventName,
        startDate: startISO,
        endDate: endISO,
        ticketPrice: lotto.ticketPrice,
        currency: lotto.currency,
        frequency: lotto.frequency,
        numbersToSelect: lotto.numbersToSelect,
        gridsPerTicket: lotto.gridsPerTicket,
        isEnabled: lotto.isEnabled !== false
      };

      const newLottoId = await LottoService.createLotto(newLottoData);
      console.log(`[Récurrence] Lotto créé avec l'ID ${newLottoId}`);
      return newLottoId;
    } catch (error) {
      console.error(`[Récurrence] Erreur lors de la création:`, error);
      throw error;
    }
  }
  
  /**
   * Calcule les dates du prochain lotto en fonction de la fréquence
   */
  private static calculateNextDates(lotto: LottoEvent): { nextStartDate: Date, nextEndDate: Date } {
    const startDate = DateService.parse(lotto.startDate);
    const endDate = DateService.parse(lotto.endDate);
    const duration = DateService.diff(endDate, startDate);

    console.log(`[Récurrence] Dates originales - Début: ${lotto.startDate}, Fin: ${lotto.endDate}`);
    console.log(`[Récurrence] Durée: ${duration}ms (${duration / 1000 / 60} minutes)`);

    let nextStartDate: Date;

    switch (lotto.frequency) {
      case 'daily':
        nextStartDate = DateService.addDays(startDate, 1);
        break;

      case 'weekly':
        nextStartDate = DateService.addWeeks(startDate, 1);
        break;

      case 'yearly':
        nextStartDate = DateService.addYears(startDate, 1);
        break;

      default:
        nextStartDate = startDate;
    }

    const nextEndDate = new Date(nextStartDate.getTime() + duration);

    console.log(`[Récurrence] Nouvelles dates calculées - Début: ${DateService.toISOString(nextStartDate)}, Fin: ${DateService.toISOString(nextEndDate)}`);

    return { nextStartDate, nextEndDate };
  }

  /**
   * Exécute manuellement la vérification des récurrences pour un lotto spécifique
   */
  static async manuallyCheckRecurrence(lottoId: string): Promise<boolean> {
    try {
      const lotto = await LottoService.getLotto(lottoId);
      if (!lotto) {
        throw new Error('Lotto non trouvé');
      }

      if (lotto.frequency === 'once') {
        throw new Error('Ce lotto n\'est pas récurrent');
      }

      await this.processRecurringLotto(lotto);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la vérification manuelle de la récurrence pour ${lottoId}:`, error);
      throw error;
    }
  }
}