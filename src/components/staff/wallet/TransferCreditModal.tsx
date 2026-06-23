import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, AlertCircle, Search, User, Check } from 'lucide-react';
import { StaffTransferService } from '../../../services/staff/transfer';
import { formatCurrency } from '../../../utils/format';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface Staff {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  status?: string;
}

interface TransferCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  staffId: string;
  onTransferComplete?: () => void;
}

export default function TransferCreditModal({
  isOpen,
  onClose,
  currentBalance,
  staffId,
  onTransferComplete
}: TransferCreditModalProps) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStaffList, setShowStaffList] = useState(false);

  // Calculer les frais et le total
  const calculations = React.useMemo(() => {
    const transferAmount = parseFloat(amount) || 0;
    const feeAmount = 0; // Pas de frais pour les transferts entre staffs
    const totalAmount = transferAmount; // Pas de frais ajoutés

    return {
      transferAmount,
      feeAmount,
      totalAmount
    };
  }, [amount]);

  // Charger les staffs au montage du composant
  useEffect(() => {
    if (isOpen) {
      loadStaff();
    }
  }, [isOpen]);

  // Filtrer les staffs en fonction du terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStaff([]);
      setShowStaffList(false);
      return;
    }

    const filtered = staffList.filter(staff => {
      const searchLower = searchTerm.toLowerCase();
      return (
        staff.id !== staffId && // Exclure le staff actuel
        (staff.email.toLowerCase().includes(searchLower) ||
        (staff.firstName?.toLowerCase() || '').includes(searchLower) ||
        (staff.lastName?.toLowerCase() || '').includes(searchLower) ||
        (staff.phoneNumber || '').includes(searchLower))
      );
    });

    setFilteredStaff(filtered);
    setShowStaffList(filtered.length > 0);
  }, [searchTerm, staffList, staffId]);

  const loadStaff = async () => {
    try {
      setIsLoadingStaff(true);
      
      // Récupérer tous les staffs actifs
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('role', '==', 'staffuser'),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);
      
      const staffData: Staff[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        staffData.push({
          id: doc.id,
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phoneNumber: userData.phoneNumber || '',
          status: userData.status || 'active'
        });
      });
      
      setStaffList(staffData);
    } catch (err) {
      console.error('Error loading staff:', err);
      setError('Erreur lors du chargement des staffs');
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    setSearchTerm(staff.email);
    setShowStaffList(false);
    setError(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (selectedStaff && value !== selectedStaff.email) {
      setSelectedStaff(null);
    }
  };

  const getStaffDisplayName = (staff: Staff) => {
    if (staff.firstName && staff.lastName) {
      return `${staff.firstName} ${staff.lastName}`;
    }
    if (staff.firstName || staff.lastName) {
      return staff.firstName || staff.lastName;
    }
    return `Staff #${staff.id.slice(0, 8)}`;
  };

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

      const { transferAmount, totalAmount } = calculations;

      if (isNaN(transferAmount) || transferAmount <= 0) {
        throw new Error('Montant invalide');
      }

      if (totalAmount > currentBalance) {
        throw new Error('Solde insuffisant');
      }

      if (!selectedStaff) {
        throw new Error('Veuillez sélectionner un staff');
      }

      // Effectuer le transfert en utilisant l'email du staff sélectionné
      await StaffTransferService.transferCreditByEmail(staffId, selectedStaff.email, transferAmount);
      
      onClose();
      
      // Rediriger vers la page de succès
      navigate('/transfer-success', {
        state: {
          amount: transferAmount,
          recipientEmail: selectedStaff.email,
          recipientName: getStaffDisplayName(selectedStaff),
          transferType: 'staff',
          feeAmount: 0, // Pas de frais pour les transferts entre staffs
          totalAmount: calculations.totalAmount
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold">Transférer du crédit</h2>
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

        <div className="max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Recherche de staff */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rechercher un staff
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Rechercher par nom, email ou téléphone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
                {isLoadingStaff && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              {/* Liste des staffs filtrés */}
              {showStaffList && filteredStaff.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {filteredStaff.slice(0, 10).map((staff) => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => handleStaffSelect(staff)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 flex items-center justify-center bg-purple-100 rounded-full flex-shrink-0">
                          <span className="text-sm font-medium text-purple-600">
                            {staff.firstName?.[0] || staff.email[0]?.toUpperCase() || 'S'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {getStaffDisplayName(staff)}
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {staff.email}
                          </div>
                          {staff.phoneNumber && (
                            <div className="text-xs text-gray-500 truncate">
                              {staff.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredStaff.length > 10 && (
                    <div className="px-4 py-2 text-sm text-gray-500 text-center border-t border-gray-100">
                      {filteredStaff.length - 10} autres staffs...
                    </div>
                  )}
                </div>
              )}

              {/* Message si aucun staff trouvé */}
              {showStaffList && filteredStaff.length === 0 && searchTerm.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-4 text-center text-gray-500">
                  Aucun staff trouvé
                </div>
              )}
            </div>

            {/* Staff sélectionné */}
            {selectedStaff && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-green-800">
                      Staff sélectionné: {getStaffDisplayName(selectedStaff)}
                    </div>
                    <div className="text-sm text-green-700">
                      {selectedStaff.email}
                    </div>
                    {selectedStaff.phoneNumber && (
                      <div className="text-sm text-green-600">
                        {selectedStaff.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Montant à transférer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant à transférer
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                  disabled={isSubmitting}
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  CFA
                </span>
              </div>
            </div>

            {/* Récapitulatif des frais */}
            {calculations.transferAmount > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Montant du transfert</span>
                  <span>{formatCurrency(calculations.transferAmount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between items-center font-medium">
                  <span>Total à débiter</span>
                  <span>{formatCurrency(calculations.totalAmount)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Aucun frais pour les transferts entre staffs
                </p>
              </div>
            )}

            {/* Solde disponible */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-blue-800">Solde disponible</span>
                <span className="font-bold text-blue-800">
                  {formatCurrency(currentBalance)}
                </span>
              </div>
            </div>

            {/* Messages d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

          </div>
          </form>
        </div>

        {/* Boutons d'action fixés en bas */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount || !selectedStaff}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Transfert en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Transférer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}