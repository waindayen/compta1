import React, { useState } from 'react';
import BaseDashboard from '../BaseDashboard';
import { Settings, Bell, Shield, Save, AlertCircle } from 'lucide-react';

export default function ManagerSettings() {
  const [notifications, setNotifications] = useState({
    newAgent: true,
    performance: true,
    reports: false,
    system: true
  });

  const [thresholds, setThresholds] = useState({
    performanceAlert: '80',
    revenueTarget: '10000',
    clientTarget: '100'
  });

  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setStatus('saving');
      setError(null);

      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setError('Une erreur est survenue lors de la sauvegarde');
      setStatus('error');
    }
  };

  return (
    <BaseDashboard title="Paramètres Manager">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Notifications</h2>
              <p className="text-sm text-gray-600">
                Gérez vos préférences de notifications
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Nouveaux agents</p>
                <p className="text-sm text-gray-600">
                  Notifications lors de l'ajout d'un nouvel agent
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.newAgent}
                  onChange={e => setNotifications(prev => ({
                    ...prev,
                    newAgent: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertes de performance</p>
                <p className="text-sm text-gray-600">
                  Notifications sur les performances de l'équipe
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.performance}
                  onChange={e => setNotifications(prev => ({
                    ...prev,
                    performance: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Rapports automatiques</p>
                <p className="text-sm text-gray-600">
                  Réception des rapports périodiques
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.reports}
                  onChange={e => setNotifications(prev => ({
                    ...prev,
                    reports: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Seuils d'alerte */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Shield className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Seuils d'alerte</h2>
              <p className="text-sm text-gray-600">
                Configurez les seuils pour les alertes automatiques
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seuil d'alerte performance (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={thresholds.performanceAlert}
                onChange={e => setThresholds(prev => ({
                  ...prev,
                  performanceAlert: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objectif de revenu mensuel (€)
              </label>
              <input
                type="number"
                min="0"
                value={thresholds.revenueTarget}
                onChange={e => setThresholds(prev => ({
                  ...prev,
                  revenueTarget: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objectif clients par agent
              </label>
              <input
                type="number"
                min="0"
                value={thresholds.clientTarget}
                onChange={e => setThresholds(prev => ({
                  ...prev,
                  clientTarget: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
            onClick={handleSubmit}
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
      </div>
    </BaseDashboard>
  );
}