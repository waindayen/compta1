import React from 'react';
import { User, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../../../utils/format';

interface TicketInfoProps {
  playerName: string;
  purchaseDate: string;
  ticketPrice: number;
  currency: string;
}

export default function TicketInfo({ 
  playerName, 
  purchaseDate, 
  ticketPrice, 
  currency 
}: TicketInfoProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-600">
        <User className="w-5 h-5" />
        <span>Client: {playerName}</span>
      </div>

      <div className="flex items-center gap-2 text-gray-600">
        <Calendar className="w-5 h-5" />
        <span>Date d'achat: {new Date(purchaseDate).toLocaleString('fr-FR')}</span>
      </div>

      <div className="flex items-center gap-2 text-gray-600">
        <DollarSign className="w-5 h-5" />
        <span>Montant: {formatCurrency(ticketPrice, currency)}</span>
      </div>
    </div>
  );
}