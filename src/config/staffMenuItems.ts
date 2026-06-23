import { 
  LayoutDashboard,
  Trophy,
  QrCode,
  Wallet,
  Send,
  Users,
  Search
} from 'lucide-react';

export const staffMenuItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Tableau de bord',
    path: '/dashboard/staff'
  },
  {
    icon: Wallet,
    label: 'Mon Portefeuille',
    path: '/dashboard/staff/wallet'
  },
  {
    icon: Send,
    label: 'Transferts',
    path: '/dashboard/staff/transfers'
  },
  { 
    icon: Trophy, 
    label: 'Lotto',
    submenu: [
      { 
        icon: QrCode, 
        label: 'Tickets Lotto', 
        path: '/dashboard/staff/lotto-tickets'
      },
      { 
        icon: Search, 
        label: 'Recherche Tickets Payés', 
        path: '/dashboard/staff/paid-ticket-search'
      }
    ]
  },
  {
    icon: Wallet,
    label: 'Portefeuilles',
    submenu: [
      {
        icon: Users,
        label: 'Portefeuilles Agents',
        path: '/dashboard/staff/agent-wallets'
      },
      {
        icon: Search,
        label: 'Traçabilité Transactions',
        path: '/dashboard/staff/transaction-traceability'
      }
    ]
  }
];