export interface StaffWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface StaffCommissionWallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffTransaction {
  id: string;
  walletId: string;
  type: 'credit' | 'debit' | 'commission';
  amount: number;
  currency: string;
  referenceType: 'payout' | 'admin_credit';
  referenceId?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}