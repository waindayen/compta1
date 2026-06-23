import {
  LayoutDashboard,
  Users,
  Settings,
  Trophy,
  Calendar,
  DollarSign,
  Wallet,
  History,
  UserCog,
  ToggleRight,
  Percent,
  ClipboardList,
  Ban,
  Calculator,
  CreditCard,
  Clock,
  Edit,
  Dice6,
  FileText,
  Package,
  FolderTree,
  Building2,
  HandCoins
} from 'lucide-react';

export const adminMenuItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    path: '/dashboard/admin' 
  },
  { 
    icon: Trophy, 
    label: 'Paris',
    submenu: [
      { 
        icon: Trophy, 
        label: 'Liste des lottos', 
        path: '/dashboard/admin/lottos' 
      },
      { 
        icon: Clock, 
        label: 'Modèles récurrents', 
        path: '/dashboard/admin/lotto-templates' 
      },
      { 
        icon: Calendar, 
        label: 'Créer un lotto', 
        path: '/dashboard/admin/setup-lotto' 
      },
      { 
        icon: Trophy, 
        label: 'Tirages', 
        path: '/dashboard/admin/lotto-draws' 
      },
      { 
        icon: Calculator, 
        label: 'Config Optimisateur', 
        path: '/dashboard/admin/draw-optimizer-config' 
      },
      { 
        icon: ClipboardList, 
        label: 'Historique Approbations', 
        path: '/dashboard/admin/approval-history' 
      },
      { 
        icon: Ban, 
        label: 'Frais d\'annulation', 
        path: '/dashboard/admin/cancellation-fee' 
      }
    ]
  },
  { 
    icon: DollarSign, 
    label: 'Finances',
    submenu: [
      { 
        icon: Wallet, 
        label: 'Portefeuilles Agents', 
        path: '/dashboard/admin/agent-wallets' 
      },
      { 
        icon: Wallet, 
        label: 'Portefeuilles Staff', 
        path: '/dashboard/admin/staff-wallets' 
      },
      { 
        icon: History, 
        label: 'Historique Crédits', 
        path: '/dashboard/admin/wallet-history' 
      },
      { 
        icon: CreditCard, 
        label: 'Limites de paiement', 
        path: '/dashboard/admin/payment-limits' 
      },
      { 
        icon: Percent, 
        label: 'Commissions', 
        path: '/dashboard/admin/commission-config'
      },
      { 
        icon: Trophy, 
        label: 'Conversions Agent', 
        path: '/dashboard/admin/agent-commission-config' 
      },
      { 
        icon: Trophy, 
        label: 'Conversions Staff', 
        path: '/dashboard/admin/staff-commission-config' 
      },
      { 
        icon: History, 
        label: 'Traçabilité Transactions', 
        path: '/dashboard/admin/transaction-traceability' 
      }
    ]
  },
  {
    icon: UserCog,
    label: 'Utilisateurs',
    submenu: [
      {
        icon: Users,
        label: 'Gestion Utilisateurs',
        path: '/dashboard/admin/users'
      },
      {
        icon: FileText,
        label: 'Candidatures Agents',
        path: '/dashboard/admin/agent-applications'
      },
      {
        icon: ToggleRight,
        label: 'Accès Tirages',
        path: '/dashboard/admin/manager-draw-access'
      },
      {
        icon: ToggleRight,
        label: 'Accès Approbations',
        path: '/dashboard/admin/manager-approval-access'
      },
      {
        icon: ToggleRight,
        label: 'Création Staff',
        path: '/dashboard/admin/manager-staff-creation-access'
      },
      {
        icon: DollarSign,
        label: 'Paiement Staff',
        path: '/dashboard/admin/staff-payment-permission'
      },
      {
        icon: ToggleRight,
        label: 'Accès Analyse Tickets',
        path: '/dashboard/admin/manager-ticket-analysis-access'
      },
      {
        icon: Edit,
        label: 'Modification Utilisateurs',
        path: '/dashboard/admin/manager-user-edit-access'
      },
      {
        icon: Dice6,
        label: 'Permissions Tirage',
        path: '/dashboard/admin/manager-gain-config-access'
      }
    ]
  },
  {
    icon: Package,
    label: 'Inventaire',
    submenu: [
      {
        icon: FolderTree,
        label: 'Catégories de Produits',
        path: '/dashboard/admin/product-categories'
      }
    ]
  },
  {
    icon: HandCoins,
    label: 'Prêts',
    submenu: [
      {
        icon: Users,
        label: 'Emprunteurs',
        path: '/dashboard/admin/borrowers'
      },
      {
        icon: FileText,
        label: 'Gestion des Prêts',
        path: '/dashboard/admin/loans'
      },
      {
        icon: DollarSign,
        label: 'Remboursements',
        path: '/dashboard/admin/loan-payments'
      }
    ]
  },
  {
    icon: Settings,
    label: 'Configuration',
    submenu: [
      {
        icon: Building2,
        label: 'Entreprise & Paie',
        path: '/dashboard/admin/company-configuration'
      }
    ]
  }
];