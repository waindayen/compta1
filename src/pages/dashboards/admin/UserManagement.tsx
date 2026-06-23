import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import BaseDashboard from '../BaseDashboard';
import { Search, UserPlus, Edit, AlertCircle, X, Save, Lock, Unlock, Power, PowerOff, CheckCircle, Printer } from 'lucide-react';
import { UserRole } from '../../../types/auth';
import PrintUserBadgeModal from '../../../components/user/PrintUserBadgeModal';

interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  createdAt?: string;
  lastLogin?: string;
  isBlocked?: boolean;
  isActive?: boolean;
  status?: 'active' | 'inactive' | 'blocked';
}

interface NewUser {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'externaluser', label: 'Utilisateur' },
  { value: 'agentuser', label: 'Agent' },
  { value: 'staffuser', label: 'Staff' },
  { value: 'manageruser', label: 'Manager' },
  { value: 'directoruser', label: 'Directeur' },
  { value: 'apiuser', label: 'API' },
  { value: 'adminuser', label: 'Administrateur' },
  { value: 'ucieruser', label: 'UCIER' }
];

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  blocked: 'bg-red-100 text-red-800'
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    password: '',
    role: 'externaluser',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().isBlocked ? 'blocked' : doc.data().isActive ? 'active' : 'inactive'
      })) as User[];
      
      setUsers(usersData);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      await fetchUsers();
    } catch (err) {
      setError('Erreur lors de la modification du rôle');
      console.error('Error updating role:', err);
    }
  };

  const handleStatusChange = async (userId: string, action: 'block' | 'unblock' | 'activate' | 'deactivate') => {
    try {
      const userRef = doc(db, 'users', userId);
      const updates: any = {};
      
      switch (action) {
        case 'block':
          updates.isBlocked = true;
          updates.isActive = false;
          updates.status = 'blocked';
          updates.status = 'blocked';
          break;
        case 'unblock':
          updates.isBlocked = false;
          updates.status = 'inactive';
          updates.status = 'inactive';
          break;
        case 'activate':
          updates.isActive = true;
          updates.isBlocked = false;
          updates.status = 'active';
          updates.status = 'active';
          break;
        case 'deactivate':
          updates.isActive = false;
          updates.status = 'inactive';
          updates.status = 'inactive';
          break;
      }

      updates.updatedAt = new Date().toISOString();
      await updateDoc(userRef, updates);
      await fetchUsers();
    } catch (err) {
      setError('Erreur lors de la modification du statut');
      console.error('Error updating status:', err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Vérifier si les champs obligatoires sont remplis
      if (!newUser.firstName.trim()) {
        throw new Error('Le prénom est obligatoire');
      }
      
      if (!newUser.lastName.trim()) {
        throw new Error('Le nom est obligatoire');
      }
      
      if (!newUser.phoneNumber.trim()) {
        throw new Error('Le numéro de téléphone est obligatoire');
      }

      // Vérifier si l'email existe déjà
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      const existingUser = querySnapshot.docs.find(doc => doc.data().email === newUser.email);

      if (existingUser) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phoneNumber: newUser.phoneNumber,
        createdAt: new Date().toISOString(),
        isActive: true,
        isBlocked: false,
        status: 'active',
        isFirstLogin: true
      });

      // Envoyer l'email de réinitialisation
      await sendPasswordResetEmail(auth, newUser.email);

      setCreatedUserId(userCredential.user.uid);
      await fetchUsers();
      setShowSuccessModal(true);
      setNewUser({
        email: '',
        password: '',
        role: 'externaluser',
        firstName: '',
        lastName: '',
        phoneNumber: ''
      });
    } catch (err) {
      console.error('Error adding user:', err);
      if (err instanceof Error) {
        if (err.message.includes('email-already-in-use')) {
          setError('Un utilisateur avec cet email existe déjà');
        } else {
          setError(err.message);
        }
      } else {
        setError('Erreur lors de la création de l\'utilisateur');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintBadge = (user: User) => {
    setSelectedUser(user);
    setShowPrintModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.phoneNumber || '').includes(searchTerm);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <BaseDashboard title="Gestion des Utilisateurs">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Gestion des Utilisateurs">
      <div className="space-y-6">
        {/* En-tête avec statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Total utilisateurs</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          {Object.entries(
            users.reduce((acc, user) => {
              acc[user.status || 'inactive'] = (acc[user.status || 'inactive'] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([status, count]) => (
            <div key={status} className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">
                {status === 'active' ? 'Actifs' :
                 status === 'inactive' ? 'Inactifs' : 'Bloqués'}
              </p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          ))}
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
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les rôles</option>
              {ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
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
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Ajouter un utilisateur
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
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
                {filteredUsers.map((user) => (
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
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.phoneNumber || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {editingUser?.id === user.id ? (
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                          className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {ROLES.map(role => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {ROLES.find(r => r.value === user.role)?.label || user.role}
                        </span>
                      )}
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
                      {editingUser?.id === user.id ? (
                        <>
                          <button
                            onClick={() => {
                              handleRoleChange(user.id, editingUser.role);
                              setEditingUser(null);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Sauvegarder
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier le rôle"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
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
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal d'ajout d'utilisateur */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Ajouter un utilisateur</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nom"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Création...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Créer l'utilisateur</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de succès */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Utilisateur créé avec succès
              </h3>
              <p className="text-gray-600 mb-6">
                Un email de réinitialisation de mot de passe a été envoyé à l'utilisateur.
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setShowAddModal(false);
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'impression de badge */}
      {selectedUser && showPrintModal && (
        <PrintUserBadgeModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          user={{
            ...selectedUser,
            role: ROLES.find(r => r.value === selectedUser.role)?.label || selectedUser.role
          }}
        />
      )}
    </BaseDashboard>
  );
}