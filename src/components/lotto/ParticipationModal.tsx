import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Ticket, AlertCircle, CheckCircle } from 'lucide-react';
import { LottoEvent } from '../../services/lotto';
import LottoGrid from './LottoGrid';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';

interface ParticipationModalProps {
  lotto: LottoEvent;
  onClose: () => void;
  onSubmit: (numbers: number[]) => Promise<string>;
}

export default function ParticipationModal({ lotto, onClose, onSubmit }: ParticipationModalProps) {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [participationId, setParticipationId] = useState<string | null>(null);

  const handleGridSubmit = async (selectedNumbers: number[]) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const id = await onSubmit(selectedNumbers);
      
      // Afficher le message de succès
      setParticipationId(id);
      setSuccess(true);
      
      // Fermer le modal après 3 secondes
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation');
      console.error('Error submitting numbers:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">{lotto.eventName}</h2>
                <p className="text-xs sm:text-sm text-gray-600">
                  Prix du ticket: {formatCurrency(lotto.ticketPrice, lotto.currency)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                Participation enregistrée avec succès !
              </h3>
              <p className="text-green-700 mb-2">
                Votre ticket a été créé avec le numéro : <span className="font-mono font-bold">{participationId}</span>
              </p>
              <p className="text-sm text-green-600">
                Cette fenêtre se fermera automatiquement dans quelques secondes...
              </p>
            </div>
          )}

          {!success && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800">
                  Sélectionnez {lotto.numbersToSelect} numéros différents entre 1 et 50 pour participer au tirage.
                </p>
              </div>

              <LottoGrid
                numbersToSelect={lotto.numbersToSelect}
                onSubmit={handleGridSubmit}
                disabled={isSubmitting}
                ticketPrice={lotto.ticketPrice}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}