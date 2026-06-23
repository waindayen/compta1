import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import BaseDashboard from '../BaseDashboard';
import { AlertCircle, Search, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import LoadingState from '../../../components/LoadingState';
import ManagerUserEditAccessNav from '../../../components/admin/manager/ManagerUserEditAccessNav';
import ManagerUserEditAccessStats from '../../../components/admin/manager/ManagerUserEditAccessStats';

interface ManagerUser {
  id: string;
  email: string;
  role: string;
  canEditUsers: boolean;
  firstName?: string;
  lastName?: string;
}

export default function ManagerUserEditAccess() {
  const [managers, setManagers] = useState<ManagerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer tous les utilisateurs managers
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'manageruser'));
      const querySnapshot = await getDocs(q);
      
      const users: ManagerUser[] = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          email: userData.email || 'Email non disponible',
          role: userData.role || 'manageruser',
          canEditUsers: userData.canEditUsers !== false, // true par défaut
          firstName: userData.firstName,
          lastName: userData.lastName
        });
      });
      
      setManagers(users);
    } catch (err) {
      console.error('Error loading managers:', err);
      setError('Erreur lors du chargement des utilisateurs managers');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserEditAccess = async (userId: string, canEdit: boolean) => {
    try {
      setUpdatingUser(userId);
      
      // Mettre à jour le document utilisateur
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        canEditUsers: canEdit
      });

      // Mettre à jour l'état local
      setManagers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, canEditUsers: canEdit } 
            : user
        )
      );
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Erreur lors de la mise à jour des permissions');
    } finally {
      setUpdatingUser(null);
    }
  };

  const filteredManagers = managers.filter(manager => 
    manager.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (manager.firstName && manager.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (manager.lastName && manager.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Statistiques
  const enabledCount = managers.filter(m => m.canEditUsers).length;
  const disabledCount = managers.length - enabledCount;

  if (loading) {
    return (
      <BaseDashboard title="Accès à la Modification des Utilisateurs">
        <LoadingState message="Chargement des managers..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Accès à la Modification des Utilisateurs">
      <ManagerUserEditAccessNav />
      
      <ManagerUserEditAccessStats 
        totalManagers={managers.length}
        enabledCount={enabledCount}
        disabledCount={disabledCount}
      />
      
      <div className="space-y-6">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un manager par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Activez ou désactivez la possibilité pour les managers de modifier les informations des utilisateurs (nom, prénom, téléphone).
            Lorsque cette option est désactivée, les boutons "Modifier" n'apparaîtront pas pour le manager et l'accès à la page d'édition sera bloqué.
          </p>
        </div>

        {/* Liste des managers */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Manager</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Modification Utilisateurs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredManagers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      Aucun manager trouvé
                    </td>
                  </tr>
                ) : (
                  filteredManagers.map((manager) => (
                    <tr key={manager.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
                            <span className="text-lg font-medium text-blue-600">
                              {manager.firstName?.[0] || manager.email[0]?.toUpperCase() || 'M'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {manager.firstName && manager.lastName 
                                ? `${manager.firstName} ${manager.lastName}`
                                : 'Manager'}
                            </div>
                            <div className="text-sm text-gray-500">ID: {manager.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {manager.email}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleUserEditAccess(manager.id, !manager.canEditUsers)}
                          disabled={updatingUser === manager.id}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            manager.canEditUsers
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          } ${updatingUser === manager.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {manager.canEditUsers ? (
                            <>
                              <ToggleRight className="w-5 h-5" />
                              <span>Activé</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5" />
                              <span>Désactivé</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BaseDashboard>
  );
}