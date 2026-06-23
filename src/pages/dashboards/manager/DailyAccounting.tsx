import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Download, Filter } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { DailyAccountingService, DailyRevenue, DailyExpense } from '../../../services/manager/dailyAccounting';
import { RevenueForm } from '../../../components/manager/accounting/RevenueForm';
import { ExpenseForm } from '../../../components/manager/accounting/ExpenseForm';
import { AccountingList } from '../../../components/manager/accounting/AccountingList';
import { AccountingSummary } from '../../../components/manager/accounting/AccountingSummary';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

type ViewMode = 'daily' | 'monthly';
type FormMode = 'revenue' | 'expense' | null;

export default function DailyAccounting() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [revenues, setRevenues] = useState<DailyRevenue[]>([]);
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [showForm, setShowForm] = useState<FormMode>(null);
  const [editingItem, setEditingItem] = useState<DailyRevenue | DailyExpense | null>(null);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpense: 0,
    balance: 0,
    revenuesByCategory: {} as Record<string, number>,
    expensesByCategory: {} as Record<string, number>
  });

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, selectedDate, viewMode]);

  const loadData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      if (viewMode === 'daily') {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const [revenueData, expenseData] = await Promise.all([
          DailyAccountingService.getRevenuesByManager(currentUser.uid, startOfDay, endOfDay),
          DailyAccountingService.getExpensesByManager(currentUser.uid, startOfDay, endOfDay)
        ]);

        setRevenues(revenueData);
        setExpenses(expenseData);

        const totalRev = revenueData.reduce((sum, r) => sum + r.amount, 0);
        const totalExp = expenseData.reduce((sum, e) => sum + e.amount, 0);

        setSummary({
          totalRevenue: totalRev,
          totalExpense: totalExp,
          balance: totalRev - totalExp,
          revenuesByCategory: {},
          expensesByCategory: {}
        });
      } else {
        const month = selectedDate.getMonth();
        const year = selectedDate.getFullYear();
        const report = await DailyAccountingService.getMonthlyReport(currentUser.uid, month, year);

        setRevenues(report.revenues);
        setExpenses(report.expenses);
        setSummary({
          totalRevenue: report.totalRevenue,
          totalExpense: report.totalExpense,
          balance: report.balance,
          revenuesByCategory: report.revenuesByCategory,
          expensesByCategory: report.expensesByCategory
        });
      }
    } catch (error) {
      console.error('Error loading accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRevenue = () => {
    setEditingItem(null);
    setShowForm('revenue');
  };

  const handleAddExpense = () => {
    setEditingItem(null);
    setShowForm('expense');
  };

  const handleEditRevenue = (revenue: DailyRevenue) => {
    setEditingItem(revenue);
    setShowForm('revenue');
  };

  const handleEditExpense = (expense: DailyExpense) => {
    setEditingItem(expense);
    setShowForm('expense');
  };

  const handleDeleteRevenue = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) return;

    try {
      await DailyAccountingService.deleteRevenue(id);
      loadData();
    } catch (error) {
      console.error('Error deleting revenue:', error);
      alert('Erreur lors de la suppression de la recette');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      await DailyAccountingService.deleteExpense(id);
      loadData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Erreur lors de la suppression de la dépense');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(null);
    setEditingItem(null);
    loadData();
  };

  const handleFormCancel = () => {
    setShowForm(null);
    setEditingItem(null);
  };

  const handlePreviousPeriod = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNextPeriod = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'daily') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const canGoNext = () => {
    const today = new Date();
    if (viewMode === 'daily') {
      return selectedDate < today;
    } else {
      return selectedDate.getMonth() < today.getMonth() || selectedDate.getFullYear() < today.getFullYear();
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Comptabilité quotidienne</h1>
          <p className="text-gray-600">Gérez vos recettes et dépenses journalières</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Journalier
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Mensuel
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPeriod}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <div className="text-center min-w-[200px]">
                <p className="text-lg font-semibold text-gray-900">
                  {viewMode === 'daily'
                    ? format(selectedDate, 'dd MMMM yyyy', { locale: fr })
                    : format(selectedDate, 'MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <button
                onClick={handleNextPeriod}
                disabled={!canGoNext()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddRevenue}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Recette</span>
              </button>
              <button
                onClick={handleAddExpense}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Dépense</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <AccountingSummary
              totalRevenue={summary.totalRevenue}
              totalExpense={summary.totalExpense}
              balance={summary.balance}
              revenuesByCategory={viewMode === 'monthly' ? summary.revenuesByCategory : undefined}
              expensesByCategory={viewMode === 'monthly' ? summary.expensesByCategory : undefined}
            />

            <div className="mt-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recettes</h2>
                <AccountingList
                  items={revenues}
                  type="revenue"
                  onEdit={handleEditRevenue}
                  onDelete={handleDeleteRevenue}
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Dépenses</h2>
                <AccountingList
                  items={expenses}
                  type="expense"
                  onEdit={handleEditExpense}
                  onDelete={handleDeleteExpense}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {showForm === 'revenue' ? (
            <RevenueForm
              managerId={currentUser.uid}
              revenue={editingItem as DailyRevenue}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          ) : (
            <ExpenseForm
              managerId={currentUser.uid}
              expense={editingItem as DailyExpense}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </div>
      )}
    </div>
  );
}
