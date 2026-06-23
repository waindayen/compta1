import React, { useState, useEffect } from 'react';
import BaseDashboard from '../BaseDashboard';
import { Search, Calendar, AlertCircle, Download } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { formatCurrency } from '../../../utils/format';
import LoadingState from '../../../components/LoadingState';

interface PaidTicket {
  id: string;
  lottoId: string;
  lottoEventName: string;
  winAmount: number;
  currency: string;
  paidAt: string;
  paidBy: string;
  payerEmail?: string;
}

export default function PaidTickets() {
  const [tickets, setTickets] = useState<PaidTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchPaidTickets();
  }, []);

  const fetchPaidTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query paid tickets with proper index
      const ticketsRef = collection(db, 'lotto_participations');
      const q = query(
        ticketsRef,
        where('paid', '==', true),
        orderBy('paidAt', 'desc'),
        limit(100)
      );

      const ticketsSnapshot = await getDocs(q);
      if (ticketsSnapshot.empty) {
        setTickets([]);
        return;
      }

      // Get unique payer IDs
      const payerIds = ticketsSnapshot.docs
        .map(doc => doc.data().paidBy)
        .filter((id): id is string => Boolean(id));
      const uniquePayerIds = [...new Set(payerIds)];

      // Get payer emails in batches
      const payersData = new Map<string, string>();
      const usersRef = collection(db, 'users');
      
      for (let i = 0; i < uniquePayerIds.length; i += 10) {
        const batch = uniquePayerIds.slice(i, i + 10);
        if (batch.length === 0) continue;

        try {
          const payersQuery = query(usersRef, where('__name__', 'in', batch));
          const payersSnapshot = await getDocs(payersQuery);
          payersSnapshot.forEach(doc => {
            payersData.set(doc.id, doc.data().email || '');
          });
        } catch (err) {
          console.warn('Error fetching some payer emails:', err);
          // Continue processing even if some emails can't be fetched
        }
      }

      // Map tickets data with error handling
      const paidTickets = ticketsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          lottoId: data.lottoId || '',
          lottoEventName: data.lottoEventName || 'Lotto',
          winAmount: Number(data.winAmount) || 0,
          currency: data.currency || 'EUR',
          paidAt: data.paidAt || '',
          paidBy: data.paidBy || '',
          payerEmail: payersData.get(data.paidBy || '')
        };
      }).filter(ticket => 
        // Filter out invalid tickets
        ticket.paidAt && 
        ticket.paidBy && 
        ticket.winAmount > 0
      );

      setTickets(paidTickets);
    } catch (err) {
      console.error('Error fetching paid tickets:', err);
      setError('Une erreur est survenue lors du chargement des tickets. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = (
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.lottoEventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.payerEmail || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesDate = !dateFilter || ticket.paidAt.startsWith(dateFilter);
    return matchesSearch && matchesDate;
  });

  const handleExport = () => {
    try {
      const csvContent = [
        ['ID Ticket', 'Événement', 'Date de paiement', 'Montant', 'Payé par'],
        ...tickets.map(ticket => [
          ticket.id,
          ticket.lottoEventName,
          new Date(ticket.paidAt).toLocaleString('fr-FR'),
          formatCurrency(ticket.winAmount, ticket.currency),
          ticket.payerEmail || ticket.paidBy
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `tickets-payes-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Erreur lors de l\'export des données');
    }
  };

  if (loading) {
    return (
      <BaseDashboard title="Tickets Payés">
        <LoadingState message="Chargement des tickets payés..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Tickets Payés">
      <div className="space-y-6">
        {/* Filtres et export */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par ID, événement ou payeur..."
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
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

        {/* Tableau des tickets */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Événement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date de paiement</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payé par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Aucun ticket payé trouvé
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono">
                        {ticket.id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {ticket.lottoEventName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(ticket.paidAt).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                        {formatCurrency(ticket.winAmount, ticket.currency)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {ticket.payerEmail || ticket.paidBy}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseDashboard>
  );
}