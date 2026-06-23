import React, { useState, useEffect } from 'react';
import { UserPlus, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function StaffCreationForm({ 
  onError, 
  onSuccess 
}: { 
  onError: (error: string) => void, 
  onSuccess: () => void 
}) {
  const { signup, currentUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'staffuser' as UserRole
  });
  const [loading, setLoading] = useState(false);
  const [canCreateStaff, setCanCreateStaff] = useState(true);

  useEffect(() => {
    // Vérifier si le manager a le droit de créer des staffs
    const checkPermission = async () => {
      if (!currentUser) return;
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // Si canCreateStaff est explicitement false, bloquer la création
          if (userData.canCreateStaff === false) {
            setCanCreateStaff(false);
            onError('Vous n\'avez pas l\'autorisation de créer des staffs. Veuillez contacter un administrateur.');
          }
        }
      } catch (err) {
        console.error('Error checking staff creation permission:', err);
      }
    };
    
    checkPermission();
  }, [currentUser, onError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      onError('');
      setLoading(true);

      if (!canCreateStaff) {
        throw new Error('Vous n\'avez pas l\'autorisation de créer des staffs');
      }

      // Validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      if (!formData.firstName.trim()) {
        throw new Error('Le prénom est obligatoire');
      }

      if (!formData.lastName.trim()) {
        throw new Error('Le nom est obligatoire');
      }

      if (!formData.phoneNumber.trim()) {
        throw new Error('Le numéro de téléphone est obligatoire');
      }

      // Créer l'utilisateur
      await signup(
        formData.email,
        formData.password,
        formData.role,
        formData.firstName,
        formData.lastName,
        formData.phoneNumber
      );

      // Réinitialiser le formulaire
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'staffuser'
      });
      
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <UserPlus className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Créer un staff</h2>
          <p className="text-sm text-gray-600">
            Ajoutez un nouveau membre du staff au système
          </p>
        </div>
      </div>

      {!canCreateStaff && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-600">
            Vous n'avez pas l'autorisation de créer des staffs. Veuillez contacter un administrateur.
          </p>
        </div>
      )}

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
              disabled={!canCreateStaff}
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
              disabled={!canCreateStaff}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="email@exemple.com"
            disabled={!canCreateStaff}
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone <span className="text-red-500">*</span>
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
            disabled={!canCreateStaff}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              minLength={6}
              disabled={!canCreateStaff}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              minLength={6}
              disabled={!canCreateStaff}
            />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Un email de réinitialisation de mot de passe sera envoyé à l'adresse email fournie.
            Le staff devra définir son propre mot de passe lors de sa première connexion.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !canCreateStaff}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Création...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Créer le staff</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}