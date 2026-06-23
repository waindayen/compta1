import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserData, UserRole } from '../types/auth';
import { AgentWalletService } from '../services/agent/wallet';

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<UserData>;
  signup: (email: string, password: string, role: UserRole, firstName?: string, lastName?: string, phoneNumber?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  authError: string | null;
  updateUserPassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            
            // Vérifier le statut de l'utilisateur
            if (data.isBlocked === true || data.status === 'blocked') {
              await signOut(auth);
              setAuthError('Veuillez contacter l\'administrateur');
              setCurrentUser(null);
              setUserData(null);
              return;
            }

            setUserData(data);
            setAuthError(null);
            
            // Create wallet if user is an agent
            if (data.role === 'agentuser') {
              await AgentWalletService.createWalletIfNotExists(user.uid, user.email!);
            }
          } else {
            const defaultUserData: UserData = {
              uid: user.uid,
              email: user.email!,
              role: 'externaluser',
              status: 'active',
              isFirstLogin: true
            };
            await setDoc(doc(db, 'users', user.uid), defaultUserData);
            setUserData(defaultUserData);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setAuthError('Une erreur est survenue lors du chargement de vos données.');
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signup(
    email: string, 
    password: string, 
    role: UserRole = 'externaluser',
    firstName?: string,
    lastName?: string,
    phoneNumber?: string
  ): Promise<void> {
    try {
      setLoading(true);
      
      // Vérifier si l'utilisateur actuel est un admin
      const isAdmin = userData?.role === 'adminuser';

      // Créer le nouvel utilisateur
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Préparer les données utilisateur
      const newUserData: UserData = {
        uid: user.uid,
        email: user.email!,
        role: role,
        firstName,
        lastName,
        phoneNumber,
        status: 'active',
        isFirstLogin: true
      };

      // Sauvegarder les données utilisateur
      await setDoc(doc(db, 'users', user.uid), newUserData);
      
      // Créer le portefeuille si c'est un agent
      if (role === 'agentuser') {
        await AgentWalletService.createWalletIfNotExists(user.uid, email);
      }

      // Envoyer l'email de réinitialisation
      await sendPasswordResetEmail(auth, email);

      // Si c'est un admin qui crée l'utilisateur, ne pas changer l'utilisateur courant
      if (isAdmin) {
        // Déconnecter le nouvel utilisateur
        await signOut(auth);
        
        // Reconnecter l'admin
        if (currentUser) {
          setCurrentUser(currentUser);
          setUserData(userData);
        }
      } else {
        setUserData(newUserData);
      }
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string): Promise<UserData> {
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userData: UserData;
      
      if (!userDoc.exists()) {
        userData = {
          uid: user.uid,
          email: user.email!,
          role: 'externaluser',
          status: 'active',
          isFirstLogin: true
        };
        await setDoc(doc(db, 'users', user.uid), userData);
      } else {
        userData = userDoc.data() as UserData;
        
        // Vérifier le statut de l'utilisateur
        if (userData.isBlocked === true || userData.status === 'blocked') {
          await signOut(auth);
          throw new Error('Veuillez contacter l\'administrateur');
        }
      }
      
      setUserData(userData);
      setAuthError(null);
      return userData;
    } catch (error) {
      if (error instanceof Error) {
        // Traduire les messages d'erreur Firebase en messages plus conviviaux
        if (error.message.includes('auth/invalid-credential') || 
            error.message.includes('auth/user-not-found') || 
            error.message.includes('auth/wrong-password')) {
          setAuthError('Identifiants incorrects. Veuillez vérifier votre email et mot de passe.');
        } else if (error.message.includes('auth/too-many-requests')) {
          setAuthError('Trop de tentatives de connexion. Veuillez réessayer plus tard ou réinitialiser votre mot de passe.');
        } else if (error.message.includes('auth/user-disabled')) {
          setAuthError('Ce compte a été désactivé. Veuillez contacter l\'administrateur.');
        } else if (error.message.includes('auth/network-request-failed')) {
          setAuthError('Problème de connexion réseau. Veuillez vérifier votre connexion internet.');
        } else {
          setAuthError(error.message);
        }
      } else {
        setAuthError('Une erreur est survenue lors de la connexion.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      await signOut(auth);
      setUserData(null);
      setAuthError(null);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserPassword(newPassword: string) {
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    try {
      await updatePassword(currentUser, newPassword);
      
      // Mettre à jour le statut de première connexion
      if (userData?.isFirstLogin) {
        const updatedUserData = {
          ...userData,
          isFirstLogin: false
        };
        await setDoc(doc(db, 'users', currentUser.uid), updatedUserData, { merge: true });
        setUserData(updatedUserData);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error('Erreur lors de la mise à jour du mot de passe');
    }
  }

  const value = {
    currentUser,
    userData,
    login,
    signup,
    logout,
    loading,
    authError,
    updateUserPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}