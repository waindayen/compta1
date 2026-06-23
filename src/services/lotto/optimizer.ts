import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LottoEvent } from '../lotto';

export interface OptimizationParams {
  targetProfitPercentage: number;
  maxPayoutPercentage: number;
  allowedVariance: number;
}

export interface PrizeConfig {
  [key: number]: number; // nombre de numéros -> montant du gain
}

export interface OptimizationResult {
  winningNumbers: number[];
  estimatedPayout: number;
  estimatedProfit: number;
  profitMargin: number;
  variance: number;
  ticketStats: { [key: number]: number };
  isOptimal: boolean;
  recommendations: string[];
  prizeDistribution: { numbers: number; amount: number; count: number; totalPayout: number }[];
  attempts: number;
  bestScore: number;
}

export class LottoOptimizerService {
  /**
   * Optimise les numéros gagnants selon les gains définis manuellement
   */
  static async optimizeNumbersFromPrizes(
    participations: any[],
    numbersToSelect: number,
    prizeConfig: PrizeConfig,
    totalRevenue: number,
    params: OptimizationParams
  ): Promise<OptimizationResult> {
    
    if (participations.length === 0) {
      throw new Error('Aucune participation trouvée pour ce lotto');
    }
    
    // Calculer le profit cible basé sur le pourcentage des revenus
    const targetProfit = totalRevenue * (params.targetProfitPercentage / 100);
    const maxAllowedPayout = totalRevenue * (params.maxPayoutPercentage / 100);
    
    let bestResult: OptimizationResult | null = null;
    let bestScore = -1;
    
    // Essayer plusieurs combinaisons de numéros gagnants
    const maxAttempts = 5000; // Plus d'tentatives pour plus de précision
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Générer des numéros gagnants avec différentes stratégies
      const winningNumbers = attempt < 2500 
        ? this.generateRandomNumbers(numbersToSelect)
        : this.generateStrategicNumbers(participations, numbersToSelect);
      
      // Calculer les statistiques pour ces numéros
      const ticketStats = this.calculateTicketStats(participations, winningNumbers);
      
      // Calculer le payout total avec la configuration de gains définie
      let totalPayout = 0;
      const prizeDistribution: { numbers: number; amount: number; count: number; totalPayout: number }[] = [];
      
      Object.entries(prizeConfig).forEach(([numbers, amount]) => {
        const matchCount = parseInt(numbers);
        const winnerCount = ticketStats[matchCount] || 0;
        const levelPayout = winnerCount * amount;
        
        if (amount > 0) {
          totalPayout += levelPayout;
          prizeDistribution.push({
            numbers: matchCount,
            amount,
            count: winnerCount,
            totalPayout: levelPayout
          });
        }
      });

      // Calculer les métriques
      const estimatedProfit = totalRevenue - totalPayout;
      const profitMargin = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;
      const variance = Math.abs(profitMargin - params.targetProfitPercentage);
      
      const isOptimal = variance <= params.allowedVariance && estimatedProfit >= 0;
      
      // Calculer un score pour cette combinaison
      const score = this.calculateOptimizationScore(
        estimatedProfit,
        profitMargin,
        variance,
        params,
        ticketStats,
        participations.length
      );
      
      if (score > bestScore) {
        bestScore = score;
        
        // Générer des recommandations
        const recommendations = this.generateRecommendations(
          estimatedProfit,
          profitMargin,
          variance,
          params,
          totalPayout,
          Object.values(ticketStats).reduce((sum, count) => sum + count, 0),
          participations.length
        );

        bestResult = {
          winningNumbers,
          estimatedPayout: totalPayout,
          estimatedProfit,
          profitMargin,
          variance,
          ticketStats,
          isOptimal,
          recommendations,
          prizeDistribution: prizeDistribution.sort((a, b) => b.numbers - a.numbers),
          attempts: attempt + 1,
          bestScore: score
        };
      }
      
      // Si on trouve une solution optimale rapidement, on peut s'arrêter
      if (isOptimal && variance <= params.allowedVariance / 2) {
        break;
      }
    }
    
    if (!bestResult) {
      throw new Error('Aucune solution optimale trouvée. Essayez d\'ajuster les gains ou la marge d\'erreur.');
    }
    
    return bestResult;
  }

  /**
   * Génère des numéros aléatoirement
   */
  private static generateRandomNumbers(count: number): number[] {
    const numbers: number[] = [];
    while (numbers.length < count) {
      const num = Math.floor(Math.random() * 50) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  }

  /**
   * Génère des numéros de manière stratégique pour minimiser les gagnants
   */
  private static generateStrategicNumbers(participations: any[], count: number): number[] {
    // Analyser la fréquence des numéros choisis par les participants
    const numberFrequency: { [key: number]: number } = {};
    
    participations.forEach(participation => {
      participation.selectedNumbers.forEach((num: number) => {
        numberFrequency[num] = (numberFrequency[num] || 0) + 1;
      });
    });
    
    // Créer une liste de tous les numéros possibles avec leur fréquence
    const allNumbers: { number: number; frequency: number }[] = [];
    for (let i = 1; i <= 50; i++) {
      allNumbers.push({
        number: i,
        frequency: numberFrequency[i] || 0
      });
    }
    
    // Mélanger entre numéros peu choisis et aléatoires pour plus de variété
    const strategy = Math.random();
    
    if (strategy < 0.6) {
      // 60% du temps : privilégier les numéros les moins choisis
      allNumbers.sort((a, b) => a.frequency - b.frequency);
    } else if (strategy < 0.8) {
      // 20% du temps : privilégier les numéros les plus choisis (pour plus de gagnants)
      allNumbers.sort((a, b) => b.frequency - a.frequency);
    } else {
      // 20% du temps : complètement aléatoire
      allNumbers.sort(() => Math.random() - 0.5);
    }
    
    // Prendre les premiers numéros selon la stratégie
    const numbers = allNumbers.slice(0, count).map(item => item.number);
    
    return numbers.sort((a, b) => a - b);
  }

  /**
   * Calcule les statistiques de tickets gagnants pour des numéros donnés
   */
  private static calculateTicketStats(participations: any[], winningNumbers: number[]): { [key: number]: number } {
    const stats: { [key: number]: number } = {};
    
    participations.forEach(participation => {
      const matches = participation.selectedNumbers.filter((num: number) => 
        winningNumbers.includes(num)
      ).length;
      
      stats[matches] = (stats[matches] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Calcule un score d'optimisation pour comparer les résultats
   */
  private static calculateOptimizationScore(
    estimatedProfit: number,
    profitMargin: number,
    variance: number,
    params: OptimizationParams,
    ticketStats: { [key: number]: number },
    totalParticipations: number
  ): number {
    let score = 0;
    
    // Bonus majeur pour être dans la variance acceptable
    if (variance <= params.allowedVariance) {
      score += 200;
    }
    
    // Bonus pour profit positif
    if (estimatedProfit > 0) {
      score += 100;
    }
    
    // Bonus pour être proche de l'objectif de profit (plus c'est proche, plus le bonus est élevé)
    const proximityBonus = Math.max(0, 100 - variance * 5);
    score += proximityBonus;
    
    // Malus pour variance élevée
    score -= variance * 3;
    
    // Bonus pour distribution équilibrée des gagnants
    const totalWinners = Object.values(ticketStats).reduce((sum, count) => sum + count, 0);
    const winnerPercentage = (totalWinners / totalParticipations) * 100;
    
    // Bonus si le pourcentage de gagnants est raisonnable (5-25%)
    if (winnerPercentage >= 5 && winnerPercentage <= 25) {
      score += 50;
    } else if (winnerPercentage < 5) {
      score += 75; // Bonus plus élevé pour peu de gagnants (plus rentable)
    }
    
    // Bonus pour éviter trop de gagnants au jackpot
    const jackpotWinners = Object.entries(ticketStats)
      .filter(([matches]) => parseInt(matches) >= Math.max(4, Object.keys(ticketStats).length - 1))
      .reduce((sum, [, count]) => sum + count, 0);
    
    if (jackpotWinners === 0) {
      score += 30; // Bonus pour aucun gagnant au jackpot
    } else if (jackpotWinners <= 2) {
      score += 15; // Bonus pour peu de gagnants au jackpot
    }
    
    return score;
  }

  /**
   * Génère des recommandations basées sur les résultats
   */
  private static generateRecommendations(
    estimatedProfit: number,
    profitMargin: number,
    variance: number,
    params: OptimizationParams,
    totalPayout: number,
    totalWinners: number,
    totalParticipations: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (estimatedProfit < 0) {
      recommendations.push('⚠️ Configuration déficitaire - Les gains définis sont trop élevés');
    } else if (variance > params.allowedVariance) {
      recommendations.push(`📊 Variance de ${variance.toFixed(1)}% - Ajuster les gains ou augmenter la marge d'erreur`);
    } else if (profitMargin > 80) {
      recommendations.push('💰 Marge très élevée - Vous pouvez augmenter les gains pour attirer plus de joueurs');
    }
    
    if (variance <= params.allowedVariance && estimatedProfit >= 0) {
      recommendations.push('✅ Configuration optimale selon vos critères de profit');
    }
    
    if (totalPayout === 0) {
      recommendations.push('⚠️ Aucun gain distribué - Vérifier la configuration des gains');
    }

    const winnerPercentage = (totalWinners / totalParticipations) * 100;
    if (winnerPercentage === 0) {
      recommendations.push('🎯 Aucun gagnant - Excellent pour la rentabilité mais peut décevoir les joueurs');
    } else if (winnerPercentage < 5) {
      recommendations.push('💎 Très peu de gagnants - Excellente rentabilité');
    } else if (winnerPercentage > 30) {
      recommendations.push('⚠️ Beaucoup de gagnants - Impact significatif sur la rentabilité');
    } else {
      recommendations.push('👍 Nombre de gagnants équilibré');
    }
    
    return recommendations;
  }
}