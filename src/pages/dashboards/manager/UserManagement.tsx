import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserManagementService, User, UserSearchFilters } from '../../../services/manager/userManagement';
import BaseDashboard from '../BaseDashboard';
import { Search, Edit, AlertCircle, Lock, Unlock, Power, PowerOff, Filter, Printer, RefreshCw } from 'lucide-react';
import LoadingState from '../../../components/LoadingState';
import UserManagementNav from '../../../components/manager/UserManagementNav';
import PrintUserBadgeModal from '../../../components/user/PrintUserBadgeModal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../contexts/AuthContext';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  blocked: 'bg-red-100 text-red-800'
};

export default function UserManagement() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canEditUsers, setCanEditUsers] = useState(true);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'agent' | 'staff'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  const [hasMore, setHasMore] = useState(false);
  const [userStats, setUserStats] = useState({
    total: 0,
    agents: 0,
    staff: 0,
    active: 0,
    inactive: 0,
    blocked: 0
  });
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Recharger quand les filtres changent
  useEffect(() => {
    loadUsers();
    checkEditPermissions();
  }, [debouncedSearchTerm, roleFilter, statusFilter]);

  const checkEditPermissions = async () => {
    if (!currentUser) {
      setCheckingPermissions(false);
      return;
    }
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        // Si canEditUsers est explicitement false, désactiver la modification
        if (userData.canEditUsers === false) {
          setCanEditUsers(false);
        } else {
          setCanEditUsers(true);
        }
      }
    } catch (err) {
      console.error('Error checking edit permissions:', err);
      // Par défaut, autoriser la modification en cas d'erreur
      setCanEditUsers(true);
    } finally {
      setCheckingPermissions(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: UserSearchFilters = {
        searchTerm: debouncedSearchTerm,
        roleFilter,
        statusFilter,
        limit: 20
      };
      
      const result = await UserManagementService.searchUsers(filters);
      
      setUsers(result.users);
      
      setHasMore(result.hasMore);
      
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  const handleEditUser = (user: User) => {
    if (!canEditUsers) {
      setError('Vous n\'avez pas l\'autorisation de modifier les utilisateurs. Veuillez contacter un administrateur.');
      return;
    }
    navigate(`/dashboard/manager/users/edit/${user.id}`);
  };

  const handleStatusChange = async (userId: string, action: 'block' | 'unblock' | 'activate' | 'deactivate') => {
    try {
      await UserManagementService.updateUserStatus(userId, action);
      
      // Mettre à jour l'utilisateur dans la liste locale
      setUsers(prev => prev.map(user => {
        if (user.id === userId) {
          let newStatus: 'active' | 'inactive' | 'blocked';
          let isBlocked = false;
          let isActive = false;
          
          switch (action) {
            case 'block':
              newStatus = 'blocked';
              isBlocked = true;
              isActive = false;
              break;
            case 'unblock':
              newStatus = 'inactive';
              isBlocked = false;
              isActive = false;
              break;
            case 'activate':
              newStatus = 'active';
              isBlocked = false;
              isActive = true;
              break;
            case 'deactivate':
              newStatus = 'inactive';
              isBlocked = false;
              isActive = false;
              break;
          }
          return { 
            ...user, 
            status: newStatus,
            isBlocked,
            isActive
          };
        }
        return user;
      }));
      
      // Recalculer les statistiques
      const updatedStats = {
        total: users.length,
        agents: users.filter(u => u.role === 'agentuser').length,
        staff: users.filter(u => u.role === 'staffuser').length,
        active: users.filter(u => u.status === 'active').length,
        inactive: users.filter(u => u.status === 'inactive').length,
        blocked: users.filter(u => u.status === 'blocked').length
      };
      setUserStats(updatedStats);
    } catch (err) {
      setError('Erreur lors de la modification du statut');
      console.error('Error updating status:', err);
    }
  };

  const handlePrintBadge = (user: User) => {
    setSelectedUser(user);
    setShowPrintModal(true);
  };

  const handleRefresh = () => {
    loadUsers();
  };

  if (loading) {
    return (
      <BaseDashboard title="Gestion des Utilisateurs">
        <LoadingState message="Chargement des utilisateurs..." />
      </BaseDashboard>
    );
  }

  if (checkingPermissions) {
    return (
      <BaseDashboard title="Gestion des Utilisateurs">
        <LoadingState message="Vérification des permissions..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Gestion des Utilisateurs">
      <UserManagementNav />
      
      <div className="space-y-6">
        {/* En-tête avec statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Total utilisateurs</p>
            <p className="text-2xl font-bold">{userStats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Agents</p>
            <p className="text-2xl font-bold">{userStats.agents}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Staff</p>
            <p className="text-2xl font-bold">{userStats.staff}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Actifs</p>
            <p className="text-2xl font-bold">{userStats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Inactifs</p>
            <p className="text-2xl font-bold">{userStats.inactive}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Bloqués</p>
            <p className="text-2xl font-bold">{userStats.blocked}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="w-full md:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'agent' | 'staff')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">Tous les rôles</option>
                <option value="agent">Agents</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'blocked')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="blocked">Bloqués</option>
            </select>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Actualiser</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!canEditUsers && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-yellow-700">
              Vous n'avez pas l'autorisation de modifier les utilisateurs. 
              Les boutons de modification sont désactivés. Contactez un administrateur pour obtenir cette permission.
            </p>
          </div>
        )}

        {/* Indicateur de recherche */}
        {debouncedSearchTerm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              Résultats pour "{debouncedSearchTerm}" : {users.length} utilisateur(s) trouvé(s)
            </p>
          </div>
        )}
        {/* Liste des utilisateurs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé le</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      {debouncedSearchTerm ? 'Aucun utilisateur trouvé pour cette recherche' : 'Aucun utilisateur trouvé'}
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="font-medium text-gray-600">
                            {user.email[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.firstName || user.lastName || 'Non renseigné'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {user.phoneNumber || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'agentuser' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {user.role === 'agentuser' ? 'Agent' : 'Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[user.status || 'inactive']}`}>
                        {user.status === 'active' ? 'Actif' :
                         user.status === 'blocked' ? 'Bloqué' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {canEditUsers ? (
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier les informations"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="text-gray-400 cursor-not-allowed"
                          title="Modification désactivée"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handlePrintBadge(user)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Imprimer le badge"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                      {user.status === 'blocked' ? (
                        <button
                          onClick={() => handleStatusChange(user.id, 'unblock')}
                          className="text-green-600 hover:text-green-900"
                          title="Débloquer"
                        >
                          <Unlock className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(user.id, 'block')}
                          className="text-red-600 hover:text-red-900"
                          title="Bloquer"
                        >
                          <Lock className="w-5 h-5" />
                        </button>
                      )}
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(user.id, 'deactivate')}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Désactiver"
                        >
                          <PowerOff className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(user.id, 'activate')}
                          className="text-green-600 hover:text-green-900"
                          title="Activer"
                        >
                          <Power className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message si plus de résultats disponibles */}
        {hasMore && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-blue-800">
              Plus de {userStats.total > 20 ? userStats.total - 20 : 0} utilisateurs disponibles. 
              Utilisez les filtres pour affiner votre recherche.
            </p>
          </div>
        )}
      </div>

      {/* Modal d'impression de badge */}
      {selectedUser && showPrintModal && (
        <PrintUserBadgeModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          user={{
            ...selectedUser,
            role: selectedUser.role === 'agentuser' ? 'Agent' : 'Staff'
          }}
        />
      )}
    </BaseDashboard>
  );
}