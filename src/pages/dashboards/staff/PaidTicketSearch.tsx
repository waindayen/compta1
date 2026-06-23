import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, CheckCircle, XCircle, User, QrCode } from 'lucide-react';
import BaseDashboard from '../BaseDashboard';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { formatCurrency } from '../../../utils/format';
import LoadingState from '../../../components/LoadingState';
import ScannerModal from '../../../components/lotto/ticket/ScannerModal';
import PaidTicketSearchNav from '../../../components/staff/PaidTicketSearchNav';

interface TicketSearchResult {
  id: string;
  paid: boolean;
  paidAt?: string;
  paidBy?: string;
  payerEmail?: string;
  winAmount?: number;
  currency?: string;
  lottoEventName?: string;
  selectedNumbers?: number[];
}

export default function PaidTicketSearch() {
  const [ticketNumber, setTicketNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TicketSearchResult | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Effect to automatically search when ticketNumber changes from scanning
  useEffect(() => {
    if (ticketNumber) {
      handleSearch();
    }
  }, [ticketNumber]);

  const handleSearch = async () => {
    if (!ticketNumber.trim()) {
      setError('Veuillez entrer un numéro de ticket');
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      setResult(null);

      // Rechercher le ticket dans la collection lotto_participations
      const ticketRef = doc(db, 'lotto_participations', ticketNumber.trim());
      const ticketSnap = await getDoc(ticketRef);

      if (!ticketSnap.exists()) {
        throw new Error('Ticket non trouvé');
      }

      const ticketData = ticketSnap.data();
      
      // Préparer les données de base du résultat
      const searchResult: TicketSearchResult = {
        id: ticketSnap.id,
        paid: ticketData.paid || false,
        paidAt: ticketData.paidAt,
        paidBy: ticketData.paidBy,
        winAmount: ticketData.winAmount,
        currency: ticketData.currency || 'XAF',
        lottoEventName: ticketData.lottoEventName,
        selectedNumbers: ticketData.selectedNumbers
      };

      // Si le ticket a été payé, récupérer les informations du payeur
      if (searchResult.paid && searchResult.paidBy) {
        try {
          const payerRef = doc(db, 'users', searchResult.paidBy);
          const payerSnap = await getDoc(payerRef);
          
          if (payerSnap.exists()) {
            searchResult.payerEmail = payerSnap.data().email;
          }
        } catch (err) {
          console.error('Error fetching payer details:', err);
          // Ne pas bloquer le résultat si les détails du payeur ne sont pas disponibles
        }
      }

      setResult(searchResult);
    } catch (error) {
      console.error('Error searching for ticket:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  const handleScan = async (data: string) => {
    try {
      setScanError(null);
      
      // Utiliser directement l'ID brut du QR code
      if (!data) {
        throw new Error('QR code invalide ou vide');
      }
      
      // Nettoyer l'ID en supprimant les espaces et caractères indésirables
      const cleanId = data.trim();
      
      // Essayer de parser comme JSON pour extraire l'ID si c'est un objet
      try {
        const jsonData = JSON.parse(cleanId);
        if (jsonData.ticketNumber) {
          setTicketNumber(jsonData.ticketNumber);
        } else if (jsonData.id) {
          setTicketNumber(jsonData.id);
        } else {
          setTicketNumber(cleanId);
        }
      } catch (e) {
        // Ce n'est pas du JSON, utiliser directement l'ID nettoyé
        setTicketNumber(cleanId);
      }
      
      setShowScanner(false);
    } catch (err) {
      console.error('Error scanning ticket:', err);
      setScanError(err instanceof Error ? err.message : 'Erreur lors du scan du QR code');
    }
  };

  return (
    <BaseDashboard title="Recherche de Tickets Payés">
      <PaidTicketSearchNav />
      
      <div className="space-y-6">
        {/* Barre de recherche et scan */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Entrez le numéro du ticket..."
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            <span>Scanner QR</span>
          </button>
          <button
            onClick={handleSearch}
            disabled={isSearching || !ticketNumber.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Recherche...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Rechercher</span>
              </>
            )}
          </button>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Résultat de la recherche */}
        {isSearching ? (
          <LoadingState message="Recherche du ticket..." />
        ) : result && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold">Ticket #{result.id}</h2>
                {result.lottoEventName && (
                  <p className="text-sm text-gray-600">{result.lottoEventName}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {result.paid ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Payé
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    Non payé
                  </span>
                )}
              </div>
            </div>

            {/* Détails du ticket */}
            <div className="space-y-4">
              {/* Numéros sélectionnés */}
              {result.selectedNumbers && result.selectedNumbers.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Numéros joués</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.selectedNumbers.map((number, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                      >
                        {number}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Montant du gain */}
              {result.winAmount && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-1">Montant du gain</h3>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(result.winAmount, result.currency)}
                  </p>
                </div>
              )}

              {/* Informations de paiement */}
              {result.paid && result.paidAt && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-800 mb-2">Informations de paiement</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-700">Date de paiement</span>
                      <span className="font-medium">
                        {new Date(result.paidAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Payé par</span>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-700" />
                        <span className="font-medium">
                          {result.payerEmail || `Agent #${result.paidBy?.slice(0, 8)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Message si non payé */}
              {!result.paid && (
                <div className="bg-yellow-50 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-yellow-700">
                    Ce ticket n'a pas encore été payé.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de scan QR */}
      <ScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
        error={scanError}
        onError={setScanError}
      />
    </BaseDashboard>
  );
}