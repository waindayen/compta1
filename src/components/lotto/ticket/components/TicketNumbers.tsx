import React from 'react';

interface TicketNumbersProps {
  numbers: number[];
}

export default function TicketNumbers({ numbers }: TicketNumbersProps) {
  return (
    <div>
      <p className="font-medium mb-2">Numéros joués:</p>
      <div className="flex flex-wrap gap-2">
        {numbers.map((number, index) => (
          <div
            key={index}
            className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
          >
            <span className="font-bold text-blue-700">{number}</span>
          </div>
        ))}
      </div>
    </div>
  );
}