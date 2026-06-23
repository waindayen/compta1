import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { AttendanceService, AttendanceRecord } from '../../../services/manager/attendance';
import { EmployeeManagementService, Employee } from '../../../services/manager/employeeManagement';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AttendanceTracking() {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, selectedMonth]);

  const loadData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const startDate = startOfMonth(selectedMonth);
      const endDate = endOfMonth(selectedMonth);

      const [recordsData, employeesData] = await Promise.all([
        AttendanceService.getAttendanceByDateRange(currentUser.uid, startDate, endDate),
        EmployeeManagementService.getActiveEmployees(currentUser.uid)
      ]);

      setRecords(recordsData);
      setEmployees(employeesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSummaryForEmployee = (employeeId: string) => {
    const empRecords = records.filter(r => r.employeeId === employeeId);
    const totalDays = empRecords.filter(r => r.status === 'clocked-out' || r.status === 'early-departure').length;
    const totalHours = empRecords.reduce((sum, r) => sum + AttendanceService.calculateWorkedHours(r), 0);
    const lateCount = empRecords.filter(r => r.isLate).length;
    const absentCount = empRecords.filter(r => r.status === 'absent').length;
    const earlyDepartureCount = empRecords.filter(r => r.isEarlyDeparture).length;
    const totalLateMinutes = empRecords.reduce((sum, r) => sum + (r.lateMinutes || 0), 0);
    const totalEarlyMinutes = empRecords.reduce((sum, r) => sum + (r.earlyDepartureMinutes || 0), 0);

    return { totalDays, totalHours, lateCount, absentCount, earlyDepartureCount, totalLateMinutes, totalEarlyMinutes };
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="h-8 w-8 text-blue-600" />
            Suivi des Présences
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
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

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Jours Travaillés</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Heures Totales</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Retards</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Départs Anticipés</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absences</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Chargement...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Aucun employé</td>
                </tr>
              ) : (
                employees.map(employee => {
                  const summary = getSummaryForEmployee(employee.id!);
                  return (
                    <tr key={employee.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{employee.position}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-semibold text-blue-600">{summary.totalDays}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-semibold text-green-600">{summary.totalHours.toFixed(1)}h</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`text-lg font-semibold ${summary.lateCount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {summary.lateCount}
                          {summary.lateCount > 0 && (
                            <div className="text-xs font-normal text-gray-600">
                              ({summary.totalLateMinutes} min)
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`text-lg font-semibold ${summary.earlyDepartureCount > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                          {summary.earlyDepartureCount}
                          {summary.earlyDepartureCount > 0 && (
                            <div className="text-xs font-normal text-gray-600">
                              ({summary.totalEarlyMinutes} min)
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-lg font-semibold ${summary.absentCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {summary.absentCount}
                        </span>
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
