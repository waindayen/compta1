import React, { useState, useEffect } from 'react';
import { Trash2, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { LoanPayment } from '../../services/loans/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface PaymentListProps {
  payments: LoanPayment[];
  onDelete?: (payment: LoanPayment) => void;
}

function useUserNames(userIds: string[]) {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const unique = [...new Set(userIds)].filter(id => id && !names[id]);
    if (unique.length === 0) return;

    Promise.all(
      unique.map(async (uid) => {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) {
            const data = snap.data();
            const name = data.displayName ||
              (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null) ||
              data.firstName || data.lastName || data.email || uid;
            return [uid, name] as [string, string];
          }
        } catch {}
        return [uid, uid] as [string, string];
      })
    ).then(results => {
      setNames(prev => {
        const next = { ...prev };
        results.forEach(([id, name]) => { next[id] = name; });
        return next;
      });
    });
  }, [userIds.join(',')]);

  return names;
}

export default function PaymentList({ payments, onDelete }: PaymentListProps) {
  const userIds = payments.map(p => p.receivedBy).filter(Boolean);
  const userNames = useUserNames(userIds);

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Espèces';
      case 'bank_transfer': return 'Virement';
      case 'mobile_money': return 'Mobile Money';
      case 'check': return 'Chèque';
      case 'other': return 'Autre';
      default: return method;
    }
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Aucun paiement enregistré</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capital</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intérêts</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reçu par</th>
            {onDelete && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {format(new Date(payment.paymentDate), 'dd MMM yyyy', { locale: fr })}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {payment.amount.toFixed(2)} €
                </div>
                {payment.lateFee != null && payment.lateFee > 0 && (
                  <div className="text-xs text-red-600">
                    + {payment.lateFee.toFixed(2)} € (retard)
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {payment.principal.toFixed(2)} €
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {payment.interest.toFixed(2)} €
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2 text-sm text-gray-900">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  {getPaymentMethodLabel(payment.paymentMethod)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <div className="font-medium">
                  {userNames[payment.receivedBy] || payment.receivedBy}
                </div>
                {payment.receiptNumber != null && payment.receiptNumber !== '' && payment.receiptNumber !== 0 && (
                  <div className="text-xs text-gray-400">Reçu: {payment.receiptNumber}</div>
                )}
              </td>
              {onDelete && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onDelete(payment)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
          <tr>
            <td className="px-6 py-4 text-sm font-bold text-gray-900">Total</td>
            <td className="px-6 py-4 text-sm font-bold text-gray-900">
              {payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)} €
            </td>
            <td className="px-6 py-4 text-sm font-bold text-gray-900">
              {payments.reduce((sum, p) => sum + p.principal, 0).toFixed(2)} €
            </td>
            <td className="px-6 py-4 text-sm font-bold text-gray-900">
              {payments.reduce((sum, p) => sum + p.interest, 0).toFixed(2)} €
            </td>
            <td colSpan={onDelete ? 3 : 2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
