import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, Filter, Trophy, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { LottoEvent } from '../../services/lotto';
import { formatCurrency } from '../../utils/format';
import { getStatusLabel } from '../../utils/lottoUtils';
import { useAuth } from '../../contexts/AuthContext';

interface LottoTableProps {
  lottos: LottoEvent[];
  onView: (lotto: LottoEvent) => void;
  onEdit: (lotto: LottoEvent) => void;
  onDelete: (lotto: LottoEvent) => void;
  onCalculatePrizes?: (lotto: LottoEvent) => void;
  onToggleStatus?: (lotto: LottoEvent) => void;
  hideActions?: boolean;
  statusFilter?: string;
  isToggling?: string | null;
}

export default function LottoTable({ 
  lottos, 
  onView, 
  onEdit, 
  onDelete,
  onCalculatePrizes,
  onToggleStatus,
  hideActions = false,
  statusFilter = 'all',
  isToggling = null
}: LottoTableProps) {
  const { userData } = useAuth();
  const canCalculatePrizes = userData?.role === 'adminuser' || userData?.role === 'ucieruser';
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
  const isManager = userData?.role === 'manageruser';

  // Si hideActions n'est pas spécifié, déterminer automatiquement en fonction du rôle
  const shouldHideActions = hideActions || isManager;

  // Mettre à jour le filtre local lorsque le filtre externe change
  useEffect(() => {
    setLocalStatusFilter(statusFilter);
  }, [statusFilter]);

  const filteredLottos = lottos.filter(lotto => {
    const matchesSearch = lotto.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || lotto.endDate.startsWith(dateFilter);
    const matchesStatus = localStatusFilter === 'all' || lotto.status === localStatusFilter;
    return matchesSearch && matchesDate && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher..."
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
              value={localStatusFilter}
              onChange={(e) => setLocalStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="active">En cours</option>
              <option value="completed">Terminés</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Événement
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Statut
                </th>
                {userData?.role === 'adminuser' && (
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Actif
                  </th>
                )}
                {!shouldHideActions && (
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLottos.length === 0 ? (
                <tr>
                  <td colSpan={shouldHideActions ? 4 : 5} className="px-6 py-8 text-center text-gray-500">
                    Aucun lotto trouvé
                  </td>
                </tr>
              ) : (
                filteredLottos.map((lotto) => {
                  const status = getStatusLabel(lotto);
                  const isPending = lotto.status === 'pending';
                  return (
                    <tr key={lotto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{lotto.eventName}</div>
                          <div className="text-sm text-gray-500">
                            {lotto.numbersToSelect} numéros à sélectionner
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div>Début: {new Date(lotto.startDate).toLocaleString('fr-FR', { 
                            timeZone: 'UTC',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</div>
                          <div>Fin: {new Date(lotto.endDate).toLocaleString('fr-FR', { 
                            timeZone: 'UTC',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(lotto.ticketPrice)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                          <status.icon className="w-4 h-4" />
                          {status.label}
                        </span>
                      </td>
                      {userData?.role === 'adminuser' && (
                        <td className="px-6 py-4">
                          {onToggleStatus && (
                            <button
                              onClick={() => onToggleStatus(lotto)}
                              disabled={isToggling === lotto.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                lotto.isEnabled !== false
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {isToggling === lotto.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : lotto.isEnabled !== false ? (
                                <ToggleRight className="w-4 h-4" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                              {lotto.isEnabled !== false ? 'Activé' : 'Désactivé'}
                            </button>
                          )}
                        </td>
                      )}
                      {!shouldHideActions && (
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => onView(lotto)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Voir les détails"
                          >
                            <Eye className="w-5 h-5 inline" />
                          </button>
                          {isPending && (
                            <button
                              onClick={() => onEdit(lotto)}
                              className="text-yellow-600 hover:text-yellow-700"
                              title="Modifier"
                            >
                              <Edit className="w-5 h-5 inline" />
                            </button>
                          )}
                          {canCalculatePrizes && 
                           lotto.status === 'completed' && 
                           !lotto.prizeCalculated && 
                           onCalculatePrizes && (
                            <button
                              onClick={() => onCalculatePrizes(lotto)}
                              className="text-green-600 hover:text-green-700"
                              title="Calculer les gains"
                            >
                              <Trophy className="w-5 h-5 inline" />
                            </button>
                          )}
                          {isPending && (
                            <button
                              onClick={() => onDelete(lotto)}
                              className="text-red-600 hover:text-red-700"
                              title="Supprimer"
                            >
                              <Trash2 className="w-5 h-5 inline" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}