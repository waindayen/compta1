import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Debug() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        setError('Document utilisateur introuvable dans Firestore');
      }
    } catch (err: any) {
      setError(`Erreur: ${err.message}`);
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Page de Diagnostic</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentification Firebase</h2>
          {user ? (
            <div className="space-y-2">
              <p><strong>Connecté:</strong> <span className="text-green-600">Oui</span></p>
              <p><strong>UID:</strong> {user.uid}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Email vérifié:</strong> {user.emailVerified ? 'Oui' : 'Non'}</p>
            </div>
          ) : (
            <p className="text-red-600">Non connecté</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Données Firestore (collection users)</h2>
          {loading ? (
            <p>Chargement...</p>
          ) : error ? (
            <div className="text-red-600">
              <p className="font-semibold">Erreur:</p>
              <p>{error}</p>
            </div>
          ) : userData ? (
            <div className="space-y-2">
              <p><strong>Document existe:</strong> <span className="text-green-600">Oui</span></p>
              <p><strong>Rôle:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{userData.role || 'Non défini'}</span></p>
              <p><strong>Statut:</strong> {userData.status || 'Non défini'}</p>
              <p><strong>Bloqué:</strong> {userData.isBlocked ? 'Oui' : 'Non'}</p>
              <p><strong>Nom complet:</strong> {userData.fullName || 'Non défini'}</p>

              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">Voir toutes les données (JSON)</summary>
                <pre className="mt-2 bg-gray-100 p-4 rounded text-xs overflow-x-auto">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-yellow-600">Aucune donnée trouvée</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold mb-2">Rôles attendus pour accéder aux emprunteurs:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><code className="bg-white px-2 py-1 rounded">adminuser</code></li>
            <li><code className="bg-white px-2 py-1 rounded">manageruser</code></li>
          </ul>

          {userData && userData.role !== 'adminuser' && userData.role !== 'manageruser' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-semibold">Problème détecté!</p>
              <p className="text-red-700 mt-2">
                Votre rôle actuel est <code className="bg-white px-2 py-1 rounded">{userData.role}</code> mais vous avez besoin du rôle <code className="bg-white px-2 py-1 rounded">adminuser</code> ou <code className="bg-white px-2 py-1 rounded">manageruser</code> pour accéder à la gestion des emprunteurs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
