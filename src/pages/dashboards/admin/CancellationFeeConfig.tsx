import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Info, ToggleLeft, ToggleRight } from 'lucide-react';
import BaseDashboard from '../BaseDashboard';
import { CancellationFeeService, CancellationFeeConfig } from '../../../services/admin/cancellationFee';
import { useAuth } from '../../../contexts/AuthContext';
import CancellationFeeNav from '../../../components/admin/payment/CancellationFeeNav';

export default function CancellationFeeConfigPage() {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<CancellationFeeConfig | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await CancellationFeeService.getConfig();
      setConfig(data);
    } catch (err) {
      console.error('Error loading config:', err);
      setError('Erreur lors du chargement de la configuration');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !currentUser) return;
    
    try {
      setStatus('saving');
      setError(null);

      // Validate percentage
      if (config.percentage < 0 || config.percentage > 100) {
        throw new Error('Le pourcentage doit être entre 0 et 100');
      }

      await CancellationFeeService.saveConfig({
        ...config,
        updatedBy: currentUser.uid
      });
      
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
      setStatus('error');
    }
  };

  const handlePercentageChange = (value: string) => {
    if (!config) return;
    
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setConfig({
        ...config,
        percentage: parseFloat(value) || 0
      });
    }
  };

  const toggleEnabled = () => {
    if (!config) return;
    
    setConfig({
      ...config,
      enabled: !config.enabled
    });
  };

  if (!config) {
    return (
      <BaseDashboard title="Configuration des frais d'annulation">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Configuration des frais d'annulation">
      <CancellationFeeNav />
      
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Activation des frais */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Frais d'annulation</h2>
                <p className="text-sm text-gray-600">
                  Activez ou désactivez les frais d'annulation pour les tickets lotto
                </p>
              </div>
              <button
                type="button"
                onClick={toggleEnabled}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  config.enabled
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {config.enabled ? (
                  <>
                    <ToggleRight className="w-5 h-5" />
                    <span>Activé</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5" />
                    <span>Désactivé</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Lorsque les frais d'annulation sont activés, un pourcentage du montant du ticket sera retenu lors de l'annulation.
                  Ce montant ne sera pas remboursé à l'agent.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pourcentage des frais d'annulation
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={config.percentage}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0-100"
                  disabled={!config.enabled}
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  %
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Pourcentage du montant du ticket qui sera retenu lors de l'annulation.
              </p>
            </div>
          </div>

          {/* Messages de statut */}
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-700">Configuration sauvegardée avec succès</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error || 'Une erreur est survenue'}</p>
            </div>
          )}

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={status === 'saving'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'saving' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Sauvegarder</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </BaseDashboard>
  );
}