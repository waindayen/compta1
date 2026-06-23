import React from 'react';
import { Eye, User, Ticket, XCircle, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { differenceInMinutes } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { PaymentLimitService } from '../../../services/admin/paymentLimits';
import { AgentWalletService } from '../../../services/agent/wallet';
import { StaffWalletService } from '../../../services/staff/wallet';

interface Participant {
  id: string;
  userId: string;
  lottoId: string;
  selectedNumbers: number[];
  purchaseDate: string;
  ticketPrice: number;
  currency: string;
  isWinner?: boolean;
  winAmount?: number;
  paid?: boolean;
  paidAt?: string;
  status?: 'active' | 'completed' | 'cancelled';
  isLost?: boolean;
}

interface TicketListProps {
  tickets: Participant[];
  onViewTicket: (ticket: Participant) => void;
  onPayWinnings?: (ticket: Participant) => void;
  onCancelTicket?: (ticket: Participant) => void;
}

const CANCELLATION_WINDOW_MINUTES = 15;

export default function TicketList({
  tickets,
  onViewTicket,
  onPayWinnings,
  onCancelTicket
}: TicketListProps) {
  const { currentUser, userData } = useAuth();
  const [paymentLimits, setPaymentLimits] = useState<{[key: string]: number}>({});
  const [canProcessPayment, setCanProcessPayment] = useState<boolean>(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  useEffect(() => {
    // Charger les limites de paiement pour l'agent actuel (seulement si c'est un agent)
    const loadPaymentLimit = async () => {
      if (currentUser && userData?.role === 'agentuser') {
        try {
          const limit = await PaymentLimitService.getAgentLimit(currentUser.uid);
          if (limit) {
            setPaymentLimits({ [currentUser.uid]: limit.maxPaymentAmount });
          }
          
          // Charger le solde du portefeuille de l'agent
          const wallet = await AgentWalletService.getWallet(currentUser.uid);
          if (wallet) {
            setWalletBalance(wallet.balance);
          }
        } catch (error) {
          console.error("Erreur lors du chargement des limites de paiement:", error);
        }
      }
    };
    
    // Vérifier si le staff a le droit de payer
    const checkPaymentPermission = async () => {
      if (currentUser && userData?.role === 'staffuser') {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Si canProcessPayment est explicitement false, désactiver le paiement
            if (userData.canProcessPayment === false) {
              setCanProcessPayment(false);
            } else {
              setCanProcessPayment(true);
            }
          }
          
          // Charger le solde du portefeuille du staff
          const wallet = await StaffWalletService.getWallet(currentUser.uid);
          if (wallet) {
            setWalletBalance(wallet.balance);
          }
        } catch (err) {
          console.error('Error checking payment permission:', err);
          // Par défaut, autoriser le paiement en cas d'erreur
          setCanProcessPayment(true);
        }
      }
    };
    
    loadPaymentLimit();
    checkPaymentPermission();
  }, [currentUser, userData]);

  // Déterminer les tickets à afficher
  const displayedTickets = (() => {
    // Si une recherche est en cours, afficher tous les résultats
    const hasSearchResults = tickets.some(ticket => ticket.id && ticket.id.length > 0);
    
    if (hasSearchResults) {
      return tickets;
    }
    
    // Sinon, afficher par défaut tous les tickets de l'utilisateur actuel
    const userTickets = tickets.filter(ticket => ticket.userId === currentUser?.uid);
    
    // Trier par date d'achat (plus récent en premier)
    const sortedTickets = userTickets.sort((a, b) => 
      new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    );
    
    // Retourner tous les tickets de l'utilisateur
    return sortedTickets;
  })();

  const canCancel = (ticket: Participant) => {
    if (ticket.status === 'cancelled' || ticket.status === 'completed') return false;
    if (ticket.paid) return false;
    if (ticket.userId !== currentUser?.uid) return false; // Vérifier si l'agent est le créateur
    
    const now = new Date();
    const purchaseTime = new Date(ticket.purchaseDate);
    const minutesSinceSubmission = differenceInMinutes(now, purchaseTime);
    return minutesSinceSubmission <= CANCELLATION_WINDOW_MINUTES;
  };

  const canPay = (ticket: Participant) => {
    if (!ticket.isWinner || ticket.paid || ticket.status === 'cancelled') return false;
    
    // Vérifier si le solde est suffisant pour payer le montant du gain
    if (ticket.winAmount && walletBalance < ticket.winAmount) {
      return false;
    }
    
    // Vérifier si le staff a la permission de payer
    if (userData?.role === 'staffuser' && !canProcessPayment) {
      return false;
    }
    
    // Vérifier si le montant dépasse la limite de paiement (seulement pour les agents)
    if (userData?.role === 'agentuser' && currentUser && ticket.winAmount && paymentLimits[currentUser.uid]) {
      return ticket.winAmount <= paymentLimits[currentUser.uid];
    }
    
    // Les staffs n'ont pas de limite de paiement
    return true;
  };

  const getStatusBadge = (ticket: Participant) => {
    // Ticket annulé
    if (ticket.status === 'cancelled') {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Annulé
        </span>
      );
    }

    // Ticket payé
    if (ticket.paid) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Payé
        </span>
      );
    }

    // Ticket terminé (résultat connu)
    if (ticket.status === 'completed') {
      if (ticket.isWinner) {
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            À payer
          </span>
        );
      }
      if (ticket.isLost) {
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Perdant
          </span>
        );
      }
    }

    // Ticket en attente
    return (
      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
        <Clock className="w-3 h-3" />
        En attente
      </span>
    );
  };

  if (displayedTickets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucun ticket trouvé
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayedTickets.map((ticket) => (
        <div key={ticket.id} className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 rounded-full">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {new Date(ticket.purchaseDate).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
            {getStatusBadge(ticket)}
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Numéros joués:</p>
            <div className="flex flex-wrap gap-1">
              {ticket.selectedNumbers.map((number, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center justify-center w-8 h-8 text-sm font-medium rounded-full ${
                    ticket.isWinner
                      ? 'bg-green-100 text-green-800'
                      : ticket.isLost
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {number}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {ticket.isWinner && !ticket.paid && onPayWinnings && ticket.status !== 'cancelled' && (
              <>
                {canPay(ticket) ? (
                  <button
                    onClick={() => onPayWinnings(ticket)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Payer</span>
                  </button>
                ) : (
                  <div className="flex-1 text-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
                    {!canProcessPayment ? "Paiement désactivé" : 
                     (ticket.winAmount && walletBalance < ticket.winAmount) ? "Solde insuffisant" : 
                     "Limite dépassée"}
                  </div>
                )}
              </>
            )}

            {onCancelTicket && canCancel(ticket) && !ticket.paid && !ticket.isWinner && (
              <button
                onClick={() => onCancelTicket(ticket)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Annuler</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}