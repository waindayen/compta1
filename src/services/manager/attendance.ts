import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface AttendanceRecord {
  id?: string;
  managerId: string;
  employeeId: string;
  employeeName: string;
  shiftId?: string;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  breakStart?: Date;
  breakEnd?: Date;
  totalBreakMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  isLate: boolean;
  isEarlyDeparture: boolean;
  status: 'clocked-in' | 'on-break' | 'clocked-out' | 'absent' | 'late' | 'early-departure';
  notes?: string;
  location?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LeaveRequest {
  id?: string;
  managerId: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'vacation' | 'sick' | 'personal' | 'unpaid' | 'maternity' | 'paternity';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const attendanceStatuses = [
  { value: 'clocked-in', label: 'Pointé', color: 'green' },
  { value: 'on-break', label: 'En pause', color: 'yellow' },
  { value: 'clocked-out', label: 'Sorti', color: 'blue' },
  { value: 'absent', label: 'Absent', color: 'red' },
  { value: 'late', label: 'En retard', color: 'orange' },
  { value: 'early-departure', label: 'Départ anticipé', color: 'purple' }
];

export const leaveTypes = [
  { value: 'vacation', label: 'Congés payés', color: 'blue' },
  { value: 'sick', label: 'Maladie', color: 'red' },
  { value: 'personal', label: 'Personnel', color: 'purple' },
  { value: 'unpaid', label: 'Sans solde', color: 'gray' },
  { value: 'maternity', label: 'Maternité', color: 'pink' },
  { value: 'paternity', label: 'Paternité', color: 'indigo' }
];

export const leaveStatuses = [
  { value: 'pending', label: 'En attente', color: 'yellow' },
  { value: 'approved', label: 'Approuvé', color: 'green' },
  { value: 'rejected', label: 'Rejeté', color: 'red' }
];

export class AttendanceService {
  private static attendanceCollection = collection(db, 'attendance_records');
  private static leaveCollection = collection(db, 'leave_requests');

  static async clockIn(
    managerId: string,
    employeeId: string,
    employeeName: string,
    shiftId?: string,
    location?: string,
    scheduledStartTime?: string
  ): Promise<string> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const existingRecord = await this.getTodayRecord(managerId, employeeId, today);

    if (existingRecord) {
      throw new Error('L\'employé a déjà pointé aujourd\'hui');
    }

    let isLate = false;
    let lateMinutes = 0;
    let status: 'clocked-in' | 'late' = 'clocked-in';

    if (scheduledStartTime) {
      const [schedHour, schedMin] = scheduledStartTime.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(schedHour, schedMin, 0, 0);

      const diffMinutes = Math.floor((now.getTime() - scheduledTime.getTime()) / 60000);

      if (diffMinutes > 5) {
        isLate = true;
        lateMinutes = diffMinutes;
        status = 'late';
      }
    }

    const recordData = {
      managerId,
      employeeId,
      employeeName,
      shiftId: shiftId || null,
      date: Timestamp.fromDate(today),
      clockIn: Timestamp.fromDate(now),
      scheduledStartTime: scheduledStartTime || null,
      scheduledEndTime: null,
      totalBreakMinutes: 0,
      lateMinutes,
      earlyDepartureMinutes: 0,
      isLate,
      isEarlyDeparture: false,
      status,
      location: location || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(this.attendanceCollection, recordData);
    return docRef.id;
  }

  static async clockOut(recordId: string, scheduledEndTime?: string): Promise<void> {
    const recordRef = doc(db, 'attendance_records', recordId);

    const recordDoc = await getDocs(query(this.attendanceCollection, where('__name__', '==', recordId)));

    const now = new Date();
    let isEarlyDeparture = false;
    let earlyDepartureMinutes = 0;
    let finalStatus: 'clocked-out' | 'early-departure' = 'clocked-out';

    if (!recordDoc.empty && scheduledEndTime) {
      const data = recordDoc.docs[0].data();
      const today = data.date.toDate();

      const [schedHour, schedMin] = scheduledEndTime.split(':').map(Number);
      const scheduledTime = new Date(today);
      scheduledTime.setHours(schedHour, schedMin, 0, 0);

      const diffMinutes = Math.floor((scheduledTime.getTime() - now.getTime()) / 60000);

      if (diffMinutes > 15) {
        isEarlyDeparture = true;
        earlyDepartureMinutes = diffMinutes;
        finalStatus = 'early-departure';
      }

      const updateData: any = {
        clockOut: Timestamp.fromDate(now),
        scheduledEndTime: scheduledEndTime || data.scheduledEndTime,
        earlyDepartureMinutes,
        isEarlyDeparture,
        status: finalStatus,
        updatedAt: Timestamp.now()
      };

      await updateDoc(recordRef, updateData);
    } else {
      await updateDoc(recordRef, {
        clockOut: Timestamp.fromDate(now),
        status: 'clocked-out',
        updatedAt: Timestamp.now()
      });
    }
  }

  static async startBreak(recordId: string): Promise<void> {
    const recordRef = doc(db, 'attendance_records', recordId);
    await updateDoc(recordRef, {
      breakStart: Timestamp.fromDate(new Date()),
      status: 'on-break',
      updatedAt: Timestamp.now()
    });
  }

  static async endBreak(recordId: string): Promise<void> {
    const recordRef = doc(db, 'attendance_records', recordId);
    const recordDoc = await getDocs(query(this.attendanceCollection, where('__name__', '==', recordId)));

    if (!recordDoc.empty) {
      const data = recordDoc.docs[0].data();
      const breakStart = data.breakStart?.toDate();
      const breakEnd = new Date();

      if (breakStart) {
        const breakMinutes = Math.floor((breakEnd.getTime() - breakStart.getTime()) / 60000);
        const totalBreakMinutes = (data.totalBreakMinutes || 0) + breakMinutes;

        await updateDoc(recordRef, {
          breakEnd: Timestamp.fromDate(breakEnd),
          totalBreakMinutes,
          breakStart: null,
          status: 'clocked-in',
          updatedAt: Timestamp.now()
        });
      }
    }
  }

  static async getTodayRecord(managerId: string, employeeId: string, date: Date): Promise<AttendanceRecord | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      this.attendanceCollection,
      where('managerId', '==', managerId),
      where('employeeId', '==', employeeId)
    );

    const snapshot = await getDocs(q);

    // Filter by date range client-side
    const startTime = startOfDay.getTime();
    const endTime = endOfDay.getTime();

    const matchingDoc = snapshot.docs.find(doc => {
      const data = doc.data();
      const recordDate = data.date.toDate().getTime();
      return recordDate >= startTime && recordDate <= endTime;
    });

    if (!matchingDoc) return null;

    const data = matchingDoc.data();

    return {
      id: matchingDoc.id,
      managerId: data.managerId,
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      shiftId: data.shiftId,
      date: data.date.toDate(),
      clockIn: data.clockIn?.toDate(),
      clockOut: data.clockOut?.toDate(),
      scheduledStartTime: data.scheduledStartTime,
      scheduledEndTime: data.scheduledEndTime,
      breakStart: data.breakStart?.toDate(),
      breakEnd: data.breakEnd?.toDate(),
      totalBreakMinutes: data.totalBreakMinutes || 0,
      lateMinutes: data.lateMinutes || 0,
      earlyDepartureMinutes: data.earlyDepartureMinutes || 0,
      isLate: data.isLate || false,
      isEarlyDeparture: data.isEarlyDeparture || false,
      status: data.status,
      notes: data.notes,
      location: data.location,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  }

  static async getAttendanceByDateRange(managerId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
    const q = query(
      this.attendanceCollection,
      where('managerId', '==', managerId)
    );

    const snapshot = await getDocs(q);
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const records = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          managerId: data.managerId,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          shiftId: data.shiftId,
          date: data.date.toDate(),
          clockIn: data.clockIn?.toDate(),
          clockOut: data.clockOut?.toDate(),
          scheduledStartTime: data.scheduledStartTime,
          scheduledEndTime: data.scheduledEndTime,
          breakStart: data.breakStart?.toDate(),
          breakEnd: data.breakEnd?.toDate(),
          totalBreakMinutes: data.totalBreakMinutes || 0,
          lateMinutes: data.lateMinutes || 0,
          earlyDepartureMinutes: data.earlyDepartureMinutes || 0,
          isLate: data.isLate || false,
          isEarlyDeparture: data.isEarlyDeparture || false,
          status: data.status,
          notes: data.notes,
          location: data.location,
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      })
      .filter(record => {
        const recordTime = record.date.getTime();
        return recordTime >= startTime && recordTime <= endTime;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return records;
  }

  static async getAttendanceByEmployee(managerId: string, employeeId: string, startDate: Date, endDate: Date): Promise<AttendanceRecord[]> {
    const q = query(
      this.attendanceCollection,
      where('managerId', '==', managerId),
      where('employeeId', '==', employeeId)
    );

    const snapshot = await getDocs(q);
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const records = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          managerId: data.managerId,
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          shiftId: data.shiftId,
          date: data.date.toDate(),
          clockIn: data.clockIn?.toDate(),
          clockOut: data.clockOut?.toDate(),
          scheduledStartTime: data.scheduledStartTime,
          scheduledEndTime: data.scheduledEndTime,
          breakStart: data.breakStart?.toDate(),
          breakEnd: data.breakEnd?.toDate(),
          totalBreakMinutes: data.totalBreakMinutes || 0,
          lateMinutes: data.lateMinutes || 0,
          earlyDepartureMinutes: data.earlyDepartureMinutes || 0,
          isLate: data.isLate || false,
          isEarlyDeparture: data.isEarlyDeparture || false,
          status: data.status,
          notes: data.notes,
          location: data.location,
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      })
      .filter(record => {
        const recordTime = record.date.getTime();
        return recordTime >= startTime && recordTime <= endTime;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    return records;
  }

  static calculateWorkedHours(record: AttendanceRecord): number {
    if (!record.clockIn || !record.clockOut) return 0;

    const totalMinutes = Math.floor((record.clockOut.getTime() - record.clockIn.getTime()) / 60000);
    const workedMinutes = totalMinutes - record.totalBreakMinutes;

    return Math.max(0, workedMinutes / 60);
  }

  static async createLeaveRequest(leave: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const leaveData = {
      ...leave,
      startDate: Timestamp.fromDate(leave.startDate),
      endDate: Timestamp.fromDate(leave.endDate),
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(this.leaveCollection, leaveData);
    return docRef.id;
  }

  static async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<void> {
    const leaveRef = doc(db, 'leave_requests', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(updates.startDate);
    }

    if (updates.endDate) {
      updateData.endDate = Timestamp.fromDate(updates.endDate);
    }

    if (updates.status === 'approved') {
      updateData.approvedAt = Timestamp.now();
    }

    await updateDoc(leaveRef, updateData);
  }

  static async getLeaveRequests(managerId: string, status?: string): Promise<LeaveRequest[]> {
    const q = query(
      this.leaveCollection,
      where('managerId', '==', managerId)
    );

    const snapshot = await getDocs(q);
    let records = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        leaveType: data.leaveType,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        days: data.days,
        reason: data.reason,
        status: data.status,
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt?.toDate(),
        rejectionReason: data.rejectionReason,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });

    // Filter by status if provided
    if (status) {
      records = records.filter(r => r.status === status);
    }

    // Sort by start date descending
    records.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    return records;
  }

  static calculateLeaveDays(startDate: Date, endDate: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / oneDay));
    return diffDays + 1;
  }
}
