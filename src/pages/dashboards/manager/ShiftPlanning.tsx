import React, { useState, useEffect } from 'react';
import { Calendar, Users, Clock, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { ShiftPlanningService, Shift, shiftStatuses } from '../../../services/manager/shiftPlanning';
import { EmployeeManagementService, Employee } from '../../../services/manager/employeeManagement';
import { format, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ShiftPlanning() {
  const { currentUser } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00',
    breakDuration: 60,
    notes: ''
  });

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, selectedWeek]);

  const loadData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const [shiftsData, employeesData] = await Promise.all([
        ShiftPlanningService.getShiftsByDateRange(currentUser.uid, weekStart, weekEnd),
        EmployeeManagementService.getActiveEmployees(currentUser.uid)
      ]);

      setShifts(shiftsData);
      setEmployees(employeesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const employee = employees.find(emp => emp.id === formData.employeeId);
    if (!employee) return;

    try {
      const shiftData: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'> = {
        managerId: currentUser.uid,
        employeeId: formData.employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        date: new Date(formData.date),
        startTime: formData.startTime,
        endTime: formData.endTime,
        breakDuration: formData.breakDuration,
        position: employee.position,
        notes: formData.notes,
        status: 'scheduled'
      };

      if (editingShift?.id) {
        await ShiftPlanningService.updateShift(editingShift.id, shiftData);
        setSuccess('Shift mis à jour');
      } else {
        await ShiftPlanningService.createShift(shiftData);
        setSuccess('Shift créé');
      }

      resetForm();
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !confirm('Supprimer ce shift ?')) return;

    try {
      await ShiftPlanningService.deleteShift(id);
      setSuccess('Shift supprimé');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '17:00',
      breakDuration: 60,
      notes: ''
    });
    setEditingShift(null);
    setShowForm(false);
  };

  const getShiftsForDay = (day: Date, employeeId: string) => {
    return shifts.filter(
      s => s.employeeId === employeeId &&
      format(s.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
    );
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              Planning des Shifts
            </h1>
            <p className="text-gray-600 mt-2">Semaine du {format(weekStart, 'dd MMM', { locale: fr })} au {format(weekEnd, 'dd MMM yyyy', { locale: fr })}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedWeek(addWeeks(selectedWeek, -1))}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Semaine précédente
            </button>
            <button
              onClick={() => setSelectedWeek(new Date())}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cette semaine
            </button>
            <button
              onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Semaine suivante
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Ajouter Shift
            </button>
          </div>
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

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">{editingShift ? 'Modifier' : 'Nouveau'} Shift</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Employé</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Sélectionner</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Début</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Fin</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pause (minutes)</label>
                  <input
                    type="number"
                    value={formData.breakDuration}
                    onChange={(e) => setFormData({ ...formData, breakDuration: parseInt(e.target.value) })}
                    required
                    min="0"
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingShift ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                  {weekDays.map(day => (
                    <th key={day.toISOString()} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      <div>{format(day, 'EEE', { locale: fr })}</div>
                      <div>{format(day, 'dd/MM')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map(employee => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                      <div className="text-xs text-gray-500">{employee.position}</div>
                    </td>
                    {weekDays.map(day => {
                      const dayShifts = getShiftsForDay(day, employee.id!);
                      return (
                        <td key={day.toISOString()} className="px-2 py-4">
                          {dayShifts.map(shift => (
                            <div key={shift.id} className="mb-2 p-2 bg-blue-50 rounded text-xs">
                              <div className="font-semibold">{shift.startTime} - {shift.endTime}</div>
                              <div className="text-gray-600">Pause: {shift.breakDuration}min</div>
                              <div className="flex gap-1 mt-1">
                                <button
                                  onClick={() => {
                                    setFormData({
                                      employeeId: shift.employeeId,
                                      date: format(shift.date, 'yyyy-MM-dd'),
                                      startTime: shift.startTime,
                                      endTime: shift.endTime,
                                      breakDuration: shift.breakDuration,
                                      notes: shift.notes || ''
                                    });
                                    setEditingShift(shift);
                                    setShowForm(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDelete(shift.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
