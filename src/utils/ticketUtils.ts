export interface TicketData {
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
}

export function validateTicketData(data: string): TicketData | null {
  try {
    // First try to parse as JSON
    try {
      const ticket = JSON.parse(data) as TicketData;
      
      // Basic validation
      if (!ticket.ticketNumber || 
          !ticket.selectedNumbers || 
          !ticket.purchaseDate || 
          !ticket.gameParameters) {
        return null;
      }

      return ticket;
    } catch (jsonError) {
      // If not JSON, check if it's a plain document ID
      if (typeof data === 'string' && data.trim().length > 0) {
        // Return a minimal object with just the ticket number
        return {
          ticketNumber: data.trim(),
          playerName: '',
          selectedNumbers: [],
          ticketPrice: 0,
          currency: '',
          purchaseDate: '',
          gameParameters: {
            eventName: '',
            numbersToSelect: 0,
            endDate: ''
          }
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error validating ticket data:', error);
    return null;
  }
}

// This function is no longer used as we directly use the ticket ID
// Kept for reference or future use if needed
export function generateTicketNumber(userId: string | undefined, timestamp: number): string {
  return `${userId || 'UNKNOWN'}-${timestamp}`;
}