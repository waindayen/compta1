import { ESCPOSPrinter } from './escpos';
import { AndroidPrinterService } from './android';
import { PrinterConfigService, PrinterConfig } from './config';
import type { TicketData } from '../../utils/ticketUtils';

export class PrinterService {
  private static instance: PrinterService;
  private escposPrinter: ESCPOSPrinter;
  private androidPrinter: AndroidPrinterService;
  private config: PrinterConfig | null = null;

  private constructor() {
    this.escposPrinter = new ESCPOSPrinter();
    this.androidPrinter = AndroidPrinterService.getInstance();
  }

  static getInstance(): PrinterService {
    if (!PrinterService.instance) {
      PrinterService.instance = new PrinterService();
    }
    return PrinterService.instance;
  }

  async loadConfig(userId: string): Promise<PrinterConfig> {
    try {
      console.log('Chargement de la configuration pour:', userId);
      this.config = await PrinterConfigService.getConfig(userId);
      this.androidPrinter.setConfig(this.config);
      return this.config;
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      throw error;
    }
  }

  async saveConfig(userId: string, config: PrinterConfig): Promise<void> {
    try {
      console.log('Sauvegarde de la configuration pour:', userId, config);
      await PrinterConfigService.saveConfig(userId, config);
      this.config = config;
      this.androidPrinter.setConfig(config);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      throw error;
    }
  }

  async getAvailablePrinters(): Promise<Array<{name: string, address: string}>> {
    console.log('Recherche des imprimantes disponibles...');
    return this.androidPrinter.getAvailablePrinters();
  }

  async printTicket(ticketData: TicketData): Promise<void> {
    try {
      if (!this.config || !this.config.enabled || !this.config.deviceAddress) {
        console.warn('Impression désactivée ou non configurée');
        return;
      }

      console.log('Impression du ticket:', ticketData.ticketNumber);

      // Générer les données ESC/POS
      const printData = await this.escposPrinter.printTicket({
        ticketNumber: ticketData.ticketNumber,
        eventName: ticketData.gameParameters.eventName,
        playerName: ticketData.playerName,
        purchaseDate: ticketData.purchaseDate,
        ticketPrice: ticketData.ticketPrice,
        currency: ticketData.currency,
        selectedNumbers: ticketData.selectedNumbers,
        numbersToSelect: ticketData.gameParameters.numbersToSelect,
        drawDate: ticketData.gameParameters.endDate
      });

      // Connecter à l'imprimante
      const connected = await this.androidPrinter.connect();
      if (!connected) {
        throw new Error("Impossible de se connecter à l'imprimante");
      }

      // Envoyer à l'imprimante
      await this.androidPrinter.print(printData);

      // Déconnecter l'imprimante
      await this.androidPrinter.disconnect();
      
      console.log('Impression terminée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      throw error;
    }
  }

  async checkPrinterStatus(): Promise<string> {
    try {
      console.log('Vérification du statut de l\'imprimante...');
      if (!this.config || !this.config.enabled || !this.config.deviceAddress) {
        return this.config?.enabled ? 'not_configured' : 'disabled';
      }
      return await this.androidPrinter.checkStatus();
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      return 'error';
    }
  }

  async deletePrinterConfig(userId: string): Promise<boolean> {
    try {
      console.log('Suppression de la configuration de l\'imprimante pour:', userId);
      
      // Supprimer la configuration côté Android
      await this.androidPrinter.deletePrinterConfig();
      
      // Réinitialiser la configuration dans Firestore
      await PrinterConfigService.deletePrinterConfig(userId);
      
      // Recharger la configuration
      this.config = await PrinterConfigService.getConfig(userId);
      this.androidPrinter.setConfig(this.config);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la configuration:', error);
      return false;
    }
  }
  
  async resetPrinter(): Promise<boolean> {
    try {
      console.log('Réinitialisation de l\'imprimante...');
      return await this.androidPrinter.resetPrinter();
    } catch (error) {
      console.error('Erreur lors de la réinitialisation de l\'imprimante:', error);
      return false;
    }
  }
}

export const printerService = PrinterService.getInstance();