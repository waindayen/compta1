import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import BaseDashboard from '../BaseDashboard';
import { AlertCircle, Search, ToggleLeft, ToggleRight, Users, ArrowLeft } from 'lucide-react';
import LoadingState from '../../../components/LoadingState';
import StaffPaymentPermissionNav from '../../../components/manager/StaffPaymentPermissionNav';
import StaffPaymentPermissionStats from '../../../components/manager/StaffPaymentPermissionStats';
import { useAuth } from '../../../contexts/AuthContext';

interface StaffUser {
  id: string;
  email: string;
  role: string;
  canProcessPayment: boolean;
  firstName?: string;
  lastName?: string;
}

export default function StaffPaymentPermission() {
  const { userData } = useAuth();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const isAdmin = userData?.role === 'adminuser';

  useEffect(() => {
    loadStaffUsers();
  }, []);

  const loadStaffUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer tous les utilisateurs staff
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'staffuser'));
      const querySnapshot = await getDocs(q);
      
      const users: StaffUser[] = [];

      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          email: userData.email || 'Email non disponible',
          role: userData.role || 'staffuser',
          canProcessPayment: userData.canProcessPayment !== false, // true par défaut
          firstName: userData.firstName,
          lastName: userData.lastName
        });
      });
      
      setStaffUsers(users);
    } catch (err) {
      console.error('Error loading staff users:', err);
      setError('Erreur lors du chargement des utilisateurs staff');
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentPermission = async (userId: string, canProcessPayment: boolean) => {
    try {
      setUpdatingUser(userId);
      
      // Mettre à jour le document utilisateur
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        canProcessPayment: canProcessPayment
      });

      // Mettre à jour l'état local
      setStaffUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, canProcessPayment: canProcessPayment } 
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

  const filteredStaff = staffUsers.filter(staff => 
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (staff.firstName && staff.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (staff.lastName && staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Statistiques
  const enabledCount = staffUsers.filter(s => s.canProcessPayment).length;
  const disabledCount = staffUsers.length - enabledCount;

  if (loading) {
    return (
      <BaseDashboard title="Permissions de Paiement des Staffs">
        <LoadingState message="Chargement des utilisateurs staff..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Permissions de Paiement des Staffs">
      <StaffPaymentPermissionNav />
      
      <StaffPaymentPermissionStats 
        totalStaff={staffUsers.length}
        enabledCount={enabledCount}
        disabledCount={disabledCount}
      />
      
      <div className="space-y-6">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un staff par nom ou email..."
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
            {isAdmin 
              ? "Activez ou désactivez la possibilité pour les staffs de payer les gains des tickets gagnants. Lorsque cette option est désactivée, le bouton \"Payer\" n'apparaîtra pas pour le staff."
              : "Cette page affiche les staffs qui ont la permission de payer les gains des tickets gagnants. Seuls les administrateurs peuvent modifier ces permissions."}
          </p>
        </div>

        {/* Liste des staffs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Staff</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      Aucun staff trouvé
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
                            <span className="text-lg font-medium text-blue-600">
                              {staff.firstName?.[0] || staff.email[0]?.toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {staff.firstName && staff.lastName 
                                ? `${staff.firstName} ${staff.lastName}`
                                : 'Staff'}
                            </div>
                            <div className="text-sm text-gray-500">ID: {staff.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {staff.email}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isAdmin ? (
                          <button
                            onClick={() => togglePaymentPermission(staff.id, !staff.canProcessPayment)}
                            disabled={updatingUser === staff.id}
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                              staff.canProcessPayment
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            } ${updatingUser === staff.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {staff.canProcessPayment ? (
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
                        ) : (
                          <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
                            staff.canProcessPayment
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {staff.canProcessPayment ? (
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
                          </span>
                        )}
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