import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface SalaryPayment {
  id?: string;
  managerId: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  paymentDate: Date;
  period: string;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
  notes?: string;
  paidAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const paymentMethods = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'check', label: 'Chèque' }
];

export const paymentStatuses = [
  { value: 'pending', label: 'En attente', color: 'yellow' },
  { value: 'paid', label: 'Payé', color: 'green' },
  { value: 'cancelled', label: 'Annulé', color: 'red' }
];

export class SalaryPaymentService {
  private static paymentsCollection = collection(db, 'salary_payments');

  static async createPayment(payment: Omit<SalaryPayment, 'id' | 'createdAt' | 'updatedAt' | 'paidAt'>): Promise<string> {
    const now = Timestamp.now();
    const paymentData = {
      ...payment,
      paymentDate: Timestamp.fromDate(payment.paymentDate),
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(this.paymentsCollection, paymentData);
    return docRef.id;
  }

  static async updatePayment(id: string, updates: Partial<Omit<SalaryPayment, 'id' | 'createdAt' | 'managerId'>>): Promise<void> {
    const paymentRef = doc(db, 'salary_payments', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.paymentDate) {
      updateData.paymentDate = Timestamp.fromDate(updates.paymentDate);
    }

    if (updates.status === 'paid' && !updates.paidAt) {
      updateData.paidAt = Timestamp.now();
    }

    await updateDoc(paymentRef, updateData);
  }

  static async markAsPaid(id: string, paymentMethod: string, notes?: string): Promise<void> {
    const paymentRef = doc(db, 'salary_payments', id);
    await updateDoc(paymentRef, {
      status: 'paid',
      paymentMethod,
      notes: notes || '',
      paidAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  static async getPaymentsByManager(managerId: string, startDate?: Date, endDate?: Date): Promise<SalaryPayment[]> {
    const q = query(
      this.paymentsCollection,
      where('managerId', '==', managerId),
      orderBy('paymentDate', 'desc')
    );

    const snapshot = await getDocs(q);
    let payments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        amount: data.amount,
        paymentDate: data.paymentDate.toDate(),
        period: data.period,
        status: data.status,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        paidAt: data.paidAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });

    if (startDate) {
      payments = payments.filter(payment => payment.paymentDate >= startDate);
    }

    if (endDate) {
      payments = payments.filter(payment => payment.paymentDate <= endDate);
    }

    return payments;
  }

  static async getPendingPayments(managerId: string): Promise<SalaryPayment[]> {
    const q = query(
      this.paymentsCollection,
      where('managerId', '==', managerId),
      where('status', '==', 'pending'),
      orderBy('paymentDate', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        amount: data.amount,
        paymentDate: data.paymentDate.toDate(),
        period: data.period,
        status: data.status,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        paidAt: data.paidAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });
  }

  static async getPaymentsByEmployee(managerId: string, employeeId: string): Promise<SalaryPayment[]> {
    const q = query(
      this.paymentsCollection,
      where('managerId', '==', managerId),
      where('employeeId', '==', employeeId),
      orderBy('paymentDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        amount: data.amount,
        paymentDate: data.paymentDate.toDate(),
        period: data.period,
        status: data.status,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        paidAt: data.paidAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });
  }

  static async getPaymentSummary(managerId: string, month: number, year: number): Promise<{
    totalPaid: number;
    totalPending: number;
    paymentCount: number;
    pendingCount: number;
  }> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const payments = await this.getPaymentsByManager(managerId, startDate, endDate);

    const paid = payments.filter(p => p.status === 'paid');
    const pending = payments.filter(p => p.status === 'pending');

    return {
      totalPaid: paid.reduce((sum, p) => sum + p.amount, 0),
      totalPending: pending.reduce((sum, p) => sum + p.amount, 0),
      paymentCount: paid.length,
      pendingCount: pending.length
    };
  }

  static generatePeriodLabel(date: Date, frequency: string): string {
    const month = date.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    if (frequency === 'monthly') {
      return month;
    } else if (frequency === 'biweekly') {
      const weekOfMonth = Math.ceil(date.getDate() / 14);
      return `${month} - Période ${weekOfMonth}`;
    } else if (frequency === 'weekly') {
      const weekNumber = Math.ceil(date.getDate() / 7);
      return `${month} - Semaine ${weekNumber}`;
    }

    return month;
  }
}
