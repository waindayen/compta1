import React, { useState, useEffect } from 'react';
import { Building2, Save, Percent, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { CompanySettingsService, CompanySettings } from '../../../services/admin/companySettings';

export default function CompanyConfiguration() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<Omit<CompanySettings, 'id' | 'managerId' | 'createdAt' | 'updatedAt'>>({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyLogoUrl: '',
    taxRate: 15.0,
    socialSecurityRate: 5.0,
    insuranceRate: 2.0,
    otherDeductionRate: 0,
    otherDeductionName: ''
  });

  useEffect(() => {
    if (currentUser) {
      loadSettings();
    }
  }, [currentUser]);

  const loadSettings = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const settings = await CompanySettingsService.getSettings(currentUser.uid);

      if (settings) {
        setFormData({
          companyName: settings.companyName,
          companyAddress: settings.companyAddress,
          companyPhone: settings.companyPhone,
          companyEmail: settings.companyEmail,
          companyLogoUrl: settings.companyLogoUrl || '',
          taxRate: settings.taxRate,
          socialSecurityRate: settings.socialSecurityRate,
          insuranceRate: settings.insuranceRate,
          otherDeductionRate: settings.otherDeductionRate || 0,
          otherDeductionName: settings.otherDeductionName || ''
        });
      } else {
        const defaultSettings = CompanySettingsService.getDefaultSettings(currentUser.uid);
        setFormData({
          companyName: defaultSettings.companyName,
          companyAddress: defaultSettings.companyAddress,
          companyPhone: defaultSettings.companyPhone,
          companyEmail: defaultSettings.companyEmail,
          companyLogoUrl: defaultSettings.companyLogoUrl || '',
          taxRate: defaultSettings.taxRate,
          socialSecurityRate: defaultSettings.socialSecurityRate,
          insuranceRate: defaultSettings.insuranceRate,
          otherDeductionRate: defaultSettings.otherDeductionRate || 0,
          otherDeductionName: defaultSettings.otherDeductionName || ''
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return;

    if (formData.taxRate < 0 || formData.taxRate > 100) {
      setError('Le taux d\'imposition doit être entre 0 et 100%');
      return;
    }

    if (formData.socialSecurityRate < 0 || formData.socialSecurityRate > 100) {
      setError('Le taux de sécurité sociale doit être entre 0 et 100%');
      return;
    }

    if (formData.insuranceRate < 0 || formData.insuranceRate > 100) {
      setError('Le taux d\'assurance doit être entre 0 et 100%');
      return;
    }

    if ((formData.otherDeductionRate || 0) < 0 || (formData.otherDeductionRate || 0) > 100) {
      setError('Le taux de déduction supplémentaire doit être entre 0 et 100%');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await CompanySettingsService.createOrUpdateSettings(currentUser.uid, formData);
      setSuccess('Configuration enregistrée avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Configuration de l'Entreprise
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les informations de votre entreprise et les taux de déduction pour les fiches de paie
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              Informations de l'Entreprise
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Votre Entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse *
                </label>
                <input
                  type="text"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 123 Rue Example, Ville"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={formData.companyPhone}
                    onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: +225 XX XX XX XX XX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: contact@entreprise.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL du Logo (optionnel)
                </label>
                <input
                  type="url"
                  value={formData.companyLogoUrl}
                  onChange={(e) => setFormData({ ...formData, companyLogoUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lien vers le logo de votre entreprise pour les fiches de paie
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Percent className="h-6 w-6 text-green-600" />
              Taux de Déduction
            </h2>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  Ces pourcentages seront appliqués automatiquement sur toutes les fiches de paie générées.
                  Les déductions sont calculées sur le salaire brut de l'employé.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Impôts (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Taux d'imposition sur le revenu
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sécurité Sociale (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.socialSecurityRate}
                    onChange={(e) => setFormData({ ...formData, socialSecurityRate: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cotisation de sécurité sociale
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assurance (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.insuranceRate}
                    onChange={(e) => setFormData({ ...formData, insuranceRate: parseFloat(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cotisation d'assurance
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Autre Déduction (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.otherDeductionRate}
                    onChange={(e) => setFormData({ ...formData, otherDeductionRate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Déduction supplémentaire optionnelle
                  </p>
                </div>
              </div>

              {(formData.otherDeductionRate || 0) > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la déduction supplémentaire
                  </label>
                  <input
                    type="text"
                    value={formData.otherDeductionName}
                    onChange={(e) => setFormData({ ...formData, otherDeductionName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Mutuelle, Prévoyance..."
                  />
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Aperçu des déductions</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Pour un salaire brut de 100,000 FCFA :
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Impôts ({formData.taxRate}%) : {(100000 * formData.taxRate / 100).toFixed(0)} FCFA</li>
                  <li>Sécurité sociale ({formData.socialSecurityRate}%) : {(100000 * formData.socialSecurityRate / 100).toFixed(0)} FCFA</li>
                  <li>Assurance ({formData.insuranceRate}%) : {(100000 * formData.insuranceRate / 100).toFixed(0)} FCFA</li>
                  {(formData.otherDeductionRate || 0) > 0 && (
                    <li>{formData.otherDeductionName || 'Autre déduction'} ({formData.otherDeductionRate}%) : {(100000 * (formData.otherDeductionRate || 0) / 100).toFixed(0)} FCFA</li>
                  )}
                  <li className="font-semibold border-t border-gray-300 pt-1 mt-1">
                    Total déductions : {(100000 * (formData.taxRate + formData.socialSecurityRate + formData.insuranceRate + (formData.otherDeductionRate || 0)) / 100).toFixed(0)} FCFA
                  </li>
                  <li className="font-semibold text-green-600">
                    Salaire net : {(100000 - (100000 * (formData.taxRate + formData.socialSecurityRate + formData.insuranceRate + (formData.otherDeductionRate || 0)) / 100)).toFixed(0)} FCFA
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
