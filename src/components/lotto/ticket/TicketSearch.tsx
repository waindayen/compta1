import React from 'react';
import { Search } from 'lucide-react';

interface TicketSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TicketSearch({ value, onChange, placeholder = "Rechercher par numéro de ticket..." }: TicketSearchProps) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}