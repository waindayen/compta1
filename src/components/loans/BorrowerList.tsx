import React from 'react';
import { Edit2, Trash2, User, Phone, Mail, Briefcase, DollarSign } from 'lucide-react';
import { Borrower } from '../../services/loans/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BorrowerListProps {
  borrowers: Borrower[];
  onEdit: (borrower: Borrower) => void;
  onDelete: (borrower: Borrower) => void;
  onSelect?: (borrower: Borrower) => void;
}

export default function BorrowerList({ borrowers, onEdit, onDelete, onSelect }: BorrowerListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'blacklisted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'blacklisted':
        return 'Liste noire';
      default:
        return status;
    }
  };

  if (borrowers.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Aucun emprunteur trouvé</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Emprunteur
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Profession
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Revenu
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {borrowers.map((borrower) => (
            <tr
              key={borrower.id}
              onClick={() => onSelect?.(borrower)}
              className={onSelect ? 'hover:bg-gray-50 cursor-pointer' : ''}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {borrower.firstName} {borrower.lastName}
                    </div>
                    {borrower.idNumber && (
                      <div className="text-sm text-gray-500">{borrower.idNumber}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {borrower.phone}
                  </div>
                  {borrower.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {borrower.email}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                {borrower.occupation && (
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    {borrower.occupation}
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                {borrower.monthlyIncome && borrower.monthlyIncome > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    {borrower.monthlyIncome.toFixed(2)} €
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(borrower.status)}`}>
                  {getStatusLabel(borrower.status)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(borrower);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(borrower);
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
