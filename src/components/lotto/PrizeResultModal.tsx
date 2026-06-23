import React from 'react';
import { X, Trophy, Star } from 'lucide-react';
import { LottoPrize } from '../../services/lotto/prize';
import { formatCurrency } from '../../utils/format';

interface PrizeResultModalProps {
  prize: LottoPrize;
  onClose: () => void;
}

export default function PrizeResultModal({ prize, onClose }: PrizeResultModalProps) {
  if (!prize) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">Résultats du tirage</h2>
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
          <div className="space-y-6">
            {/* Numéros gagnants */}
            {prize.winningNumbers && (
              <div>
                <h3 className="text-lg font-medium mb-4">Numéros gagnants</h3>
                <div className="flex flex-wrap gap-2">
                  {prize.winningNumbers.map((number, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center"
                    >
                      <span className="text-lg font-bold text-yellow-700">{number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cagnotte totale */}
            {prize.jackpotAmount && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Cagnotte totale</h4>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(prize.jackpotAmount)}
                </p>
              </div>
            )}

            {/* Distribution des gains */}
            {prize.prizeDistribution && prize.prizeDistribution.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Distribution des gains</h3>
                <div className="space-y-3">
                  {prize.prizeDistribution.map((level, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{level.numbers} numéros</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(level.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gagnants */}
            {prize.winners && prize.winners.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Statistiques des gagnants</h3>
                <div className="grid grid-cols-2 gap-4">
                  {prize.winners.map((winner, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">{winner.matchedNumbers} numéros</div>
                      <div className="text-xl font-bold">{winner.count}</div>
                      <div className="text-sm text-gray-600">gagnant{winner.count > 1 ? 's' : ''}</div>
                      {winner.count > 0 && (
                        <div className="text-sm text-green-600 mt-1">
                          {formatCurrency(winner.prizePerWinner)} par gagnant
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}