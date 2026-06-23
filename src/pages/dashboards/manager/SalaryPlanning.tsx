import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, CheckCircle, Clock, Filter, Plus, Search } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  SalaryPaymentService,
  SalaryPayment,
  paymentMethods,
  paymentStatuses
} from '../../../services/manager/salaryPayment';
import { EmployeeManagementService, Employee } from '../../../services/manager/employeeManagement';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SalaryPlanning() {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<SalaryPayment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SalaryPayment | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalPending: 0,
    paymentCount: 0,
    pendingCount: 0
  });

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, selectedMonth]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, filterStatus]);

  const loadData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);

      const [paymentsData, employeesData] = await Promise.all([
        SalaryPaymentService.getPaymentsByManager(currentUser.uid, startDate, endDate),
        EmployeeManagementService.getActiveEmployees(currentUser.uid)
      ]);

      setPayments(paymentsData);
      setEmployees(employeesData);

      const summaryData = await SalaryPaymentService.getPaymentSummary(
        currentUser.uid,
        selectedMonth.getMonth(),
        selectedMonth.getFullYear()
      );
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.period.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status === filterStatus);
    }

    setFilteredPayments(filtered);
  };

  const handleGeneratePayments = async () => {
    if (!currentUser) return;

    setError('');
    setSuccess('');

    try {
      const activeEmployees = await EmployeeManagementService.getActiveEmployees(currentUser.uid);

      if (activeEmployees.length === 0) {
        setError('Aucun employé actif trouvé');
        return;
      }

      let generatedCount = 0;

      for (const employee of activeEmployees) {
        const period = SalaryPaymentService.generatePeriodLabel(
          selectedMonth,
          employee.paymentFrequency
        );

        const existingPayment = payments.find(
          p => p.employeeId === employee.id && p.period === period
        );

        if (!existingPayment) {
          await SalaryPaymentService.createPayment({
            managerId: currentUser.uid,
            employeeId: employee.id!,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            amount: employee.salary,
            paymentDate: new Date(),
            period,
            status: 'pending',
            paymentMethod: 'cash'
          });
          generatedCount++;
        }
      }

      if (generatedCount > 0) {
        setSuccess(`${generatedCount} paiement(s) généré(s) avec succès`);
        setShowGenerateForm(false);
        loadData();
      } else {
        setError('Tous les paiements pour cette période ont déjà été générés');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!selectedPayment?.id) return;

    setError('');
    setSuccess('');

    try {
      await SalaryPaymentService.markAsPaid(
        selectedPayment.id,
        paymentMethod,
        paymentNotes
      );

      setSuccess('Paiement marqué comme payé');
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setPaymentMethod('cash');
      setPaymentNotes('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openPaymentModal = (payment: SalaryPayment) => {
    setSelectedPayment(payment);
    setPaymentMethod(payment.paymentMethod || 'cash');
    setPaymentNotes(payment.notes || '');
    setShowPaymentModal(true);
  };

  const getStatusInfo = (value: string) => {
    return paymentStatuses.find(status => status.value === value);
  };

  const getPaymentMethodLabel = (value: string) => {
    return paymentMethods.find(method => method.value === value)?.label || value;
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, -1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    if (nextMonth <= new Date()) {
      setSelectedMonth(nextMonth);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            Planification Salariale
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez et planifiez les paiements de salaires
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Calendar className="w-5 h-5" />
            </button>

            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
              </p>
            </div>

            <button
              onClick={handleNextMonth}
              disabled={addMonths(selectedMonth, 1) > new Date()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payé</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.totalPaid.toFixed(0)} FCFA
                </p>
                <p className="text-xs text-gray-500">{summary.paymentCount} paiements</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Attente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {summary.totalPending.toFixed(0)} FCFA
                </p>
                <p className="text-xs text-gray-500">{summary.pendingCount} paiements</p>
              </div>
              <Clock className="h-12 w-12 text-orange-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(summary.totalPaid + summary.totalPending).toFixed(0)} FCFA
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Employés Actifs</p>
                <p className="text-2xl font-bold text-purple-600">{employees.length}</p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-600 opacity-50" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-2" />
                Rechercher
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom de l'employé, période..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-2" />
                Statut
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                {paymentStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Réinitialiser
            </button>

            <button
              onClick={() => setShowGenerateForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Générer Paiements
            </button>
          </div>
        </div>

        {showGenerateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Générer les Paiements
              </h2>
              <p className="text-gray-600 mb-6">
                Voulez-vous générer automatiquement les paiements de salaire pour tous les employés actifs pour la période de{' '}
                <span className="font-semibold">
                  {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
                </span> ?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowGenerateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleGeneratePayments}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Générer
                </button>
              </div>
            </div>
          </div>
        )}

        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Marquer comme Payé
              </h2>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Employé</p>
                  <p className="font-semibold text-gray-900">{selectedPayment.employeeName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-semibold text-gray-900">{selectedPayment.amount.toFixed(0)} FCFA</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Période</p>
                  <p className="font-semibold text-gray-900">{selectedPayment.period}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Méthode de paiement *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={3}
                    placeholder="Notes additionnelles..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPayment(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleMarkAsPaid}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Confirmer le Paiement
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de paiement
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Méthode
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Chargement...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Aucun paiement trouvé
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => {
                    const statusInfo = getStatusInfo(payment.status);
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {payment.employeeName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {payment.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(payment.paymentDate, 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                          {payment.amount.toFixed(0)} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.paymentMethod ? getPaymentMethodLabel(payment.paymentMethod) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${statusInfo?.color}-100 text-${statusInfo?.color}-800`}>
                            {statusInfo?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {payment.status === 'pending' && (
                            <button
                              onClick={() => openPaymentModal(payment)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Marquer payé
                            </button>
                          )}
                          {payment.status === 'paid' && payment.paidAt && (
                            <span className="text-xs text-gray-500">
                              Payé le {format(payment.paidAt, 'dd/MM/yyyy')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
