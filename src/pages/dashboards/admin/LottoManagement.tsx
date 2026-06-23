import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LottoService, LottoEvent } from '../../../services/lotto';
import { LottoPrizeService } from '../../../services/lotto/prize';
import BaseDashboard from '../BaseDashboard';
import LottoTable from '../../../components/lotto/LottoTable';
import PrizeModal from '../../../components/lotto/PrizeModal';
import DrawModal from '../../../components/lotto/DrawModal';
import PrizeResultModal from '../../../components/lotto/PrizeResultModal';
import LoadingState from '../../../components/LoadingState';
import { AlertCircle, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export default function LottoManagement() {
  const navigate = useNavigate();
  const [lottos, setLottos] = useState<LottoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLotto, setSelectedLotto] = useState<LottoEvent | null>(null);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [prizeResult, setPrizeResult] = useState<any | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLottos();
  }, []);

  const fetchLottos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LottoService.getAllLottos();
      setLottos(data);
    } catch (err) {
      setError('Erreur lors du chargement des lottos');
      console.error('Error fetching lottos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (lotto: LottoEvent) => {
    setSelectedLotto(lotto);
  };

  const handleEdit = (lotto: LottoEvent) => {
    // Vérifier si le lotto est en attente avant de permettre la modification
    if (lotto.status !== 'pending') {
      setError('Seuls les lottos en attente peuvent être modifiés');
      return;
    }
    navigate(`/dashboard/admin/setup-lotto/${lotto.id}`);
  };

  const handleDelete = async (lotto: LottoEvent) => {
    // Vérifier si le lotto est en attente avant de permettre la suppression
    if (lotto.status !== 'pending') {
      setError('Seuls les lottos en attente peuvent être supprimés');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return;
    }

    try {
      await LottoService.deleteLotto(lotto.id!);
      await fetchLottos();
    } catch (err) {
      console.error('Error deleting lotto:', err);
      setError('Erreur lors de la suppression du lotto');
    }
  };

  const handleCalculatePrizes = async (lotto: LottoEvent) => {
    setSelectedLotto(lotto);
    setShowDrawModal(true);
  };

  const handleDrawComplete = async (draw: any) => {
    try {
      setPrizeResult(draw);
      setShowDrawModal(false);
      await fetchLottos();
    } catch (err) {
      setError('Erreur lors du calcul des gains');
      console.error('Error calculating prizes:', err);
    }
  };

  const handleToggleStatus = async (lotto: LottoEvent) => {
    try {
      setIsToggling(lotto.id!);
      await LottoService.toggleLottoStatus(lotto.id!, !lotto.isEnabled);
      await fetchLottos();
    } catch (err) {
      console.error('Error toggling lotto status:', err);
      setError('Erreur lors de la modification du statut du lotto');
    } finally {
      setIsToggling(null);
    }
  };

  const filteredLottos = lottos.filter(lotto => {
    const matchesSearch = lotto.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lotto.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <BaseDashboard title="Gestion des Lottos">
        <LoadingState message="Chargement des lottos..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Gestion des Lottos">
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Rechercher un lotto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'active' | 'completed')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="active">En cours</option>
            <option value="completed">Terminés</option>
          </select>
        </div>
        
        <button
          onClick={() => navigate('/dashboard/admin/setup-lotto')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Créer un nouveau lotto
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <LottoTable
        lottos={filteredLottos}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCalculatePrizes={handleCalculatePrizes}
        onToggleStatus={handleToggleStatus}
        isToggling={isToggling}
        statusFilter={statusFilter}
      />

      {showDrawModal && selectedLotto && (
        <DrawModal
          lotto={selectedLotto}
          onClose={() => setShowDrawModal(false)}
          onDrawComplete={handleDrawComplete}
        />
      )}

      {prizeResult && (
        <PrizeResultModal
          prize={prizeResult}
          onClose={() => setPrizeResult(null)}
        />
      )}
    </BaseDashboard>
  );
}