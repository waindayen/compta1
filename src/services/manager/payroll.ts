import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AttendanceService, AttendanceRecord } from './attendance';
import { Employee } from './employeeManagement';
import { CompanySettingsService } from '../admin/companySettings';

export interface PayrollRecord {
  id?: string;
  managerId: string;
  employeeId: string;
  employeeName: string;
  period: string;
  month: number;
  year: number;
  baseSalary: number;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  grossPay: number;
  deductions: PayrollDeduction[];
  totalDeductions: number;
  netPay: number;
  bonuses: PayrollBonus[];
  totalBonuses: number;
  status: 'draft' | 'approved' | 'paid' | 'cancelled';
  paymentMethod?: string;
  paidAt?: Date;
  generatedBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PayrollDeduction {
  type: 'tax' | 'social-security' | 'insurance' | 'advance' | 'loan' | 'other';
  label: string;
  amount: number;
  percentage?: number;
}

export interface PayrollBonus {
  type: 'performance' | 'commission' | 'overtime-premium' | 'holiday' | 'other';
  label: string;
  amount: number;
}

export interface PayrollConfig {
  id?: string;
  managerId: string;
  regularHoursPerWeek: number;
  overtimeRate: number;
  taxRate: number;
  socialSecurityRate: number;
  insuranceRate: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const payrollStatuses = [
  { value: 'draft', label: 'Brouillon', color: 'gray' },
  { value: 'approved', label: 'Approuvé', color: 'blue' },
  { value: 'paid', label: 'Payé', color: 'green' },
  { value: 'cancelled', label: 'Annulé', color: 'red' }
];

export const deductionTypes = [
  { value: 'tax', label: 'Impôts' },
  { value: 'social-security', label: 'Sécurité sociale' },
  { value: 'insurance', label: 'Assurance' },
  { value: 'advance', label: 'Avance sur salaire' },
  { value: 'loan', label: 'Prêt' },
  { value: 'other', label: 'Autre' }
];

export const bonusTypes = [
  { value: 'performance', label: 'Performance' },
  { value: 'commission', label: 'Commission' },
  { value: 'overtime-premium', label: 'Prime heures sup.' },
  { value: 'holiday', label: 'Prime vacances' },
  { value: 'other', label: 'Autre' }
];

export class PayrollService {
  private static payrollCollection = collection(db, 'payroll_records');
  private static configCollection = collection(db, 'payroll_config');

  static async getOrCreateConfig(managerId: string): Promise<PayrollConfig> {
    const q = query(
      this.configCollection,
      where('managerId', '==', managerId)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        regularHoursPerWeek: data.regularHoursPerWeek,
        overtimeRate: data.overtimeRate,
        taxRate: data.taxRate,
        socialSecurityRate: data.socialSecurityRate,
        insuranceRate: data.insuranceRate,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    }

    const defaultConfig: Omit<PayrollConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      managerId,
      regularHoursPerWeek: 40,
      overtimeRate: 1.5,
      taxRate: 0.15,
      socialSecurityRate: 0.05,
      insuranceRate: 0.02
    };

    const docRef = await addDoc(this.configCollection, {
      ...defaultConfig,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return { ...defaultConfig, id: docRef.id };
  }

  static async updateConfig(id: string, updates: Partial<PayrollConfig>): Promise<void> {
    const configRef = doc(db, 'payroll_config', id);
    await updateDoc(configRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  static async generatePayroll(
    managerId: string,
    employee: Employee,
    month: number,
    year: number,
    attendanceRecords: AttendanceRecord[],
    config: PayrollConfig,
    bonuses: PayrollBonus[] = [],
    customDeductions: PayrollDeduction[] = []
  ): Promise<string> {
    const regularHoursPerMonth = (config.regularHoursPerWeek * 52) / 12;

    let totalWorkedHours = 0;
    let totalLateMinutes = 0;
    let totalEarlyDepartureMinutes = 0;
    let lateCount = 0;
    let earlyDepartureCount = 0;

    attendanceRecords.forEach(record => {
      totalWorkedHours += AttendanceService.calculateWorkedHours(record);
      if (record.isLate) {
        totalLateMinutes += record.lateMinutes;
        lateCount++;
      }
      if (record.isEarlyDeparture) {
        totalEarlyDepartureMinutes += record.earlyDepartureMinutes;
        earlyDepartureCount++;
      }
    });

    const regularHours = Math.min(totalWorkedHours, regularHoursPerMonth);
    const overtimeHours = Math.max(0, totalWorkedHours - regularHoursPerMonth);

    const hourlyRate = employee.salary / regularHoursPerMonth;

    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * hourlyRate * config.overtimeRate;

    const grossPay = regularPay + overtimePay;

    const lateHours = totalLateMinutes / 60;
    const earlyDepartureHours = totalEarlyDepartureMinutes / 60;
    const attendanceDeduction = (lateHours + earlyDepartureHours) * hourlyRate;

    const companySettings = await CompanySettingsService.getSettings(managerId);
    const defaultSettings = CompanySettingsService.getDefaultSettings(managerId);

    const taxRate = companySettings ? companySettings.taxRate / 100 : defaultSettings.taxRate / 100;
    const socialSecurityRate = companySettings ? companySettings.socialSecurityRate / 100 : defaultSettings.socialSecurityRate / 100;
    const insuranceRate = companySettings ? companySettings.insuranceRate / 100 : defaultSettings.insuranceRate / 100;
    const otherDeductionRate = companySettings ? (companySettings.otherDeductionRate || 0) / 100 : 0;
    const otherDeductionName = companySettings ? companySettings.otherDeductionName : '';

    const deductions: PayrollDeduction[] = [
      {
        type: 'tax',
        label: 'Impôts',
        amount: grossPay * taxRate,
        percentage: taxRate * 100
      },
      {
        type: 'social-security',
        label: 'Sécurité sociale',
        amount: grossPay * socialSecurityRate,
        percentage: socialSecurityRate * 100
      },
      {
        type: 'insurance',
        label: 'Assurance',
        amount: grossPay * insuranceRate,
        percentage: insuranceRate * 100
      }
    ];

    if (otherDeductionRate > 0 && otherDeductionName) {
      deductions.push({
        type: 'other',
        label: otherDeductionName,
        amount: grossPay * otherDeductionRate,
        percentage: otherDeductionRate * 100
      });
    }

    if (attendanceDeduction > 0) {
      deductions.push({
        type: 'other',
        label: `Retards et départs anticipés (${lateCount} retards: ${totalLateMinutes}min, ${earlyDepartureCount} départs: ${totalEarlyDepartureMinutes}min)`,
        amount: attendanceDeduction
      });
    }

    deductions.push(...customDeductions);

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);
    const netPay = grossPay + totalBonuses - totalDeductions;

    const period = new Date(year, month).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

    const payrollData = {
      managerId,
      employeeId: employee.id!,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      period,
      month,
      year,
      baseSalary: employee.salary,
      regularHours,
      overtimeHours,
      regularPay,
      overtimePay,
      grossPay,
      deductions,
      totalDeductions,
      netPay,
      bonuses,
      totalBonuses,
      status: 'draft',
      generatedBy: managerId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(this.payrollCollection, payrollData);
    return docRef.id;
  }

  static async updatePayroll(id: string, updates: Partial<PayrollRecord>): Promise<void> {
    const payrollRef = doc(db, 'payroll_records', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.status === 'approved' && !updates.approvedAt) {
      updateData.approvedAt = Timestamp.now();
    }

    if (updates.status === 'paid' && !updates.paidAt) {
      updateData.paidAt = Timestamp.now();
    }

    await updateDoc(payrollRef, updateData);
  }

  static async getPayrollRecords(managerId: string, month?: number, year?: number): Promise<PayrollRecord[]> {
    const q = query(
      this.payrollCollection,
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
        period: data.period,
        month: data.month,
        year: data.year,
        baseSalary: data.baseSalary,
        regularHours: data.regularHours,
        overtimeHours: data.overtimeHours,
        regularPay: data.regularPay,
        overtimePay: data.overtimePay,
        grossPay: data.grossPay,
        deductions: data.deductions,
        totalDeductions: data.totalDeductions,
        netPay: data.netPay,
        bonuses: data.bonuses,
        totalBonuses: data.totalBonuses,
        status: data.status,
        paymentMethod: data.paymentMethod,
        paidAt: data.paidAt?.toDate(),
        generatedBy: data.generatedBy,
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt?.toDate(),
        notes: data.notes,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });

    // Filter by month and year if provided
    if (month !== undefined && year !== undefined) {
      records = records.filter(r => r.month === month && r.year === year);
      // Sort by employee name
      records.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    } else {
      // Sort by year and month descending
      records.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      });
    }

    return records;
  }

  static async getPayrollByEmployee(managerId: string, employeeId: string): Promise<PayrollRecord[]> {
    const q = query(
      this.payrollCollection,
      where('managerId', '==', managerId),
      where('employeeId', '==', employeeId)
    );

    const snapshot = await getDocs(q);
    const records = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        period: data.period,
        month: data.month,
        year: data.year,
        baseSalary: data.baseSalary,
        regularHours: data.regularHours,
        overtimeHours: data.overtimeHours,
        regularPay: data.regularPay,
        overtimePay: data.overtimePay,
        grossPay: data.grossPay,
        deductions: data.deductions,
        totalDeductions: data.totalDeductions,
        netPay: data.netPay,
        bonuses: data.bonuses,
        totalBonuses: data.totalBonuses,
        status: data.status,
        paymentMethod: data.paymentMethod,
        paidAt: data.paidAt?.toDate(),
        generatedBy: data.generatedBy,
        approvedBy: data.approvedBy,
        approvedAt: data.approvedAt?.toDate(),
        notes: data.notes,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });

    // Sort by year and month descending
    records.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    return records;
  }

  static async getSummary(managerId: string, month: number, year: number): Promise<{
    totalGross: number;
    totalDeductions: number;
    totalBonuses: number;
    totalNet: number;
    totalOvertimeHours: number;
    recordCount: number;
  }> {
    const records = await this.getPayrollRecords(managerId, month, year);

    return {
      totalGross: records.reduce((sum, r) => sum + r.grossPay, 0),
      totalDeductions: records.reduce((sum, r) => sum + r.totalDeductions, 0),
      totalBonuses: records.reduce((sum, r) => sum + r.totalBonuses, 0),
      totalNet: records.reduce((sum, r) => sum + r.netPay, 0),
      totalOvertimeHours: records.reduce((sum, r) => sum + r.overtimeHours, 0),
      recordCount: records.length
    };
  }
}
