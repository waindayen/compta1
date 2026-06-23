import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

interface CommissionFormProps {
  betType: string;
  currentPercentage: number;
  onSave: (percentage: number) => Promise<void>;
}

export default function CommissionForm({ betType, currentPercentage, onSave }: CommissionFormProps) {
  const [percentage, setPercentage] = useState(currentPercentage.toString());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      setIsSubmitting(true);

      const value = parseFloat(percentage);
      if (isNaN(value) || value < 0 || value > 100) {
        throw new Error('Le pourcentage doit être entre 0 et 100');
      }

      await onSave(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pourcentage de commission
        </label>
        <div className="relative">
          <input
            type="text"
            value={percentage}
            onChange={(e) => {
              if (/^\d*\.?\d*$/.test(e.target.value)) {
                setPercentage(e.target.value);
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0-100"
            disabled={isSubmitting}
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
            %
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            <span>Sauvegarde...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Sauvegarder</span>
          </>
        )}
      </button>
    </form>
  );
}