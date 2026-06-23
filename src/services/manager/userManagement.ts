import { collection, query, where, getDocs, orderBy, limit, startAfter, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserRole } from '../../types/auth';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  createdAt?: string;
  status?: 'active' | 'inactive' | 'blocked';
}

export interface UserSearchFilters {
  searchTerm?: string;
  roleFilter?: 'all' | 'agent' | 'staff';
  statusFilter?: 'all' | 'active' | 'inactive' | 'blocked';
  limit?: number;
  lastDoc?: any;
}

export interface UserSearchResult {
  users: User[];
  hasMore: boolean;
  total: number;
  stats: {
    total: number;
    agents: number;
    staff: number;
    active: number;
    inactive: number;
    blocked: number;
  };
}

export class UserManagementService {
  private static COLLECTION = 'users';
  private static DEFAULT_LIMIT = 10;

  /**
   * Recherche des utilisateurs avec pagination et filtres
   */
  static async searchUsers(filters: UserSearchFilters = {}): Promise<UserSearchResult> {
    try {
      const {
        searchTerm = '',
        roleFilter = 'all',
        statusFilter = 'all',
        limit: limitValue = this.DEFAULT_LIMIT
      } = filters;

      console.log('Searching users with filters:', filters);

      // Utiliser une requête simple sans index composite
      const usersRef = collection(db, this.COLLECTION);
      
      // Requête simple : récupérer tous les agents et staffs (limité côté client)
      let q = query(usersRef, limit(100)); // Limite raisonnable côté serveur
      
      const querySnapshot = await getDocs(q);
      let allUsers: User[] = [];
      
      // Traiter tous les utilisateurs et filtrer côté client
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Filtrer seulement les agents et staffs
        if (!['agentuser', 'staffuser'].includes(data.role)) {
          return;
        }
        
        allUsers.push({
          id: doc.id,
          email: data.email || '',
          role: data.role as UserRole,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNumber: data.phoneNumber || '',
          createdAt: data.createdAt || '',
          status: data.isBlocked ? 'blocked' : data.isActive ? 'active' : 'inactive'
        });
      });

      // Appliquer tous les filtres côté client
      let filteredUsers = [...allUsers];
      
      // Filtre par rôle
      if (roleFilter !== 'all') {
        const targetRole = roleFilter === 'agent' ? 'agentuser' : 'staffuser';
        filteredUsers = filteredUsers.filter(user => user.role === targetRole);
      }
      
      // Filtre par statut
      if (statusFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
      }
      
      // Filtre par terme de recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(searchLower) ||
          (user.firstName?.toLowerCase() || '').includes(searchLower) ||
          (user.lastName?.toLowerCase() || '').includes(searchLower) ||
          (user.phoneNumber || '').includes(searchLower)
        );
      }

      // Trier par email
      filteredUsers.sort((a, b) => a.email.localeCompare(b.email));
      
      // Pagination côté client
      const startIndex = 0; // Pour simplifier, on recharge toujours depuis le début
      const endIndex = Math.min(startIndex + limitValue, filteredUsers.length);
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      const hasMore = endIndex < filteredUsers.length;

      // Calculer les statistiques sur les données filtrées
      const stats = {
        total: filteredUsers.length,
        agents: filteredUsers.filter(u => u.role === 'agentuser').length,
        staff: filteredUsers.filter(u => u.role === 'staffuser').length,
        active: filteredUsers.filter(u => u.status === 'active').length,
        inactive: filteredUsers.filter(u => u.status === 'inactive').length,
        blocked: filteredUsers.filter(u => u.status === 'blocked').length
      };

      return {
        users: paginatedUsers,
        hasMore,
        total: filteredUsers.length,
        stats
      };
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Erreur lors de la recherche des utilisateurs');
    }
  }

  /**
   * Récupère un utilisateur par son ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, this.COLLECTION, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return null;
      }

      const data = userSnap.data();
      return {
        id: userSnap.id,
        email: data.email || '',
        role: data.role as UserRole,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phoneNumber: data.phoneNumber || '',
        createdAt: data.createdAt || '',
        status: data.isBlocked ? 'blocked' : data.isActive ? 'active' : 'inactive'
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Erreur lors de la récupération de l\'utilisateur');
    }
  }

  /**
   * Met à jour les informations d'un utilisateur (nom, prénom, téléphone uniquement)
   */
  static async updateUserInfo(
    userId: string, 
    updates: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
    }
  ): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION, userId);
      
      // Vérifier que l'utilisateur existe
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        throw new Error('Utilisateur non trouvé');
      }

      const userData = userSnap.data();
      
      // Vérifier que c'est un agent ou un staff
      if (!['agentuser', 'staffuser'].includes(userData.role)) {
        throw new Error('Vous ne pouvez modifier que les agents et les staffs');
      }

      // Mettre à jour uniquement les champs autorisés
      await updateDoc(userRef, {
        firstName: updates.firstName.trim(),
        lastName: updates.lastName.trim(),
        phoneNumber: updates.phoneNumber.trim(),
        updatedAt: new Date().toISOString()
      });

      console.log('User updated successfully:', userId);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error instanceof Error ? error : new Error('Erreur lors de la mise à jour de l\'utilisateur');
    }
  }

  /**
   * Met à jour le statut d'un utilisateur
   */
  static async updateUserStatus(
    userId: string, 
    action: 'block' | 'unblock' | 'activate' | 'deactivate'
  ): Promise<void> {
    try {
      const userRef = doc(db, this.COLLECTION, userId);
      const updates: any = {};
      
      switch (action) {
        case 'block':
          updates.isBlocked = true;
          updates.isActive = false;
          updates.status = 'blocked';
          break;
        case 'unblock':
          updates.isBlocked = false;
          updates.status = 'inactive';
          break;
        case 'activate':
          updates.isActive = true;
          updates.isBlocked = false;
          updates.status = 'active';
          break;
        case 'deactivate':
          updates.isActive = false;
          updates.status = 'inactive';
          break;
      }

      updates.updatedAt = new Date().toISOString();
      await updateDoc(userRef, updates);

      console.log('User status updated successfully:', userId, action);
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error instanceof Error ? error : new Error('Erreur lors de la mise à jour du statut');
    }
  }
}