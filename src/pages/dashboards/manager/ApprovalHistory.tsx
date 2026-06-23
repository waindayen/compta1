import React, { useState, useEffect } from 'react';
import BaseDashboard from '../BaseDashboard';
import { LottoPrizeService, ApprovalRequest, ApprovalHistory as ApprovalHistoryType } from '../../../services/lotto/prize';
import LoadingState from '../../../components/LoadingState';
import { Search, Calendar, Filter, Download, Clock, CheckCircle, XCircle, MessageSquare, Eye, ThumbsUp, ThumbsDown, AlertCircle, Lock } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import PrizeResultModal from '../../../components/lotto/PrizeResultModal';

export default function ApprovalHistory() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState<any | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await LottoPrizeService.getApprovalRequests();
      setRequests(data);
    } catch (err) {
      setError('Erreur lors du chargement des demandes d\'approbation');
      console.error('Error fetching approval requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleViewHistory = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setShowHistoryModal(true);
  };

  const handleViewDraw = (draw: any) => {
    setSelectedDraw(draw);
  };

  const handleExportCSV = () => {
    try {
      const filteredRequests = getFilteredRequests();
      
      const headers = ['Date', 'Lotto', 'Demandeur', 'Email Demandeur', 'Type', 'Statut', 'Votes Pour', 'Votes Contre', 'Emails Votants'];
      const rows = filteredRequests.map(request => {
        // Extraire les emails des votants
        const approverEmails = request.votes
          ?.filter(v => v.decision === 'approve')
          .map(v => v.managerEmail || v.managerId)
          .join('; ');
        
        const rejecterEmails = request.votes
          ?.filter(v => v.decision === 'reject')
          .map(v => v.managerEmail || v.managerId)
          .join('; ');
        
        return [
          new Date(request.createdAt).toLocaleString('fr-FR'),
          request.lottoId,
          request.requestedBy,
          request.requestedByEmail || 'N/A',
          request.request_type || 'prize_calculation',
          request.status,
          request.votes?.filter(v => v.decision === 'approve').length || 0,
          request.votes?.filter(v => v.decision === 'reject').length || 0,
          `Pour: ${approverEmails || 'Aucun'} | Contre: ${rejecterEmails || 'Aucun'}`
        ];
      });
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `approbations-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Erreur lors de l\'export CSV');
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

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'approved':
        return <ThumbsUp className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <ThumbsDown className="w-5 h-5 text-red-600" />;
      case 'commented':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'processed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Eye className="w-5 h-5 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'created': return 'Créé';
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      case 'commented': return 'Commenté';
      case 'processed': return 'Traité';
      default: return action;
    }
  };

  const getFilteredRequests = () => {
    return requests.filter(request => {
      const matchesSearch = 
        (request.lottoId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (request.requestedBy?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (request.requestedByEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        request.votes?.some(vote => 
          (vote.managerEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
      
      const matchesDate = !dateFilter || request.createdAt.startsWith(dateFilter);
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      
      return matchesSearch && matchesDate && matchesStatus;
    });
  };

  const filteredRequests = getFilteredRequests();

  if (loading) {
    return (
      <BaseDashboard title="Historique des Approbations">
        <LoadingState message="Chargement de l'historique..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Historique des Approbations">
      <div className="space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Total des demandes</p>
            <p className="text-2xl font-bold">{requests.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">En attente</p>
            <p className="text-2xl font-bold">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Approuvées</p>
            <p className="text-2xl font-bold">{requests.filter(r => r.status === 'approved').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Rejetées</p>
            <p className="text-2xl font-bold">{requests.filter(r => r.status === 'rejected').length}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par lotto, demandeur, email ou votant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
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
          
          <div className="w-full md:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvés</option>
                <option value="rejected">Rejetés</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exporter
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Tableau des demandes */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lotto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Demandeur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Aucune demande d'approbation trouvée
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.lottoId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {request.requestedBy}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {request.requestedByEmail || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {request.request_type || 'Calcul de gains'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{request.votes?.filter(v => v.decision === 'approve').length || 0}</span>
                            {request.votes?.filter(v => v.decision === 'approve').length > 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({request.votes?.filter(v => v.decision === 'approve').map(v => v.managerEmail || v.managerId).join(', ')})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsDown className="w-4 h-4 text-red-600" />
                            <span className="text-sm">{request.votes?.filter(v => v.decision === 'reject').length || 0}</span>
                            {request.votes?.filter(v => v.decision === 'reject').length > 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({request.votes?.filter(v => v.decision === 'reject').map(v => v.managerEmail || v.managerId).join(', ')})
                              </span>
                            )}
                          </div>
                          {/* Afficher l'état des numéros gagnants */}
                          {request.isWinningNumbersLocked && (
                            <div className="flex items-center gap-1 mt-1">
                              <Lock className="w-4 h-4 text-blue-600" />
                              <span className="text-xs text-blue-600">Numéros verrouillés</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleViewHistory(request)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Voir l'historique"
                          >
                            <Clock className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleViewDraw(request.draw)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Voir les résultats"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de détails */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Détails de la demande</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRequest(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Informations générales</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-mono">{selectedRequest.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lotto:</span>
                      <span>{selectedRequest.lottoId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut:</span>
                      <span>{getStatusBadge(selectedRequest.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Créé par:</span>
                      <span>{selectedRequest.requestedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{selectedRequest.requestedByEmail || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date de création:</span>
                      <span>{new Date(selectedRequest.createdAt).toLocaleString('fr-FR')}</span>
                    </div>
                    {selectedRequest.winningNumbers && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Numéros gagnants:</span>
                        <div className="flex gap-1">
                          {selectedRequest.winningNumbers.map((number, index) => (
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
                    {selectedRequest.isWinningNumbersLocked && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Numéros verrouillés:</span>
                        <span className="flex items-center gap-1 text-blue-600">
                          <Lock className="w-4 h-4" />
                          <span>Oui</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Votes</h4>
                  {selectedRequest.votes && selectedRequest.votes.length > 0 ? (
                    <div className="space-y-2">
                      {selectedRequest.votes.map((vote) => (
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
                  <h4 className="font-medium mb-2">Détails de la demande</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-xs overflow-auto max-h-60 whitespace-pre-wrap">
                      {JSON.stringify(selectedRequest.draw, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'historique */}
      {showHistoryModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Historique de la demande</h3>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedRequest(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {selectedRequest.history && selectedRequest.history.length > 0 ? (
                <div className="space-y-4">
                  {selectedRequest.history.map((entry: ApprovalHistoryType) => (
                    <div key={entry.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getActionIcon(entry.action)}
                          <span className="font-medium">
                            {entry.userEmail || entry.userId}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.createdAt).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {getActionLabel(entry.action)}
                      </p>
                      {entry.details?.message && (
                        <p className="mt-1 text-xs text-blue-600 italic">
                          {entry.details.message}
                        </p>
                      )}
                      {entry.details && (
                        <div className="mt-2 text-xs bg-white p-2 rounded">
                          <pre className="whitespace-pre-wrap">
                            {typeof entry.details === 'string' 
                              ? entry.details 
                              : JSON.stringify(entry.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  Aucun historique disponible pour cette demande
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de résultats */}
      {selectedDraw && (
        <PrizeResultModal
          prize={selectedDraw}
          onClose={() => setSelectedDraw(null)}
        />
      )}
    </BaseDashboard>
  );
}