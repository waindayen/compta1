import React, { useState, useEffect } from 'react';
import { Calendar, Search, Download, TrendingUp, TrendingDown, Filter, AlertCircle, CheckCircle, XCircle, BarChart } from 'lucide-react';
import BaseDashboard from '../BaseDashboard';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { formatCurrency } from '../../../utils/format';
import LoadingState from '../../../components/LoadingState';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';

interface TicketAnalysisProps {}

interface TicketData {
  id: string;
  lottoId: string;
  lottoEventName: string;
  isWinner: boolean;
  isLost: boolean;
  winAmount: number;
  ticketPrice: number;
  currency: string;
  purchaseDate: string;
  paid: boolean;
  paidAt?: string;
}

interface AnalysisResult {
  totalTickets: number;
  winningTickets: number;
  losingTickets: number;
  pendingTickets: number;
  totalRevenue: number;
  totalPayout: number;
  unpaidWinnings: number;
  netProfit: number;
  potentialNetProfit: number;
  profitMargin: number;
  totalAgentCommissions: number;
}

export default function TicketAnalysis({}: TicketAnalysisProps) {
  const { currentUser } = useAuth();
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [ticketType, setTicketType] = useState<'all' | 'winning' | 'losing'>('all');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [canAccessAnalysis, setCanAccessAnalysis] = useState(true);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur a accès à l'analyse des tickets
    const checkAccess = async () => {
      if (!currentUser) {
        setCheckingAccess(false);
        return;
      }
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // Si canAccessTicketAnalysis est explicitement false, bloquer l'accès
          if (userData.canAccessTicketAnalysis === false) {
            setCanAccessAnalysis(false);
          } else {
            setCanAccessAnalysis(true);
          }
        }
      } catch (err) {
        console.error('Error checking ticket analysis access:', err);
        // Par défaut, autoriser l'accès en cas d'erreur
        setCanAccessAnalysis(true);
      } finally {
        setCheckingAccess(false);
      }
    };
    
    checkAccess();
  }, [currentUser]);

  const fetchTickets = async () => {
    if (!startDate) {
      setError('Veuillez sélectionner une date de début');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Convertir les dates en objets Date
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = endDate ? new Date(endDate) : new Date(startDate);
      end.setHours(23, 59, 59, 999);

      // Créer la requête Firestore
      const ticketsRef = collection(db, 'lotto_participations');
      let q = query(
        ticketsRef,
        where('purchaseDate', '>=', start.toISOString()),
        where('purchaseDate', '<=', end.toISOString())
      );

      // Exécuter la requête
      const querySnapshot = await getDocs(q);
      
      // Traiter les résultats
      const ticketsData: TicketData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ticketsData.push({
          id: doc.id,
          lottoId: data.lottoId || '',
          lottoEventName: data.lottoEventName || 'Lotto',
          isWinner: data.isWinner || false,
          isLost: data.isLost || false,
          winAmount: data.winAmount || 0,
          ticketPrice: data.ticketPrice || 0,
          currency: data.currency || 'XAF',
          purchaseDate: data.purchaseDate || '',
          paid: data.paid || false,
          paidAt: data.paidAt || null
        });
      });

      setTickets(ticketsData);
      
      // Analyser les résultats
      await analyzeTickets(ticketsData, start, end);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Erreur lors de la récupération des tickets');
    } finally {
      setLoading(false);
    }
  };

  const analyzeTickets = async (ticketsData: TicketData[], startDate: Date, endDate: Date) => {
    // Séparer les tickets par type
    const winningTickets = ticketsData.filter(ticket => ticket.isWinner);
    const losingTickets = ticketsData.filter(ticket => ticket.isLost);
    const pendingTickets = ticketsData.filter(ticket => !ticket.isWinner && !ticket.isLost);
    
    // Calcul des revenus : somme de tous les prix des tickets
    const totalRevenue = ticketsData.reduce((sum, ticket) => sum + ticket.ticketPrice, 0);
    
    // Calcul des paiements : somme des gains réellement payés
    const totalPayout = winningTickets.reduce((sum, ticket) => sum + (ticket.paid ? ticket.winAmount : 0), 0);
    
    // Calcul des gains potentiels non encore payés
    const unpaidWinnings = winningTickets.reduce((sum, ticket) => sum + (!ticket.paid ? ticket.winAmount : 0), 0);
    
    // Bénéfice net = Revenus totaux - Paiements effectués
    const netProfit = totalRevenue - totalPayout;
    
    // Bénéfice net potentiel (si tous les gains étaient payés)
    const potentialNetProfit = totalRevenue - (totalPayout + unpaidWinnings);
    
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Calculer le total des soldes actuels des portefeuilles de commission des agents
    let totalAgentCommissions = 0;
    try {
      const commissionsRef = collection(db, 'agent_commission_wallets');
      const commissionsSnapshot = await getDocs(commissionsRef);
      
      commissionsSnapshot.forEach((doc) => {
        const walletData = doc.data();
        totalAgentCommissions += walletData.balance || 0;
      });
    } catch (err) {
      console.error('Error calculating agent commission wallets:', err);
      // Ne pas bloquer l'analyse si le calcul des soldes de commission échoue
    }

    setAnalysis({
      totalTickets: ticketsData.length,
      winningTickets: winningTickets.length,
      losingTickets: losingTickets.length,
      pendingTickets: pendingTickets.length,
      totalRevenue,
      totalPayout,
      unpaidWinnings,
      netProfit,
      potentialNetProfit,
      profitMargin,
      totalAgentCommissions
    });
  };

  useEffect(() => {
    if (tickets.length > 0) {
      let filtered = [...tickets];
      
      // Filtrer par type de ticket
      if (ticketType === 'winning') {
        filtered = filtered.filter(ticket => ticket.isWinner);
      } else if (ticketType === 'losing') {
        filtered = filtered.filter(ticket => ticket.isLost);
      }
      
      // Filtrer par terme de recherche
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(ticket => 
          ticket.id.toLowerCase().includes(term) ||
          ticket.lottoEventName.toLowerCase().includes(term)
        );
      }
      
      setFilteredTickets(filtered);
    } else {
      setFilteredTickets([]);
    }
  }, [tickets, ticketType, searchTerm]);

  const exportToCSV = () => {
    if (filteredTickets.length === 0) return;

    const headers = ['ID', 'Événement', 'Type', 'Date d\'achat', 'Prix', 'Gain', 'Payé', 'Date de paiement'];
    const rows = filteredTickets.map(ticket => [
      ticket.id,
      ticket.lottoEventName,
      ticket.isWinner ? 'Gagnant' : ticket.isLost ? 'Perdant' : 'En attente',
      new Date(ticket.purchaseDate).toLocaleString('fr-FR'),
      formatCurrency(ticket.ticketPrice, ticket.currency),
      ticket.isWinner ? formatCurrency(ticket.winAmount, ticket.currency) : '0',
      ticket.paid ? 'Oui' : 'Non',
      ticket.paidAt ? new Date(ticket.paidAt).toLocaleString('fr-FR') : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tickets-analyse-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (checkingAccess) {
    return (
      <BaseDashboard title="Analyse des Tickets">
        <LoadingState message="Vérification des permissions..." />
      </BaseDashboard>
    );
  }

  if (!canAccessAnalysis) {
    return (
      <BaseDashboard title="Analyse des Tickets">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-700 mb-2">Accès non autorisé</h2>
          <p className="text-red-600">
            Vous n'avez pas l'autorisation d'accéder à l'analyse des tickets. 
            Veuillez contacter un administrateur pour obtenir cette permission.
          </p>
        </div>
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Analyse des Tickets">
      <div className="space-y-6">
        {/* Filtres de date */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Filtres</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin (optionnel)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de tickets
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value as 'all' | 'winning' | 'losing')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="all">Tous les tickets</option>
                  <option value="winning">Tickets gagnants</option>
                  <option value="losing">Tickets perdants</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchTickets}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              Rechercher
            </button>
          </div>
        </div>

        {/* Résultats d'analyse */}
        {analysis && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Résultats d'analyse</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total des tickets</p>
                <p className="text-2xl font-bold">{analysis.totalTickets}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-green-600">Tickets gagnants</p>
                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {analysis.totalTickets > 0 ? ((analysis.winningTickets / analysis.totalTickets) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-700">{analysis.winningTickets}</p>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-red-600">Tickets perdants</p>
                  <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {analysis.totalTickets > 0 ? ((analysis.losingTickets / analysis.totalTickets) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-700">{analysis.losingTickets}</p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-yellow-600">En attente</p>
                  <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    {analysis.totalTickets > 0 ? ((analysis.pendingTickets / analysis.totalTickets) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-yellow-700">{analysis.pendingTickets}</p>
              </div>
              
              <div className={`${analysis.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg p-4`}>
                <div className="flex justify-between items-center">
                  <p className={`text-sm ${analysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Bénéfice net actuel
                  </p>
                  <span className={`text-xs font-medium ${
                    analysis.netProfit >= 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  } px-2 py-1 rounded-full`}>
                    {analysis.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <p className={`text-2xl font-bold ${
                  analysis.netProfit >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {analysis.netProfit >= 0 ? '+' : '-'}{formatCurrency(Math.abs(analysis.netProfit))}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium">Revenus et Paiements</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Revenus totaux (tous tickets)</span>
                    <span className="font-bold">{formatCurrency(analysis.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Paiements effectués</span>
                    <span className="font-bold">{formatCurrency(analysis.totalPayout)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Gains non payés</span>
                    <span className="font-bold text-orange-600">{formatCurrency(analysis.unpaidWinnings)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Commissions agents</span>
                    <span className="font-bold text-blue-600">{formatCurrency(analysis.totalAgentCommissions)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-medium">Bénéfice net actuel</span>
                    <span className={`font-bold ${analysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysis.netProfit >= 0 ? '+' : '-'}{formatCurrency(Math.abs(analysis.netProfit))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-500">Bénéfice si tout payé</span>
                    <span className={`font-medium ${analysis.potentialNetProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {analysis.potentialNetProfit >= 0 ? '+' : '-'}{formatCurrency(Math.abs(analysis.potentialNetProfit))}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium">Statistiques</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Commissions totales/Revenus</span>
                      <span className="text-sm font-medium">
                        {analysis.totalRevenue > 0 ? ((analysis.totalAgentCommissions / analysis.totalRevenue) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${analysis.totalRevenue > 0 ? (analysis.totalAgentCommissions / analysis.totalRevenue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Taux de gain</span>
                      <span className="text-sm font-medium">
                        {analysis.totalTickets > 0 ? ((analysis.winningTickets / analysis.totalTickets) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${analysis.totalTickets > 0 ? (analysis.winningTickets / analysis.totalTickets) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Marge bénéficiaire</span>
                      <span className="text-sm font-medium">
                        {analysis.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${analysis.profitMargin >= 0 ? 'bg-green-600' : 'bg-red-600'} h-2 rounded-full`}
                        style={{ width: `${Math.min(Math.abs(analysis.profitMargin), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Liste des tickets */}
        {loading ? (
          <LoadingState message="Chargement des tickets..." />
        ) : filteredTickets.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Tickets ({filteredTickets.length})</h2>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Exporter
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Ticket</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Événement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date d'achat</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gain</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono">
                        {ticket.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {ticket.lottoEventName}
                      </td>
                      <td className="px-6 py-4">
                        {ticket.isWinner ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Gagnant
                          </span>
                        ) : ticket.isLost ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Perdant
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(ticket.purchaseDate).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {formatCurrency(ticket.ticketPrice, ticket.currency)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        {ticket.isWinner ? (
                          <span className="font-medium text-green-600">
                            {formatCurrency(ticket.winAmount, ticket.currency)}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {ticket.isWinner && (
                          ticket.paid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Payé
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Non payé
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : tickets.length > 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-700">Aucun ticket ne correspond aux critères de recherche.</p>
          </div>
        ) : null}
      </div>
    </BaseDashboard>
  );
}