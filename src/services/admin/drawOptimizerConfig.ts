import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ServerTimeService } from '../serverTime';

export interface DrawOptimizerSuggestion {
  name: string;
  label: string;
  description: string;
  gains: {
    [key: number]: number; // nombre de numéros -> montant en CFA
  };
}

export interface DrawOptimizerConfig {
  suggestions: DrawOptimizerSuggestion[];
  defaultSuggestion: string;
  updatedAt: string;
  updatedBy?: string;
}

const DEFAULT_CONFIG: DrawOptimizerConfig = {
  suggestions: [
    {
      name: 'petits_gains',
      label: 'Petits Gains',
      description: 'Distribution avec des gains modestes pour maximiser les profits',
      gains: {
        6: 50000,   // Jackpot 6 numéros
        5: 10000,   // 5 numéros
        4: 5000,    // 4 numéros
        3: 1000,    // 3 numéros
        2: 500,     // 2 numéros
        1: 100      // 1 numéro
      }
    },
    {
      name: 'gains_moyens',
      label: 'Gains Moyens',
      description: 'Distribution équilibrée entre gains attractifs et rentabilité',
      gains: {
        6: 100000,  // Jackpot 6 numéros
        5: 25000,   // 5 numéros
        4: 10000,   // 4 numéros
        3: 2500,    // 3 numéros
        2: 1000,    // 2 numéros
        1: 250      // 1 numéro
      }
    },
    {
      name: 'gros_gains',
      label: 'Gros Gains',
      description: 'Distribution généreuse pour attirer plus de joueurs',
      gains: {
        6: 200000,  // Jackpot 6 numéros
        5: 50000,   // 5 numéros
        4: 20000,   // 4 numéros
        3: 5000,    // 3 numéros
        2: 2000,    // 2 numéros
        1: 500      // 1 numéro
      }
    },
    {
      name: 'jackpot_focus',
      label: 'Focus Jackpot',
      description: 'Concentration sur le jackpot avec gains minimes pour les autres niveaux',
      gains: {
        6: 500000,  // Jackpot très élevé
        5: 5000,    // Gains réduits pour les autres
        4: 2000,
        3: 500,
        2: 200,
        1: 50
      }
    }
  ],
  defaultSuggestion: 'gains_moyens',
  updatedAt: ServerTimeService.getServerTimeISO()
};

export class DrawOptimizerConfigService {
  private static CONFIG_DOC = 'draw_optimizer_config';

  static async getConfig(): Promise<DrawOptimizerConfig> {
    try {
      const docRef = doc(db, 'site_config', this.CONFIG_DOC);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          ...DEFAULT_CONFIG,
          ...docSnap.data()
        } as DrawOptimizerConfig;
      }
      
      // Si aucune configuration n'existe, créer la configuration par défaut
      await this.saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error getting draw optimizer config:', error);
      return DEFAULT_CONFIG;
    }
  }

  static async saveConfig(config: DrawOptimizerConfig): Promise<void> {
    try {
      const docRef = doc(db, 'site_config', this.CONFIG_DOC);
      await setDoc(docRef, {
        ...config,
        updatedAt: ServerTimeService.getServerTimeISO()
      });
    } catch (error) {
      console.error('Error saving draw optimizer config:', error);
      throw new Error('Failed to save draw optimizer configuration');
    }
  }

  static validateConfig(config: DrawOptimizerConfig): string[] {
    const errors: string[] = [];

    if (!config.suggestions || config.suggestions.length === 0) {
      errors.push('Au moins une suggestion doit être définie');
    }

    config.suggestions.forEach((suggestion, index) => {
      if (!suggestion.name || !suggestion.label) {
        errors.push(`Suggestion ${index + 1}: nom et libellé obligatoires`);
      }

      // Vérifier que les gains sont des nombres positifs
      Object.entries(suggestion.gains).forEach(([numbers, amount]) => {
        if (amount < 0) {
          errors.push(`Suggestion "${suggestion.label}": le gain pour ${numbers} numéros ne peut pas être négatif`);
        }
      });

      // Vérifier qu'au moins un gain est défini
      const hasValidGains = Object.values(suggestion.gains).some(amount => amount > 0);
      if (!hasValidGains) {
        errors.push(`Suggestion "${suggestion.label}": au moins un gain doit être supérieur à 0`);
      }
    });

    if (!config.suggestions.find(s => s.name === config.defaultSuggestion)) {
      errors.push('La suggestion par défaut doit exister dans la liste des suggestions');
    }

    return errors;
  }

  static getGainLevels(): number[] {
    return [1, 2, 3, 4, 5, 6];
  }

  static getGainLevelLabel(level: number): string {
    switch (level) {
      case 6: return 'Jackpot (6 numéros)';
      case 5: return '2ème Prix (5 numéros)';
      case 4: return '3ème Prix (4 numéros)';
      case 3: return '4ème Prix (3 numéros)';
      case 2: return '5ème Prix (2 numéros)';
      case 1: return 'Consolation (1 numéro)';
      default: return `${level} numéros`;
    }
  }
}