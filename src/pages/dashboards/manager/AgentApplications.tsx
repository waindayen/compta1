import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, FileText, CheckCircle, XCircle, BookOpen, PauseCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { AgentApplication, AgentApplicationService, ApplicationStatus, applicationStatuses } from '../../../services/admin/agentApplications';
import AgentApplicationForm from '../../../components/admin/agents/AgentApplicationForm';
import ApplicationDetailModal from '../../../components/admin/agents/ApplicationDetailModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ManagerAgentApplicationsMobile from './AgentApplicationsMobile';

export default function ManagerAgentApplications() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<AgentApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');

  useEffect(() => {
    loadApplications();
  }, [currentUser]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchQuery, statusFilter]);

  const loadApplications = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      const data = await AgentApplicationService.getAllApplications();
      setApplications(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.firstName.toLowerCase().includes(query) ||
        app.lastName.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.phone.includes(query) ||
        app.city.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  };

  const getStatusCounts = () => {
    const counts = {
      total: applications.length,
      candidat: 0,
      'en-instruction': 0,
      'en-formation': 0,
      'en-service': 0,
      rejete: 0,
      suspendu: 0
    };

    applications.forEach(app => {
      counts[app.status]++;
    });

    return counts;
  };

  const counts = getStatusCounts();

  const getStatusIcon = (status: ApplicationStatus) => {
    const iconMap = {
      candidat: FileText,
      'en-instruction': Search,
      'en-formation': BookOpen,
      'en-service': CheckCircle,
      rejete: XCircle,
      suspendu: PauseCircle
    };
    return iconMap[status] || FileText;
  };

  if (!currentUser) return null;

  return (
    <>
    <div className="hidden lg:block min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Candidatures d'agents</h1>
          <p className="mt-2 text-gray-600">Gérez les candidatures pour devenir agent de point de vente</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          {applicationStatuses.map(status => {
            const Icon = getStatusIcon(status.value as ApplicationStatus);
            const count = counts[status.value as ApplicationStatus];

            return (
              <div
                key={status.value}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${statusFilter === status.value ? `ring-2 ring-${status.color}-500` : ''}`}
                onClick={() => setStatusFilter(statusFilter === status.value ? 'all' : status.value as ApplicationStatus)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{status.label}</p>
                    <p className={`text-2xl font-bold text-${status.color}-600`}>{count}</p>
                  </div>
                  <Icon className={`h-6 w-6 text-${status.color}-400`} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, email, téléphone ou ville..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              {applicationStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="h-5 w-5" />
              Nouvelle candidature
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidat</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        Chargement...
                      </div>
                    </td>
                  </tr>
                ) : filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Aucune candidature trouvée
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map(application => {
                    const statusInfo = AgentApplicationService.getStatusInfo(application.status);

                    return (
                      <tr
                        key={application.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedApplication(application)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">
                                {application.firstName[0]}{application.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {application.firstName} {application.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{application.idNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{application.email}</p>
                          <p className="text-sm text-gray-500">{application.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{application.city}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {application.createdAt && format(application.createdAt, 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApplication(application);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Voir détails
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <AgentApplicationForm
          onSuccess={() => {
            setShowForm(false);
            loadApplications();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdate={() => {
            setSelectedApplication(null);
            loadApplications();
          }}
        />
      )}
    </div>
    <ManagerAgentApplicationsMobile />
    </>
  );
}
