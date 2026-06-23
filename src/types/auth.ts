export type UserRole = 
  | 'externaluser'
  | 'agentuser'
  | 'staffuser'
  | 'manageruser'
  | 'directoruser'
  | 'apiuser'
  | 'adminuser'
  | 'ucieruser';

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  displayName?: string;
  status?: 'active' | 'inactive' | 'blocked';
  isBlocked?: boolean;
  isActive?: boolean;
  isFirstLogin?: boolean;
  updatedAt?: string;
}