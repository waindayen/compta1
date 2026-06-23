import React from 'react';
import TicketHeader from './components/TicketHeader';
import TicketInfo from './components/TicketInfo';
import TicketNumbers from './components/TicketNumbers';
import TicketGameInfo from './components/TicketGameInfo';
import TicketQRCode from './components/TicketQRCode';
import type { TicketData } from '../../../utils/ticketUtils';

interface LottoTicketProps {
  ticketNumber: string;
  playerName: string;
  selectedNumbers: number[];
  ticketPrice: number;
  currency: string;
  purchaseDate: string;
  gameParameters: {
    eventName: string;
    numbersToSelect: number;
    endDate: string;
  };
  onPrintTicket?: () => void;
}

export default function LottoTicket({
  ticketNumber,
  playerName,
  selectedNumbers,
  ticketPrice,
  currency,
  purchaseDate,
  gameParameters,
  onPrintTicket
}: LottoTicketProps) {
  if (!ticketNumber || !selectedNumbers || !gameParameters) {
    return null;
  }

  const ticketData: TicketData = {
    ticketNumber,
    playerName,
    selectedNumbers,
    ticketPrice,
    currency,
    purchaseDate,
    gameParameters
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <TicketHeader
        ticketNumber={ticketNumber}
        eventName={gameParameters.eventName}
        onPrint={onPrintTicket}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-mono text-lg font-bold mb-2">N° {ticketNumber}</p>
          </div>

          <TicketInfo
            playerName={playerName}
            purchaseDate={purchaseDate}
            ticketPrice={ticketPrice}
            currency={currency}
          />

          <TicketGameInfo
            numbersToSelect={gameParameters.numbersToSelect}
            endDate={gameParameters.endDate}
          />

          <TicketNumbers numbers={selectedNumbers} />
        </div>

        <TicketQRCode data={ticketData} />
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          Ce ticket est requis pour le retrait des gains. Veuillez le conserver en lieu sûr.
        </p>
      </div>
    </div>
  );
}