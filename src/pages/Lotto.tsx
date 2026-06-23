import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, DollarSign, Ticket, AlertCircle } from 'lucide-react';
import { LottoService, LottoEvent, LottoParticipation } from '../services/lotto';
import { useAuth } from '../contexts/AuthContext';
import LoadingState from '../components/LoadingState';
import ParticipationModal from '../components/lotto/ParticipationModal';
import AuthMobileModal from '../components/auth/AuthMobileModal';
import AuthDesktopModal from '../components/auth/AuthDesktopModal';

import { ServerTimeService } from '../services/serverTime';

export default function Lotto() {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [lottos, setLottos] = useState<LottoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLotto, setSelectedLotto] = useState<LottoEvent | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    fetchLottos();
  }, []);

  const fetchLottos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LottoService.getAllLottos();
      
      const now = new Date(ServerTimeService.getServerTimeISO());
      const activeEvents = data.filter(lotto => {
        const startDate = new Date(lotto.startDate);
        const endDate = new Date(lotto.endDate);
        // Filter active events that are also enabled
        return now >= startDate && now < endDate && lotto.isEnabled !== false;
      });

      setLottos(activeEvents);
    } catch (err) {
      setError('Erreur lors du chargement des lottos');
      console.error('Error fetching lottos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipate = async (selectedNumbers: number[]) => {
    if (!currentUser || !selectedLotto) {
      setShowAuthModal(true);
      return;
    }

    try {
      setError(null);

      const participationId = await LottoService.participate({
        lottoId: selectedLotto.id!,
        userId: currentUser.uid,
        selectedNumbers,
        ticketPrice: selectedLotto.ticketPrice,
        currency: selectedLotto.currency
      });

      return participationId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la participation');
      throw err;
    }
  };

  const handleLottoClick = (lotto: LottoEvent) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    
    // Vérifier si le lotto est activé
    if (lotto.isEnabled === false) {
      setError('Ce lotto est actuellement désactivé');
      return;
    }

    // Vérifier si le lotto est encore actif
    const now = new Date(ServerTimeService.getServerTimeISO());
    const startDate = new Date(lotto.startDate);
    const endDate = new Date(lotto.endDate);

    if (now < startDate) {
      setError('Ce lotto n\'a pas encore commencé');
      return;
    }

    if (now >= endDate) {
      setError('Ce lotto est terminé');
      return;
    }

    // Ouvrir le modal de participation
    setSelectedLotto(lotto);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-4">
        <LoadingState message="Chargement des lottos..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lotto en cours</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {lottos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">Aucun lotto en cours actuellement</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lottos.map((lotto) => (
              <div key={lotto.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">{lotto.eventName}</h2>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      En cours
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Début: {new Date(lotto.startDate).toLocaleString('fr-FR', { 
                        timeZone: 'UTC',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} UTC</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Fin: {new Date(lotto.endDate).toLocaleString('fr-FR', { 
                        timeZone: 'UTC',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} UTC</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>Prix: {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: lotto.currency
                      }).format(lotto.ticketPrice)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleLottoClick(lotto)}
                    className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-5 h-5" />
                    Participer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedLotto && (
          <ParticipationModal
            lotto={selectedLotto}
            onClose={() => setSelectedLotto(null)}
            onSubmit={handleParticipate}
          />
        )}

        <AuthMobileModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          message="Connectez-vous pour participer aux tirages Lotto et tenter de gagner !"
        />

        <AuthDesktopModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          message="Connectez-vous pour participer aux tirages Lotto et tenter de gagner !"
        />
      </div>
    </div>
  );
}