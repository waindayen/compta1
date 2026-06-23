import React from 'react';
import { Ticket, Hash } from 'lucide-react';

interface TicketHeaderProps {
  ticketNumber: string;
  eventName: string;
  onPrint?: () => void;
}

export default function TicketHeader({ ticketNumber, eventName, onPrint }: TicketHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Ticket className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{eventName}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Hash className="w-4 h-4" />
            <span className="font-mono">N° {ticketNumber}</span>
          </div>
        </div>
      </div>
      {onPrint && (
        <button
          onClick={onPrint}
          className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Imprimer
        </button>
      )}
    </div>
  );
}