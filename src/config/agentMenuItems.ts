import { 
  LayoutDashboard, 
  QrCode,
  Wallet,
  Trophy,
  Send,
  History
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
      },
      {
        icon: History,
        label: 'Historique Transferts',
        path: '/dashboard/agent/transfer-history'
      }
    ]
  }
];