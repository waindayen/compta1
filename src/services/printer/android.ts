import { PrinterConfig } from './config';
import { getAndroidInterface, AndroidInterface } from './android-interface';

export class AndroidPrinterService {
  private static instance: AndroidPrinterService;
  private isConnected: boolean = false;
  private config: PrinterConfig | null = null;
  private androidInterface: AndroidInterface;
  private lastScannedPrinters: Array<{name: string, address: string}> = [];
  private lastScanTime: number = 0;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;
  private printAttempts: number = 0;
  private maxPrintAttempts: number = 3;

  private constructor() {
    this.androidInterface = getAndroidInterface();
    console.log('AndroidPrinterService initialized, mock mode:', this.androidInterface.isMockMode());
  }

  static getInstance(): AndroidPrinterService {
    if (!AndroidPrinterService.instance) {
      AndroidPrinterService.instance = new AndroidPrinterService();
    }
    return AndroidPrinterService.instance;
  }

  // Configure l'imprimante
  setConfig(config: PrinterConfig): void {
    this.config = config;
    
    // Si le protocole est défini, essayer de le configurer
    if (config.protocol && this.androidInterface.setPrinterProtocol) {
      this.androidInterface.setPrinterProtocol(config.protocol)
        .then(result => {
          console.log(`Protocole d'impression configuré: ${config.protocol}, résultat: ${result}`);
        })
        .catch(error => {
          console.error(`Erreur lors de la configuration du protocole d'impression: ${error}`);
        });
    }
  }

  // Récupère la liste des imprimantes Bluetooth disponibles
  async getAvailablePrinters(): Promise<Array<{name: string, address: string}>> {
    try {
      const now = Date.now();
      const SCAN_COOLDOWN = 2000; // 2 secondes entre les scans pour éviter les appels trop fréquents
      
      // Si le dernier scan est trop récent, utiliser les résultats en cache
      if (now - this.lastScanTime < SCAN_COOLDOWN && this.lastScannedPrinters.length > 0) {
        console.log('Utilisation du cache récent des imprimantes:', this.lastScannedPrinters);
        return [...this.lastScannedPrinters];
      }
      
      this.lastScanTime = now;
      
      // Essayer d'utiliser refreshBluetoothDevices si disponible
      let result: string;
      if (this.androidInterface.refreshBluetoothDevices) {
        console.log('Utilisation de refreshBluetoothDevices pour une liste fraîche');
        result = await this.androidInterface.refreshBluetoothDevices();
      } else {
        console.log('Utilisation de getBluetoothDevices');
        result = await this.androidInterface.getBluetoothDevices();
      }
      
      console.log('Available printers raw result:', result);
      
      // Vider la liste précédente
      this.lastScannedPrinters = [];
      
      try {
        // Essayer de parser le résultat comme JSON
        if (typeof result === 'string' && result.trim().startsWith('[') && result.trim().endsWith(']')) {
          const parsedResult = JSON.parse(result);
          if (Array.isArray(parsedResult)) {
            this.lastScannedPrinters = parsedResult
              .filter(printer => printer && printer.address) // Filtrer les entrées invalides
              .map(printer => ({
                name: printer.name || `Imprimante (${printer.address})`,
                address: printer.address
              }));
          }
        } 
        // Si ce n'est pas un JSON valide, essayer d'autres formats
        else if (typeof result === 'string') {
          // Format possible: "name1,address1;name2,address2"
          if (result.includes(';')) {
            this.lastScannedPrinters = result.split(';')
              .filter(pair => pair.includes(','))
              .map(pair => {
                const [name, address] = pair.split(',');
                return { name: name || '', address: address || '' };
              })
              .filter(printer => printer.address); // Filtrer les entrées sans adresse
          }
          // Format possible: "name,address"
          else if (result.includes(',')) {
            const [name, address] = result.split(',');
            if (address) {
              this.lastScannedPrinters = [{ name: name || '', address }];
            }
          }
          // Format possible: juste l'adresse
          else if (result.trim().match(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i)) {
            this.lastScannedPrinters = [{ name: '', address: result.trim() }];
          }
        }
        
        // Normaliser les noms d'imprimantes
        this.lastScannedPrinters = this.lastScannedPrinters.map(printer => ({
          name: printer.name || `Imprimante (${printer.address})`,
          address: printer.address
        }));
        
        console.log('Parsed printers:', this.lastScannedPrinters);
      } catch (parseError) {
        console.error('Error parsing printer list:', parseError);
        // En cas d'erreur de parsing, retourner un tableau vide
        this.lastScannedPrinters = [];
      }
      
      return [...this.lastScannedPrinters];
    } catch (error) {
      console.error('Erreur lors de la recherche d\'imprimantes:', error);
      // En cas d'erreur, retourner un tableau vide
      this.lastScannedPrinters = [];
      return [];
    }
  }

  // Connecte à l'imprimante
  async connect(): Promise<boolean> {
    if (!this.config || !this.config.deviceAddress) {
      console.error('Configuration d\'imprimante non définie');
      return false;
    }

    try {
      // Réinitialiser le compteur de tentatives si c'est une nouvelle tentative
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        this.connectionAttempts = 0;
      }
      
      this.connectionAttempts++;
      
      console.log(`Tentative de connexion à l'imprimante: ${this.config.deviceAddress} avec protocole: ${this.config.protocol || 'escpos'} (tentative ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
      
      // Déconnecter d'abord pour éviter les conflits
      try {
        await this.disconnect();
      } catch (e) {
        console.log('Erreur lors de la déconnexion préalable:', e);
      }
      
      // Attendre un peu avant de se connecter
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Essayer de réinitialiser l'imprimante si la méthode existe
      if (this.androidInterface.resetPrinter) {
        try {
          console.log('Réinitialisation de l\'imprimante avant connexion...');
          await this.androidInterface.resetPrinter();
          // Attendre après la réinitialisation
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          console.log('Erreur lors de la réinitialisation de l\'imprimante:', e);
        }
      }
      
      const result = await this.androidInterface.connectPrinter(this.config.deviceAddress);
      this.isConnected = result === 'success';
      
      if (this.isConnected) {
        console.log(`Connecté à l'imprimante: ${this.config.deviceName || this.config.deviceAddress}`);
        this.connectionAttempts = 0; // Réinitialiser le compteur en cas de succès
      } else {
        console.error(`Échec de connexion à l'imprimante: ${this.config.deviceAddress}, résultat: ${result}`);
        
        // Si nous n'avons pas atteint le nombre maximum de tentatives, réessayer
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          console.log(`Nouvelle tentative de connexion (${this.connectionAttempts + 1}/${this.maxConnectionAttempts})...`);
          // Attendre un peu avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 1500));
          return this.connect();
        }
      }
      
      return this.isConnected;
    } catch (error) {
      console.error('Erreur de connexion à l\'imprimante:', error);
      this.isConnected = false;
      
      // Si nous n'avons pas atteint le nombre maximum de tentatives, réessayer
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log(`Nouvelle tentative de connexion après erreur (${this.connectionAttempts + 1}/${this.maxConnectionAttempts})...`);
        // Attendre un peu avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1500));
        return this.connect();
      }
      
      return false;
    }
  }

  // Imprime des données au format ESC/POS
  async print(data: Buffer): Promise<void> {
    if (!this.isConnected) {
      console.log('Imprimante non connectée, tentative de connexion...');
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Impossible de se connecter à l\'imprimante');
      }
    }

    try {
      // Réinitialiser le compteur de tentatives d'impression
      this.printAttempts = 0;
      
      // Convertir le buffer en base64 pour le passage à Android
      const base64Data = data.toString('base64');
      
      // Fonction pour essayer d'imprimer avec plusieurs tentatives
      const tryPrint = async (): Promise<void> => {
        this.printAttempts++;
        console.log(`Tentative d'impression ${this.printAttempts}/${this.maxPrintAttempts}...`);
        
        try {
          console.log(`Envoi des données d'impression (${base64Data.length} caractères)...`);
          const result = await this.androidInterface.printData(base64Data);
          
          if (result !== 'success') {
            console.error(`Erreur d'impression: ${result}`);
            
            if (this.printAttempts < this.maxPrintAttempts) {
              console.log(`Nouvelle tentative d'impression (${this.printAttempts + 1}/${this.maxPrintAttempts})...`);
              // Attendre un peu avant de réessayer
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Vérifier la connexion avant de réessayer
              if (!this.isConnected) {
                await this.connect();
              }
              
              return tryPrint();
            } else {
              throw new Error(`Échec de l'impression après ${this.maxPrintAttempts} tentatives: ${result}`);
            }
          }
          
          console.log('Impression réussie');
        } catch (error) {
          console.error(`Erreur d'impression (tentative ${this.printAttempts}):`, error);
          
          if (this.printAttempts < this.maxPrintAttempts) {
            console.log(`Nouvelle tentative d'impression après erreur (${this.printAttempts + 1}/${this.maxPrintAttempts})...`);
            // Attendre un peu avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Vérifier la connexion avant de réessayer
            if (!this.isConnected) {
              await this.connect();
            }
            
            return tryPrint();
          } else {
            throw error;
          }
        }
      };
      
      // Lancer la première tentative d'impression
      await tryPrint();
    } catch (error) {
      console.error('Erreur d\'impression finale:', error);
      throw error;
    }
  }

  // Vérifie l'état de l'imprimante
  async checkStatus(): Promise<string> {
    try {
      console.log('Vérification du statut de l\'imprimante...');
      if (!this.config || !this.config.deviceAddress) {
        return 'not_configured';
      }
      
      // Essayer de se connecter d'abord si nécessaire
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) {
          return 'disconnected';
        }
      }
      
      const status = await this.androidInterface.getPrinterStatus();
      console.log(`Statut de l'imprimante: ${status}`);
      
      // Si le statut est 'disconnected', essayer de se reconnecter une fois
      if (status === 'disconnected') {
        console.log('Imprimante déconnectée, tentative de reconnexion...');
        const reconnected = await this.connect();
        if (reconnected) {
          return 'connected';
        }
      }
      
      return status;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      return 'error';
    }
  }

  // Déconnecte l'imprimante
  async disconnect(): Promise<void> {
    try {
      console.log('Déconnexion de l\'imprimante...');
      await this.androidInterface.disconnectPrinter();
      this.isConnected = false;
      console.log('Imprimante déconnectée');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      this.isConnected = false;
    }
  }

  // Supprime la configuration de l'imprimante
  async deletePrinterConfig(): Promise<boolean> {
    try {
      console.log('Suppression de la configuration de l\'imprimante...');
      
      // Déconnecter d'abord l'imprimante
      await this.disconnect();
      
      // Vider la liste des imprimantes scannées
      this.lastScannedPrinters = [];
      this.connectionAttempts = 0;
      this.printAttempts = 0;
      
      if (this.androidInterface.deletePrinterConfig) {
        const result = await this.androidInterface.deletePrinterConfig();
        this.isConnected = false;
        console.log('Configuration de l\'imprimante supprimée:', result);
        return result === 'success';
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de la configuration:', error);
      return false;
    }
  }
  
  // Réinitialise l'imprimante
  async resetPrinter(): Promise<boolean> {
    try {
      console.log('Réinitialisation de l\'imprimante...');
      
      // Déconnecter d'abord l'imprimante
      await this.disconnect();
      
      // Réinitialiser les compteurs
      this.connectionAttempts = 0;
      this.printAttempts = 0;
      
      if (this.androidInterface.resetPrinter) {
        const result = await this.androidInterface.resetPrinter();
        console.log('Réinitialisation de l\'imprimante:', result);
        
        // Attendre un peu après la réinitialisation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Essayer de se reconnecter
        await this.connect();
        
        return result === 'success';
      }
      
      // Si la méthode n'existe pas, essayer de se reconnecter
      await this.connect();
      return true;
    } catch (error) {
      console.error('Erreur lors de la réinitialisation de l\'imprimante:', error);
      return false;
    }
  }
}