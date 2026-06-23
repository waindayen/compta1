import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BaseDashboard from '../BaseDashboard';
import { Users, BarChart, Settings, TrendingUp, Wallet, AlertCircle, Search, Box } from 'lucide-react';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import LoadingState from '../../../components/LoadingState';

interface DashboardStats {
  agentsCount: number;
  agentsGrowth: string;
  performanceAvg: number;
  performanceGrowth: string;
  goalsAchieved: number;
  goalsGrowth: string;
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    agentsCount: 0,
    agentsGrowth: '+0%',
    performanceAvg: 0,
    performanceGrowth: '+0%',
    goalsAchieved: 0,
    goalsGrowth: '+0%'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Récupérer le nombre d'agents actifs
      const usersRef = collection(db, 'users');
      const agentsQuery = query(usersRef, where('role', '==', 'agentuser'), where('status', '==', 'active'));
      const agentsSnapshot = await getDocs(agentsQuery);
      const activeAgentsCount = agentsSnapshot.size;
      
      // Récupérer les portefeuilles des agents pour calculer la performance
      const walletsRef = collection(db, 'agent_wallets');
      const walletsSnapshot = await getDocs(walletsRef);
      
      // Calculer la performance moyenne (basée sur le solde des portefeuilles)
      let totalBalance = 0;
      walletsSnapshot.forEach(doc => {
        totalBalance += doc.data().balance || 0;
      });
      
      // Calculer le pourcentage d'objectifs atteints
      // Pour cet exemple, nous considérons qu'un agent a atteint son objectif si son solde est > 1000
      let agentsWithGoalsMet = 0;
      walletsSnapshot.forEach(doc => {
        if ((doc.data().balance || 0) > 1000) {
          agentsWithGoalsMet++;
        }
      });
      
      const totalAgents = walletsSnapshot.size;
      const goalsPercentage = totalAgents > 0 ? Math.round((agentsWithGoalsMet / totalAgents) * 100) : 0;
      
      // Calculer la performance moyenne (pour cet exemple, basée sur une formule arbitraire)
      const performanceAvg = totalAgents > 0 ? Math.min(Math.round((totalBalance / totalAgents) / 100), 100) : 0;
      
      // Mettre à jour les statistiques
      setStats({
        agentsCount: activeAgentsCount,
        agentsGrowth: '+2', // Valeur fixe pour l'exemple
        performanceAvg: performanceAvg,
        performanceGrowth: '+5.2%', // Valeur fixe pour l'exemple
        goalsAchieved: goalsPercentage,
        goalsGrowth: '+3.1%' // Valeur fixe pour l'exemple
      });
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Erreur lors du chargement des données du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Gestion',
      items: [
        {
          label: 'Gestion des Utilisateurs',
          description: 'Gérer les utilisateurs du système',
          path: '/dashboard/manager/users',
          icon: Users,
          color: 'blue'
        },
        {
          label: 'Gestion de Stock',
          description: 'Gérer les produits et fournisseurs',
          path: '/dashboard/manager/inventory',
          icon: Box,
          color: 'orange'
        },
        {
          label: 'Analyse des Tickets',
          description: 'Analyser les tickets gagnants et perdants',
          path: '/dashboard/manager/ticket-analysis',
          icon: Search,
          color: 'green'
        }
      ]
    },
    {
      title: 'Finances',
      items: [
        {
          label: 'Portefeuilles Agents',
          description: 'Gérer les portefeuilles des agents',
          path: '/dashboard/manager/agent-wallets',
          icon: Wallet,
          color: 'yellow'
        }
      ]
    },
    {
      title: 'Configuration',
      items: [
        {
          label: 'Paramètres',
          description: 'Configurer les préférences',
          path: '/dashboard/manager/settings',
          icon: Settings,
          color: 'purple'
        }
      ]
    }
  ];

  if (loading) {
    return (
      <BaseDashboard title="Tableau de bord Manager">
        <LoadingState message="Chargement des données du tableau de bord..." />
      </BaseDashboard>
    );
  }

  if (error) {
    return (
      <BaseDashboard title="Tableau de bord Manager">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-600">{error}</p>
        </div>
        
        {/* Afficher les actions rapides même en cas d'erreur */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {quickActions.map((section, index) => (
            <div key={index} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
              {section.items.map((action, actionIndex) => (
                <Link
                  key={actionIndex}
                  to={action.path}
                  className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-${action.color}-100 rounded-lg`}>
                      <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{action.label}</h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </BaseDashboard>
    );
  }

  return (
    <BaseDashboard title="Tableau de bord Manager">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-green-600">
              {stats.agentsGrowth}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.agentsCount}</p>
          <p className="text-sm text-gray-600">Agents actifs</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">
              {stats.performanceGrowth}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.performanceAvg}%</p>
          <p className="text-sm text-gray-600">Performance moyenne</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-green-600">
              {stats.goalsGrowth}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.goalsAchieved}%</p>
          <p className="text-sm text-gray-600">Objectifs atteints</p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {quickActions.map((section, index) => (
          <div key={index} className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
            {section.items.map((action, actionIndex) => (
              <Link
                key={actionIndex}
                to={action.path}
                className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-${action.color}-100 rounded-lg`}>
                    <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.label}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </BaseDashboard>
  );
}