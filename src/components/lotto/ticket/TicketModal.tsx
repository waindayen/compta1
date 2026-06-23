import React, { useState, useEffect } from 'react';
import { X, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import LottoTicket from './LottoTicket';
import PrintableTicket from './PrintableTicket';
import { LottoParticipation } from '../../../services/lotto/types';
import { printerService } from '../../../services/printer';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  participation: LottoParticipation;
  playerName: string;
  gameParameters: {
    eventName: string;
    numbersToSelect: number;
    endDate: string;
  };
  autoPrint?: boolean;
}

export default function TicketModal({
  isOpen,
  onClose,
  participation,
  playerName,
  gameParameters,
  autoPrint = false
}: TicketModalProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  useEffect(() => {
    if (autoPrint && isOpen && currentUser) {
      // Attendre un court instant pour que le ticket soit rendu
      setTimeout(async () => {
        await handleNativePrint();
      }, 500);
    }
  }, [autoPrint, isOpen, currentUser]);

  const handleNativePrint = async () => {
    if (!currentUser) return;
    
    try {
      setIsPrinting(true);
      setPrintError(null);
      
      console.log('Tentative d\'impression native...');
      
      // Charger la configuration de l'imprimante
      const config = await printerService.loadConfig(currentUser.uid);
      
      // Si l'impression est désactivée, ne rien faire
      if (!config.enabled) {
        console.log('Impression désactivée dans la configuration');
        return;
      }
      
      // Créer les données du ticket
      const ticketData = {
        ticketNumber: participation.id!,
        playerName,
        selectedNumbers: participation.selectedNumbers,
        ticketPrice: participation.ticketPrice,
        currency: participation.currency,
        purchaseDate: participation.purchaseDate,
        gameParameters
      };
      
      console.log('Impression du ticket:', ticketData);
      
      // Imprimer le ticket
      await printerService.printTicket(ticketData);
      console.log('Impression native réussie');
    } catch (error) {
      console.error('Erreur lors de l\'impression native:', error);
      setPrintError(error instanceof Error ? error.message : 'Erreur d\'impression');
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrint = async () => {
    try {
      // Essayer l'impression native en premier
      if (currentUser) {
        try {
          await handleNativePrint();
          // Si l'impression native réussit, ne pas faire l'impression du navigateur
          return;
        } catch (error) {
          console.warn('Impression native échouée, fallback vers l\'impression navigateur:', error);
        }
      }
      
      // Fallback à l'impression du navigateur seulement si l'impression native échoue
      window.print();
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
    }
  };

  const handleClose = () => {
    onClose();
    // Ne pas rediriger automatiquement, laisser le composant parent gérer la navigation
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Ticket de participation</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600 disabled:opacity-50"
                title="Imprimer le ticket"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {isPrinting && (
            <div className="mt-2 flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              <span className="text-sm">Impression en cours...</span>
            </div>
          )}
          {printError && (
            <div className="mt-2 text-sm text-red-600">
              Erreur d'impression: {printError}
            </div>
          )}
        </div>

        <div className="p-6">
          <LottoTicket
            ticketNumber={participation.id!}
            playerName={playerName}
            selectedNumbers={participation.selectedNumbers}
            ticketPrice={participation.ticketPrice}
            currency={participation.currency}
            purchaseDate={participation.purchaseDate}
            gameParameters={gameParameters}
            onPrintTicket={handlePrint}
          />
        </div>

        <PrintableTicket
          data={{
            ticketNumber: participation.id!,
            playerName,
            selectedNumbers: participation.selectedNumbers,
            ticketPrice: participation.ticketPrice,
            currency: participation.currency,
            purchaseDate: participation.purchaseDate,
            gameParameters
          }}
        />
      </div>
    </div>
  );
}