import { UserData } from '../types/auth';

export function getDisplayName(userData: UserData | null | undefined): string {
  if (!userData) {
    return 'Utilisateur inconnu';
  }

  if (userData.displayName) {
    return userData.displayName;
  }

  if (userData.firstName && userData.lastName) {
    return `${userData.firstName} ${userData.lastName}`;
  }

  if (userData.firstName) {
    return userData.firstName;
  }

  if (userData.lastName) {
    return userData.lastName;
  }

  if (userData.email) {
    return userData.email;
  }

  return 'Utilisateur inconnu';
}
