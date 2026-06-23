export interface AgentWallet {
  id: string;
  userId: string;
  userEmail: string;
  balance: number;
  currency: string;
  unitValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentWalletWithUserInfo extends AgentWallet {
  firstName?: string;
  lastName?: string;
}

export interface AgentCommissionWallet {
  id: string;
  userId: string;
  userEmail: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentTransaction {
  id: string;
  walletId: string;
  type: 'credit' | 'debit' | 'commission';
  amount: number;
  currency?: string;
  referenceType: 'bet' | 'payout' | 'admin_credit' | 'refund' | 'cancellation_fee';
  referenceId?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  transferTo?: string;
  transferFrom?: string;
  transferAmount?: number;
  feeAmount?: number;
  reason?: string;
}

export interface AgentCommission {
  id: string;
  betType: string;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}