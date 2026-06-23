import React, { useState, useEffect } from 'react';
import { LottoService, LottoEvent } from '../../../services/lotto';
import { LottoPrizeService } from '../../../services/lotto/prize';
import PrizeModal from '../PrizeModal';
import PrizeResultModal from '../PrizeResultModal';
import LoadingState from '../../LoadingState';
import { AlertCircle, Trophy, Search, Lock, Clock } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';

export default function PendingDraws() {
  const [lottos, setLottos] = useState<LottoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLotto, setSelectedLotto] = useState<LottoEvent | null>(null);
  const [prizeResult, setPrizeResult] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lottoStatuses, setLottoStatuses] = useState<{[key: string]: {hasRequest: boolean; numbersLocked: boolean; lockedNumbers?: number[]}}>({});

  useEffect(() => {
    fetchLottos();
  }, []);

  useEffect(() => {
    if (lottos.length > 0) {
      checkLottoStatuses();
    }
  }, [lottos]);

  const fetchLottos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LottoService.getAllLottos();
      // Filtrer uniquement les lottos terminés sans calcul de gains
      const pendingLottos = data.filter(lotto => {
        const endDate = new Date(lotto.endDate);
        return endDate < new Date() && !lotto.prizeCalculated;
      });
      setLottos(pendingLottos);
    } catch (err) {
      setError('Erreur lors du chargement des lottos');
      console.error('Error fetching lottos:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkLottoStatuses = async () => {
    try {
      const statuses: {[key: string]: {hasRequest: boolean; numbersLocked: boolean; lockedNumbers?: number[]}} = {};
      
      for (const lotto of lottos) {
        if (lotto.id) {
          // Vérifier s'il y a une demande d'approbation en cours
          const hasRequest = await LottoPrizeService.hasExistingApprovalRequest(lotto.id);
          
          // Vérifier si les numéros gagnants sont verrouillés
          const lockStatus = await LottoPrizeService.areWinningNumbersLocked(lotto.id);
          
          statuses[lotto.id] = {
            hasRequest,
            numbersLocked: lockStatus.locked,
            lockedNumbers: lockStatus.numbers
          };
        }
      }
      
      setLottoStatuses(statuses);
    } catch (err) {
      console.error('Error checking lotto statuses:', err);
    }
  };

  const handlePrizeCalculated = async () => {
    await fetchLottos();
    await checkLottoStatuses();
  };

  const canDefinePrizes = (lotto: LottoEvent) => {
    if (!lotto.id) return false;
    const status = lottoStatuses[lotto.id];
    return !status?.hasRequest; // Peut définir les gains seulement s'il n'y a pas de demande en cours
  };

  const getStatusMessage = (lotto: LottoEvent) => {
    if (!lotto.id) return null;
    const status = lottoStatuses[lotto.id];
    
    if (status?.hasRequest) {
      return {
        type: 'warning',
        message: 'Demande d\'approbation en cours',
        icon: Clock
      };
    }
    
    if (status?.numbersLocked) {
      return {
        type: 'info',
        message: 'Numéros gagnants verrouillés',
        icon: Lock
      };
    }
    
    return null;
  };

  const filteredLottos = lottos.filter(lotto =>
    lotto.eventName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Chargement des lottos..." />;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un lotto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
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
          <p className="text-gray-500">Aucun lotto en attente de calcul des gains</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLottos.map((lotto) => {
            const statusMessage = getStatusMessage(lotto);
            const canDefine = canDefinePrizes(lotto);
            
            return (
            <div key={lotto.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{lotto.eventName}</h3>
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  Date de fin: {new Date(lotto.endDate).toLocaleDateString('fr-FR', {
                    timeZone: 'UTC',
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} (UTC)
                </p>
                <p className="text-sm text-gray-600">
                  Prix du ticket: {formatCurrency(lotto.ticketPrice)}
                </p>
                <p className="text-sm text-gray-600">
                  Numéros à sélectionner: {lotto.numbersToSelect}
                </p>
              </div>

                {/* Message de statut */}
                {statusMessage && (
                  <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                    statusMessage.type === 'warning' 
                      ? 'bg-yellow-50 border border-yellow-200' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <statusMessage.icon className={`w-4 h-4 ${
                      statusMessage.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                    <span className={`text-sm ${
                      statusMessage.type === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                    }`}>
                      {statusMessage.message}
                    </span>
                  </div>
                )}

                {/* Afficher les numéros verrouillés */}
                {lottoStatuses[lotto.id!]?.lockedNumbers && (
                  <div className="mb-4 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Numéros gagnants :</p>
                    <div className="flex flex-wrap gap-1">
                      {lottoStatuses[lotto.id!].lockedNumbers!.map((number, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full"
                        >
                          {number}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {canDefine ? (
                  <button
                    onClick={() => setSelectedLotto(lotto)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Définir les gains
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                    title={statusMessage?.message || 'Action non disponible'}
                  >
                    {statusMessage?.type === 'warning' ? 'En attente d\'approbation' : 'Gains en cours de définition'}
                  </button>
                )}
            </div>
            );
          })}
        </div>
      )}

      {selectedLotto && (
        <PrizeModal
          lotto={selectedLotto}
          onClose={() => setSelectedLotto(null)}
          onPrizeCalculated={handlePrizeCalculated}
        />
      )}

      {prizeResult && (
        <PrizeResultModal
          prize={prizeResult}
          onClose={() => setPrizeResult(null)}
        />
      )}
    </div>
  );
}