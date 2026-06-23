import React, { useState } from 'react';
import { DollarSign, Calendar, Tag, FileText, X } from 'lucide-react';
import { DailyExpense, DailyAccountingService } from '../../../services/manager/dailyAccounting';
import { useAuth } from '../../../contexts/AuthContext';
import { getDisplayName } from '../../../utils/userUtils';

interface ExpenseFormProps {
  managerId: string;
  expense?: DailyExpense;
  onSuccess: () => void;
  onCancel: () => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'operations', label: 'Opérations' },
  { value: 'salaries', label: 'Salaires' },
  { value: 'utilities', label: 'Services publics' },
  { value: 'supplies', label: 'Fournitures' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Autres' }
];

export function ExpenseForm({ managerId, expense, onSuccess, onCancel }: ExpenseFormProps) {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    amount: expense?.amount?.toString() || '',
    category: expense?.category || 'operations',
    description: expense?.description || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }

    if (!formData.description.trim()) {
      setError('Veuillez entrer une description');
      return;
    }

    setLoading(true);

    try {
      const expenseData: any = {
        managerId,
        date: new Date(formData.date),
        amount: parseFloat(formData.amount),
        category: formData.category as any,
        description: formData.description.trim()
      };

      if (!expense?.id) {
        expenseData.performedBy = currentUser?.uid || '';
        expenseData.performedByName = getDisplayName(userData);
      }

      if (expense?.id) {
        await DailyAccountingService.updateExpense(expense.id, expenseData);
      } else {
        await DailyAccountingService.createExpense(expenseData);
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving expense:', err);
      setError('Erreur lors de l\'enregistrement de la dépense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {expense ? 'Modifier la dépense' : 'Nouvelle dépense'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-2" />
            Montant (FCFA)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-2" />
            Catégorie
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            required
          >
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Détails de la dépense..."
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Enregistrement...' : expense ? 'Modifier' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
