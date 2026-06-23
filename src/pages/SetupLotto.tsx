import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock, DollarSign, Grid, AlertCircle, Info } from 'lucide-react';
import { LottoService } from '../services/lotto';
import BaseDashboard from './dashboards/BaseDashboard';

const CURRENCIES = [
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'USD', label: 'Dollar ($)', symbol: '$' },
  { value: 'XAF', label: 'CFA', symbol: 'CFA' }
];

const FREQUENCIES = [
  { value: 'once', label: 'Une fois' },
  { value: 'daily', label: 'Chaque jour' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'yearly', label: 'Annuel' }
];

const NUMBERS_TO_SELECT = [3, 4, 5, 6];
const GRIDS_PER_TICKET = [1, 2, 3, 4, 5];

export default function SetupLotto() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    eventName: '',
    startDate: '',
    endDate: '',
    ticketPrice: '',
    currency: 'XAF',
    frequency: 'once',
    numbersToSelect: 6,
    gridsPerTicket: 1
  });
  const [lottoStatus, setLottoStatus] = useState<string | null>(null);
  const [useCurrentDate, setUseCurrentDate] = useState(false);

  useEffect(() => {
    if (id) {
      loadLotto(id);
    }
  }, [id]);

  const loadLotto = async (lottoId: string) => {
    try {
      const lotto = await LottoService.getLotto(lottoId);
      if (lotto) {
        // Vérifier si le lotto est en attente
        if (lotto.status !== 'pending') {
          setError('Seuls les lottos en attente peuvent être modifiés');
          setLottoStatus(lotto.status || 'unknown');
          return;
        }
        
        setFormData({
          eventName: lotto.eventName,
          startDate: lotto.startDate.slice(0, 16),
          endDate: lotto.endDate.slice(0, 16),
          ticketPrice: lotto.ticketPrice.toString(),
          currency: lotto.currency,
          frequency: lotto.frequency,
          numbersToSelect: lotto.numbersToSelect,
          gridsPerTicket: lotto.gridsPerTicket
        });
        
        setLottoStatus(lotto.status || null);
      }
    } catch (err) {
      setError('Erreur lors du chargement du lotto');
    }
  };

  const validateDates = () => {
    const startDate = useCurrentDate 
      ? new Date(ServerTimeService.getServerTimeISO()) 
      : new Date(formData.startDate + 'Z'); // Forcer UTC
    const endDate = new Date(formData.endDate);
    const now = new Date(ServerTimeService.getServerTimeISO());

    if (endDate <= startDate) {
      throw new Error("La date de fin doit être après la date de début");
    }

    // Validation spécifique selon la fréquence
    switch (formData.frequency) {
      case 'daily':
        // Calculer la différence en heures
        const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
        
        // Vérifier que la durée est d'au moins 1 heure
        if (diffHours < 1) {
          throw new Error("Pour un événement quotidien, la durée doit être d'au moins 1 heure");
        }
        break;

      case 'weekly':
        // Pour les lottos hebdomadaires, calculer la différence en jours
        const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Vérifier que la durée est d'environ 7 jours (entre 6.5 et 7.5 jours pour permettre une marge)
        if (diffDays < 6.5 || diffDays > 7.5) {
          throw new Error("Pour un événement hebdomadaire, la durée doit être d'environ 7 jours");
        }
        break;

      case 'yearly':
        // Pour les lottos annuels, vérifier que la différence est d'environ 1 an
        const startYear = startDate.getFullYear();
        const endYear = endDate.getFullYear();
        const startMonth = startDate.getMonth();
        const endMonth = endDate.getMonth();
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        
        // Vérifier que la différence est d'environ 1 an (même mois, même jour à peu près)
        if (endYear - startYear !== 1 || 
            endMonth !== startMonth || 
            Math.abs(endDay - startDay) > 1) {
          throw new Error("Pour un événement annuel, la durée doit être d'environ 1 an");
        }
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      validateDates();

      const startDate = useCurrentDate 
        ? new Date(ServerTimeService.getServerTimeISO()) 
        : new Date(formData.startDate + 'Z'); // Forcer UTC
      
      const lottoData = {
        ...formData,
        startDate: startDate.toISOString(),
        ticketPrice: parseFloat(formData.ticketPrice),
        numbersToSelect: parseInt(formData.numbersToSelect.toString()),
        gridsPerTicket: parseInt(formData.gridsPerTicket.toString())
      };

      if (id) {
        // Vérifier si le lotto est en attente
        if (lottoStatus !== 'pending') {
          throw new Error('Seuls les lottos en attente peuvent être modifiés');
        }
        
        await LottoService.updateLotto(id, lottoData);
      } else {
        await LottoService.createLotto(lottoData);
      }

      navigate('/dashboard/admin/lottos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getDateConstraints = () => {
    // Utiliser l'heure du serveur pour les contraintes
    const serverTime = new Date(ServerTimeService.getServerTimeISO());
    serverTime.setMinutes(serverTime.getMinutes() + 1);
    const min = serverTime.toISOString().slice(0, 16);

    return {
      startMin: min,
      startMax: null,
      endMin: formData.startDate || min
    };
  };

  const dateConstraints = getDateConstraints();

  // Si le lotto n'est pas en attente et qu'on essaie de le modifier, afficher un message d'erreur
  if (id && lottoStatus && lottoStatus !== 'pending') {
    return (
      <BaseDashboard title={id ? "Modifier le Lotto" : "Créer un Lotto"}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-lg font-semibold text-red-700">Modification impossible</h2>
            </div>
            <p className="text-red-600 mb-4">
              Ce lotto ne peut pas être modifié car son statut est "{lottoStatus}".
              Seuls les lottos en attente peuvent être modifiés.
            </p>
            <button
              onClick={() => navigate('/dashboard/admin/lottos')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour à la liste des lottos
            </button>
          </div>
        </div>
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title={id ? "Modifier le Lotto" : "Créer un Lotto"}>
      <div className="max-w-2xl mx-auto">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom de l'événement */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'événement
            </label>
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Super Lotto 2024"
              required
            />
          </div>

          {/* Fréquence */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Fréquence</span>
              </div>
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {FREQUENCIES.map(freq => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-gray-500">
              {formData.frequency === 'daily' && "L'événement se répétera chaque jour"}
              {formData.frequency === 'weekly' && "L'événement se répétera chaque semaine"}
              {formData.frequency === 'yearly' && "L'événement se répétera chaque année"}
              {formData.frequency === 'once' && "L'événement n'aura lieu qu'une seule fois"}
            </p>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Date de début</span>
                  </div>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useCurrentDate"
                      checked={useCurrentDate}
                      onChange={(e) => setUseCurrentDate(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useCurrentDate" className="text-sm text-gray-700">
                      Utiliser la date actuelle
                    </label>
                  </div>
                  {!useCurrentDate && (
                    <input
                      type="datetime-local"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      min={dateConstraints.startMin}
                      max={dateConstraints.startMax}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={!useCurrentDate}
                      disabled={useCurrentDate}
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Date de fin</span>
                  </div>
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={dateConstraints.endMin}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="mt-4 bg-blue-50 rounded-lg p-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Conseils pour les dates selon la fréquence :</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-1 list-disc list-inside">
                  {formData.frequency === 'daily' && (
                    <li>Pour un lotto quotidien, la durée doit être d'au moins 1 heure</li>
                  )}
                  {formData.frequency === 'weekly' && (
                    <li>Pour un lotto hebdomadaire, la durée doit être d'environ 7 jours</li>
                  )}
                  {formData.frequency === 'yearly' && (
                    <li>Pour un lotto annuel, la durée doit être d'environ 1 an</li>
                  )}
                  {formData.frequency === 'once' && (
                    <li>Pour un lotto unique, choisissez les dates qui vous conviennent</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Prix et Devise */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>Prix du ticket</span>
                  </div>
                </label>
                <input
                  type="number"
                  name="ticketPrice"
                  value={formData.ticketPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devise
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Configuration du jeu */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    <span>Nombres à sélectionner</span>
                  </div>
                </label>
                <select
                  name="numbersToSelect"
                  value={formData.numbersToSelect}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {NUMBERS_TO_SELECT.map(num => (
                    <option key={num} value={num}>
                      {num} nombres
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    <span>Grilles par ticket</span>
                  </div>
                </label>
                <select
                  name="gridsPerTicket"
                  value={formData.gridsPerTicket}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {GRIDS_PER_TICKET.map(num => (
                    <option key={num} value={num}>
                      {num} grille{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Traitement...' : id ? 'Mettre à jour le lotto' : 'Créer le lotto'}
            </button>
          </div>
        </form>
      </div>
    </BaseDashboard>
  );
}