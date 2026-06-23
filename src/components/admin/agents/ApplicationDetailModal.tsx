import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, FileText, Clock, MessageSquare, CheckCircle, AlertCircle, CreditCard, Home } from 'lucide-react';
import { AgentApplication, AgentApplicationService, ApplicationStatus, applicationStatuses } from '../../../services/admin/agentApplications';
import { useAuth } from '../../../contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ServiceInfoModal from './ServiceInfoModal';

interface ApplicationDetailModalProps {
  application: AgentApplication;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ApplicationDetailModal({ application, onClose, onUpdate }: ApplicationDetailModalProps) {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [showServiceInfoModal, setShowServiceInfoModal] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>(application.status);
  const [statusReason, setStatusReason] = useState('');

  const statusInfo = AgentApplicationService.getStatusInfo(application.status);
  const possibleStatuses = AgentApplicationService.getNextPossibleStatuses(application.status);

  const handleStatusChange = async () => {
    if (!currentUser || newStatus === application.status) return;

    if (newStatus === 'en-service' && !AgentApplicationService.hasRequiredServiceInfo(application)) {
      setShowServiceInfoModal(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await AgentApplicationService.updateApplicationStatus(
        application.id!,
        newStatus,
        currentUser.uid,
        userData?.name || 'Admin',
        statusReason
      );

      setShowStatusChange(false);
      setStatusReason('');
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceInfoSave = async (serviceInfo: {
    serviceNumber: string;
    personalPhone: string;
    agentId: string;
    tpeNumber: string;
    callBoxNumber: string;
  }) => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      await AgentApplicationService.updateServiceInfo(application.id!, serviceInfo);

      await AgentApplicationService.updateApplicationStatus(
        application.id!,
        'en-service',
        currentUser.uid,
        userData?.name || 'Admin',
        statusReason || 'Mise en service avec informations complètes'
      );

      setShowServiceInfoModal(false);
      setShowStatusChange(false);
      setStatusReason('');
      onUpdate();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {application.firstName} {application.lastName}
            </h2>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mt-2 bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
              {statusInfo.label}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Nom complet</p>
                  <p className="font-medium text-gray-900">{application.firstName} {application.lastName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{application.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-medium text-gray-900">{application.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Date de naissance</p>
                  <p className="font-medium text-gray-900">
                    {application.dateOfBirth && format(application.dateOfBirth, 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Numéro CNI</p>
                  <p className="font-medium text-gray-900">{application.idNumber}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Ville</p>
                  <p className="font-medium text-gray-900">{application.city}</p>
                </div>
              </div>

              <div className="md:col-span-2 flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Adresse</p>
                  <p className="font-medium text-gray-900">{application.address}</p>
                </div>
              </div>
            </div>
          </div>

          {application.experience && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expérience</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{application.experience}</p>
            </div>
          )}

          {application.motivation && (
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Motivation</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{application.motivation}</p>
            </div>
          )}

          {application.notes && (
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Notes
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{application.notes}</p>
            </div>
          )}

          {application.serviceInfo && (
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Informations de service
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Numéro de service</p>
                    <p className="font-medium text-gray-900">{application.serviceInfo.serviceNumber}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Téléphone personnel</p>
                    <p className="font-medium text-gray-900">{application.serviceInfo.personalPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">ID Agent</p>
                    <p className="font-medium text-gray-900">{application.serviceInfo.agentId}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Numéro TPE</p>
                    <p className="font-medium text-gray-900">{application.serviceInfo.tpeNumber}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Numéro Call Box / Cabane</p>
                    <p className="font-medium text-gray-900">{application.serviceInfo.callBoxNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historique des statuts
            </h3>
            <div className="space-y-3">
              {application.statusHistory.map((change, index) => {
                const fromStatus = change.from ? AgentApplicationService.getStatusInfo(change.from) : null;
                const toStatus = AgentApplicationService.getStatusInfo(change.to);

                return (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                    <CheckCircle className={`h-5 w-5 text-${toStatus.color}-600 flex-shrink-0 mt-1`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {fromStatus && (
                          <>
                            <span className={`px-2 py-1 rounded text-xs font-semibold bg-${fromStatus.color}-100 text-${fromStatus.color}-800`}>
                              {fromStatus.label}
                            </span>
                            <span className="text-gray-400">→</span>
                          </>
                        )}
                        <span className={`px-2 py-1 rounded text-xs font-semibold bg-${toStatus.color}-100 text-${toStatus.color}-800`}>
                          {toStatus.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Par {change.changedByName} • {change.date && format(change.date, 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </p>
                      {change.reason && (
                        <p className="text-sm text-gray-700 mt-1 italic">{change.reason}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {possibleStatuses.length > 0 && !showStatusChange && (
            <button
              onClick={() => setShowStatusChange(true)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Changer le statut
            </button>
          )}

          {showStatusChange && (
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Changer le statut</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau statut
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={application.status}>
                    {statusInfo.label} (actuel)
                  </option>
                  {possibleStatuses.map(status => {
                    const info = AgentApplicationService.getStatusInfo(status);
                    return (
                      <option key={status} value={status}>
                        {info.label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du changement (optionnel)
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  placeholder="Expliquez pourquoi vous changez ce statut..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusChange(false);
                    setNewStatus(application.status);
                    setStatusReason('');
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={loading || newStatus === application.status}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Mise à jour...' : 'Confirmer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showServiceInfoModal && (
        <ServiceInfoModal
          application={application}
          onSave={handleServiceInfoSave}
          onCancel={() => setShowServiceInfoModal(false)}
        />
      )}
    </div>
  );
}
