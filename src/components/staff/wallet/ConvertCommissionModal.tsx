import React, { useState, useEffect } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { StaffWalletService } from '../../../services/staff/wallet';
import { formatCurrency } from '../../../utils/format';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface ConvertCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  commissionBalance: number;
  staffId: string;
  onConvertComplete?: () => void;
}

export default function ConvertCommissionModal({
  isOpen,
  onClose,
  commissionBalance,
  staffId,
  onConvertComplete
}: ConvertCommissionModalProps) {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canConvert, setCanConvert] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur a le droit de convertir
    const checkConversionPermission = async () => {
      try {
        const userRef = doc(db, 'users', staffId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // Si canConvertCommission est explicitement false, désactiver la conversion
          if (userData.canConvertCommission === false) {
            setCanConvert(false);
            setError('Vous n\'êtes pas autorisé à convertir vos commissions. Veuillez contacter l\'administrateur.');
          } else {
            setCanConvert(true);
            setError(null);
          }
        }
      } catch (err) {
        console.error('Error checking conversion permission:', err);
      }
    };

    if (isOpen && staffId) {
      checkConversionPermission();
    }
  }, [isOpen, staffId]);

  if (!isOpen) return null;

  const handleAmountChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setIsSubmitting(true);

      if (!canConvert) {
        throw new Error('Vous n\'êtes pas autorisé à convertir vos commissions');
      }

      const convertAmount = parseFloat(amount);
      if (isNaN(convertAmount) || convertAmount <= 0) {
        throw new Error('Montant invalide');
      }

      if (convertAmount > commissionBalance) {
        throw new Error('Solde de commission insuffisant');
      }

      await StaffWalletService.convertCommissionToBalance(staffId, convertAmount);
      
      onConvertComplete?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">Convertir les commissions</h2>
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

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant à convertir
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                  disabled={isSubmitting || !canConvert}
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  CFA
                </span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-blue-800">Commission disponible</span>
                <span className="font-bold text-blue-800">
                  {formatCurrency(commissionBalance)}
                </span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {!canConvert && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <p className="text-sm text-yellow-600">
                  La conversion de commission a été désactivée pour votre compte. 
                  Veuillez contacter l'administrateur pour plus d'informations.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !amount || !canConvert}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Conversion en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Convertir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}