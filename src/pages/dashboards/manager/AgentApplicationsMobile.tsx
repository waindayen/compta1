import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Users, FileText, CheckCircle, XCircle,
  BookOpen, PauseCircle, ChevronRight, X, Phone, Mail, MapPin, Calendar
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  AgentApplication,
  AgentApplicationService,
  ApplicationStatus,
  applicationStatuses
} from '../../../services/admin/agentApplications';
import AgentApplicationForm from '../../../components/admin/agents/AgentApplicationForm';
import ApplicationDetailModal from '../../../components/admin/agents/ApplicationDetailModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType; pill: string; dot: string }> = {
  candidat:        { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: FileText,     pill: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  'en-instruction':{ bg: 'bg-amber-50',  text: 'text-amber-700',  icon: Search,       pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  'en-formation':  { bg: 'bg-purple-50', text: 'text-purple-700', icon: BookOpen,     pill: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  'en-service':    { bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle,  pill: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  rejete:          { bg: 'bg-red-50',    text: 'text-red-700',    icon: XCircle,      pill: 'bg-red-100 text-red-700',     dot: 'bg-red-500' },
  suspendu:        { bg: 'bg-gray-50',   text: 'text-gray-600',   icon: PauseCircle,  pill: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
};

const STAT_CARDS = [
  { key: 'total',           label: 'Total',           icon: Users,        bg: 'bg-slate-100',  text: 'text-slate-600',  num: 'text-slate-800' },
  { key: 'candidat',        label: 'Candidats',       icon: FileText,     bg: 'bg-blue-100',   text: 'text-blue-600',   num: 'text-blue-700' },
  { key: 'en-instruction',  label: 'En instruction',  icon: Search,       bg: 'bg-amber-100',  text: 'text-amber-600',  num: 'text-amber-700' },
  { key: 'en-formation',    label: 'En formation',    icon: BookOpen,     bg: 'bg-purple-100', text: 'text-purple-600', num: 'text-purple-700' },
  { key: 'en-service',      label: 'En service',      icon: CheckCircle,  bg: 'bg-green-100',  text: 'text-green-600',  num: 'text-green-700' },
  { key: 'rejete',          label: 'Rejetés',         icon: XCircle,      bg: 'bg-red-100',    text: 'text-red-600',    num: 'text-red-700' },
  { key: 'suspendu',        label: 'Suspendus',       icon: PauseCircle,  bg: 'bg-gray-100',   text: 'text-gray-500',   num: 'text-gray-700' },
];

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
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  useEffect(() => { loadApplications(); }, [currentUser]);

  useEffect(() => {
    let filtered = [...applications];
    if (statusFilter !== 'all') filtered = filtered.filter(a => a.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.firstName.toLowerCase().includes(q) ||
        a.lastName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.includes(q) ||
        a.city.toLowerCase().includes(q)
      );
    }
    setFilteredApplications(filtered);
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

  const counts: Record<string, number> = {
    total: applications.length,
    candidat: 0, 'en-instruction': 0, 'en-formation': 0,
    'en-service': 0, rejete: 0, suspendu: 0,
  };
  applications.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });

  const activeFilterLabel = applicationStatuses.find(s => s.value === statusFilter)?.label;

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100 lg:hidden pb-24">

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 pt-5 pb-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Candidatures d'agents</h1>
            <p className="text-xs text-gray-500 mt-0.5">{counts.total} candidature{counts.total > 1 ? 's' : ''} au total</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md active:bg-blue-700 flex-shrink-0"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Nom, email, téléphone, ville…"
            className="w-full pl-9 pr-9 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Stats grid 2 cols */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {STAT_CARDS.map(card => {
            const Icon = card.icon;
            const isActive = statusFilter === card.key;
            const isTotal = card.key === 'total';

            return (
              <button
                key={card.key}
                onClick={() => !isTotal && setStatusFilter(isActive ? 'all' : card.key as ApplicationStatus)}
                className={`bg-white rounded-2xl p-3.5 text-left transition-all ${
                  isActive ? 'ring-2 ring-blue-500 shadow-md' : 'shadow-sm'
                } ${isTotal ? 'col-span-2' : ''} active:scale-95`}
              >
                <div className={`flex items-center gap-3 ${isTotal ? '' : 'flex-col items-start'}`}>
                  <div className={`h-9 w-9 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4.5 w-4.5 ${card.text}`} style={{ height: '18px', width: '18px' }} />
                  </div>
                  <div className={isTotal ? 'flex-1' : ''}>
                    <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                    <p className={`text-2xl font-bold leading-tight ${card.num}`}>{counts[card.key] ?? 0}</p>
                  </div>
                  {isTotal && (
                    <div className="text-xs text-gray-400 self-center">
                      {filteredApplications.length !== counts.total && (
                        <span className="text-blue-600 font-medium">{filteredApplications.length} affichés</span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active filter badge */}
        {statusFilter !== 'all' && (
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Filtre :</span>
            <button
              onClick={() => setStatusFilter('all')}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium"
            >
              {activeFilterLabel}
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-700">Aucune candidature</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery || statusFilter !== 'all' ? 'Essayez de modifier vos filtres.' : 'Créez la première candidature.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              {filteredApplications.length} résultat{filteredApplications.length > 1 ? 's' : ''}
            </p>
            {filteredApplications.map(app => {
              const style = STATUS_STYLES[app.status] || STATUS_STYLES.candidat;
              const StatusIcon = style.icon;

              return (
                <button
                  key={app.id}
                  onClick={() => setSelectedApplication(app)}
                  className="w-full bg-white rounded-2xl shadow-sm overflow-hidden text-left active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-stretch">
                    {/* Color stripe */}
                    <div className={`w-1 flex-shrink-0 ${style.dot}`} />

                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div className="h-11 w-11 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                            {app.firstName[0]}{app.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 leading-tight truncate">
                              {app.firstName} {app.lastName}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{app.idNumber}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                      </div>

                      {/* Contact row */}
                      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate">{app.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate">{app.city}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                          <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate">{app.email}</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.pill}`}>
                          <StatusIcon className="h-3 w-3" />
                          {AgentApplicationService.getStatusInfo(app.status).label}
                        </span>
                        {app.createdAt && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="h-3 w-3" />
                            {format(app.createdAt, 'dd MMM yyyy', { locale: fr })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating new candidature button */}
      <div className="fixed bottom-6 left-0 right-0 px-4 z-20">
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 active:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Nouvelle candidature
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <AgentApplicationForm
          onSuccess={() => { setShowForm(false); loadApplications(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Detail modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onUpdate={() => { setSelectedApplication(null); loadApplications(); }}
        />
      )}
    </div>
  );
}
