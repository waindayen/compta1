import React, { useState } from 'react';
import BaseDashboard from '../BaseDashboard';
import StaffCreationForm from '../../../components/manager/StaffCreationForm';
import StaffCreationNav from '../../../components/manager/StaffCreationNav';
import { AlertCircle } from 'lucide-react';

export default function CreateStaff() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <BaseDashboard title="Créer un staff">
      <StaffCreationNav />
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">
            Le staff a été créé avec succès. Un email de réinitialisation de mot de passe a été envoyé.
          </p>
        </div>
      )}

      <StaffCreationForm 
        onError={setError}
        onSuccess={() => setSuccess(true)}
      />
    </BaseDashboard>
  );
}