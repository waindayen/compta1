import React from 'react';
import { Edit2, Trash2, Calendar, Tag, FileText } from 'lucide-react';
import { DailyRevenue, DailyExpense } from '../../../services/manager/dailyAccounting';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AccountingListProps {
  items: (DailyRevenue | DailyExpense)[];
  type: 'revenue' | 'expense';
  onEdit: (item: DailyRevenue | DailyExpense) => void;
  onDelete: (id: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  sales: 'Ventes',
  commissions: 'Commissions',
  bonuses: 'Bonus',
  operations: 'Opérations',
  salaries: 'Salaires',
  utilities: 'Services publics',
  supplies: 'Fournitures',
  maintenance: 'Maintenance',
  other: 'Autres'
};

export function AccountingList({ items, type, onEdit, onDelete }: AccountingListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">
          {type === 'revenue'
            ? 'Aucune recette enregistrée'
            : 'Aucune dépense enregistrée'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={type === 'revenue' ? 'bg-green-50' : 'bg-red-50'}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Effectué par
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {format(new Date(item.date), 'dd MMM yyyy', { locale: fr })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    type === 'revenue'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <Tag className="w-3 h-3 mr-1" />
                    {CATEGORY_LABELS[item.category]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start text-sm text-gray-900">
                    <FileText className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{item.description}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`text-sm font-semibold ${
                    type === 'revenue' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.amount.toLocaleString('fr-FR')} FCFA
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {item.performedByName || <span className="text-gray-400 italic">Non renseigné</span>}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-blue-600 hover:text-blue-900 mr-3 transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => item.id && onDelete(item.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
