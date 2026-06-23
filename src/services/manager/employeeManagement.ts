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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface Employee {
  id?: string;
  managerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: 'management' | 'operations' | 'sales' | 'technical' | 'support' | 'other';
  hireDate: Date;
  salary: number;
  paymentFrequency: 'monthly' | 'biweekly' | 'weekly';
  status: 'active' | 'inactive' | 'suspended';
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const departments = [
  { value: 'management', label: 'Direction' },
  { value: 'operations', label: 'Opérations' },
  { value: 'sales', label: 'Ventes' },
  { value: 'technical', label: 'Technique' },
  { value: 'support', label: 'Support' },
  { value: 'other', label: 'Autres' }
];

export const paymentFrequencies = [
  { value: 'monthly', label: 'Mensuel' },
  { value: 'biweekly', label: 'Bi-mensuel' },
  { value: 'weekly', label: 'Hebdomadaire' }
];

export const employeeStatuses = [
  { value: 'active', label: 'Actif', color: 'green' },
  { value: 'inactive', label: 'Inactif', color: 'gray' },
  { value: 'suspended', label: 'Suspendu', color: 'red' }
];

export class EmployeeManagementService {
  private static employeesCollection = collection(db, 'employees');

  static async createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const employeeData: any = {
      ...employee,
      hireDate: Timestamp.fromDate(employee.hireDate),
      createdAt: now,
      updatedAt: now
    };

    // Remove undefined values to prevent Firestore errors
    Object.keys(employeeData).forEach(key => {
      if (employeeData[key] === undefined) {
        delete employeeData[key];
      }
    });

    const docRef = await addDoc(this.employeesCollection, employeeData);
    return docRef.id;
  }

  static async updateEmployee(id: string, updates: Partial<Omit<Employee, 'id' | 'createdAt' | 'managerId'>>): Promise<void> {
    const employeeRef = doc(db, 'employees', id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    if (updates.hireDate) {
      updateData.hireDate = Timestamp.fromDate(updates.hireDate);
    }

    // Remove undefined values to prevent Firestore errors
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(employeeRef, updateData);
  }

  static async deleteEmployee(id: string): Promise<void> {
    const employeeRef = doc(db, 'employees', id);
    await deleteDoc(employeeRef);
  }

  static async getEmployeesByManager(managerId: string): Promise<Employee[]> {
    const q = query(
      this.employeesCollection,
      where('managerId', '==', managerId)
    );

    const snapshot = await getDocs(q);
    const employees = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        position: data.position,
        department: data.department,
        hireDate: data.hireDate.toDate(),
        salary: data.salary,
        paymentFrequency: data.paymentFrequency,
        status: data.status,
        address: data.address,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        notes: data.notes,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });

    return employees.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }

  static async getActiveEmployees(managerId: string): Promise<Employee[]> {
    const q = query(
      this.employeesCollection,
      where('managerId', '==', managerId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    const employees = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        managerId: data.managerId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        position: data.position,
        department: data.department,
        hireDate: data.hireDate.toDate(),
        salary: data.salary,
        paymentFrequency: data.paymentFrequency,
        status: data.status,
        address: data.address,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        notes: data.notes,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    });

    return employees.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }

  static async getEmployeeSummary(managerId: string): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    totalMonthlySalary: number;
    byDepartment: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const employees = await this.getEmployeesByManager(managerId);

    const activeCount = employees.filter(emp => emp.status === 'active').length;

    const totalMonthlySalary = employees
      .filter(emp => emp.status === 'active')
      .reduce((sum, emp) => {
        if (emp.paymentFrequency === 'monthly') {
          return sum + emp.salary;
        } else if (emp.paymentFrequency === 'biweekly') {
          return sum + (emp.salary * 2);
        } else if (emp.paymentFrequency === 'weekly') {
          return sum + (emp.salary * 4);
        }
        return sum;
      }, 0);

    const byDepartment = employees.reduce((acc, emp) => {
      if (!acc[emp.department]) {
        acc[emp.department] = 0;
      }
      acc[emp.department] += 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = employees.reduce((acc, emp) => {
      if (!acc[emp.status]) {
        acc[emp.status] = 0;
      }
      acc[emp.status] += 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEmployees: employees.length,
      activeEmployees: activeCount,
      totalMonthlySalary,
      byDepartment,
      byStatus
    };
  }
}
