import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, AlertCircle, Search, User, Check } from 'lucide-react';
import { StaffTransferService } from '../../../services/staff/transfer';
import { formatCurrency } from '../../../utils/format';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface Agent {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  status?: string;
}

interface TransferToAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  staffId: string;
  onTransferComplete?: () => void;
}

export default function TransferToAgentModal({
  isOpen,
  onClose,
  currentBalance,
  staffId,
  onTransferComplete
}: TransferToAgentModalProps) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAgentList, setShowAgentList] = useState(false);

  // Calculer les frais et le total
  const calculations = React.useMemo(() => {
    const transferAmount = parseFloat(amount) || 0;
    const feeAmount = Math.round((transferAmount * 0.02) * 100) / 100; // 2% arrondi à 2 décimales
    const totalAmount = transferAmount; // Le staff ne paie pas de frais pour les transferts vers les agents

    return {
      transferAmount,
      feeAmount,
      totalAmount
    };
  }, [amount]);

  // Charger les agents au montage du composant
  useEffect(() => {
    if (isOpen) {
      loadAgents();
    }
  }, [isOpen]);

  // Filtrer les agents en fonction du terme de recherche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAgents([]);
      setShowAgentList(false);
      return;
    }

    const filtered = agents.filter(agent => {
      const searchLower = searchTerm.toLowerCase();
      return (
        agent.email.toLowerCase().includes(searchLower) ||
        (agent.firstName?.toLowerCase() || '').includes(searchLower) ||
        (agent.lastName?.toLowerCase() || '').includes(searchLower) ||
        (agent.phoneNumber || '').includes(searchLower)
      );
    });

    setFilteredAgents(filtered);
    setShowAgentList(filtered.length > 0);
  }, [searchTerm, agents]);

  const loadAgents = async () => {
    try {
      setIsLoadingAgents(true);
      
      // Récupérer tous les agents actifs
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('role', '==', 'agentuser'),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(q);
      
      const agentsData: Agent[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        agentsData.push({
          id: doc.id,
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phoneNumber: userData.phoneNumber || '',
          status: userData.status || 'active'
        });
      });
      
      setAgents(agentsData);
    } catch (err) {
      console.error('Error loading agents:', err);
      setError('Erreur lors du chargement des agents');
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    setSearchTerm(agent.email);
    setShowAgentList(false);
    setError(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (selectedAgent && value !== selectedAgent.email) {
      setSelectedAgent(null);
    }
  };

  const getAgentDisplayName = (agent: Agent) => {
    if (agent.firstName && agent.lastName) {
      return `${agent.firstName} ${agent.lastName}`;
    }
    if (agent.firstName || agent.lastName) {
      return agent.firstName || agent.lastName;
    }
    return `Agent #${agent.id.slice(0, 8)}`;
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

      const { transferAmount } = calculations;

      if (isNaN(transferAmount) || transferAmount <= 0) {
        throw new Error('Montant invalide');
      }

      if (transferAmount > currentBalance) {
        throw new Error('Solde insuffisant');
      }

      if (!selectedAgent) {
        throw new Error('Veuillez sélectionner un agent');
      }

      // Effectuer le transfert en utilisant l'email de l'agent sélectionné
      await StaffTransferService.transferToAgentByEmail(staffId, selectedAgent.email, transferAmount);
      
      onClose();
      
      // Rediriger vers la page de succès
      navigate('/transfer-success', {
        state: {
          amount: transferAmount,
          recipientEmail: selectedAgent.email,
          recipientName: getAgentDisplayName(selectedAgent),
          transferType: 'agent',
          feeAmount: calculations.feeAmount,
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
              <h2 className="text-lg sm:text-xl font-semibold">Transférer à un agent</h2>
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
            {/* Recherche d'agent */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rechercher un agent
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
                {isLoadingAgents && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              {/* Liste des agents filtrés */}
              {showAgentList && filteredAgents.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {filteredAgents.slice(0, 10).map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => handleAgentSelect(agent)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 flex items-center justify-center bg-blue-100 rounded-full flex-shrink-0">
                          <span className="text-sm font-medium text-blue-600">
                            {agent.firstName?.[0] || agent.email[0]?.toUpperCase() || 'A'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {getAgentDisplayName(agent)}
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {agent.email}
                          </div>
                          {agent.phoneNumber && (
                            <div className="text-xs text-gray-500 truncate">
                              {agent.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                  {filteredAgents.length > 10 && (
                    <div className="px-4 py-2 text-sm text-gray-500 text-center border-t border-gray-100">
                      {filteredAgents.length - 10} autres agents...
                    </div>
                  )}
                </div>
              )}

              {/* Message si aucun agent trouvé */}
              {showAgentList && filteredAgents.length === 0 && searchTerm.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-4 text-center text-gray-500">
                  Aucun agent trouvé
                </div>
              )}
            </div>

            {/* Agent sélectionné */}
            {selectedAgent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-green-800">
                      Agent sélectionné: {getAgentDisplayName(selectedAgent)}
                    </div>
                    <div className="text-sm text-green-700">
                      {selectedAgent.email}
                    </div>
                    {selectedAgent.phoneNumber && (
                      <div className="text-sm text-green-600">
                        {selectedAgent.phoneNumber}
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Commission (2%)</span>
                  <span className="text-green-600">+{formatCurrency(calculations.feeAmount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between items-center font-medium">
                  <span>Total à débiter</span>
                  <span>{formatCurrency(calculations.totalAmount)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Vous recevrez une commission de {formatCurrency(calculations.feeAmount)} pour ce transfert.
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
              disabled={isSubmitting || !amount || !selectedAgent}
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