import React, { useState, useEffect } from 'react';
import { LottoService } from '../../../services/lotto';
import { LottoPrizeService } from '../../../services/lotto/prize';
import PrizeResultModal from '../PrizeResultModal';
import LoadingState from '../../LoadingState';
import { AlertCircle, Trophy, Search, Calendar } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';

export default function PrizeHistory() {
  const [lottos, setLottos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrize, setSelectedPrize] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchLottos();
  }, []);

  const fetchLottos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LottoService.getAllLottos();
      const completedLottos = data.filter(lotto => lotto.prizeCalculated);
      setLottos(completedLottos);
    } catch (err) {
      setError('Erreur lors du chargement des résultats');
      console.error('Error fetching lottos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrize = async (lotto: any) => {
    try {
      const prizeResult = await LottoPrizeService.getPrizeResult(lotto.id!);
      if (prizeResult) {
        setSelectedPrize(prizeResult);
      }
    } catch (err) {
      setError('Erreur lors du chargement des résultats');
    }
  };

  const filteredLottos = lottos.filter(lotto => {
    const matchesSearch = lotto.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || lotto.endDate.startsWith(dateFilter);
    return matchesSearch && matchesDate;
  });

  if (loading) {
    return <LoadingState message="Chargement de l'historique..." />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un tirage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="w-full md:w-48">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {filteredLottos.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun résultat trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLottos.map((lotto) => (
            <div key={lotto.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{lotto.eventName}</h3>
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Tirage du {new Date(lotto.endDate).toLocaleDateString('fr-FR', {
                      timeZone: 'UTC',
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} (UTC)
                  </p>
                </div>

                {lotto.winningNumbers && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Numéros gagnants</h4>
                    <div className="flex flex-wrap gap-2">
                      {lotto.winningNumbers.map((number: number, index: number) => (
                        <div
                          key={index}
                          className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center"
                        >
                          <span className="text-sm font-bold text-yellow-700">{number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleViewPrize(lotto)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Voir les résultats
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPrize && (
        <PrizeResultModal
          prize={selectedPrize}
          onClose={() => setSelectedPrize(null)}
        />
      )}
    </div>
  );
}