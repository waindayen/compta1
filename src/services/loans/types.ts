export interface Borrower {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  idNumber?: string;
  occupation?: string;
  monthlyIncome?: number;
  creditScore?: number;
  status: 'active' | 'inactive' | 'blacklisted';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Loan {
  id: string;
  borrowerId: string;
  borrowerName: string;
  amount: number;
  interestRate: number;
  term: number;
  termUnit: 'days' | 'weeks' | 'months' | 'years';
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'defaulted' | 'cancelled';
  purpose?: string;
  collateral?: string;
  monthlyPayment: number;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  nextPaymentDate?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  borrowerId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'other';
  principal: number;
  interest: number;
  lateFee?: number;
  notes?: string;
  receivedBy: string;
  receiptNumber?: string;
  createdAt: Date;
}

export interface LoanSummary {
  totalLoans: number;
  activeLoans: number;
  completedLoans: number;
  defaultedLoans: number;
  totalDisbursed: number;
  totalCollected: number;
  outstandingBalance: number;
  expectedRevenue: number;
}

export interface BorrowerStats {
  totalBorrowers: number;
  activeBorrowers: number;
  blacklistedBorrowers: number;
  totalLoansIssued: number;
  averageLoanAmount: number;
  defaultRate: number;
}
