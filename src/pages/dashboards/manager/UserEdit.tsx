import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { UserManagementService, User } from '../../../services/manager/userManagement';
import BaseDashboard from '../BaseDashboard';
import { Save, ArrowLeft, AlertCircle, User as UserIcon } from 'lucide-react';
import LoadingState from '../../../components/LoadingState';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function UserEdit() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [canEditUsers, setCanEditUsers] = useState(true);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });

  useEffect(() => {
    if (userId) {
      loadUser(userId);
    }
    checkEditPermissions();
  }, [userId]);

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
        // Si canEditUsers est explicitement false, bloquer l'accès
        if (userData.canEditUsers === false) {
          setCanEditUsers(false);
          setError('Vous n\'avez pas l\'autorisation de modifier les utilisateurs. Veuillez contacter un administrateur.');
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

  const loadUser = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const userData = await UserManagementService.getUserById(id);
      
      if (!userData) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier que c'est un agent ou un staff
      if (!['agentuser', 'staffuser'].includes(userData.role)) {
        throw new Error('Vous ne pouvez modifier que les agents et les staffs');
      }

      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || ''
      });
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !userId) return;

    if (!canEditUsers) {
      setError('Vous n\'avez pas l\'autorisation de modifier les utilisateurs.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!formData.firstName.trim()) {
        throw new Error('Le prénom est obligatoire');
      }

      if (!formData.lastName.trim()) {
        throw new Error('Le nom est obligatoire');
      }

      if (!formData.phoneNumber.trim()) {
        throw new Error('Le numéro de téléphone est obligatoire');
      }

      // Utiliser le service pour mettre à jour
      await UserManagementService.updateUserInfo(userId, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim()
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard/manager/users');
      }, 2000);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <BaseDashboard title="Modifier l'utilisateur">
        <LoadingState message="Chargement de l'utilisateur..." />
      </BaseDashboard>
    );
  }

  if (checkingPermissions) {
    return (
      <BaseDashboard title="Modifier l'utilisateur">
        <LoadingState message="Vérification des permissions..." />
      </BaseDashboard>
    );
  }

  if (!canEditUsers) {
    return (
      <BaseDashboard title="Modifier l'utilisateur">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-700 mb-2">Accès non autorisé</h2>
          <p className="text-red-600 mb-4">
            Vous n'avez pas l'autorisation de modifier les utilisateurs. 
            Veuillez contacter un administrateur pour obtenir cette permission.
          </p>
          <button
            onClick={() => navigate('/dashboard/manager/users')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à la liste
          </button>
        </div>
      </BaseDashboard>
    );
  }

  if (!user) {
    return (
      <BaseDashboard title="Modifier l'utilisateur">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-700 mb-2">Utilisateur non trouvé</h2>
          <p className="text-red-600 mb-4">
            L'utilisateur demandé n'existe pas ou vous n'avez pas les permissions pour le modifier.
          </p>
          <button
            onClick={() => navigate('/dashboard/manager/users')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à la liste
          </button>
        </div>
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Modifier l'utilisateur">
      <div className="max-w-2xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/manager/users')}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la liste</span>
          </button>
        </div>

        {/* Messages de statut */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700">
              Utilisateur mis à jour avec succès. Redirection en cours...
            </p>
          </div>
        )}

        {/* Informations de l'utilisateur */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Informations de l'utilisateur</h2>
              <p className="text-sm text-gray-600">
                Modifiez les informations personnelles de l'utilisateur
              </p>
            </div>
          </div>

          {/* Informations non modifiables */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Informations système (non modifiables)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Rôle
                </label>
                <input
                  type="text"
                  value={user.role === 'agentuser' ? 'Agent' : user.role === 'staffuser' ? 'Staff' : user.role}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Formulaire de modification */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Prénom"
                  disabled={saving || !canEditUsers}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nom"
                  disabled={saving || !canEditUsers}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de téléphone <span className="text-red-500">*</span>
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+33 6 12 34 56 78"
                disabled={saving || !canEditUsers}
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note :</strong> L'email et le rôle ne peuvent pas être modifiés pour des raisons de sécurité.
                Seules les informations personnelles peuvent être mises à jour.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard/manager/users')}
                disabled={saving}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || !canEditUsers}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sauvegarde...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Sauvegarder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </BaseDashboard>
  );
}