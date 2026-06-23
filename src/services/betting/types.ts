export interface Bet {
  id: string;
  userId: string;
  match: string;
  selection: string;
  odds: number;
  stake: number;
  status: 'pending' | 'won' | 'lost';
  date: string;
  type: 'simple' | 'combine';
  potentialWin?: number;
  actualWin?: number;
  matches?: Array<{
    match: string;
    selection: string;
    odds: number;
  }>;
  totalOdds?: number;
}