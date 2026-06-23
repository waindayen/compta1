import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Service pour gérer la synchronisation avec l'heure du serveur
 */
export class ServerTimeService {
  private static timeOffset: number = 0;
  private static lastSyncTime: number = 0;
  private static isSyncing: boolean = false;
  private static SYNC_INTERVAL: number = 1000 * 60 * 30; // 30 minutes
  private static TIME_DOC_PATH = 'site_config/server_time';

  /**
   * Synchronise l'heure locale avec l'heure du serveur
   */
  static async syncWithServerTime(): Promise<void> {
    if (this.isSyncing) return;
    
    try {
      this.isSyncing = true;
      console.log('Synchronisation avec l\'heure du serveur...');
      
      // Récupérer l'heure actuelle du client avant la requête
      const clientTimeBefore = Date.now();
      
      try {
        // Créer ou mettre à jour un document avec un timestamp serveur
        const timeDocRef = doc(db, this.TIME_DOC_PATH);
        
        // Récupérer le document existant
        let timeDoc = await getDoc(timeDocRef);
        
        // Si le document n'existe pas ou n'a pas de timestamp, le créer
        if (!timeDoc.exists() || !timeDoc.data()?.timestamp) {
          console.log('Création du document de synchronisation temporelle...');
          await setDoc(timeDocRef, {
            timestamp: serverTimestamp(),
            lastUpdate: serverTimestamp()
          });
          
          // Attendre un court délai pour que le timestamp soit écrit
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Récupérer le document mis à jour
          timeDoc = await getDoc(timeDocRef);
          
          if (!timeDoc.exists() || !timeDoc.data()?.timestamp) {
            throw new Error('Impossible de créer ou récupérer l\'heure du serveur');
          }
        }
        
        // Récupérer le timestamp serveur
        const serverTime = timeDoc.data().timestamp.toMillis();
        
        // Récupérer l'heure actuelle du client après la requête
        const clientTimeAfter = Date.now();
        
        // Calculer le temps de latence (approximatif)
        const latency = (clientTimeAfter - clientTimeBefore) / 2;
        
        // Calculer le décalage entre l'heure du serveur et l'heure locale
        // En tenant compte de la latence
        this.timeOffset = serverTime + latency - clientTimeAfter;
        
        this.lastSyncTime = clientTimeAfter;
        console.log(`Synchronisation réussie. Décalage: ${this.timeOffset}ms, Latence: ${latency}ms`);
        
      } catch (permissionError) {
        // Si erreur de permissions, utiliser un fallback sans synchronisation
        console.warn('Impossible de synchroniser avec le serveur (permissions insuffisantes). Utilisation de l\'heure locale.', permissionError);
        this.timeOffset = 0;
        this.lastSyncTime = Date.now();
      }
      
    } catch (error) {
      console.error('Erreur lors de la synchronisation avec l\'heure du serveur:', error);
      // En cas d'erreur, utiliser l'heure locale comme fallback
      this.timeOffset = 0;
      this.lastSyncTime = Date.now();
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Obtient l'heure actuelle du serveur
   * @returns Timestamp actuel du serveur
   */
  static getServerTime(): Date {
    // Si la dernière synchronisation est trop ancienne, déclencher une nouvelle synchronisation
    if (Date.now() - this.lastSyncTime > this.SYNC_INTERVAL) {
      this.syncWithServerTime().catch(console.error);
    }
    
    // Retourner l'heure UTC ajustée avec le décalage pour éviter les problèmes de fuseau horaire
    const serverTime = new Date(Date.now() + this.timeOffset);
    // Forcer l'utilisation de UTC pour éviter les décalages horaires
    return new Date(serverTime.getTime() - (serverTime.getTimezoneOffset() * 60000));
  }

  /**
   * Obtient un timestamp ISO de l'heure du serveur
   * @returns ISO string en UTC
   */
  static getServerTimeISO(): string {
    // Utiliser directement UTC pour éviter les problèmes de fuseau horaire
    const serverTime = new Date(Date.now() + this.timeOffset);
    return serverTime.toISOString();
  }

  /**
   * Obtient l'heure du serveur formatée pour les inputs datetime-local
   * @returns String formaté pour datetime-local
   */
  static getServerTimeForInput(): string {
    const serverTime = this.getServerTime();
    // Convertir en heure locale pour l'affichage dans les inputs
    const localTime = new Date(serverTime.getTime() - (serverTime.getTimezoneOffset() * 60000));
    return localTime.toISOString().slice(0, 16);
  }

  /**
   * Vérifie si une date est dans le futur selon l'heure du serveur
   * @param date Date à vérifier
   * @returns true si la date est dans le futur
   */
  static isInFuture(date: Date | string): boolean {
    const compareDate = typeof date === 'string' ? new Date(date) : date;
    return compareDate > this.getServerTime();
  }

  /**
   * Vérifie si une date est dans le passé selon l'heure du serveur
   * @param date Date à vérifier
   * @returns true si la date est dans le passé
   */
  static isInPast(date: Date | string): boolean {
    const compareDate = typeof date === 'string' ? new Date(date) : date;
    return compareDate < this.getServerTime();
  }

  /**
   * Initialise le service de synchronisation
   */
  static initialize(): void {
    // Synchroniser immédiatement
    this.syncWithServerTime().catch(console.error);
    
    // Configurer une synchronisation périodique
    setInterval(() => {
      this.syncWithServerTime().catch(console.error);
    }, this.SYNC_INTERVAL);
  }
}