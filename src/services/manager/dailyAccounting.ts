import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface DailyRevenue {
  id?: string;
  managerId: string;
  date: Date;
  amount: number;
  category: 'sales' | 'commissions' | 'bonuses' | 'other';
  description: string;
  performedBy?: string;
  performedByName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DailyExpense {
  id?: string;
  managerId: string;
  date: Date;
  amount: number;
  category: 'operations' | 'salaries' | 'utilities' | 'supplies' | 'maintenance' | 'other';
  description: string;
  performedBy?: string;
  performedByName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DailyAccountingService {
  private static revenuesCollection = collection(db, 'daily_revenues');
  private static expensesCollection = collection(db, 'daily_expenses');

  static async createRevenue(revenue: Omit<DailyRevenue, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const revenueData = {
      ...revenue,
      date: Timestamp.fromDate(revenue.date),
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(this.revenuesCollection, revenueData);
    return docRef.id;
  }

  static async updateRevenue(id: string, updates: Partial<Omit<DailyRevenue, 'id' | 'createdAt' | 'managerId'>>): Promise<void> {
    const revenueRef = doc(db, 'daily_revenues', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
    }

    await updateDoc(revenueRef, updateData);
  }

  static async deleteRevenue(id: string): Promise<void> {
    const revenueRef = doc(db, 'daily_revenues', id);
    await deleteDoc(revenueRef);
  }

  static async getRevenuesByManager(managerId: string, startDate?: Date, endDate?: Date): Promise<DailyRevenue[]> {
    const q = query(
      this.revenuesCollection,
      where('managerId', '==', managerId)
    );

    const snapshot = await getDocs(q);
    let revenues = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        date: data.date.toDate(),
        amount: data.amount,
        category: data.category,
        description: data.description,
        performedBy: data.performedBy,
        performedByName: data.performedByName,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });

    if (startDate) {
      revenues = revenues.filter(rev => rev.date >= startDate);
    }

    if (endDate) {
      revenues = revenues.filter(rev => rev.date <= endDate);
    }

    revenues.sort((a, b) => b.date.getTime() - a.date.getTime());

    return revenues;
  }

  static async createExpense(expense: Omit<DailyExpense, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const expenseData = {
      ...expense,
      date: Timestamp.fromDate(expense.date),
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(this.expensesCollection, expenseData);
    return docRef.id;
  }

  static async updateExpense(id: string, updates: Partial<Omit<DailyExpense, 'id' | 'createdAt' | 'managerId'>>): Promise<void> {
    const expenseRef = doc(db, 'daily_expenses', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date);
    }

    await updateDoc(expenseRef, updateData);
  }

  static async deleteExpense(id: string): Promise<void> {
    const expenseRef = doc(db, 'daily_expenses', id);
    await deleteDoc(expenseRef);
  }

  static async getExpensesByManager(managerId: string, startDate?: Date, endDate?: Date): Promise<DailyExpense[]> {
    const q = query(
      this.expensesCollection,
      where('managerId', '==', managerId)
    );

    const snapshot = await getDocs(q);
    let expenses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        date: data.date.toDate(),
        amount: data.amount,
        category: data.category,
        description: data.description,
        performedBy: data.performedBy,
        performedByName: data.performedByName,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });

    if (startDate) {
      expenses = expenses.filter(exp => exp.date >= startDate);
    }

    if (endDate) {
      expenses = expenses.filter(exp => exp.date <= endDate);
    }

    expenses.sort((a, b) => b.date.getTime() - a.date.getTime());

    return expenses;
  }

  static async getDailySummary(managerId: string, date: Date): Promise<{ totalRevenue: number; totalExpense: number; balance: number }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const revenues = await this.getRevenuesByManager(managerId, startOfDay, endOfDay);
    const expenses = await this.getExpensesByManager(managerId, startOfDay, endOfDay);

    const totalRevenue = revenues.reduce((sum, rev) => sum + rev.amount, 0);
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      totalRevenue,
      totalExpense,
      balance: totalRevenue - totalExpense
    };
  }

  static async getMonthlyReport(managerId: string, month: number, year: number): Promise<{
    revenues: DailyRevenue[];
    expenses: DailyExpense[];
    totalRevenue: number;
    totalExpense: number;
    balance: number;
    revenuesByCategory: Record<string, number>;
    expensesByCategory: Record<string, number>;
  }> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const revenues = await this.getRevenuesByManager(managerId, startDate, endDate);
    const expenses = await this.getExpensesByManager(managerId, startDate, endDate);

    const totalRevenue = revenues.reduce((sum, rev) => sum + rev.amount, 0);
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const revenuesByCategory = revenues.reduce((acc, rev) => {
      acc[rev.category] = (acc[rev.category] || 0) + rev.amount;
      return acc;
    }, {} as Record<string, number>);

    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      revenues,
      expenses,
      totalRevenue,
      totalExpense,
      balance: totalRevenue - totalExpense,
      revenuesByCategory,
      expensesByCategory
    };
  }
}
