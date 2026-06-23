import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LottoService, LottoEvent } from '../../../services/lotto';
import { LottoPrizeService } from '../../../services/lotto/prize';
import BaseDashboard from '../BaseDashboard';
import LoadingState from '../../../components/LoadingState';
import { 
  Search, 
  Calculator, 
  Trophy, 
  Target, 
  BarChart, 
  AlertCircle, 
  Info, 
  TrendingUp,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Dice6
} from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { DrawOptimizerConfigService } from '../../../services/admin/drawOptimizerConfig';

interface PrizeConfig {
  [key: number]: number; // nombre de numéros -> montant du gain
}

interface DrawResult {
  winningNumbers: number[];
  totalRevenue: number;
  totalPayout: number;
  netProfit: number;
  profitMargin: number;
  gagnantsByLevel: { [key: number]: number };
  prizeDistribution: { numbers: number; amount: number; count: number; totalPayout: number }[];
}

export default function DrawOptimizer() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [lottos, setLottos] = useState<LottoEvent[]>([]);
  const [selectedLotto, setSelectedLotto] = useState<LottoEvent | null>(null);
  const [participations, setParticipations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingParticipations, setLoadingParticipations] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [optimizerConfig, setOptimizerConfig] = useState<any>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Configuration des gains (étape 1)
  const [prizeConfig, setPrizeConfig] = useState<PrizeConfig>({});
  const [prizeConfigComplete, setPrizeConfigComplete] = useState(false);
  const [prizeConfigLocked, setPrizeConfigLocked] = useState(false);
  const [canConfigureGains, setCanConfigureGains] = useState(true);
  const [canPerformDraw, setCanPerformDraw] = useState(true);

  const checkGainConfigPermission = async () => {
    if (!currentUser) {
      setCanConfigureGains(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCanConfigureGains(userData.canConfigureGains !== false);
        setCanPerformDraw(userData.canPerformDraw !== false);
      } else {
        setCanConfigureGains(false);
        setCanPerformDraw(false);
      }
    } catch (err) {
      console.error('Error checking gain config permission:', err);
      setCanConfigureGains(false);
      setCanPerformDraw(false);
    }
  };

  // Résultats du tirage (étape 2)
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);

  useEffect(() => {
    fetchCompletedLottos();
    loadOptimizerConfig();
    checkGainConfigPermission();
  }, []);

  const loadOptimizerConfig = async () => {
    try {
      const config = await DrawOptimizerConfigService.getConfig();
      setOptimizerConfig(config);
      setConfigLoaded(true);
    } catch (err) {
      console.error('Error loading optimizer config:', err);
      setConfigLoaded(true);
    }
  };

  useEffect(() => {
    if (selectedLotto) {
      loadParticipations();
      resetOptimization();
    }
  }, [selectedLotto]);

  // Nouveau useEffect pour appliquer automatiquement la configuration par défaut
  useEffect(() => {
    if (selectedLotto && participations.length > 0 && configLoaded && optimizerConfig && !prizeConfigComplete) {
      applyDefaultConfiguration();
    }
  }, [selectedLotto, participations, configLoaded, optimizerConfig, prizeConfigComplete]);
  
  const fetchCompletedLottos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LottoService.getAllLottos();
      
      // Filtrer les lottos terminés sans calcul de gains
      const completedLottos = data.filter(lotto => {
        const endDate = new Date(lotto.endDate);
        return endDate < new Date() && !lotto.prizeCalculated;
      });
      
      setLottos(completedLottos);
    } catch (err) {
      setError('Erreur lors du chargement des lottos');
      console.error('Error fetching lottos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipations = async () => {
    if (!selectedLotto?.id) return;

    try {
      setLoadingParticipations(true);
      
      // Récupérer toutes les participations pour ce lotto
      const participationsRef = collection(db, 'lotto_participations');
      const q = query(
        participationsRef,
        where('lottoId', '==', selectedLotto.id),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      const participationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setParticipations(participationsData);
      
      // La configuration sera appliquée automatiquement par le useEffect
    } catch (err) {
      console.error('Error loading participations:', err);
      setError('Erreur lors du chargement des participations');
    } finally {
      setLoadingParticipations(false);
    }
  };

  const resetOptimization = () => {
    setPrizeConfig({});
    setPrizeConfigComplete(false);
    setPrizeConfigLocked(false);
    setDrawResult(null);
  };

  const applyDefaultConfiguration = () => {
    if (!optimizerConfig?.suggestions || optimizerConfig.suggestions.length === 0) {
      console.log('No suggestions available in optimizer config');
      return;
    }

    // Utiliser la suggestion par défaut ou la première disponible
    const defaultSuggestionName = optimizerConfig.defaultSuggestion || optimizerConfig.suggestions[0]?.name;
    
    if (defaultSuggestionName) {
      console.log('Applying default configuration:', defaultSuggestionName);
      applySuggestion(defaultSuggestionName);
      setPrizeConfigLocked(true); // Verrouiller après chargement automatique
    }
  };

  const handleLottoSelect = (lotto: LottoEvent) => {
    setSelectedLotto(lotto);
  };

  // Gestion de la configuration des gains
  const handlePrizeChange = (numbers: number, value: string) => {
    // Empêcher la modification si la configuration est verrouillée
    if (prizeConfigLocked) {
      setError('La configuration des gains a été chargée automatiquement et ne peut pas être modifiée pour des raisons de sécurité.');
      return;
    }
    
    const numericValue = value.replace(/[^0-9]/g, '');
    setPrizeConfig(prev => ({
      ...prev,
      [numbers]: parseInt(numericValue) || 0
    }));
  };

  const applySuggestion = (suggestionName: string) => {
    // Empêcher l'application de suggestions si la configuration est verrouillée
    if (prizeConfigLocked) {
      setError('La configuration des gains a été chargée automatiquement et ne peut pas être modifiée pour des raisons de sécurité.');
      return;
    }
    
    if (!selectedLotto || participations.length === 0) return;
    
    setError(null);
    const newConfig: PrizeConfig = {};
    
    // Utiliser la configuration chargée depuis la base de données
    const suggestion = optimizerConfig?.suggestions?.find((s: any) => s.name === suggestionName);
    
    if (!suggestion) {
      setError(`Configuration de suggestion "${suggestionName}" non trouvée`);
      return;
    }
    
    // Vérification défensive pour s'assurer que gains existe et est un objet
    if (!suggestion.gains || typeof suggestion.gains !== 'object') {
      setError('Configuration des gains invalide pour cette suggestion');
      return;
    }
    
    const gains = suggestion.gains;
    
    // Appliquer les gains configurés pour chaque niveau disponible dans le lotto
    for (let i = 1; i <= selectedLotto.numbersToSelect; i++) {
      // S'assurer que la valeur est toujours un nombre valide
      const gainValue = gains[i];
      newConfig[i] = (typeof gainValue === 'number' && !isNaN(gainValue)) ? gainValue : 0;
    }
    
    setPrizeConfig(newConfig);
  };

  const resetPrizeConfig = () => {
    // Empêcher la réinitialisation si la configuration est verrouillée
    if (prizeConfigLocked) {
      setError('La configuration des gains a été chargée automatiquement et ne peut pas être modifiée pour des raisons de sécurité.');
      return;
    }
    
    const resetConfig: PrizeConfig = {};
    if (selectedLotto) {
      for (let i = 1; i <= selectedLotto.numbersToSelect; i++) {
        resetConfig[i] = 0;
      }
    }
    setPrizeConfig(resetConfig);
  };

  const confirmPrizeConfig = () => {
    // Vérifier qu'au moins un gain est défini
    const hasValidPrizes = Object.values(prizeConfig).some(amount => amount > 0);
    if (hasValidPrizes) {
      setPrizeConfigComplete(true);
    }
  };

  const editPrizeConfig = () => {
    // Empêcher l'édition si la configuration est verrouillée
    if (prizeConfigLocked) {
      setError('La configuration des gains a été chargée automatiquement et ne peut pas être modifiée pour des raisons de sécurité.');
      return;
    }
    
    setPrizeConfigComplete(false);
    setDrawResult(null);
  };

  // Tirage aléatoire simple avec calcul direct
  const performRandomDraw = () => {
    if (!selectedLotto || !prizeConfigComplete || participations.length === 0) return;

    try {
      setError(null);

      // Générer des numéros gagnants aléatoires
      const winningNumbers: number[] = [];
      while (winningNumbers.length < selectedLotto.numbersToSelect) {
        const num = Math.floor(Math.random() * 50) + 1;
        if (!winningNumbers.includes(num)) {
          winningNumbers.push(num);
        }
      }
      winningNumbers.sort((a, b) => a - b);

      // Calculer les gagnants par niveau selon les participations réelles
      const gagnantsByLevel: { [key: number]: number } = {};
      
      participations.forEach(participation => {
        const matchedNumbers = participation.selectedNumbers.filter((num: number) => 
          winningNumbers.includes(num)
        ).length;
        
        gagnantsByLevel[matchedNumbers] = (gagnantsByLevel[matchedNumbers] || 0) + 1;
      });

      // Calculer le payout total selon les gains définis
      let totalPayout = 0;
      const prizeDistribution: { numbers: number; amount: number; count: number; totalPayout: number }[] = [];
      
      Object.entries(prizeConfig).forEach(([numbers, amount]) => {
        const matchCount = parseInt(numbers);
        const winnerCount = gagnantsByLevel[matchCount] || 0;
        const levelPayout = winnerCount * amount;
        
        if (amount > 0) {
          totalPayout += levelPayout;
          prizeDistribution.push({
            numbers: matchCount,
            amount,
            count: winnerCount,
            totalPayout: levelPayout
          });
        }
      });

      // Calcul simple : Revenus totaux - Gains distribués = Bénéfice
      const totalRevenue = participations.length * selectedLotto.ticketPrice;
      const netProfit = totalRevenue - totalPayout;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setDrawResult({
        winningNumbers,
        totalRevenue,
        totalPayout,
        netProfit,
        profitMargin,
        gagnantsByLevel,
        prizeDistribution: prizeDistribution.sort((a, b) => b.numbers - a.numbers)
      });

    } catch (err) {
      console.error('Error performing draw:', err);
      setError('Erreur lors du tirage');
    }
  };

  const handleSubmitForApproval = async () => {
    if (!selectedLotto || !currentUser || !drawResult) return;

    // Vérification de sécurité : empêcher la soumission si le tirage n'est pas rentable
    if (drawResult.netProfit < 0) {
      setError('Impossible de soumettre un tirage déficitaire pour approbation. Le tirage doit être rentable pour être soumis.');
      return;
    }

    // Vérification supplémentaire : s'assurer qu'il y a un bénéfice minimum
    const minimumProfitMargin = 5; // 5% minimum
    if (drawResult.profitMargin < minimumProfitMargin) {
      setError(`La marge bénéficiaire doit être d'au moins ${minimumProfitMargin}% pour soumettre le tirage. Marge actuelle: ${drawResult.profitMargin.toFixed(1)}%`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Créer la demande d'approbation avec les résultats du tirage
      const drawData = {
        winningNumbers: drawResult.winningNumbers,
        jackpotAmount: drawResult.totalPayout,
        prizeDistribution: drawResult.prizeDistribution.map(p => ({
          numbers: p.numbers,
          amount: p.amount
        })),
        ticketStats: drawResult.gagnantsByLevel,
        analysis: {
          totalRevenue: drawResult.totalRevenue,
          totalPayout: drawResult.totalPayout,
          netProfit: drawResult.netProfit,
          profitMargin: drawResult.profitMargin
        }
      };

      await LottoPrizeService.createApprovalRequest({
        lottoId: selectedLotto.id!,
        draw: drawData,
        status: 'pending',
        requestedBy: currentUser.uid,
        createdAt: new Date().toISOString()
      });

      // Rediriger vers les approbations
      navigate('/dashboard/manager/lotto-approvals');
    } catch (err) {
      console.error('Error submitting for approval:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLottos = lottos.filter(lotto =>
    lotto.eventName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = selectedLotto && participations.length > 0 
    ? participations.length * selectedLotto.ticketPrice 
    : 0;

  const getPrizeLabel = (numbers: number, totalNumbers: number) => {
    if (numbers === totalNumbers) return 'Jackpot';
    if (numbers === totalNumbers - 1) return '2ème Prix';
    if (numbers === totalNumbers - 2) return '3ème Prix';
    return 'Consolation';
  };

  const getPrizeIcon = (numbers: number, totalNumbers: number) => {
    if (numbers === totalNumbers) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (numbers === totalNumbers - 1) return <Target className="w-5 h-5 text-orange-500" />;
    if (numbers === totalNumbers - 2) return <BarChart className="w-5 h-5 text-blue-500" />;
    return <DollarSign className="w-5 h-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <BaseDashboard title="Optimisateur de Tirages">
        <LoadingState message="Chargement des lottos terminés..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Optimisateur de Tirages">
      <div className="space-y-6">
        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-800">Optimisateur Simple de Tirages</h3>
          </div>
          <p className="text-blue-700 text-sm">
            <strong>Processus :</strong> 1) Sélectionnez un lotto → 2) Définissez les gains par niveau → 3) Tirage aléatoire → 4) Analyse automatique → 5) Décision de soumission
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Étape 1: Sélection du Lotto */}
        {!selectedLotto && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Étape 1: Sélectionner un Lotto</h2>
                <p className="text-sm text-gray-600">
                  Choisissez un lotto terminé pour effectuer le tirage
                </p>
              </div>
            </div>

            {/* Recherche */}
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un lotto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Liste des lottos */}
            {filteredLottos.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun lotto terminé disponible pour le tirage</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLottos.map((lotto) => (
                  <div
                    key={lotto.id}
                    onClick={() => handleLottoSelect(lotto)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                  >
                    <h3 className="font-semibold mb-2">{lotto.eventName}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Date de fin: {new Date(lotto.endDate).toLocaleDateString('fr-FR')}</p>
                      <p>Prix du ticket: {formatCurrency(lotto.ticketPrice)}</p>
                      <p>Numéros à sélectionner: {lotto.numbersToSelect}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Étape 2: Configuration manuelle des gains */}
        {selectedLotto && !prizeConfigComplete && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Étape 2: Définir les Gains par Niveau</h2>
                  <p className="text-sm text-gray-600">
                    Configurez manuellement le montant des gains pour chaque niveau de numéros correspondants
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLotto(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                Changer de lotto
              </button>
            </div>

            {loadingParticipations ? (
              <LoadingState message="Chargement des participations..." />
            ) : (
              <>
                {/* Informations du lotto */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nombre de tickets</p>
                      <p className="text-xl font-bold">{participations.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Revenus totaux</p>
                      <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Numéros à sélectionner</p>
                      <p className="text-xl font-bold">{selectedLotto.numbersToSelect}</p>
                    </div>
                  </div>
                </div>

                {/* Boutons de suggestion rapide */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Suggestions rapides</h3>
                  {prizeConfigLocked ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <p className="text-sm text-yellow-800 font-medium">
                          Configuration verrouillée pour sécurité
                        </p>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        La configuration des gains a été chargée automatiquement depuis les paramètres admin et ne peut pas être modifiée pour éviter les abus.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mb-4">
                      Configuration automatiquement chargée depuis les paramètres admin. 
                      Vous pouvez appliquer d'autres suggestions ou modifier manuellement.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {optimizerConfig?.suggestions?.map((suggestion: any) => (
                      <button
                        key={suggestion.name}
                        onClick={() => applySuggestion(suggestion.name)}
                        disabled={prizeConfigLocked}
                        className={`px-4 py-2 rounded-lg transition-colors border-2 ${
                          prizeConfigLocked ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500 border-gray-200' :
                          suggestion.name === 'petits_gains' ? 'bg-green-50 text-green-800 border-green-200 hover:bg-green-100' :
                          suggestion.name === 'gains_moyens' ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' :
                          suggestion.name === 'gros_gains' ? 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100' :
                          suggestion.name === 'jackpot_focus' ? 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100' :
                          'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100'
                        }`}
                        title={suggestion.description}
                      >
                        <div className="text-center">
                          <div className="font-medium">{suggestion.label}</div>
                          <div className="text-xs opacity-75">
                            Jackpot: {formatCurrency(suggestion.gains?.[6] || 0)}
                          </div>
                        </div>
                      </button>
                    )) || (
                      <div className="text-gray-500">Chargement des suggestions...</div>
                    )}
                    <button
                      onClick={resetPrizeConfig}
                      disabled={prizeConfigLocked}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        prizeConfigLocked 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>

                {/* Configuration des gains par niveau */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-medium">Configuration des gains par niveau</h3>
                  
                  {Array.from({ length: selectedLotto.numbersToSelect }, (_, i) => {
                    const numbers = selectedLotto.numbersToSelect - i;
                    const currentAmount = prizeConfig[numbers] || 0;
                    
                    return (
                      <div key={numbers} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getPrizeIcon(numbers, selectedLotto.numbersToSelect)}
                            <div>
                              <h4 className="font-medium">
                                {getPrizeLabel(numbers, selectedLotto.numbersToSelect)}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {currentAmount > 0 ? `Gain: ${formatCurrency(currentAmount)}` : 'Aucun gain défini'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={currentAmount > 0 ? currentAmount.toLocaleString('fr-FR') : ''}
                            onChange={(e) => handlePrizeChange(numbers, e.target.value)}
                            disabled={prizeConfigLocked}
                            className={`w-full px-4 py-2 pr-16 border rounded-lg ${
                              prizeConfigLocked
                                ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            placeholder="0"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                            CFA
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Récapitulatif des gains */}
                {Object.values(prizeConfig).some(amount => amount > 0) && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-blue-800 mb-3">Récapitulatif de votre configuration</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Total des gains configurés:</span>
                        <span className="font-bold text-blue-800">
                          {formatCurrency(Object.values(prizeConfig).reduce((sum, amount) => sum + amount, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Revenus totaux:</span>
                        <span className="font-bold text-blue-800">
                          {formatCurrency(totalRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Profit estimé (si aucun gagnant):</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(totalRevenue - Object.values(prizeConfig).reduce((sum, amount) => sum + amount, 0))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Pourcentage de distribution:</span>
                        <span className="font-bold text-blue-800">
                          {totalRevenue > 0 ? ((Object.values(prizeConfig).reduce((sum, amount) => sum + amount, 0) / totalRevenue) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bouton de confirmation */}
                <div className="flex justify-end">
                  <button
                    onClick={confirmPrizeConfig}
                    disabled={!Object.values(prizeConfig).some(amount => amount > 0)}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {prizeConfigLocked ? 'Configuration chargée automatiquement' : 'Confirmer la configuration des gains'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Étape 3: Tirage aléatoire et résultats */}
        {selectedLotto && prizeConfigComplete && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Dice6 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Étape 3: Tirage Aléatoire</h2>
                  <p className="text-sm text-gray-600">
                    Effectuez un tirage aléatoire et analysez les résultats
                  </p>
                </div>
              </div>
              <button
                onClick={editPrizeConfig}
                disabled={prizeConfigLocked}
                className={prizeConfigLocked ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}
                title={prizeConfigLocked ? 'Configuration verrouillée pour sécurité' : 'Modifier les gains'}
              >
                {prizeConfigLocked ? 'Configuration verrouillée' : 'Modifier les gains'}
              </button>
            </div>

            {/* Gains configurés (résumé) */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-800">Gains configurés</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(prizeConfig)
                  .filter(([, amount]) => amount > 0)
                  .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                  .map(([numbers, amount]) => (
                    <div key={numbers} className="bg-white rounded p-2 text-center">
                      <div className="text-xs text-gray-600">{numbers} numéro{parseInt(numbers) > 1 ? 's' : ''}</div>
                      <div className="font-bold text-green-700">{formatCurrency(amount)}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Bouton de tirage aléatoire */}
            {canPerformDraw ? (
              <div className="flex justify-center mb-6">
                <button
                  onClick={performRandomDraw}
                  disabled={!canPerformDraw}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Dice6 className="w-6 h-6" />
                  <span className="text-lg font-medium">Effectuer un Tirage Aléatoire</span>
                </button>
              </div>
            ) : (
              <div className="flex justify-center mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 font-medium">Accès au tirage désactivé</p>
                  <p className="text-sm text-red-600">
                    Vous n'avez pas l'autorisation d'effectuer des tirages. Contactez un administrateur.
                  </p>
                </div>
              </div>
            )}

            {/* Résultats du tirage */}
            {drawResult && (
              <>
                {/* Numéros gagnants tirés */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 mb-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                    Numéros Gagnants Tirés
                  </h3>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {drawResult.winningNumbers.map((num, index) => (
                      <div key={index} className="relative">
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white text-xs rounded-full flex items-center justify-center z-10 font-bold">
                          {index + 1}
                        </span>
                        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 text-white font-bold text-xl border-4 border-yellow-300 shadow-lg">
                          {num}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analyse financière */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mb-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    Analyse Financière
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Revenus totaux:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(drawResult.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Gains distribués:</span>
                        <span className="font-bold text-orange-600">{formatCurrency(drawResult.totalPayout)}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 flex justify-between">
                        <span className="font-bold text-gray-800">
                          {drawResult.netProfit >= 0 ? 'Bénéfice:' : 'Perte:'}
                        </span>
                        <span className={`font-bold text-xl ${
                          drawResult.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {drawResult.netProfit >= 0 ? '+' : ''}{formatCurrency(drawResult.netProfit)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Marge bénéficiaire:</span>
                        <span className={`font-bold ${
                          drawResult.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {drawResult.profitMargin.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total participants:</span>
                        <span className="font-medium text-blue-600">
                          {participations.length} tickets
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total gagnants:</span>
                        <span className="font-medium text-orange-600">
                          {Object.values(drawResult.gagnantsByLevel).reduce((sum, count) => sum + count, 0)} tickets
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression du profit */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Répartition Profit/Gains</span>
                      <span className="text-sm font-medium">
                        {drawResult.profitMargin.toFixed(1)}% profit
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full ${
                          drawResult.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.max(0, Math.min(100, drawResult.profitMargin))}%` 
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>0% (Tout en gains)</span>
                      <span>100% (Tout en profit)</span>
                    </div>
                  </div>

                  {/* Indicateur de qualité */}
                  <div className={`mt-4 p-3 rounded-lg text-center ${
                    drawResult.netProfit >= 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <span className="font-bold">
                      {drawResult.netProfit >= 0 
                        ? '✅ Tirage Rentable' 
                        : '⚠️ Tirage Déficitaire'
                      }
                    </span>
                  </div>
                </div>

                {/* Répartition détaillée des gagnants */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                    <h3 className="font-bold text-lg">Répartition des Gagnants</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Niveau</th>
                          <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">Gagnants</th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Gain par ticket</th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Total à payer</th>
                          <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">% Revenus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {drawResult.prizeDistribution.map((prize) => (
                          <tr key={prize.numbers} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {getPrizeIcon(prize.numbers, selectedLotto.numbersToSelect)}
                                <span className="font-medium">
                                  {prize.numbers} numéro{prize.numbers > 1 ? 's' : ''}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({getPrizeLabel(prize.numbers, selectedLotto.numbersToSelect)})
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`font-bold text-lg ${
                                prize.count > 0 ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {prize.count}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium">
                              {formatCurrency(prize.amount)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`font-bold ${
                                prize.totalPayout > 0 ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {formatCurrency(prize.totalPayout)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-medium text-gray-600">
                                {totalRevenue > 0 ? ((prize.totalPayout / totalRevenue) * 100).toFixed(1) : 0}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td className="px-6 py-4">TOTAL</td>
                          <td className="px-6 py-4 text-center">
                            {Object.values(drawResult.gagnantsByLevel).reduce((sum, count) => sum + count, 0)}
                          </td>
                          <td className="px-6 py-4 text-right">-</td>
                          <td className="px-6 py-4 text-right text-orange-600">
                            {formatCurrency(drawResult.totalPayout)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {totalRevenue > 0 ? ((drawResult.totalPayout / totalRevenue) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-between">
                  <button
                    onClick={performRandomDraw}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Nouveau Tirage Aléatoire
                  </button>
                  
                  <button
                    onClick={handleSubmitForApproval}
                    disabled={submitting || !drawResult || drawResult.netProfit < 0 || drawResult.profitMargin < 5}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      drawResult && drawResult.netProfit >= 0 && drawResult.profitMargin >= 5
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                    title={
                      drawResult && drawResult.netProfit < 0 
                        ? 'Tirage déficitaire - Soumission bloquée'
                        : drawResult && drawResult.profitMargin < 5
                        ? 'Marge bénéficiaire insuffisante (minimum 5%)'
                        : 'Soumettre pour approbation'
                    }
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Soumission...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-5 h-5" />
                        <span>
                          {drawResult && drawResult.netProfit < 0 
                            ? 'Tirage Déficitaire'
                            : drawResult && drawResult.profitMargin < 5
                            ? 'Marge Insuffisante'
                            : 'Soumettre pour Approbation'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Message d'avertissement pour les tirages non rentables */}
                {drawResult && (drawResult.netProfit < 0 || drawResult.profitMargin < 5) && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <h3 className="font-medium text-red-800">Tirage non soumissible</h3>
                    </div>
                    <div className="text-sm text-red-700 space-y-1">
                      {drawResult.netProfit < 0 && (
                        <p>• Le tirage est déficitaire ({formatCurrency(drawResult.netProfit)})</p>
                      )}
                      {drawResult.profitMargin < 5 && (
                        <p>• La marge bénéficiaire est insuffisante ({drawResult.profitMargin.toFixed(1)}% &lt; 5%)</p>
                      )}
                      <p>
                        Ajustez les gains ou effectuez un nouveau tirage pour obtenir un résultat rentable.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </BaseDashboard>
  );
}