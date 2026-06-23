import React from 'react';
import QRCode from 'react-qr-code';
import type { TicketData } from '../../../../utils/ticketUtils';

interface TicketQRCodeProps {
  data: TicketData;
}

export default function TicketQRCode({ data }: TicketQRCodeProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <QRCode
          value={JSON.stringify(data)}
          size={200}
          level="H"
        />
      </div>
      <p className="mt-2 text-sm text-gray-500 text-center">
        Scanner pour vérifier le ticket
      </p>
    </div>
  );
}