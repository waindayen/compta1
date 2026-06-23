import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  and
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface Shift {
  id?: string;
  managerId: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  startTime: string;
  endTime: string;
  breakDuration: number;
  position: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShiftTemplate {
  id?: string;
  managerId: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  daysOfWeek: number[];
  createdAt?: Date;
}

export const shiftStatuses = [
  { value: 'scheduled', label: 'Planifié', color: 'blue' },
  { value: 'completed', label: 'Terminé', color: 'green' },
  { value: 'cancelled', label: 'Annulé', color: 'red' },
  { value: 'no-show', label: 'Absent', color: 'orange' }
];

export const daysOfWeek = [
  { value: 0, label: 'Dimanche', short: 'Dim' },
  { value: 1, label: 'Lundi', short: 'Lun' },
  { value: 2, label: 'Mardi', short: 'Mar' },
  { value: 3, label: 'Mercredi', short: 'Mer' },
  { value: 4, label: 'Jeudi', short: 'Jeu' },
  { value: 5, label: 'Vendredi', short: 'Ven' },
  { value: 6, label: 'Samedi', short: 'Sam' }
];

export class ShiftPlanningService {
  private static shiftsCollection = collection(db, 'shifts');
  private static templatesCollection = collection(db, 'shift_templates');

  static async createShift(shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const shiftData = {
      ...shift,
      date: Timestamp.fromDate(shift.date),
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(this.shiftsCollection, shiftData);
    return docRef.id;
  }

  static async updateShift(id: string, updates: Partial<Omit<Shift, 'id' | 'createdAt' | 'managerId'>>): Promise<void> {
    const shiftRef = doc(db, 'shifts', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
    }

    await updateDoc(shiftRef, updateData);
  }

  static async deleteShift(id: string): Promise<void> {
    const shiftRef = doc(db, 'shifts', id);
    await deleteDoc(shiftRef);
  }

  static async getShiftsByDateRange(managerId: string, startDate: Date, endDate: Date): Promise<Shift[]> {
    const q = query(
      this.shiftsCollection,
      where('managerId', '==', managerId)
    );

    const snapshot = await getDocs(q);
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const shifts = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          managerId: data.managerId,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          date: data.date.toDate(),
          startTime: data.startTime,
          endTime: data.endTime,
          breakDuration: data.breakDuration,
          position: data.position,
          notes: data.notes,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      })
      .filter(shift => {
        const shiftTime = shift.date.getTime();
        return shiftTime >= startTime && shiftTime <= endTime;
      });

    return shifts.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  static async getShiftsByEmployee(managerId: string, employeeId: string, startDate: Date, endDate: Date): Promise<Shift[]> {
    const q = query(
      this.shiftsCollection,
      where('managerId', '==', managerId),
      where('employeeId', '==', employeeId)
    );

    const snapshot = await getDocs(q);
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const shifts = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          managerId: data.managerId,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          date: data.date.toDate(),
          startTime: data.startTime,
          endTime: data.endTime,
          breakDuration: data.breakDuration,
          position: data.position,
          notes: data.notes,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      })
      .filter(shift => {
        const shiftTime = shift.date.getTime();
        return shiftTime >= startTime && shiftTime <= endTime;
      });

    return shifts.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  static async createTemplate(template: Omit<ShiftTemplate, 'id' | 'createdAt'>): Promise<string> {
    const templateData = {
      ...template,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(this.templatesCollection, templateData);
    return docRef.id;
  }

  static async getTemplates(managerId: string): Promise<ShiftTemplate[]> {
    const q = query(
      this.templatesCollection,
      where('managerId', '==', managerId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        breakDuration: data.breakDuration,
        daysOfWeek: data.daysOfWeek,
        createdAt: data.createdAt?.toDate()
      };
    });
  }

  static calculateShiftHours(startTime: string, endTime: string, breakDuration: number): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }

    totalMinutes -= breakDuration;

    return totalMinutes / 60;
  }

  static async getWeekSummary(managerId: string, startDate: Date, endDate: Date): Promise<{
    totalShifts: number;
    totalHours: number;
    byEmployee: Record<string, { shifts: number; hours: number; name: string }>;
    byStatus: Record<string, number>;
  }> {
    const shifts = await this.getShiftsByDateRange(managerId, startDate, endDate);

    const byEmployee: Record<string, { shifts: number; hours: number; name: string }> = {};
    const byStatus: Record<string, number> = {};

    let totalHours = 0;

    shifts.forEach(shift => {
      const hours = this.calculateShiftHours(shift.startTime, shift.endTime, shift.breakDuration);
      totalHours += hours;

      if (!byEmployee[shift.employeeId]) {
        byEmployee[shift.employeeId] = {
          shifts: 0,
          hours: 0,
          name: shift.employeeName
        };
      }
      byEmployee[shift.employeeId].shifts += 1;
      byEmployee[shift.employeeId].hours += hours;

      byStatus[shift.status] = (byStatus[shift.status] || 0) + 1;
    });

    return {
      totalShifts: shifts.length,
      totalHours,
      byEmployee,
      byStatus
    };
  }
}
