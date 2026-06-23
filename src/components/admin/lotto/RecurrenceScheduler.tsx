import React, { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle, Check, Info } from 'lucide-react';
import { LottoRecurrenceService } from '../../../services/lotto/recurrence';

interface RecurrenceSchedulerProps {
  frequency: string;
  startDate: string;
  endDate: string;
}

export default function RecurrenceScheduler({ frequency, startDate, endDate }: RecurrenceSchedulerProps) {
  const [nextOccurrence, setNextOccurrence] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (frequency !== 'once' && startDate && endDate) {
      calculateNextOccurrence();
    }
  }, [frequency, startDate, endDate]);

  const calculateNextOccurrence = () => {
    try {
      if (!startDate || !endDate) return;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();
      const duration = end.getTime() - start.getTime();

      let next: Date;

      switch (frequency) {
        case 'daily':
          next = new Date(now);
          next.setHours(start.getHours(), start.getMinutes(), 0, 0);
          if (next < now) {
            next.setDate(next.getDate() + 1);
          }
          break;

        case 'weekly':
          next = new Date(now);
          const dayDiff = start.getDay() - next.getDay();
          next.setDate(next.getDate() + (dayDiff >= 0 ? dayDiff : dayDiff + 7));
          next.setHours(start.getHours(), start.getMinutes(), 0, 0);
          if (next < now) {
            next.setDate(next.getDate() + 7);
          }
          break;

        case 'yearly':
          next = new Date(start);
          next.setFullYear(now.getFullYear());
          if (next < now) {
            next.setFullYear(now.getFullYear() + 1);
          }
          break;

        default:
          return;
      }

      setNextOccurrence(next);
    } catch (err) {
      console.error('Error calculating next occurrence:', err);
      setError('Erreur lors du calcul de la prochaine occurrence');
    }
  };

  const handleManualCheck = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await LottoRecurrenceService.checkAndCreateRecurringLottos();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Recalculer la prochaine occurrence
      calculateNextOccurrence();
    } catch (err) {
      console.error('Error checking recurrence:', err);
      setError('Erreur lors de la vérification de la récurrence');
    } finally {
      setLoading(false);
    }
  };

  if (frequency === 'once') {
    return null;
  }

  return (
    <div className="bg-blue-50 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-800 mb-2">Programmation de récurrence</h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">
                Fréquence: {frequency === 'daily' ? 'Quotidienne' : 
                           frequency === 'weekly' ? 'Hebdomadaire' : 
                           frequency === 'yearly' ? 'Annuelle' : 'Inconnue'}
              </span>
            </div>
            
            {nextOccurrence && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700">
                  Prochaine occurrence: {nextOccurrence.toLocaleString('fr-FR')}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualCheck}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Vérifier maintenant</span>
                </>
              )}
            </button>
            
            <div className="text-sm text-blue-700">
              <Info className="w-4 h-4 inline mr-1" />
              La vérification est automatique, mais vous pouvez la forcer manuellement.
            </div>
          </div>
          
          {error && (
            <div className="mt-3 bg-red-100 text-red-700 p-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mt-3 bg-green-100 text-green-700 p-2 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Vérification effectuée avec succès</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}