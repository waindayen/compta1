import React, { useState, useEffect } from 'react';
import { LottoService } from '../services/lotto';
import { Calendar, Search, Trophy, Filter, RotateCcw } from 'lucide-react';
import LoadingState from '../components/LoadingState';

export default function LottoResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [limitResults, setLimitResults] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer tous les lottos mais filtrer côté client pour limiter les données
      const lottos = await LottoService.getAllLottos();
      
      // Filtrer uniquement les lottos avec des résultats calculés
      const completedLottos = lottos
        .filter(lotto => {
          // Vérifier que le lotto a des résultats calculés
          return lotto.prizeCalculated && lotto.winningNumbers && lotto.winningNumbers.length > 0;
        })
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
        .slice(0, limitResults); // Limiter le nombre de résultats affichés
      
      setResults(completedLottos);
      setHasMore(completedLottos.length === limitResults);
    } catch (err) {
      setError('Erreur lors du chargement des résultats');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreResults = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const newLimit = limitResults + 10;
      
      const lottos = await LottoService.getAllLottos();
      const completedLottos = lottos
        .filter(lotto => lotto.prizeCalculated && lotto.winningNumbers && lotto.winningNumbers.length > 0)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
        .slice(0, newLimit);
      
      setResults(completedLottos);
      setLimitResults(newLimit);
      setHasMore(completedLottos.length === newLimit);
    } catch (err) {
      setError('Erreur lors du chargement de plus de résultats');
    } finally {
      setLoadingMore(false);
    }
  };

  const filteredResults = results.filter(result => {
    const matchesSearch = result.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || result.endDate.startsWith(dateFilter);
    return matchesSearch && matchesDate;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setDateFilter('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-4">
        <LoadingState message="Chargement des résultats..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Résultats Lotto</h1>
          <div className="text-sm text-gray-600">
            {filteredResults.length} résultat{filteredResults.length > 1 ? 's' : ''} affiché{filteredResults.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Filtres de recherche */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par nom de tirage..."
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
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Réinitialiser
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Liste des résultats */}
        {filteredResults.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun résultat trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResults.map((result) => (
              <div key={result.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{result.eventName}</h3>
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Tirage du {new Date(result.endDate).toLocaleDateString('fr-FR', {
                        timeZone: 'UTC',
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} (UTC)
                    </p>
                  </div>

                  {result.winningNumbers && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Numéros gagnants</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.winningNumbers.map((number: number, index: number) => (
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
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bouton "Charger plus" */}
        {hasMore && results.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMoreResults}
              disabled={loadingMore}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Chargement...</span>
                </>
              ) : (
                `Charger plus de résultats`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}