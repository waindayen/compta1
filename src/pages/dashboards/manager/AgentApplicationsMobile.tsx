import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, FileText, CheckCircle, XCircle, BookOpen, PauseCircle, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { AgentApplication, AgentApplicationService, ApplicationStatus, applicationStatuses } from '../../../services/admin/agentApplications';
import AgentApplicationForm from '../../../components/admin/agents/AgentApplicationForm';
import ApplicationDetailModal from '../../../components/admin/agents/ApplicationDetailModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ManagerAgentApplicationsMobile() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<AgentApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<AgentApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

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
    <div className="min-h-screen bg-gray-50 lg:hidden">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Candidatures d'agents</h1>
          <p className="mt-1 text-sm text-gray-600">Gérez les candidatures pour devenir agent</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Stats - Horizontal scroll */}
        <div className="mb-5 -mx-4 px-4 overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            <div className="bg-white rounded-xl shadow-sm p-3 min-w-[110px] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold text-gray-900">{counts.total}</p>
                </div>
              </div>
            </div>

            {applicationStatuses.map(status => {
              const Icon = getStatusIcon(status.value as ApplicationStatus);
              const count = counts[status.value as ApplicationStatus];
              const isActive = statusFilter === status.value;

              return (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(isActive ? 'all' : status.value as ApplicationStatus)}
                  className={`bg-white rounded-xl shadow-sm p-3 min-w-[110px] flex-shrink-0 text-left transition-all ${isActive ? `ring-2 ring-${status.color}-500` : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-9 w-9 rounded-lg bg-${status.color}-100 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 text-${status.color}-500`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{status.label}</p>
                      <p className={`text-xl font-bold text-${status.color}-600`}>{count}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Actions */}
        <div className="mb-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(true)}
            className="px-3 py-2.5 bg-white border border-gray-300 rounded-xl flex items-center gap-1.5 text-sm text-gray-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden xs:inline">Filtres</span>
            {statusFilter !== 'all' && (
              <span className="h-2 w-2 rounded-full bg-blue-500" />
            )}
          </button>
        </div>

        {/* Active filter badge */}
        {statusFilter !== 'all' && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Filtre actif:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
            >
              {applicationStatuses.find(s => s.value === statusFilter)?.label}
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* New application button */}
        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-4 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Nouvelle candidature
        </button>

        {/* Applications list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Aucune candidature trouvée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map(application => {
              const statusInfo = AgentApplicationService.getStatusInfo(application.status);
              const StatusIcon = getStatusIcon(application.status);

              return (
                <button
                  key={application.id}
                  onClick={() => setSelectedApplication(application)}
                  className="w-full bg-white rounded-xl shadow-sm p-4 text-left active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="h-11 w-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">
                        {application.firstName[0]}{application.lastName[0]}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {application.firstName} {application.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{application.idNumber}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0" />
                      </div>

                      {/* Contact info */}
                      <div className="mt-2 space-y-0.5">
                        <p className="text-xs text-gray-600 truncate">{application.email}</p>
                        <p className="text-xs text-gray-600 truncate">{application.phone}</p>
                      </div>

                      {/* Footer */}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>{application.city}</span>
                          <span>·</span>
                          <span>
                            {application.createdAt && format(application.createdAt, 'dd MMM', { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter bottom sheet */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Filtrer par statut</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setShowFilters(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  statusFilter === 'all'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-500" />
                  </div>
                  <span className="font-medium text-gray-900">Tous les statuts</span>
                </div>
                <span className="text-sm font-semibold text-gray-500">{counts.total}</span>
              </button>

              {applicationStatuses.map(status => {
                const Icon = getStatusIcon(status.value as ApplicationStatus);
                const count = counts[status.value as ApplicationStatus];
                const isActive = statusFilter === status.value;

                return (
                  <button
                    key={status.value}
                    onClick={() => {
                      setStatusFilter(status.value as ApplicationStatus);
                      setShowFilters(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isActive ? `border-${status.color}-500 bg-${status.color}-50` : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg bg-${status.color}-100 flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 text-${status.color}-500`} />
                      </div>
                      <span className="font-medium text-gray-900">{status.label}</span>
                    </div>
                    <span className={`text-sm font-semibold text-${status.color}-600`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <AgentApplicationForm
          onSuccess={() => {
            setShowForm(false);
            loadApplications();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Detail modal */}
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
  );
}
