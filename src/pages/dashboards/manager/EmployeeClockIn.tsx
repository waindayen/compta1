import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, Coffee, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { AttendanceService, AttendanceRecord } from '../../../services/manager/attendance';
import { EmployeeManagementService, Employee } from '../../../services/manager/employeeManagement';
import { ShiftPlanningService, Shift } from '../../../services/manager/shiftPlanning';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EmployeeClockIn() {
  const { currentUser } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [todayShift, setTodayShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadEmployees();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedEmployee && currentUser) {
      loadTodayRecord();
    }
  }, [selectedEmployee, currentUser]);

  const loadEmployees = async () => {
    if (!currentUser) return;

    try {
      const data = await EmployeeManagementService.getActiveEmployees(currentUser.uid);
      setEmployees(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadTodayRecord = async () => {
    if (!currentUser || !selectedEmployee) return;

    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const [record, shifts] = await Promise.all([
        AttendanceService.getTodayRecord(currentUser.uid, selectedEmployee, new Date()),
        ShiftPlanningService.getShiftsByEmployee(currentUser.uid, selectedEmployee, startOfDay, endOfDay)
      ]);

      setTodayRecord(record);
      setTodayShift(shifts.length > 0 ? shifts[0] : null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClockIn = async () => {
    if (!currentUser || !selectedEmployee) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) return;

      await AttendanceService.clockIn(
        currentUser.uid,
        selectedEmployee,
        `${employee.firstName} ${employee.lastName}`,
        todayShift?.id,
        undefined,
        todayShift?.startTime
      );

      setSuccess('Pointage d\'entrée enregistré');
      loadTodayRecord();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord?.id) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await AttendanceService.clockOut(todayRecord.id, todayShift?.endTime);
      setSuccess('Pointage de sortie enregistré');
      loadTodayRecord();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    if (!todayRecord?.id) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await AttendanceService.startBreak(todayRecord.id);
      setSuccess('Pause commencée');
      loadTodayRecord();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!todayRecord?.id) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await AttendanceService.endBreak(todayRecord.id);
      setSuccess('Pause terminée');
      loadTodayRecord();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <Clock className="h-12 w-12 text-blue-600 inline-block mb-2" />
          </h1>
          <p className="text-6xl font-bold text-blue-600 mb-2">
            {format(currentTime, 'HH:mm:ss')}
          </p>
          <p className="text-2xl text-gray-600">
            {format(currentTime, 'EEEE dd MMMM yyyy', { locale: fr })}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              Sélectionner un employé
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choisir un employé...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} - {emp.position}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className="space-y-4">
              {todayShift && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-900 font-semibold mb-2">Shift prévu aujourd'hui</p>
                  <div className="flex justify-between text-blue-800">
                    <span>Début: {todayShift.startTime}</span>
                    <span>Fin: {todayShift.endTime}</span>
                    <span>Pause: {todayShift.breakDuration} min</span>
                  </div>
                </div>
              )}

              {!todayRecord && (
                <button
                  onClick={handleClockIn}
                  disabled={loading}
                  className="w-full py-6 bg-green-600 text-white text-xl font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  <LogIn className="h-8 w-8" />
                  Pointer l'arrivée
                </button>
              )}

              {todayRecord && (todayRecord.status === 'clocked-in' || todayRecord.status === 'late') && (
                <>
                  <div className={`p-4 border rounded-lg ${todayRecord.isLate ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                    <p className={`font-semibold ${todayRecord.isLate ? 'text-orange-800' : 'text-green-800'}`}>
                      Arrivée enregistrée à {todayRecord.clockIn && format(todayRecord.clockIn, 'HH:mm')}
                    </p>
                    {todayRecord.isLate && (
                      <div className="flex items-center gap-2 mt-2 text-orange-700">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-bold">Retard de {todayRecord.lateMinutes} minutes</span>
                      </div>
                    )}
                    {todayRecord.scheduledStartTime && (
                      <p className="text-sm text-gray-600 mt-1">
                        Heure prévue: {todayRecord.scheduledStartTime}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleStartBreak}
                    disabled={loading}
                    className="w-full py-6 bg-orange-500 text-white text-xl font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <Coffee className="h-8 w-8" />
                    Commencer la pause
                  </button>

                  <button
                    onClick={handleClockOut}
                    disabled={loading}
                    className="w-full py-6 bg-red-600 text-white text-xl font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <LogOut className="h-8 w-8" />
                    Pointer la sortie
                  </button>
                </>
              )}

              {todayRecord && todayRecord.status === 'on-break' && (
                <>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-800 font-semibold">
                      En pause depuis {todayRecord.breakStart && format(todayRecord.breakStart, 'HH:mm')}
                    </p>
                  </div>

                  <button
                    onClick={handleEndBreak}
                    disabled={loading}
                    className="w-full py-6 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <CheckCircle className="h-8 w-8" />
                    Terminer la pause
                  </button>
                </>
              )}

              {todayRecord && (todayRecord.status === 'clocked-out' || todayRecord.status === 'early-departure') && (
                <div className={`p-6 border-2 rounded-lg text-center ${todayRecord.isEarlyDeparture ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
                  {todayRecord.isEarlyDeparture ? (
                    <AlertCircle className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                  ) : (
                    <CheckCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  )}
                  <p className={`text-xl font-semibold mb-2 ${todayRecord.isEarlyDeparture ? 'text-purple-900' : 'text-blue-900'}`}>
                    {todayRecord.isEarlyDeparture ? 'Départ anticipé' : 'Journée terminée'}
                  </p>
                  <div className={todayRecord.isEarlyDeparture ? 'text-purple-700' : 'text-blue-700'}>
                    <p>Arrivée: {todayRecord.clockIn && format(todayRecord.clockIn, 'HH:mm')}</p>
                    {todayRecord.scheduledStartTime && (
                      <p className="text-sm text-gray-600">(Prévu: {todayRecord.scheduledStartTime})</p>
                    )}
                    {todayRecord.isLate && (
                      <p className="text-orange-600 font-semibold">Retard: {todayRecord.lateMinutes} min</p>
                    )}
                    <p className="mt-2">Sortie: {todayRecord.clockOut && format(todayRecord.clockOut, 'HH:mm')}</p>
                    {todayRecord.scheduledEndTime && (
                      <p className="text-sm text-gray-600">(Prévu: {todayRecord.scheduledEndTime})</p>
                    )}
                    {todayRecord.isEarlyDeparture && (
                      <p className="text-purple-600 font-semibold">Départ {todayRecord.earlyDepartureMinutes} min avant</p>
                    )}
                    <p className="mt-2 font-semibold">
                      Heures travaillées: {AttendanceService.calculateWorkedHours(todayRecord).toFixed(2)}h
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
