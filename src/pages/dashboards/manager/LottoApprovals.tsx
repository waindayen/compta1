import React, { useState, useEffect } from 'react';
import BaseDashboard from '../BaseDashboard';
import { LottoPrizeService, ApprovalRequest, ApprovalVote, ApprovalHistory } from '../../../services/lotto/prize';
import PrizeResultModal from '../../../components/lotto/PrizeResultModal';
import LoadingState from '../../../components/LoadingState';
import { AlertCircle, Trophy, Search, Calendar, Clock, CheckCircle, XCircle, Info, Filter, MessageSquare, Eye, ThumbsUp, ThumbsDown, Lock } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function LottoApprovals() {
  const { currentUser } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDraw, setSelectedDraw] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canApprove, setCanApprove] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchApprovals();
    checkApprovalAccess();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LottoPrizeService.getApprovalRequests();
      setApprovals(data);
    } catch (err) {
      setError('Erreur lors du chargement des demandes d\'approbation');
      console.error('Error fetching approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkApprovalAccess = async () => {
    if (!currentUser) return;
    
    try {
      // Vérifier si l'utilisateur a le droit d'approuver
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        // Si canApprove est explicitement false, bloquer l'accès
        if (userData.canApprove === false) {
          setCanApprove(false);
        } else {
          setCanApprove(true);
        }
      }
    } catch (err) {
      console.error('Error checking approval access:', err);
      // Par défaut, autoriser l'accès en cas d'erreur
      setCanApprove(true);
    }
  };

  const handleViewDraw = (draw: any) => {
    setSelectedDraw(draw);
  };

  const handleApprove = async (approval: ApprovalRequest) => {
    if (!currentUser) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      await LottoPrizeService.approveRequest(approval.id!, currentUser.uid);
      await fetchApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'approbation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!currentUser || !selectedApproval || !rejectReason) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      await LottoPrizeService.rejectRequest(selectedApproval.id!, currentUser.uid, rejectReason);
      setShowRejectModal(false);
      setSelectedApproval(null);
      setRejectReason('');
      await fetchApprovals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rejet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewHistory = async (approval: ApprovalRequest) => {
    try {
      setLoadingHistory(true);
      const history = await LottoPrizeService.getApprovalHistory(approval.id!);
      setApprovalHistory(history);
      setSelectedApproval(approval);
      setShowHistoryModal(true);
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
      console.error('Error loading history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            En attente
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Approuvé
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
            <XCircle className="w-4 h-4" />
            Rejeté
          </span>
        );
      default:
        return null;
    }
  };

  const hasVoted = (approval: ApprovalRequest): boolean => {
    if (!currentUser || !approval.votes) return false;
    return approval.votes.some(vote => vote.managerId === currentUser.uid);
  };

  const getUserVote = (approval: ApprovalRequest): ApprovalVote | undefined => {
    if (!currentUser || !approval.votes) return undefined;
    return approval.votes.find(vote => vote.managerId === currentUser.uid);
  };

  const getVoteCount = (approval: ApprovalRequest, decision: 'approve' | 'reject'): number => {
    if (!approval.votes) return 0;
    return approval.votes.filter(vote => vote.decision === decision).length;
  };

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.lottoId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || approval.createdAt.startsWith(dateFilter);
    const matchesStatus = statusFilter === 'all' || approval.status === statusFilter;
    return matchesSearch && matchesDate && matchesStatus;
  });

  if (loading) {
    return (
      <BaseDashboard title="Approbations des Gains">
        <LoadingState message="Chargement des approbations..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Approbations des Gains">
      <div className="space-y-6">
        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par ID de lotto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtre par date */}
          <div className="w-full md:w-48">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filtre par statut */}
          <div className="w-full md:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'pending' | 'approved' | 'rejected' | 'all')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvés</option>
                <option value="rejected">Rejetés</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!canApprove && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-700">
              Vous n'avez pas l'autorisation d'approuver ou rejeter les demandes de calcul de gains.
              Veuillez contacter un administrateur pour obtenir cette permission.
            </p>
          </div>
        )}

        {/* Liste des approbations */}
        {filteredApprovals.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune demande d'approbation trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApprovals.map((approval) => (
              <div key={approval.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">Lotto #{approval.lottoId}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(approval.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  {getStatusBadge(approval.status)}
                </div>

                {/* Statistiques des tickets */}
                {approval.draw.ticketStats && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-medium text-blue-900">Répartition des tickets</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(approval.draw.ticketStats)
                        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                        .map(([numbers, count]) => (
                          <div key={numbers} className="bg-white p-2 rounded">
                            <div className="text-xs text-gray-600">{numbers} numéro{parseInt(numbers) > 1 ? 's' : ''}</div>
                            <div className="font-bold">{count}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Analyse Profit/Perte rapide */}
                {approval.draw.ticketStats && approval.draw.prizeDistribution && (
                  <div className="bg-gradient-to-r from-green-50 to-red-50 border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-gray-600" />
                      <h4 className="text-sm font-medium text-gray-800">Impact Financier</h4>
                    </div>
                    {(() => {
                      // Calculer le nombre total de tickets
                      const totalTickets = Object.entries(approval.draw.ticketStats)
                        .reduce((sum, [, count]) => sum + (count as number), 0);
                      
                      // Calculer les revenus totaux (estimation basée sur le prix moyen)
                      const estimatedTicketPrice = 1000; // Prix estimé par défaut
                      const totalRevenue = totalTickets * estimatedTicketPrice;
                      
                      // Calculer le total des gains distribués
                      const totalPayout = approval.draw.prizeDistribution
                        .reduce((sum: number, prize: any) => {
                          const ticketCount = approval.draw.ticketStats[prize.numbers] || 0;
                          return sum + (prize.amount * ticketCount);
                        }, 0);
                      
                      // Calculer la perte/bénéfice
                      const profitLoss = totalRevenue - totalPayout;
                      const profitMargin = totalRevenue > 0 ? ((profitLoss / totalRevenue) * 100) : 0;
                      
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Revenus estimés:</span>
                            <span className="font-medium text-blue-600">{formatCurrency(totalRevenue)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Gains à distribuer:</span>
                            <span className="font-medium text-orange-600">{formatCurrency(totalPayout)}</span>
                          </div>
                          <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
                            <span className="font-medium text-gray-800">
                              {profitLoss >= 0 ? 'Bénéfice:' : 'Perte:'}
                            </span>
                            <div className="text-right">
                              <div className={`font-bold text-lg ${
                                profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                              </div>
                              <div className={`text-xs ${
                                profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                Marge: {profitMargin.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          
                          {/* Indicateur visuel */}
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  profitLoss >= 0 ? 'bg-green-500' : 'bg-red-500'
                                }`}
                                style={{ 
                                  width: `${Math.min(Math.abs(profitMargin), 100)}%` 
                                }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-red-600">Perte</span>
                              <span className="text-xs text-green-600">Bénéfice</span>
                            </div>
                          </div>
                          
                          {/* Recommandation */}
                          <div className={`mt-2 p-2 rounded text-center ${
                            profitLoss >= 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <span className="text-xs font-medium">
                              {profitLoss >= 0 
                                ? '✓ Tirage rentable'
                                : '⚠️ Tirage déficitaire'
                              }
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {/* Afficher les numéros gagnants verrouillés */}
                {approval.winningNumbers && (
                  <div className="mb-4 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-gray-600" />
                      <h4 className="text-sm font-medium text-gray-700">Numéros gagnants (verrouillés)</h4>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {approval.winningNumbers.map((number, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full"
                        >
                          {number}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      ⚠️ Ces numéros sont verrouillés et ne peuvent plus être modifiés
                    </p>
                  </div>
                )}

                {/* Votes */}
                {approval.votes && approval.votes.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Votes</h4>
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{getVoteCount(approval, 'approve')}/2 Approuvés</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ThumbsDown className="w-4 h-4 text-red-600" />
                        <span className="text-sm">{getVoteCount(approval, 'reject')} Rejetés</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Votre vote */}
                {approval.status === 'pending' && hasVoted(approval) && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Votre vote</h4>
                    <div className="flex items-center gap-2">
                      {getUserVote(approval)?.decision === 'approve' ? (
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <ThumbsDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm text-blue-800">
                        {getUserVote(approval)?.decision === 'approve' ? 'Approuvé' : 'Rejeté'}
                      </span>
                    </div>
                    {getUserVote(approval)?.comment && (
                      <p className="text-xs text-blue-700 mt-1">
                        "{getUserVote(approval)?.comment}"
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Boutons d'action */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewDraw(approval.draw)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Détails</span>
                    </button>
                    
                    <button
                      onClick={() => handleViewHistory(approval)}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Historique</span>
                    </button>
                  </div>

                  {/* Boutons d'approbation/rejet */}
                  {approval.status === 'pending' && canApprove && !hasVoted(approval) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(approval)}
                        disabled={isSubmitting}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Approuver</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowRejectModal(true);
                        }}
                        disabled={isSubmitting}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>Rejeter</span>
                      </button>
                    </div>
                  )}

                  {approval.status === 'pending' && canApprove && !hasVoted(approval) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-700">
                        ⚠️ En rejetant cette demande, les numéros gagnants seront déverrouillés et pourront être redéfinis.
                      </p>
                    </div>
                  )}

                  {/* Message d'information pour les demandes en attente */}
                  {approval.status === 'pending' && !canApprove && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-700">
                        Vous n'avez pas l'autorisation d'approuver cette demande.
                      </p>
                    </div>
                  )}
                </div>

                {approval.status === 'rejected' && approval.reason && (
                  <div className="mt-4 bg-red-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="font-medium text-red-800">Demande rejetée</p>
                    </div>
                    <p className="text-sm text-red-700">
                      Raison: {approval.reason}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Les numéros gagnants ont été déverrouillés et peuvent être redéfinis.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal de rejet */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold mb-4">Rejeter la demande</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Raison du rejet..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                rows={4}
                required
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedApproval(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmer le rejet
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedDraw && (
          <PrizeResultModal
            prize={selectedDraw}
            onClose={() => setSelectedDraw(null)}
          />
        )}

        {/* Modal d'historique */}
        {showHistoryModal && selectedApproval && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Historique de la demande</h3>
                  <button
                    onClick={() => {
                      setShowHistoryModal(false);
                      setSelectedApproval(null);
                      setApprovalHistory([]);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Informations de la demande</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">ID:</span>
                          <span className="font-mono">{selectedApproval.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lotto:</span>
                          <span>{selectedApproval.lottoId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Statut:</span>
                          <span>{getStatusBadge(selectedApproval.status)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Créé par:</span>
                          <span>{selectedApproval.requestedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date de création:</span>
                          <span>{new Date(selectedApproval.createdAt).toLocaleString('fr-FR')}</span>
                        </div>
                        {selectedApproval.winningNumbers && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Numéros gagnants:</span>
                            <div className="flex gap-1">
                              {selectedApproval.winningNumbers.map((number, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full"
                                >
                                  {number}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Votes</h4>
                      {selectedApproval.votes && selectedApproval.votes.length > 0 ? (
                        <div className="space-y-2">
                          {selectedApproval.votes.map((vote) => (
                            <div key={vote.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {vote.decision === 'approve' ? (
                                    <ThumbsUp className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <ThumbsDown className="w-4 h-4 text-red-600" />
                                  )}
                                  <span className="font-medium">
                                    {vote.managerEmail || vote.managerId}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(vote.createdAt).toLocaleString('fr-FR')}
                                </span>
                              </div>
                              {vote.comment && (
                                <p className="mt-2 text-sm text-gray-600 bg-white p-2 rounded">
                                  "{vote.comment}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          Aucun vote pour cette demande
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Historique des actions</h4>
                      {approvalHistory.length > 0 ? (
                        <div className="space-y-2">
                          {approvalHistory.map((entry) => (
                            <div key={entry.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {entry.action === 'created' && <Clock className="w-4 h-4 text-blue-600" />}
                                  {entry.action === 'approved' && <ThumbsUp className="w-4 h-4 text-green-600" />}
                                  {entry.action === 'rejected' && <ThumbsDown className="w-4 h-4 text-red-600" />}
                                  {entry.action === 'commented' && <MessageSquare className="w-4 h-4 text-purple-600" />}
                                  {entry.action === 'processed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                  <span className="font-medium">
                                    {entry.userEmail || entry.userId}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(entry.createdAt).toLocaleString('fr-FR')}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-600">
                                {entry.action === 'created' && 'A créé la demande'}
                                {entry.action === 'approved' && 'A approuvé la demande'}
                                {entry.action === 'rejected' && 'A rejeté la demande'}
                                {entry.action === 'commented' && 'A commenté la demande'}
                                {entry.action === 'processed' && 'Demande traitée'}
                              </p>
                              {entry.details && (
                                <div className="mt-2 text-xs text-gray-500 bg-white p-2 rounded">
                                  {typeof entry.details === 'string' 
                                    ? entry.details 
                                    : JSON.stringify(entry.details, null, 2)}
                                </div>
                              )}
                              {entry.details?.message && (
                                <p className="mt-1 text-xs text-gray-500 italic">
                                  {entry.details.message}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          Aucun historique disponible
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedDraw && (
          <PrizeResultModal
            prize={selectedDraw}
            onClose={() => setSelectedDraw(null)}
          />
        )}
      </div>
    </BaseDashboard>
  );
}