import { 
  LayoutDashboard, 
  QrCode,
  Wallet,
  Trophy,
  Send,
  Settings,
  Ticket,
  Printer,
  Users,
  Search,
  Percent,
  History,
  UserPlus,
  ClipboardList,
  BarChart,
  DollarSign,
  Clock
} from 'lucide-react';

export const agentMenuItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    path: '/dashboard/agent' 
  },
  { 
    icon: QrCode, 
    label: 'Tickets Lotto',
    path: '/dashboard/agent/lotto-tickets'
  },
  {
    icon: Wallet,
    label: 'Portefeuille',
    submenu: [
      {
        icon: Wallet,
        label: 'Mon Portefeuille',
        path: '/dashboard/agent/wallet'
      },
      {
        icon: Send,
        label: 'Transferts',
        path: '/dashboard/agent/transfers'
      }
    ]
  }
];

export const managerMenuItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/dashboard/manager'
  },
  {
    icon: Users,
    label: 'Utilisateurs',
    submenu: [
      {
        icon: Users,
        label: 'Gestion Utilisateurs',
        path: '/dashboard/manager/users'
      },
      {
        icon: UserPlus,
        label: 'Créer un Agent',
        path: '/dashboard/manager/users/create'
      },
      {
        icon: UserPlus,
        label: 'Créer un Staff',
        path: '/dashboard/manager/create-staff'
      },
      {
        icon: DollarSign,
        label: 'Permissions Paiement',
        path: '/dashboard/manager/staff-payment-permission'
      }
    ]
  },
  {
    icon: Trophy,
    label: 'Lotto',
    submenu: [
      {
        icon: Trophy,
        label: 'Gestion des Lottos',
        path: '/dashboard/manager/lotto-management'
      },
      {
        icon: Clock,
        label: 'Modèles Récurrents',
        path: '/dashboard/manager/lotto-templates'
      },
      {
        icon: Trophy,
        label: 'Gestion des Tirages',
        path: '/dashboard/manager/lotto-draws'
      },
      {
        icon: Trophy,
        label: 'Approbations',
        path: '/dashboard/manager/lotto-approvals'
      },
      {
        icon: ClipboardList,
        label: 'Historique Approbations',
        path: '/dashboard/manager/approval-history'
      },
      {
        icon: Search,
        label: 'Recherche Ticket',
        path: '/dashboard/manager/paid-ticket-search'
      },
      {
        icon: BarChart,
        label: 'Analyse des Tickets',
        path: '/dashboard/manager/ticket-analysis'
      }
    ]
  },
  {
    icon: Wallet,
    label: 'Finances',
    submenu: [
      {
        icon: Wallet,
        label: 'Portefeuilles Agents',
        path: '/dashboard/manager/agent-wallets'
      },
      {
        icon: Wallet,
        label: 'Portefeuilles Staff',
        path: '/dashboard/manager/staff-wallets'
      },
      {
        icon: Percent,
        label: 'Conversions Agent',
        path: '/dashboard/manager/agent-commission-config'
      },
      {
        icon: History,
        label: 'Historique Crédits',
        path: '/dashboard/manager/credit-history'
      },
      {
        icon: Search,
        label: 'Traçabilité Transactions',
        path: '/dashboard/manager/transaction-traceability'
      }
    ]
  },
  {
    icon: Settings,
    label: 'Paramètres',
    path: '/dashboard/manager/settings'
  }
];