import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  Clock,
  Calculator,
  Receipt,
  Package,
  Calendar,
  FileText,
  Box,
  ArrowUpDown,
  BarChart3,
  HandCoins
} from 'lucide-react';

export function useManagerMenuItems() {
  const { currentUser, userData } = useAuth();
  const [canAccessTicketAnalysis, setCanAccessTicketAnalysis] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentUser || userData?.role !== 'manageruser') {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // Si canAccessTicketAnalysis est explicitement false, désactiver l'accès
          setCanAccessTicketAnalysis(userData.canAccessTicketAnalysis !== false);
        }
      } catch (err) {
        console.error('Error checking ticket analysis permission:', err);
        // Par défaut, autoriser l'accès en cas d'erreur
        setCanAccessTicketAnalysis(true);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [currentUser, userData]);

  const baseMenuItems = [
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
          icon: FileText,
          label: 'Candidatures Agents',
          path: '/dashboard/manager/agent-applications'
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
      icon: Wallet,
      label: 'Finances',
      submenu: [
        {
          icon: Receipt,
          label: 'Comptabilité Quotidienne',
          path: '/dashboard/manager/daily-accounting'
        },
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
      icon: HandCoins,
      label: 'Prêts',
      submenu: [
        {
          icon: Users,
          label: 'Emprunteurs',
          path: '/dashboard/manager/borrowers'
        },
        {
          icon: FileText,
          label: 'Gestion des Prêts',
          path: '/dashboard/manager/loans'
        },
        {
          icon: DollarSign,
          label: 'Remboursements',
          path: '/dashboard/manager/loan-payments'
        }
      ]
    },
    {
      icon: Package,
      label: 'Gestion des Actifs',
      path: '/dashboard/manager/asset-management'
    },
    {
      icon: Box,
      label: 'Gestion de Stock',
      submenu: [
        {
          icon: LayoutDashboard,
          label: 'Tableau de Bord',
          path: '/dashboard/manager/inventory'
        },
        {
          icon: Box,
          label: 'Produits',
          path: '/dashboard/manager/inventory/products'
        },
        {
          icon: Package,
          label: 'Fournisseurs',
          path: '/dashboard/manager/inventory/suppliers'
        },
        {
          icon: ArrowUpDown,
          label: 'Mouvements',
          path: '/dashboard/manager/inventory/movements'
        },
        {
          icon: BarChart3,
          label: 'Rapports',
          path: '/dashboard/manager/inventory/reports'
        }
      ]
    },
    {
      icon: Users,
      label: 'Ressources Humaines',
      submenu: [
        {
          icon: Users,
          label: 'Gestion Employés',
          path: '/dashboard/manager/employee-management'
        },
        {
          icon: Calendar,
          label: 'Planning Shifts',
          path: '/dashboard/manager/shift-planning'
        },
        {
          icon: Clock,
          label: 'Pointage Employés',
          path: '/dashboard/manager/employee-clock-in'
        },
        {
          icon: UserPlus,
          label: 'Suivi Présences',
          path: '/dashboard/manager/attendance-tracking'
        },
        {
          icon: DollarSign,
          label: 'Traitement Paie',
          path: '/dashboard/manager/payroll-processing'
        },
        {
          icon: Receipt,
          label: 'Planification Salariale',
          path: '/dashboard/manager/salary-planning'
        }
      ]
    },
    {
      icon: Settings,
      label: 'Paramètres',
      path: '/dashboard/manager/settings'
    }
  ];

  return { menuItems: baseMenuItems, loading };
}