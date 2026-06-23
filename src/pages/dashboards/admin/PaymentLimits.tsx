import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import BaseDashboard from '../BaseDashboard';
import { PaymentLimitService, PaymentLimitConfig } from '../../../services/admin/paymentLimits';
import PaymentLimitForm from '../../../components/admin/payment/PaymentLimitForm';
import AgentLimitList from '../../../components/admin/payment/AgentLimitList';
import AgentLimitModal from '../../../components/admin/payment/AgentLimitModal';
import { CreditCard, Plus, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingState from '../../../components/LoadingState';

export default function PaymentLimits() {
  const { currentUser } = useAuth();
  const [globalLimit, setGlobalLimit] = useState<PaymentLimitConfig | null>(null);
  const [agentLimits, setAgentLimits] = useState<PaymentLimitConfig[]>([]);
  const [agents, setAgents] = useState<Array<{ id: string; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLimit, setEditingLimit] = useState<PaymentLimitConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadAgents();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger la limite globale
      const global = await PaymentLimitService.getGlobalLimit();
      setGlobalLimit(global);
      
      // Charger les limites spécifiques aux agents
      const agentLimitsList = await PaymentLimitService.getAllAgentLimits();
      setAgentLimits(agentLimitsList);
    } catch (err) {
      console.error('Error loading payment limits:', err);
      setError('Erreur lors du chargement des limites de paiement');
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      // Récupérer tous les utilisateurs qui sont des agents
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'agentuser'));
      const querySnapshot = await getDocs(q);
      
      const agentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || 'Email non disponible'
      }));
      
      setAgents(agentsList);
    } catch (err) {
      console.error('Error loading agents:', err);
    }
  };

  const handleSaveGlobalLimit = async (amount: number) => {
    try {
      await PaymentLimitService.setGlobalLimit(amount, 'XAF', currentUser?.uid);
      await loadData();
    } catch (err) {
      console.error('Error saving global limit:', err);
      throw new Error('Erreur lors de la sauvegarde de la limite globale');
    }
  };

  const handleSaveAgentLimit = async (agentId: string, amount: number, agentEmail?: string) => {
    try {
      await PaymentLimitService.setAgentLimit(agentId, amount, agentEmail, 'XAF', currentUser?.uid);
      await loadData();
    } catch (err) {
      console.error('Error saving agent limit:', err);
      throw new Error('Erreur lors de la sauvegarde de la limite agent');
    }
  };

  const handleDeleteLimit = async (limitId: string) => {
    try {
      setIsDeleting(limitId);
      await PaymentLimitService.deleteAgentLimit(limitId);
      await loadData();
    } catch (err) {
      console.error('Error deleting limit:', err);
      setError('Erreur lors de la suppression de la limite');
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <BaseDashboard title="Limites de Paiement">
        <LoadingState message="Chargement des limites de paiement..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Limites de Paiement">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-blue-800">
              Configurez le montant maximum qu'un agent est autorisé à payer pour un ticket gagnant.
              La limite globale s'applique à tous les agents qui n'ont pas de limite spécifique.
            </p>
          </div>
        </div>

        {/* Limite globale */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Limite de paiement globale</h2>
              <p className="text-sm text-gray-600">
                Cette limite s'applique à tous les agents qui n'ont pas de limite spécifique
              </p>
            </div>
          </div>

          {globalLimit && (
            <PaymentLimitForm
              currentAmount={globalLimit.maxPaymentAmount}
              currency={globalLimit.currency}
              onSave={handleSaveGlobalLimit}
            />
          )}
        </div>

        {/* Limites spécifiques aux agents */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Limites de paiement par agent</h2>
                <p className="text-sm text-gray-600">
                  Configurez des limites spécifiques pour certains agents
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Ajouter une limite
            </button>
          </div>

          <AgentLimitList
            limits={agentLimits}
            onEdit={setEditingLimit}
            onDelete={handleDeleteLimit}
          />
        </div>

        {/* Modal d'ajout/modification de limite agent */}
        {showAddModal && (
          <AgentLimitModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={handleSaveAgentLimit}
            agents={agents}
          />
        )}

        {/* Modal d'édition de limite agent */}
        {editingLimit && (
          <AgentLimitModal
            isOpen={!!editingLimit}
            onClose={() => setEditingLimit(null)}
            onSave={handleSaveAgentLimit}
            limit={editingLimit}
            agents={agents}
          />
        )}
      </div>
    </BaseDashboard>
  );
}