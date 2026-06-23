import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, AlertCircle } from 'lucide-react';
import BaseDashboard from '../BaseDashboard';
import { useLottoParticipants } from '../../../hooks/useLottoParticipants';
import { useLottoPayment } from '../../../hooks/useLottoPayment.tsx';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingState from '../../../components/LoadingState';
import ErrorAlert from '../../../components/ErrorAlert';
import TicketList from '../../../components/lotto/ticket/TicketList';
import ScannerModal from '../../../components/lotto/ticket/ScannerModal';
import PaymentConfirmationModal from '../../../components/lotto/ticket/PaymentConfirmationModal';
import TicketSearch from '../../../components/lotto/ticket/TicketSearch';
import type { LottoParticipation } from '../../../services/lotto/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function LottoTickets() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    participants, 
    scannedTicket,
    setScannedTicket,
    fetchTicketById,
    loading, 
    error: fetchError, 
    hasMore,
    loadingMore,
    loadMoreParticipants,
    cancelParticipation, 
    refreshParticipants 
  } = useLottoParticipants();
  const { processPayment, isSubmitting, error: paymentError, setError } = useLottoPayment();
  const [ticketNumber, setTicketNumber] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<LottoParticipation | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState<LottoParticipation | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Combiner les participants locaux avec le ticket scanné
  const allTickets = React.useMemo(() => {
    const tickets = [...participants];
    
    // Ajouter le ticket scanné s'il existe et n'est pas déjà dans la liste
    if (scannedTicket && !tickets.find(t => t.id === scannedTicket.id)) {
      tickets.unshift(scannedTicket); // Ajouter en premier
    }
    
    return tickets;
  }, [participants, scannedTicket]);

  // Optimiser l'affichage des tickets
  const displayedTickets = React.useMemo(() => {
    if (!ticketNumber.trim()) {
      // Sans recherche, afficher uniquement les tickets en attente
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Filtrer uniquement les tickets en attente
      const pendingTickets = allTickets.filter(ticket => 
        ticket.status === 'active'
      );
      
      // Séparer les tickets en attente du jour et les autres
      const todayPendingTickets = pendingTickets.filter(ticket => {
        const ticketDate = new Date(ticket.purchaseDate);
        return ticketDate >= today && ticketDate < tomorrow;
      });
      
      const otherPendingTickets = pendingTickets.filter(ticket => {
        const ticketDate = new Date(ticket.purchaseDate);
        return ticketDate < today || ticketDate >= tomorrow;
      });
      
      // Trier chaque groupe par date (plus récent en premier)
      const sortedTodayPendingTickets = todayPendingTickets.sort((a, b) => 
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
      );
      
      const sortedOtherPendingTickets = otherPendingTickets.sort((a, b) => 
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
      );
      
      // Combiner : tous les tickets en attente du jour + maximum 20 tickets en attente au total
      const finalPendingTickets = [...sortedTodayPendingTickets, ...sortedOtherPendingTickets.slice(0, Math.max(0, 20 - sortedTodayPendingTickets.length))];
      return finalPendingTickets;
    }
    
    return allTickets.filter(participation => 
      participation.id?.toLowerCase().includes(ticketNumber.toLowerCase())
    );
  }, [allTickets, ticketNumber]);

  const handleSearch = async (searchTerm: string) => {
    setTicketNumber(searchTerm);
    
    if (searchTerm.trim()) {
      setIsSearching(true);
      try {
        await fetchTicketById(searchTerm);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setScannedTicket(null);
    }
  };

  const handlePayWinnings = (ticket: LottoParticipation) => {
    setSelectedTicket(ticket);
    setShowPaymentModal(true);
  };

  const handleCancelTicket = async (ticket: LottoParticipation) => {
    try {
      setTicketToCancel(ticket);
      setShowCancelConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'annulation");
    }
  };

  const confirmCancellation = async () => {
    if (!ticketToCancel?.id || !currentUser) return;
    
    // Empêcher les clics multiples
    if (isCancelling) return;

    try {
      setIsCancelling(true);
      await cancelParticipation(ticketToCancel.id, currentUser.uid);
      // Rediriger vers la page de succès avec l'ID du ticket
      navigate('/cancellation-success', { 
        state: { ticketNumber: ticketToCancel.id }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'annulation");
    } finally {
      setIsCancelling(false);
      setShowCancelConfirmation(false);
      setTicketToCancel(null);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedTicket) return;

    try {
      const success = await processPayment(selectedTicket);
      if (success) {
        setShowPaymentModal(false);
        setSelectedTicket(null);

        // Rediriger vers la page de succès
        navigate('/payment-success', {
          state: {
            amount: selectedTicket.winAmount,
            ticketNumber: selectedTicket.id
          }
        });
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      
      // Ne pas définir d'erreur ici car la redirection sera gérée par le modal
      // Les erreurs spéciales comme INSUFFICIENT_BALANCE sont traitées dans le modal
    }
  };
  
  const handleScan = async (data: string) => {
    try {
      setScanError(null);
      setScannedTicket(null); // Réinitialiser le ticket scanné précédent
      
      // Utiliser directement l'ID brut du QR code
      if (!data) {
        throw new Error('QR code invalide ou vide');
      }
      
      // Nettoyer l'ID en supprimant les espaces et caractères indésirables
      const cleanId = data.trim();
      
      let ticketId = cleanId;
      
      try {
        // Essayer de parser comme JSON pour extraire l'ID si c'est un objet
        const jsonData = JSON.parse(cleanId);
        if (jsonData.ticketNumber) {
          ticketId = jsonData.ticketNumber;
        } else if (jsonData.id) {
          ticketId = jsonData.id;
        }
      } catch (e) {
        // Ce n'est pas du JSON, utiliser l'ID nettoyé
      }
      
      // Rechercher le ticket par son ID
      const ticket = await fetchTicketById(ticketId);
      if (ticket) {
        setTicketNumber(ticketId);
      } else {
        throw new Error('Ticket non trouvé');
      }
      
      setShowScanner(false);
    } catch (err) {
      console.error('Error scanning ticket:', err);
      setScanError(err instanceof Error ? err.message : 'Erreur lors du scan du QR code');
    }
  };

  if (loading) {
    return (
      <BaseDashboard title="Tickets Lotto">
        <LoadingState message="Chargement des tickets..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Tickets Lotto">
      <div className="space-y-6">
        {/* Barre de recherche et scan */}
        <div className="flex flex-col md:flex-row gap-4">
          <TicketSearch 
            value={ticketNumber}
            onChange={handleSearch}
            placeholder="Rechercher un ticket spécifique..."
          />
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <QrCode className="w-5 h-5" />
            Scanner un ticket
          </button>
        </div>

        {/* Messages d'erreur */}
        {fetchError && <ErrorAlert message={fetchError} />}
        {scanError && <ErrorAlert message={scanError} />}
        {paymentError && <ErrorAlert message={paymentError} />}

        {/* Liste des tickets */}
        {isSearching ? (
          <LoadingState message="Recherche en cours..." />
        ) : (
        <TicketList 
          tickets={displayedTickets}
          onViewTicket={() => {}}
          onPayWinnings={handlePayWinnings}
          onCancelTicket={handleCancelTicket}
        />
        )}
        
        {/* Message informatif */}
        {!ticketNumber && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800">
              Affichage des tickets en attente uniquement. Tickets d'aujourd'hui en priorité, puis les plus récents. Utilisez la recherche pour trouver un ticket spécifique.
            </p>
          </div>
        )}
        
        {/* Bouton "Charger plus" */}
        {hasMore && !loading && !ticketNumber && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMoreParticipants}
              disabled={loadingMore}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Chargement...</span>
                </>
              ) : (
                'Charger plus de tickets'
              )}
            </button>
          </div>
        )}

        {/* Modals */}
        <ScannerModal
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onScan={handleScan}
          error={scanError}
          onError={setScanError}
        />

        {selectedTicket && showPaymentModal && (
          <PaymentConfirmationModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedTicket(null);
              setError(null);
            }}
            onConfirm={handleConfirmPayment}
            amount={selectedTicket.winAmount || 0}
            currency={selectedTicket.currency}
            isSubmitting={isSubmitting}
            error={paymentError}
            ticketNumber={selectedTicket.id}
          />
        )}

        {/* Modal de confirmation d'annulation */}
        {showCancelConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Confirmer l'annulation</h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir annuler ce ticket ? Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowCancelConfirmation(false);
                    setTicketToCancel(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmCancellation}
                  disabled={isCancelling}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Annulation...</span>
                    </>
                  ) : (
                    'Confirmer l\'annulation'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseDashboard>
  );
}