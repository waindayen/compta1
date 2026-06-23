import React, { useState, useEffect } from 'react';
import { DollarSign, FileText, Calendar, Download, Eye } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { PayrollService, PayrollRecord, payrollStatuses, PayrollConfig } from '../../../services/manager/payroll';
import { AttendanceService } from '../../../services/manager/attendance';
import { EmployeeManagementService, Employee } from '../../../services/manager/employeeManagement';
import { PayslipService, CompanyInfo } from '../../../services/manager/payslip';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function PayrollProcessing() {
  const { currentUser } = useAuth();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [config, setConfig] = useState<PayrollConfig | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generating, setGenerating] = useState(false);

  const companyInfo: CompanyInfo = {
    name: 'Votre Entreprise',
    address: '123 Rue Example, Ville',
    phone: '+225 XX XX XX XX XX',
    email: 'contact@entreprise.com'
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, selectedMonth]);

  const loadData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const [payrollsData, employeesData, configData] = await Promise.all([
        PayrollService.getPayrollRecords(currentUser.uid, selectedMonth.getMonth(), selectedMonth.getFullYear()),
        EmployeeManagementService.getActiveEmployees(currentUser.uid),
        PayrollService.getOrCreateConfig(currentUser.uid)
      ]);

      setPayrolls(payrollsData);
      setEmployees(employeesData);
      setConfig(configData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayrolls = async () => {
    if (!currentUser || !config) return;

    const employeesWithZeroSalary = employees.filter(emp => !emp.salary || emp.salary === 0);
    if (employeesWithZeroSalary.length > 0) {
      setError(`Impossible de générer les fiches de paie. Les employés suivants n'ont pas de salaire défini : ${employeesWithZeroSalary.map(e => `${e.firstName} ${e.lastName}`).join(', ')}. Veuillez définir leur salaire dans la Gestion des Employés.`);
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);

      let generatedCount = 0;

      for (const employee of employees) {
        const existingPayroll = payrolls.find(p => p.employeeId === employee.id);
        if (existingPayroll) continue;

        const attendanceRecords = await AttendanceService.getAttendanceByEmployee(
          currentUser.uid,
          employee.id!,
          startDate,
          endDate
        );

        await PayrollService.generatePayroll(
          currentUser.uid,
          employee,
          selectedMonth.getMonth(),
          selectedMonth.getFullYear(),
          attendanceRecords,
          config
        );

        generatedCount++;
      }

      if (generatedCount > 0) {
        setSuccess(`${generatedCount} fiche(s) de paie générée(s)`);
        loadData();
      } else {
        setError('Toutes les fiches de paie ont déjà été générées pour cette période');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (payroll: PayrollRecord) => {
    if (!payroll.id || !currentUser) return;

    try {
      await PayrollService.updatePayroll(payroll.id, {
        status: 'approved',
        approvedBy: currentUser.uid,
        approvedAt: new Date()
      });
      setSuccess('Fiche de paie approuvée');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMarkAsPaid = async (payroll: PayrollRecord) => {
    if (!payroll.id) return;

    try {
      await PayrollService.updatePayroll(payroll.id, {
        status: 'paid',
        paidAt: new Date(),
        paymentMethod: 'bank_transfer'
      });
      setSuccess('Paiement enregistré');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleViewPayslip = async (payroll: PayrollRecord) => {
    const employee = employees.find(emp => emp.id === payroll.employeeId);
    if (!employee) return;

    const html = PayslipService.generatePayslipHTML({
      payroll,
      employee,
      companyInfo,
      generatedDate: new Date()
    });

    PayslipService.printPayslip(html);
  };

  const handleDownloadPayslip = async (payroll: PayrollRecord) => {
    const employee = employees.find(emp => emp.id === payroll.employeeId);
    if (!employee) return;

    const html = PayslipService.generatePayslipHTML({
      payroll,
      employee,
      companyInfo,
      generatedDate: new Date()
    });

    const filename = `Fiche_Paie_${employee.lastName}_${format(selectedMonth, 'yyyy-MM')}.html`;
    PayslipService.downloadPayslip(html, filename);
  };

  const getStatusInfo = (value: string) => {
    return payrollStatuses.find(status => status.value === value);
  };

  const summary = payrolls.reduce(
    (acc, p) => ({
      totalGross: acc.totalGross + p.grossPay,
      totalNet: acc.totalNet + p.netPay,
      totalDeductions: acc.totalDeductions + p.totalDeductions,
      count: acc.count + 1
    }),
    { totalGross: 0, totalNet: 0, totalDeductions: 0, count: 0 }
  );

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-blue-600" />
            Traitement de la Paie
          </h1>
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

        {employees.some(emp => !emp.salary || emp.salary === 0) && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="font-semibold text-yellow-800 mb-2">Attention : Employés sans salaire défini</p>
            <p className="text-yellow-700 text-sm mb-2">
              Les employés suivants n'ont pas de salaire de base défini et ne pourront pas recevoir de fiche de paie :
            </p>
            <ul className="list-disc list-inside text-yellow-700 text-sm">
              {employees.filter(emp => !emp.salary || emp.salary === 0).map(emp => (
                <li key={emp.id}>{emp.firstName} {emp.lastName} - {emp.position}</li>
              ))}
            </ul>
            <p className="text-yellow-700 text-sm mt-2">
              Veuillez définir leur salaire dans la section <strong>Gestion des Employés</strong>.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Calendar className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <button
              onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
              disabled={addMonths(selectedMonth, 1) > new Date()}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600">Fiches de Paie</p>
            <p className="text-2xl font-bold text-blue-600">{summary.count}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600">Salaire Brut Total</p>
            <p className="text-xl font-bold text-green-600">{summary.totalGross.toFixed(0)} FCFA</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600">Déductions Totales</p>
            <p className="text-xl font-bold text-red-600">{summary.totalDeductions.toFixed(0)} FCFA</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm text-gray-600">Salaire Net Total</p>
            <p className="text-xl font-bold text-purple-600">{summary.totalNet.toFixed(0)} FCFA</p>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={handleGeneratePayrolls}
            disabled={generating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Génération...' : 'Générer les Fiches de Paie'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Heures</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Brut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : payrolls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucune fiche de paie pour cette période
                  </td>
                </tr>
              ) : (
                payrolls.map(payroll => {
                  const statusInfo = getStatusInfo(payroll.status);
                  return (
                    <tr key={payroll.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {payroll.employeeName}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {payroll.regularHours.toFixed(1)}h
                        {payroll.overtimeHours > 0 && (
                          <div className="text-xs text-orange-600">+{payroll.overtimeHours.toFixed(1)}h sup</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        {payroll.grossPay.toFixed(0)} FCFA
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">
                        {payroll.netPay.toFixed(0)} FCFA
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${statusInfo?.color}-100 text-${statusInfo?.color}-800`}>
                          {statusInfo?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleViewPayslip(payroll)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDownloadPayslip(payroll)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Télécharger"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          {payroll.status === 'draft' && (
                            <button
                              onClick={() => handleApprove(payroll)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Approuver
                            </button>
                          )}
                          {payroll.status === 'approved' && (
                            <button
                              onClick={() => handleMarkAsPaid(payroll)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Marquer payé
                            </button>
                          )}
                        </div>
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
  );
}
