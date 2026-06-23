import React from 'react';
import QRCode from 'react-qr-code';
import type { TicketData } from '../../../utils/ticketUtils';

interface PrintableTicketProps {
  data: TicketData;
}

export default function PrintableTicket({ data }: PrintableTicketProps) {
  if (!data || !data.selectedNumbers || !data.gameParameters) {
    return null;
  }

  return (
    <div className="print-only" style={{ display: 'none' }}>
      {/* En-tête du ticket */}
      <div className="ticket-header">
        <h1>BetSport Lotto</h1>
        <h2>{data.gameParameters.eventName}</h2>
      </div>

      {/* Informations du ticket */}
      <div className="ticket-info">
        <p className="font-mono font-bold">N° {data.ticketNumber}</p>
        <p>Client: {data.playerName}</p>
        <p>Date: {new Date(data.purchaseDate).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p>Montant: {new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: data.currency
        }).format(data.ticketPrice)}</p>
      </div>

      {/* Paramètres du jeu */}
      <div className="ticket-info">
        <p>Nums à sélectionner: {data.gameParameters.numbersToSelect}</p>
        <p>Tirage: {new Date(data.gameParameters.endDate).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>

      {/* Numéros joués */}
      <div className="numbers">
        {data.selectedNumbers.map((number, index) => (
          <div key={index} className="number">
            {number}
          </div>
        ))}
      </div>

      {/* QR Code */}
      <div className="qr-code">
        <QRCode
          value={JSON.stringify(data)}
          size={150} /* Taille réduite pour 58mm */
          level="M" /* Niveau de correction d'erreur moyen pour un meilleur rendu */
        />
      </div>

      {/* Pied de ticket */}
      <div className="ticket-footer">
        <p>*** Conservez ce ticket ***</p>
        <p>Nécessaire pour les gains</p>
        <p>www.betsport.com</p>
      </div>
    </div>
  );
}