import React, { useState, useEffect } from 'react';
import BaseDashboard from '../BaseDashboard';
import { BarChart, TrendingUp, Users, Target, Download, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import LoadingState from '../../../components/LoadingState';

interface PerformanceMetric {
  label: string;
  current: number;
  target: number;
  unit: string;
  trend: string;
}

interface AgentPerformance {
  id: string;
  name: string;
  email: string;
  performance: number;
  clients: number;
  revenue: number;
}

export default function PerformanceReports() {
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer les agents
      const usersRef = collection(db, 'users');
      const agentsQuery = query(usersRef, where('role', '==', 'agentuser'));
      const agentsSnapshot = await getDocs(agentsQuery);
      
      // Récupérer les portefeuilles des agents
      const walletsRef = collection(db, 'agent_wallets');
      const walletsSnapshot = await getDocs(walletsRef);
      
      // Récupérer les transactions pour calculer les revenus
      const transactionsRef = collection(db, 'agent_transactions');
      const transactionsSnapshot = await getDocs(transactionsRef);
      
      // Calculer les métriques de performance
      const agentData: AgentPerformance[] = [];
      
      // Mapper les portefeuilles aux agents
      const walletMap = new Map();
      walletsSnapshot.forEach(doc => {
        walletMap.set(doc.data().userId, doc.data());
      });
      
      // Calculer les revenus par agent
      const revenueMap = new Map();
      transactionsSnapshot.forEach(doc => {
        const transaction = doc.data();
        if (transaction.type === 'credit' && transaction.status === 'completed') {
          const walletId = transaction.walletId;
          const amount = transaction.amount || 0;
          revenueMap.set(walletId, (revenueMap.get(walletId) || 0) + amount);
        }
      });
      
      // Créer les données de performance des agents
      agentsSnapshot.forEach(doc => {
        const agent = doc.data();
        const wallet = walletMap.get(doc.id);
        const balance = wallet ? wallet.balance || 0 : 0;
        const revenue = revenueMap.get(doc.id) || 0;
        
        // Calculer la performance (formule arbitraire pour l'exemple)
        const performance = Math.min(Math.round((balance / 1000) * 100), 100);
        
        agentData.push({
          id: doc.id,
          name: `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || `Agent #${doc.id.slice(0, 8)}`,
          email: agent.email || 'Email non disponible',
          performance,
          clients: Math.floor(Math.random() * 200) + 50, // Valeur aléatoire pour l'exemple
          revenue
        });
      });
      
      // Trier par performance décroissante
      agentData.sort((a, b) => b.performance - a.performance);
      
      setAgentPerformance(agentData);
      
      // Calculer les métriques globales
      const totalAgents = agentData.length;
      const avgPerformance = totalAgents > 0 
        ? Math.round(agentData.reduce((sum, agent) => sum + agent.performance, 0) / totalAgents) 
        : 0;
      
      const totalRevenue = agentData.reduce((sum, agent) => sum + agent.revenue, 0);
      const totalClients = agentData.reduce((sum, agent) => sum + agent.clients, 0);
      
      // Définir les métriques de performance
      setPerformanceMetrics([
        { 
          label: 'Taux de conversion',
          current: 8.5,
          target: 10,
          unit: '%',
          trend: '+1.2%'
        },
        { 
          label: 'Performance moyenne',
          current: avgPerformance,
          target: 80,
          unit: '%',
          trend: '+2.5%'
        },
        { 
          label: 'Revenus totaux',
          current: Math.round(totalRevenue / 1000),
          target: 500,
          unit: 'K',
          trend: '+12.8%'
        }
      ]);
      
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Erreur lors du chargement des données de performance');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <BaseDashboard title="Rapports de Performance">
        <LoadingState message="Chargement des données de performance..." />
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Rapports de Performance">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {/* Métriques de performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">{metric.label}</h3>
                <span className={`text-sm font-medium ${
                  metric.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend}
                </span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between items-baseline mb-1">
                  <p className="text-2xl font-bold">{metric.current}{metric.unit}</p>
                  <p className="text-sm text-gray-500">
                    Objectif: {metric.target}{metric.unit}
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(metric.current / metric.target) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Graphiques de performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold">Performance par agent</h2>
              </div>
              <select 
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="quarter">3 derniers mois</option>
              </select>
            </div>
            <div className="space-y-4">
              {agentPerformance.slice(0, 5).map((agent, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{agent.name}</span>
                    <span className="text-sm text-gray-600">{agent.performance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${agent.performance}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold">Évolution du CA</h2>
              </div>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-2">
                <option>Par jour</option>
                <option>Par semaine</option>
                <option>Par mois</option>
              </select>
            </div>
            <div className="h-64 flex items-center justify-center">
              <div className="w-full space-y-4">
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day, index) => {
                  const height = [60, 45, 75, 50, 80][index];
                  return (
                    <div key={index} className="flex items-end gap-1">
                      <div className="w-full">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-500">{day}</span>
                          <span className="text-xs font-medium">{height}K</span>
                        </div>
                        <div className="h-4 bg-blue-100 rounded-sm relative">
                          <div 
                            className="absolute bottom-0 left-0 bg-blue-500 rounded-sm"
                            style={{ width: '100%', height: `${height}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Rapports disponibles */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold mb-6">Rapports disponibles</h2>
          <div className="space-y-4">
            {[
              { name: 'Rapport quotidien', date: new Date().toISOString().split('T')[0], size: '1.2 MB' },
              { name: 'Rapport hebdomadaire', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], size: '3.5 MB' },
              { name: 'Rapport mensuel', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], size: '5.8 MB' }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-gray-500">
                      Généré le {new Date(report.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{report.size}</span>
                  <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Télécharger</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BaseDashboard>
  );
}