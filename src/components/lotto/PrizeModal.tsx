import React, { useState, useEffect } from 'react';
import { X, Trophy, AlertCircle, Info } from 'lucide-react';
import { LottoEvent } from '../../services/lotto';
import { LottoPrizeService } from '../../services/lotto/prize';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';

interface PrizeModalProps {
  lotto: LottoEvent;
  onClose: () => void;
  onPrizeCalculated: () => void;
}

interface TicketStats {
  [key: number]: number; // nombre de numéros -> nombre de tickets
}

export default function PrizeModal({ lotto, onClose, onPrizeCalculated }: PrizeModalProps) {
  const { userData, currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [winningNumbers, setWinningNumbers] = useState<number[]>([]);
  const [prizes, setPrizes] = useState<{ [key: number]: string }>({});
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  const [winningNumbersLocked, setWinningNumbersLocked] = useState<{locked: boolean; numbers?: number[]}>({ locked: false });
  const [checkingStatus, setCheckingStatus] = useState(true);

  const isAdmin = userData?.role === 'adminuser';

  // Initialiser les champs de prix en fonction du nombre de numéros à sélectionner
  useEffect(() => {
    const initialPrizes: { [key: number]: string } = {};
    // Créer un champ pour chaque nombre possible de numéros corrects (de 1 à numbersToSelect)
    for (let i = 1; i <= lotto.numbersToSelect; i++) {
      initialPrizes[i] = '';
    }
    setPrizes(initialPrizes);
  }, [lotto.numbersToSelect]);

  // Vérifier le statut au chargement du modal
  React.useEffect(() => {
    checkLottoStatus();
  }, [lotto.id]);

  const checkLottoStatus = async () => {
    try {
      setCheckingStatus(true);
      
      // Vérifier s'il y a déjà une demande d'approbation en cours
      const hasExisting = await LottoPrizeService.hasExistingApprovalRequest(lotto.id!);
      setHasExistingRequest(hasExisting);
      
      // Vérifier si les numéros gagnants sont verrouillés
      const lockStatus = await LottoPrizeService.areWinningNumbersLocked(lotto.id!);
      setWinningNumbersLocked(lockStatus);
      
      // Si les numéros sont verrouillés, les pré-remplir
      if (lockStatus.locked && lockStatus.numbers) {
        setWinningNumbers(lockStatus.numbers);
      }
    } catch (err) {
      console.error('Error checking lotto status:', err);
      setError('Erreur lors de la vérification du statut du lotto');
    } finally {
      setCheckingStatus(false);
    }
  };

  const calculateStats = async () => {
    try {
      setIsDrawing(true);
      setError(null);

      // Validation des numéros gagnants
      if (winningNumbers.length !== lotto.numbersToSelect) {
        throw new Error(`Veuillez saisir les ${lotto.numbersToSelect} numéros gagnants`);
      }

      // Vérifier que les numéros sont uniques
      const uniqueNumbers = new Set(winningNumbers);
      if (uniqueNumbers.size !== lotto.numbersToSelect) {
        throw new Error('Les numéros gagnants doivent être uniques');
      }

      // Vérifier que les numéros sont dans la plage valide
      if (winningNumbers.some(n => n < 1 || n > 50)) {
        throw new Error('Les numéros doivent être entre 1 et 50');
      }

      // Si les numéros sont verrouillés, vérifier qu'ils correspondent
      if (winningNumbersLocked.locked && winningNumbersLocked.numbers) {
        const providedSorted = [...winningNumbers].sort((a, b) => a - b);
        const lockedSorted = [...winningNumbersLocked.numbers].sort((a, b) => a - b);
        
        if (JSON.stringify(providedSorted) !== JSON.stringify(lockedSorted)) {
          throw new Error('Les numéros gagnants ne peuvent pas être modifiés car ils sont déjà verrouillés');
        }
      }

      // Calculer les statistiques
      const stats = await LottoPrizeService.calculateMatchingStats(lotto.id!, winningNumbers);
      setTicketStats(stats);
      setShowConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsDrawing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showConfirmation) {
      await calculateStats();
      return;
    }
    
    try {
      setIsDrawing(true);
      setError(null);

      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      // Vérifier que tous les montants sont renseignés
      const prizeAmounts = Object.entries(prizes).map(([numbers, amount]) => ({
        numbers: parseInt(numbers),
        amount: parseInt(amount.replace(/[^0-9]/g, '')) || 0
      }));

      if (prizeAmounts.some(prize => prize.amount <= 0)) {
        throw new Error('Veuillez définir tous les montants de gains');
      }

      // Calculer le jackpot total
      const totalPrizePool = prizeAmounts.reduce((sum, prize) => sum + prize.amount, 0);

      const drawData = {
        winningNumbers,
        jackpotAmount: totalPrizePool,
        prizeDistribution: prizeAmounts,
        ticketStats
      };

      if (isAdmin) {
        // Pour les admins, calculer directement les gains
        await LottoPrizeService.calculatePrizes(
          lotto.id!,
          winningNumbers,
          totalPrizePool,
          prizeAmounts
        );
        onPrizeCalculated();
      } else {
        // Pour les managers, créer une demande d'approbation
        await LottoPrizeService.createApprovalRequest({
          lottoId: lotto.id!,
          draw: drawData,
          status: 'pending',
          requestedBy: currentUser.uid,
          createdAt: new Date().toISOString()
        });
      }

      onClose();
    } catch (err) {
      console.error('Error submitting prize calculation:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsDrawing(false);
    }
  };

  const handleNumberChange = (index: number, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 50) {
      const newNumbers = [...winningNumbers];
      newNumbers[index] = numValue;
      setWinningNumbers(newNumbers);
      // Réinitialiser les stats quand les numéros changent
      setTicketStats(null);
      setShowConfirmation(false);
    }
  };

  const handlePrizeChange = (numbers: number, value: string) => {
    // Permettre uniquement les chiffres
    const numericValue = value.replace(/[^0-9]/g, '');
    setPrizes(prev => ({
      ...prev,
      [numbers]: numericValue
    }));
  };

  // Formater l'affichage du montant en CFA
  const formatPrizeDisplay = (value: string) => {
    if (!value) return '';
    const numericValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    return numericValue.toLocaleString('fr-FR');
  };

  // Si on vérifie encore le statut
  if (checkingStatus) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Vérification du statut du lotto...</span>
          </div>
        </div>
      </div>
    );
  }

  // Si il y a déjà une demande d'approbation en cours
  if (hasExistingRequest) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-semibold">Demande en cours</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-800">Action non autorisée</h3>
              </div>
              <p className="text-yellow-700">
                Une demande d'approbation pour le calcul des gains est déjà en cours pour ce lotto. 
                Vous ne pouvez pas créer une nouvelle demande tant que la précédente n'est pas traitée.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Que faire maintenant ?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Attendez que la demande en cours soit approuvée ou rejetée</li>
                <li>• Consultez la page "Approbations" pour voir le statut</li>
                <li>• Contactez un administrateur si nécessaire</li>
              </ul>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">Calcul des gains - {lotto.eventName}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isDrawing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Message d'information sur les numéros verrouillés */}
          {winningNumbersLocked.locked && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-800">Numéros gagnants verrouillés</h3>
              </div>
              <p className="text-blue-700 text-sm">
                Les numéros gagnants ont été définis et ne peuvent plus être modifiés pour des raisons de sécurité.
                Vous pouvez uniquement ajuster les montants des gains.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Numéros gagnants */}
            <div>
              <h3 className="text-lg font-medium mb-4">Numéros gagnants</h3>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: lotto.numbersToSelect }).map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={winningNumbers[index] || ''}
                    onChange={(e) => handleNumberChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center"
                    placeholder={(index + 1).toString()}
                    disabled={showConfirmation || winningNumbersLocked.locked}
                    maxLength={2}
                  />
                ))}
              </div>
              {winningNumbersLocked.locked && (
                <p className="mt-2 text-sm text-blue-600">
                  ⚠️ Ces numéros sont verrouillés et ne peuvent pas être modifiés
                </p>
              )}
            </div>

            {/* Statistiques des tickets */}
            {ticketStats && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Répartition des tickets</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(ticketStats)
                    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                    .map(([numbers, count]) => (
                      <div key={numbers} className="bg-white p-2 rounded">
                        <div className="text-xs text-gray-600">{numbers} numéro{parseInt(numbers) > 1 ? 's' : ''}</div>
                        <div className="font-bold">{count}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Analyse Profit/Perte */}
            {showConfirmation && ticketStats && (
              <div className="bg-gradient-to-r from-green-50 to-red-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-800">Analyse Profit/Perte</h3>
                </div>
                <div className="space-y-2">
                  {(() => {
                    // Calculer le nombre total de tickets participants
                    const totalTickets = Object.entries(ticketStats)
                      .reduce((sum, [, count]) => sum + (count as number), 0);
                    
                    // Calculer le nombre de tickets gagnants (ceux qui ont des gains > 0)
                    const totalWinningTickets = Object.entries(ticketStats)
                      .filter(([numbers]) => parseInt(numbers) > 0 && prizes[parseInt(numbers)] && parseInt(prizes[parseInt(numbers)].replace(/[^0-9]/g, '')) > 0)
                      .reduce((sum, [, count]) => sum + (count as number), 0);
                    
                    // Calculer le total des revenus (TOUS les tickets × prix du ticket)
                    const totalRevenue = totalTickets * lotto.ticketPrice;
                    
                    // Calculer le total des gains distribués
                    const totalPayout = Object.entries(prizes)
                      .filter(([numbers, amount]) => parseInt(amount.replace(/[^0-9]/g, '')) > 0)
                      .reduce((sum, [numbers, amount]) => {
                        const prizeAmount = parseInt(amount.replace(/[^0-9]/g, '')) || 0;
                        const ticketCount = ticketStats[parseInt(numbers)] || 0;
                        return sum + (prizeAmount * ticketCount);
                      }, 0);
                    
                    // Calculer la perte/bénéfice
                    const profitLoss = totalRevenue - totalPayout;
                    const profitMargin = totalRevenue > 0 ? ((profitLoss / totalRevenue) * 100) : 0;
                    
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-xs text-gray-600">Total tickets</div>
                            <div className="font-bold text-lg">{totalTickets}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-xs text-gray-600">Tickets gagnants</div>
                            <div className="font-bold text-lg text-yellow-600">{totalWinningTickets}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Revenus totaux:</span>
                            <span className="font-medium text-blue-600">{formatCurrency(totalRevenue)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Gains distribués:</span>
                            <span className="font-medium text-orange-600">{formatCurrency(totalPayout)}</span>
                          </div>
                          <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
                            <span className="font-medium text-gray-800">
                              {profitLoss >= 0 ? 'Bénéfice:' : 'Perte:'}
                            </span>
                            <div className="text-right">
                              <div className={`font-bold text-xl ${
                                profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                              </div>
                              <div className={`text-sm ${
                                profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                Marge: {profitMargin.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Indicateur visuel de rentabilité */}
                        <div className="mt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Rentabilité</span>
                            <span className={`text-xs font-medium ${
                              profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {profitLoss >= 0 ? 'Profitable' : 'Déficitaire'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                profitLoss >= 0 ? 'bg-green-500' : 'bg-red-500'
                              }`}
                              style={{ 
                                width: `${Math.min(Math.abs(profitMargin), 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Recommandation */}
                        <div className={`mt-3 p-3 rounded-lg border ${
                          profitLoss >= 0 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              profitLoss >= 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <span className={`text-sm font-medium ${
                              profitLoss >= 0 ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {profitLoss >= 0 
                                ? '✓ Tirage rentable - Recommandé d\'approuver'
                                : '⚠️ Tirage déficitaire - Vérifier les montants'
                              }
                            </span>
                          </div>
                          {profitLoss < 0 && (
                            <p className="text-xs text-red-700 mt-1">
                              Déficit de {formatCurrency(Math.abs(profitLoss))}. Considérez ajuster les gains ou vérifier les calculs.
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            {/* Distribution des gains */}
            {showConfirmation && (
              <div>
                <h3 className="text-lg font-medium mb-4">Montants des gains</h3>
                <div className="space-y-4">
                  {Object.entries(prizes)
                    .sort((a, b) => parseInt(b[0]) - parseInt(a[0])) // Trier par nombre de numéros décroissant
                    .map(([numbers, amount]) => (
                      <div key={numbers} className="flex items-center gap-4">
                        <div className="flex-1">
                          <span className="font-medium">
                            {numbers} numéro{parseInt(numbers) > 1 ? 's' : ''}
                          </span>
                          {ticketStats && (
                            <span className="text-sm text-gray-600 ml-2">
                              ({ticketStats[parseInt(numbers)] || 0} ticket{ticketStats[parseInt(numbers)] !== 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                        <div className="relative flex-shrink-0">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={amount}
                            onChange={(e) => handlePrizeChange(parseInt(numbers), e.target.value)}
                            className="w-48 px-3 py-2 pr-16 border border-gray-300 rounded-lg text-right"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                            CFA
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {!isAdmin && showConfirmation && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <p className="font-medium text-yellow-800">Approbation requise</p>
                </div>
                <p className="text-sm text-yellow-700">
                  Les gains proposés devront être validés par un administrateur avant d'être appliqués.
                </p>
              </div>
            )}

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="font-medium text-yellow-800">Attention</p>
              </div>
              <p className="text-sm text-yellow-700">
                {isAdmin 
                  ? "Le calcul des gains est définitif et ne peut pas être annulé. Assurez-vous que l'événement est bien terminé avant de procéder."
                  : "Une fois soumise, cette demande verrouillera les numéros gagnants. Assurez-vous qu'ils sont corrects avant de continuer."
                }
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isDrawing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDrawing ? 'Traitement...' : 
                 !showConfirmation ? 'Vérifier les tickets' :
                 isAdmin ? 'Calculer les gains' : 
                 'Soumettre pour approbation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}