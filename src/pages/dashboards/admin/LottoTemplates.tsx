import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LottoService, LottoEvent } from '../../../services/lotto';
import { LottoRecurrenceService } from '../../../services/lotto/recurrence';
import BaseDashboard from '../BaseDashboard';
import LottoTable from '../../../components/lotto/LottoTable';
import LoadingState from '../../../components/LoadingState';
import { AlertCircle, Plus, Clock, Calendar, Search, RefreshCw, Info } from 'lucide-react';

export default function LottoTemplates() {
  const navigate = useNavigate();
  const [lottos, setLottos] = useState<LottoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'daily' | 'weekly' | 'yearly'>('all');

  useEffect(() => {
    fetchLottos();
  }, []);

  const fetchLottos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LottoService.getAllLottos();
      
      // Filtrer uniquement les lottos récurrents (non "once")
      const recurringLottos = data.filter(lotto => 
        lotto.frequency !== 'once'
      );
      
      setLottos(recurringLottos);
      setLastRefresh(new Date());
    } catch (err) {
      setError('Erreur lors du chargement des modèles de lottos');
      console.error('Error fetching lottos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (lotto: LottoEvent) => {
    // Afficher les détails du lotto
    console.log('View lotto:', lotto);
  };

  const handleEdit = (lotto: LottoEvent) => {
    navigate(`/dashboard/admin/setup-lotto/${lotto.id}`);
  };

  const handleDelete = async (lotto: LottoEvent) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce modèle de lotto ? Cela n\'affectera pas les lottos déjà créés.')) {
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

  const handleToggleStatus = async (lotto: LottoEvent) => {
    try {
      await LottoService.toggleLottoStatus(lotto.id!, !lotto.isEnabled);
      await fetchLottos();
    } catch (err) {
      console.error('Error toggling lotto status:', err);
      setError('Erreur lors de la modification du statut du lotto');
    }
  };

  const handleRefreshRecurrence = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Exécuter manuellement la vérification des lottos récurrents
      await LottoRecurrenceService.checkAndCreateRecurringLottos();
      
      // Recharger la liste des lottos
      await fetchLottos();
      
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error refreshing recurrence:', err);
      setError('Erreur lors de la vérification des lottos récurrents');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredLottos = lottos.filter(lotto => {
    const matchesSearch = lotto.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lotto.frequency === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <BaseDashboard title="Modèles de Lottos Récurrents">
        <LoadingState message="Chargement des modèles de lottos..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Modèles de Lottos Récurrents">
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'daily' | 'weekly' | 'yearly')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Tous les types</option>
            <option value="daily">Quotidiens</option>
            <option value="weekly">Hebdomadaires</option>
            <option value="yearly">Annuels</option>
          </select>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={handleRefreshRecurrence}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isRefreshing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Vérification...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>Vérifier récurrence</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => navigate('/dashboard/admin/setup-lotto')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Créer un nouveau modèle
          </button>
        </div>
      </div>

      {lastRefresh && (
        <div className="mb-4 text-sm text-gray-500 flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Dernière vérification: {lastRefresh.toLocaleString('fr-FR')}</span>
        </div>
      )}

      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <p className="text-blue-800">
            Les modèles de lottos récurrents sont automatiquement créés selon leur fréquence (quotidien, hebdomadaire, annuel).
            Vous pouvez cliquer sur "Vérifier récurrence" pour forcer la vérification et la création des prochains lottos.
          </p>
        </div>
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
        onToggleStatus={handleToggleStatus}
      />
    </BaseDashboard>
  );
}