import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LottoService, LottoEvent } from '../../../services/lotto';
import BaseDashboard from '../BaseDashboard';
import LottoTable from '../../../components/lotto/LottoTable';
import LoadingState from '../../../components/LoadingState';
import { AlertCircle, Trophy, Search, Calendar, Filter, Clock, Info } from 'lucide-react';

export default function ManagerLottoManagement() {
  const navigate = useNavigate();
  const [lottos, setLottos] = useState<LottoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchLottos();
  }, []);

  const fetchLottos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LottoService.getAllLottos();
      console.log("Lottos chargés:", data.length);
      setLottos(data);
    } catch (err) {
      setError('Erreur lors du chargement des lottos');
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
    // Les managers ne peuvent pas modifier les lottos
    console.log('Edit lotto (not allowed for managers):', lotto);
  };

  const handleDelete = async (lotto: LottoEvent) => {
    // Les managers ne peuvent pas supprimer les lottos
    console.log('Delete lotto (not allowed for managers):', lotto);
  };

  const filteredLottos = lottos.filter(lotto => {
    const matchesSearch = lotto.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtre par date unique
    const matchesDate = !dateFilter || lotto.endDate.startsWith(dateFilter);
    
    // Filtre par période
    let matchesDateRange = true;
    if (startDateFilter) {
      const startDate = new Date(startDateFilter);
      const lottoDate = new Date(lotto.endDate);
      matchesDateRange = lottoDate >= startDate;
    }
    if (endDateFilter) {
      const endDate = new Date(endDateFilter);
      endDate.setHours(23, 59, 59, 999); // Fin de la journée
      const lottoDate = new Date(lotto.endDate);
      matchesDateRange = matchesDateRange && lottoDate <= endDate;
    }
    
    const matchesStatus = statusFilter === 'all' || lotto.status === statusFilter;
    
    return matchesSearch && matchesDate && matchesDateRange && matchesStatus;
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
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un lotto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="w-full md:w-48">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'active' | 'completed')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="active">En cours</option>
              <option value="completed">Terminés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtre par période */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Période :</span>
        </div>
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/2 relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              placeholder="Date de début"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="w-full sm:w-1/2 relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              placeholder="Date de fin"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <button
          onClick={() => {
            setStartDateFilter('');
            setEndDateFilter('');
          }}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Réinitialiser
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-blue-800">
            En tant que manager, vous pouvez consulter tous les lottos, mais vous ne pouvez pas les modifier ni les supprimer. 
            Seuls les administrateurs peuvent créer, modifier ou supprimer des lottos, et uniquement lorsqu'ils sont en statut "En attente".
          </p>
        </div>
      </div>

      {filteredLottos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun lotto trouvé avec les critères sélectionnés</p>
        </div>
      ) : (
        <LottoTable
          lottos={filteredLottos}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          hideActions={true}
        />
      )}
    </BaseDashboard>
  );
}