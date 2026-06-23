import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Plus, Trash2, Calculator, Info, RotateCcw, Trophy, Target, BarChart, DollarSign } from 'lucide-react';
import BaseDashboard from '../BaseDashboard';
import { DrawOptimizerConfigService, DrawOptimizerConfig, DrawOptimizerSuggestion } from '../../../services/admin/drawOptimizerConfig';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingState from '../../../components/LoadingState';
import DrawOptimizerConfigNav from '../../../components/admin/optimizer/DrawOptimizerConfigNav';
import { formatCurrency } from '../../../utils/format';

export default function DrawOptimizerConfigPage() {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<DrawOptimizerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DrawOptimizerConfigService.getConfig();
      setConfig(data);
    } catch (err) {
      console.error('Error loading config:', err);
      setError('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config || !currentUser) return;

    try {
      setSaving(true);
      setError(null);
      setValidationErrors([]);

      // Valider la configuration
      const errors = DrawOptimizerConfigService.validateConfig(config);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }

      await DrawOptimizerConfigService.saveConfig({
        ...config,
        updatedBy: currentUser.uid
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSuggestionChange = (index: number, field: string, value: any) => {
    if (!config) return;

    const newSuggestions = [...config.suggestions];
    if (field.startsWith('gains.')) {
      const gainLevel = parseInt(field.split('.')[1]);
      newSuggestions[index] = {
        ...newSuggestions[index],
        gains: {
          ...(newSuggestions[index].gains || {}),
          [gainLevel]: parseInt(value.toString().replace(/[^0-9]/g, '')) || 0
        }
      };
    } else {
      newSuggestions[index] = {
        ...newSuggestions[index],
        [field]: value
      };
    }

    setConfig({
      ...config,
      suggestions: newSuggestions
    });
  };

  const addSuggestion = () => {
    if (!config) return;

    const newSuggestion: DrawOptimizerSuggestion = {
      name: `custom_${Date.now()}`,
      label: 'Nouvelle suggestion',
      description: 'Description de la nouvelle suggestion',
      gains: {
        6: 100000,
        5: 25000,
        4: 10000,
        3: 2500,
        2: 1000,
        1: 250
      }
    };

    setConfig({
      ...config,
      suggestions: [...config.suggestions, newSuggestion]
    });
  };

  const removeSuggestion = (index: number) => {
    if (!config || config.suggestions.length <= 1) return;

    const newSuggestions = config.suggestions.filter((_, i) => i !== index);
    
    // Si la suggestion supprimée était la suggestion par défaut, choisir la première
    let newDefaultSuggestion = config.defaultSuggestion;
    if (config.suggestions[index].name === config.defaultSuggestion) {
      newDefaultSuggestion = newSuggestions[0]?.name || '';
    }

    setConfig({
      ...config,
      suggestions: newSuggestions,
      defaultSuggestion: newDefaultSuggestion
    });
  };

  const resetToDefaults = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser la configuration par défaut ? Toutes vos modifications seront perdues.')) {
      const defaultConfig: DrawOptimizerConfig = {
        suggestions: [
          {
            name: 'petits_gains',
            label: 'Petits Gains',
            description: 'Distribution avec des gains modestes pour maximiser les profits',
            gains: {
              6: 50000,
              5: 10000,
              4: 5000,
              3: 1000,
              2: 500,
              1: 100
            }
          },
          {
            name: 'gains_moyens',
            label: 'Gains Moyens',
            description: 'Distribution équilibrée entre gains attractifs et rentabilité',
            gains: {
              6: 100000,
              5: 25000,
              4: 10000,
              3: 2500,
              2: 1000,
              1: 250
            }
          },
          {
            name: 'gros_gains',
            label: 'Gros Gains',
            description: 'Distribution généreuse pour attirer plus de joueurs',
            gains: {
              6: 200000,
              5: 50000,
              4: 20000,
              3: 5000,
              2: 2000,
              1: 500
            }
          },
          {
            name: 'jackpot_focus',
            label: 'Focus Jackpot',
            description: 'Concentration sur le jackpot avec gains minimes pour les autres niveaux',
            gains: {
              6: 500000,
              5: 5000,
              4: 2000,
              3: 500,
              2: 200,
              1: 50
            }
          }
        ],
        defaultSuggestion: 'gains_moyens',
        updatedAt: new Date().toISOString()
      };
      setConfig(defaultConfig);
    }
  };

  const calculateTotalGains = (suggestion: DrawOptimizerSuggestion) => {
    return Object.values(suggestion.gains || {}).reduce((sum, amount) => sum + amount, 0);
  };

  const getGainIcon = (level: number) => {
    switch (level) {
      case 6: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 5: return <Target className="w-5 h-5 text-orange-500" />;
      case 4: return <BarChart className="w-5 h-5 text-blue-500" />;
      case 3: return <DollarSign className="w-5 h-5 text-green-500" />;
      case 2: return <DollarSign className="w-5 h-5 text-purple-500" />;
      case 1: return <DollarSign className="w-5 h-5 text-gray-500" />;
      default: return <DollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  const getGainLabel = (level: number) => {
    switch (level) {
      case 6: return 'Jackpot (6 numéros)';
      case 5: return '2ème Prix (5 numéros)';
      case 4: return '3ème Prix (4 numéros)';
      case 3: return '4ème Prix (3 numéros)';
      case 2: return '5ème Prix (2 numéros)';
      case 1: return 'Consolation (1 numéro)';
      default: return `${level} numéros`;
    }
  };

  if (loading) {
    return (
      <BaseDashboard title="Configuration de l'Optimisateur">
        <LoadingState message="Chargement de la configuration..." />
      </BaseDashboard>
    );
  }

  if (!config) {
    return (
      <BaseDashboard title="Configuration de l'Optimisateur">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Erreur lors du chargement de la configuration</p>
        </div>
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Configuration de l'Optimisateur">
      <DrawOptimizerConfigNav />
      
      <div className="space-y-6">
        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-800">Configuration des Suggestions Rapides</h3>
          </div>
          <p className="text-blue-700 text-sm">
            Configurez les suggestions rapides qui apparaîtront dans l'optimisateur de tirages. 
            Ces suggestions permettent aux managers de définir rapidement les gains en CFA selon différentes stratégies.
            Chaque suggestion peut définir des gains pour 1 à 6 numéros correspondants.
          </p>
        </div>

        {/* Messages d'erreur et de succès */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <h3 className="font-medium text-red-800">Erreurs de validation</h3>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-700">Configuration sauvegardée avec succès</p>
          </div>
        )}

        {/* Configuration par défaut */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Suggestion par défaut</h2>
          <div className="relative">
            <select
              value={config.defaultSuggestion}
              onChange={(e) => setConfig({ ...config, defaultSuggestion: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {config.suggestions.map((suggestion) => (
                <option key={suggestion.name} value={suggestion.name}>
                  {suggestion.label}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Cette suggestion sera pré-sélectionnée par défaut dans l'optimisateur
          </p>
        </div>

        {/* Liste des suggestions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Suggestions de gains</h2>
            <div className="flex gap-2">
              <button
                onClick={resetToDefaults}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Réinitialiser
              </button>
              <button
                onClick={addSuggestion}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Ajouter une suggestion
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {config.suggestions.map((suggestion, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom (identifiant)
                      </label>
                      <input
                        type="text"
                        value={suggestion.name}
                        onChange={(e) => handleSuggestionChange(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="petits_gains"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Libellé
                      </label>
                      <input
                        type="text"
                        value={suggestion.label}
                        onChange={(e) => handleSuggestionChange(index, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Petits Gains"
                      />
                    </div>
                  </div>
                  {config.suggestions.length > 1 && (
                    <button
                      onClick={() => removeSuggestion(index)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer cette suggestion"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={suggestion.description}
                    onChange={(e) => handleSuggestionChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Description de cette suggestion..."
                  />
                </div>

                {/* Configuration des gains par niveau */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-4">Gains par niveau (en CFA)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DrawOptimizerConfigService.getGainLevels().reverse().map((level) => (
                      <div key={level} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {getGainIcon(level)}
                          <span className="font-medium text-sm">
                            {getGainLabel(level)}
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={suggestion.gains?.[level] ? suggestion.gains[level].toLocaleString('fr-FR') : ''}
                            onChange={(e) => handleSuggestionChange(index, `gains.${level}`, e.target.value)}
                            className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            CFA
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Récapitulatif des gains */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Total des gains configurés:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {formatCurrency(calculateTotalGains(suggestion))}
                    </span>
                  </div>
                  
                  {/* Répartition visuelle */}
                  <div className="space-y-2">
                    {Object.entries(suggestion.gains || {})
                      .filter(([, amount]) => amount > 0)
                      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                      .map(([level, amount]) => {
                        const percentage = calculateTotalGains(suggestion) > 0 
                          ? (amount / calculateTotalGains(suggestion)) * 100 
                          : 0;
                        return (
                          <div key={level} className="flex items-center gap-3">
                            <div className="w-24 text-sm text-gray-600">
                              {getGainLabel(parseInt(level)).split('(')[0].trim()}
                            </div>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-20 text-sm text-right font-medium">
                              {formatCurrency(amount)}
                            </div>
                            <div className="w-12 text-xs text-gray-500 text-right">
                              {percentage.toFixed(0)}%
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Indicateur si c'est la suggestion par défaut */}
                {suggestion.name === config.defaultSuggestion && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Suggestion par défaut</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-4">
          <button
            onClick={loadConfig}
            disabled={saving}
            className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
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