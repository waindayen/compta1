import React, { useState, useEffect } from 'react';
import BaseDashboard from '../BaseDashboard';
import { CommissionService, CommissionConfig, CommissionType } from '../../../services/admin/commission';
import CommissionList from '../../../components/admin/commission/CommissionList';
import CommissionEditModal from '../../../components/admin/commission/CommissionEditModal';
import LoadingState from '../../../components/LoadingState';
import { AlertCircle, Percent, Info } from 'lucide-react';

export default function CommissionConfigPage() {
  const [commissions, setCommissions] = useState<CommissionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCommission, setEditingCommission] = useState<CommissionConfig | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CommissionService.getCommissions();
      setCommissions(data);
    } catch (err) {
      console.error('Error loading commissions:', err);
      setError('Erreur lors du chargement des commissions');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (commission: CommissionConfig) => {
    setEditingCommission(commission);
    setShowEditModal(true);
  };

  const handleSave = async (betType: CommissionType, percentage: number) => {
    try {
      await CommissionService.updateCommission(betType, percentage);
      await loadCommissions();
      setShowEditModal(false);
      setEditingCommission(null);
    } catch (err) {
      console.error('Error saving commission:', err);
      setError('Erreur lors de la sauvegarde de la commission');
    }
  };

  if (loading) {
    return (
      <BaseDashboard title="Configuration des Commissions">
        <LoadingState message="Chargement des commissions..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Configuration des Commissions">
      <div className="space-y-6">
        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-800">Configuration des taux de commission</h3>
          </div>
          <p className="text-blue-700 text-sm">
            Configurez les pourcentages de commission pour chaque type de transaction. 
            Ces commissions sont automatiquement calculées et créditées aux portefeuilles de commission des agents et staffs.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Percent className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Taux de Commission</h2>
              <p className="text-sm text-gray-600">
                Gérez les pourcentages de commission pour chaque type de transaction
              </p>
            </div>
          </div>

          <CommissionList 
            commissions={commissions}
            onEdit={handleEdit}
          />
        </div>

        {/* Modal d'édition */}
        {editingCommission && showEditModal && (
          <CommissionEditModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingCommission(null);
            }}
            commission={editingCommission}
            onSave={handleSave}
          />
        )}
      </div>
    </BaseDashboard>
  );
}