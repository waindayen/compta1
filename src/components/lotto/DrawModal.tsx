import React, { useState } from 'react';
import { X, Trophy, AlertCircle } from 'lucide-react';
import { LottoEvent } from '../../services/lotto';
import { LottoDrawService, LottoDraw } from '../../services/lotto/draw';
import { formatCurrency } from '../../utils/format';

interface DrawModalProps {
  lotto: LottoEvent;
  onClose: () => void;
  onDrawComplete: (draw: LottoDraw) => void;
}

const DEFAULT_PRIZE_DISTRIBUTION = {
  6: 40, // 40% pour 6 numéros
  5: 30, // 30% pour 5 numéros
  4: 20, // 20% pour 4 numéros
  3: 10  // 10% pour 3 numéros
};

export default function DrawModal({ lotto, onClose, onDrawComplete }: DrawModalProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prizeDistribution, setPrizeDistribution] = useState(DEFAULT_PRIZE_DISTRIBUTION);

  const handleDraw = async () => {
    try {
      setIsDrawing(true);
      setError(null);

      const draw = await LottoDrawService.performDraw(lotto.id!, prizeDistribution);
      onDrawComplete(draw);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du tirage');
    } finally {
      setIsDrawing(false);
    }
  };

  const handlePrizeDistributionChange = (numbers: number, value: string) => {
    const percentage = parseInt(value);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      setPrizeDistribution(prev => ({
        ...prev,
        [numbers]: percentage
      }));
    }
  };

  const totalPercentage = Object.values(prizeDistribution).reduce((sum, value) => sum + value, 0);
  const isValidDistribution = totalPercentage === 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">Tirage au sort - {lotto.eventName}</h2>
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

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Distribution des gains</h3>
              <div className="space-y-4">
                {Object.entries(prizeDistribution).map(([numbers, percentage]) => (
                  <div key={numbers} className="flex items-center gap-4">
                    <span className="w-32">{numbers} numéros :</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={percentage}
                      onChange={(e) => handlePrizeDistributionChange(parseInt(numbers), e.target.value)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                      disabled={isDrawing}
                    />
                    <span>%</span>
                  </div>
                ))}
              </div>
              {!isValidDistribution && (
                <p className="mt-2 text-red-500 text-sm">
                  Le total doit être égal à 100% (actuellement {totalPercentage}%)
                </p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Important</h4>
              <p className="text-yellow-700 text-sm">
                Le tirage au sort est définitif et ne peut pas être annulé. 
                Assurez-vous que l'événement est bien terminé avant de procéder.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleDraw}
                disabled={isDrawing || !isValidDistribution}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDrawing ? 'Tirage en cours...' : 'Effectuer le tirage'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}