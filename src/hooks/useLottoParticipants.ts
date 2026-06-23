import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where, limit, orderBy, doc, getDoc, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LottoService } from '../services/lotto';
import { useAuth } from '../contexts/AuthContext';
import type { LottoParticipation } from '../services/lotto/types';

const PAGE_SIZE = 50;

export function useLottoParticipants() {
  const { currentUser } = useAuth();
  const [participants, setParticipants] = useState<LottoParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [scannedTicket, setScannedTicket] = useState<LottoParticipation | null>(null);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Charger les tickets de l'utilisateur (chargement initial)
  const fetchUserTickets = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Chargement des tickets pour:', currentUser.uid);

      // Requête avec limite de 50 documents
      const participationsRef = collection(db, 'lotto_participations');
      const q = query(
        participationsRef,
        where('userId', '==', currentUser.uid),
        where('status', '!=', 'cancelled'),
        orderBy('status'),
        orderBy('purchaseDate', 'desc'),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      console.log('Tickets trouvés:', snapshot.size);

      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LottoParticipation[];

      setParticipants(ticketsData);

      // Sauvegarder le dernier document pour la pagination
      if (snapshot.docs.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } else {
        lastDocRef.current = null;
        setHasMore(false);
      }

    } catch (err) {
      console.error('Error fetching user tickets:', err);
      setError('Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  };

  // Rechercher un ticket par ID
  const fetchTicketById = async (ticketId: string): Promise<LottoParticipation | null> => {
    try {
      setError(null);
      console.log('Recherche du ticket:', ticketId);
      
      const ticketRef = doc(db, 'lotto_participations', ticketId);
      const ticketSnap = await getDoc(ticketRef);
      
      if (ticketSnap.exists()) {
        const ticketData = {
          id: ticketSnap.id,
          ...ticketSnap.data()
        } as LottoParticipation;
        
        console.log('Ticket trouvé:', ticketData);
        setScannedTicket(ticketData);
        return ticketData;
      } else {
        console.log('Ticket non trouvé');
        setError('Ticket non trouvé');
        return null;
      }
    } catch (err) {
      console.error('Error fetching ticket by ID:', err);
      setError('Erreur lors de la récupération du ticket');
      return null;
    }
  };

  // Annuler une participation
  const cancelParticipation = async (participationId: string, cancelledBy: string) => {
    try {
      setError(null);
      await LottoService.cancelParticipation(participationId, cancelledBy);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'annulation du ticket';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Charger plus de tickets (pagination)
  const loadMoreParticipants = async () => {
    if (!currentUser || !lastDocRef.current || loadingMore || !hasMore) {
      return;
    }

    try {
      setLoadingMore(true);
      setError(null);

      console.log('Chargement de tickets supplémentaires...');

      // Requête avec pagination (startAfter)
      const participationsRef = collection(db, 'lotto_participations');
      const q = query(
        participationsRef,
        where('userId', '==', currentUser.uid),
        where('status', '!=', 'cancelled'),
        orderBy('status'),
        orderBy('purchaseDate', 'desc'),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      console.log('Tickets supplémentaires trouvés:', snapshot.size);

      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LottoParticipation[];

      // Ajouter les nouveaux tickets à la liste existante
      setParticipants(prev => [...prev, ...ticketsData]);

      // Mettre à jour le curseur pour la pagination
      if (snapshot.docs.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }

    } catch (err) {
      console.error('Error loading more tickets:', err);
      setError('Erreur lors du chargement de tickets supplémentaires');
    } finally {
      setLoadingMore(false);
    }
  };

  // Charger les tickets au montage du composant
  useEffect(() => {
    console.log('Hook useLottoParticipants - currentUser:', currentUser?.uid);
    fetchUserTickets();
  }, [currentUser]);

  return {
    participants,
    scannedTicket,
    setScannedTicket,
    fetchTicketById,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMoreParticipants,
    cancelParticipation,
    refreshParticipants: fetchUserTickets
  };
}