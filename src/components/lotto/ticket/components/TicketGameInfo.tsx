import React from 'react';
import { Grid, Calendar } from 'lucide-react';

interface TicketGameInfoProps {
  numbersToSelect: number;
  endDate: string;
}

export default function TicketGameInfo({ numbersToSelect, endDate }: TicketGameInfoProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 text-gray-600">
        <Grid className="w-5 h-5" />
        <span>Numéros à sélectionner: {numbersToSelect}</span>
      </div>
      <div className="flex items-center gap-2 text-gray-600">
        <Calendar className="w-5 h-5" />
        <span>Date du tirage: {new Date(endDate).toLocaleString('fr-FR')}</span>
      </div>
    </div>
  );
}