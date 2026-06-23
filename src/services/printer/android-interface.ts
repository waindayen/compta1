/**
 * Interface for Android-specific printer functionality
 * This interface defines the methods that should be implemented
 * in the Android WebView JavaScript interface
 */
export interface AndroidInterface {
  // Bluetooth printer methods
  getBluetoothDevices(): Promise<string>; // Returns JSON string of available devices
  connectPrinter(address: string): Promise<string>; // 'success' or error message
  printData(base64Data: string): Promise<string>; // 'success' or error message
  getPrinterStatus(): Promise<string>; // 'connected', 'disconnected', or error
  disconnectPrinter(): Promise<string>; // 'success' or error message
  setPrinterProtocol?(protocol: string): Promise<string>; // Set printer protocol (escpos, tspl)
  deletePrinterConfig?(): Promise<string>; // Delete printer configuration
  refreshBluetoothDevices?(): Promise<string>; // Force refresh of Bluetooth devices
  resetPrinter?(): Promise<string>; // Reset printer
  
  // Mock implementation for development/testing
  isMockMode(): boolean;
}

/**
 * Mock implementation of the Android interface for development and testing
 */
class MockAndroidInterface implements AndroidInterface {
  private mockDevices = [
    { name: 'Printer 58mm', address: '00:11:22:33:44:55' },
    { name: '', address: '55:44:33:22:11:00' }, // Imprimante sans nom pour tester
    { name: 'Printer TSPL', address: '66:77:88:99:AA:BB' }
  ];
  
  private connected = false;
  private selectedPrinter: string | null = null;
  private protocol: string = 'escpos';
  
  async getBluetoothDevices(): Promise<string> {
    console.log('MockAndroid: Getting Bluetooth devices');
    return JSON.stringify(this.mockDevices);
  }
  
  async refreshBluetoothDevices(): Promise<string> {
    console.log('MockAndroid: Refreshing Bluetooth devices');
    // Simuler l'ajout d'une nouvelle imprimante
    this.mockDevices.push({ name: 'New Printer', address: '11:22:33:44:55:66' });
    return JSON.stringify(this.mockDevices);
  }
  
  async connectPrinter(address: string): Promise<string> {
    console.log(`MockAndroid: Connecting to printer ${address} with protocol ${this.protocol}`);
    const device = this.mockDevices.find(d => d.address === address);
    if (device) {
      this.connected = true;
      this.selectedPrinter = address;
      return 'success';
    }
    return 'Device not found';
  }
  
  async printData(base64Data: string): Promise<string> {
    if (!this.connected) {
      console.log('MockAndroid: Not connected to printer');
      return 'Not connected to printer';
    }
    
    console.log(`MockAndroid: Printing data to ${this.selectedPrinter} using ${this.protocol} protocol`);
    console.log(`MockAndroid: Data length: ${base64Data.length} bytes`);
    
    // Simuler une impression réussie
    return 'success';
  }
  
  async getPrinterStatus(): Promise<string> {
    console.log('MockAndroid: Getting printer status');
    return this.connected ? 'connected' : 'disconnected';
  }
  
  async disconnectPrinter(): Promise<string> {
    console.log('MockAndroid: Disconnecting printer');
    this.connected = false;
    this.selectedPrinter = null;
    return 'success';
  }
  
  async setPrinterProtocol(protocol: string): Promise<string> {
    console.log(`MockAndroid: Setting printer protocol to ${protocol}`);
    this.protocol = protocol;
    return 'success';
  }
  
  async deletePrinterConfig(): Promise<string> {
    console.log('MockAndroid: Deleting printer configuration');
    this.connected = false;
    this.selectedPrinter = null;
    this.protocol = 'escpos';
    // Vider la liste des imprimantes pour simuler une réinitialisation complète
    this.mockDevices = [];
    return 'success';
  }
  
  async resetPrinter(): Promise<string> {
    console.log('MockAndroid: Resetting printer');
    // Simuler une réinitialisation de l'imprimante
    this.connected = false;
    setTimeout(() => {
      this.connected = true;
    }, 1000);
    return 'success';
  }
  
  isMockMode(): boolean {
    return true;
  }
}

/**
 * Get the Android interface, either from the WebView or a mock implementation
 */
export function getAndroidInterface(): AndroidInterface {
  if (typeof window !== 'undefined' && window.Android) {
    // Real Android interface from WebView
    const nativeAndroid = window.Android;
    
    // Wrap native methods in promises
    return {
      getBluetoothDevices: () => {
        console.log('Native: Getting Bluetooth devices');
        try {
          const result = nativeAndroid.getBluetoothDevices();
          console.log('Native: Got Bluetooth devices', result);
          return Promise.resolve(result);
        } catch (error) {
          console.error('Native: Error getting Bluetooth devices', error);
          return Promise.reject(error);
        }
      },
      refreshBluetoothDevices: () => {
        console.log('Native: Refreshing Bluetooth devices');
        try {
          // Vérifier si la méthode existe
          if (typeof nativeAndroid.refreshBluetoothDevices === 'function') {
            const result = nativeAndroid.refreshBluetoothDevices();
            console.log('Native: Refresh result', result);
            return Promise.resolve(result);
          } else {
            // Fallback à getBluetoothDevices si refreshBluetoothDevices n'existe pas
            console.warn('Native: refreshBluetoothDevices method not available, falling back to getBluetoothDevices');
            const result = nativeAndroid.getBluetoothDevices();
            return Promise.resolve(result);
          }
        } catch (error) {
          console.error('Native: Error refreshing Bluetooth devices', error);
          return Promise.reject(error);
        }
      },
      connectPrinter: (address) => {
        console.log('Native: Connecting to printer', address);
        try {
          // Essayer plusieurs fois en cas d'échec
          let attempts = 0;
          const maxAttempts = 3;
          const tryConnect = () => {
            attempts++;
            try {
              const result = nativeAndroid.connectPrinter(address);
              console.log(`Native: Connect attempt ${attempts} result:`, result);
              if (result === 'success' || attempts >= maxAttempts) {
                return result;
              } else {
                // Petite pause avant de réessayer
                console.log(`Native: Retrying connection (attempt ${attempts + 1}/${maxAttempts})...`);
                return new Promise(resolve => {
                  setTimeout(() => {
                    resolve(tryConnect());
                  }, 1000); // Augmenter le délai entre les tentatives
                });
              }
            } catch (err) {
              console.error(`Native: Error in connect attempt ${attempts}:`, err);
              if (attempts >= maxAttempts) {
                throw err;
              } else {
                // Réessayer après une pause
                return new Promise(resolve => {
                  setTimeout(() => {
                    resolve(tryConnect());
                  }, 1000); // Augmenter le délai entre les tentatives
                });
              }
            }
          };
          
          return Promise.resolve(tryConnect());
        } catch (error) {
          console.error('Native: Error connecting to printer', error);
          return Promise.reject(error);
        }
      },
      printData: (base64Data) => {
        console.log('Native: Printing data', base64Data.substring(0, 50) + '...');
        try {
          // Essayer plusieurs fois en cas d'échec
          let attempts = 0;
          const maxAttempts = 3;
          const tryPrint = () => {
            attempts++;
            try {
              const result = nativeAndroid.printData(base64Data);
              console.log(`Native: Print attempt ${attempts} result:`, result);
              if (result === 'success' || attempts >= maxAttempts) {
                return result;
              } else {
                // Petite pause avant de réessayer
                console.log(`Native: Retrying print (attempt ${attempts + 1}/${maxAttempts})...`);
                return new Promise(resolve => {
                  setTimeout(() => {
                    resolve(tryPrint());
                  }, 1000); // Augmenter le délai entre les tentatives
                });
              }
            } catch (err) {
              console.error(`Native: Error in print attempt ${attempts}:`, err);
              if (attempts >= maxAttempts) {
                throw err;
              } else {
                // Réessayer après une pause
                return new Promise(resolve => {
                  setTimeout(() => {
                    resolve(tryPrint());
                  }, 1000); // Augmenter le délai entre les tentatives
                });
              }
            }
          };
          
          return Promise.resolve(tryPrint());
        } catch (error) {
          console.error('Native: Error printing data', error);
          return Promise.reject(error);
        }
      },
      getPrinterStatus: () => {
        console.log('Native: Getting printer status');
        try {
          const result = nativeAndroid.getPrinterStatus();
          console.log('Native: Status result', result);
          return Promise.resolve(result);
        } catch (error) {
          console.error('Native: Error getting printer status', error);
          return Promise.reject(error);
        }
      },
      disconnectPrinter: () => {
        console.log('Native: Disconnecting printer');
        try {
          const result = nativeAndroid.disconnectPrinter();
          console.log('Native: Disconnect result', result);
          return Promise.resolve(result);
        } catch (error) {
          console.error('Native: Error disconnecting printer', error);
          return Promise.reject(error);
        }
      },
      setPrinterProtocol: (protocol) => {
        console.log('Native: Setting printer protocol', protocol);
        try {
          // Vérifier si la méthode existe
          if (typeof nativeAndroid.setPrinterProtocol === 'function') {
            const result = nativeAndroid.setPrinterProtocol(protocol);
            console.log('Native: Protocol set result', result);
            return Promise.resolve(result);
          } else {
            console.warn('Native: setPrinterProtocol method not available');
            return Promise.resolve('not_supported');
          }
        } catch (error) {
          console.error('Native: Error setting printer protocol', error);
          return Promise.reject(error);
        }
      },
      deletePrinterConfig: () => {
        console.log('Native: Deleting printer configuration');
        try {
          // Vérifier si la méthode existe
          if (typeof nativeAndroid.deletePrinterConfig === 'function') {
            const result = nativeAndroid.deletePrinterConfig();
            console.log('Native: Delete config result', result);
            return Promise.resolve(result);
          } else {
            console.warn('Native: deletePrinterConfig method not available');
            return Promise.resolve('not_supported');
          }
        } catch (error) {
          console.error('Native: Error deleting printer configuration', error);
          return Promise.reject(error);
        }
      },
      resetPrinter: () => {
        console.log('Native: Resetting printer');
        try {
          // Vérifier si la méthode existe
          if (typeof nativeAndroid.resetPrinter === 'function') {
            const result = nativeAndroid.resetPrinter();
            console.log('Native: Reset printer result', result);
            return Promise.resolve(result);
          } else {
            console.warn('Native: resetPrinter method not available');
            return Promise.resolve('not_supported');
          }
        } catch (error) {
          console.error('Native: Error resetting printer', error);
          return Promise.reject(error);
        }
      },
      isMockMode: () => false
    };
  }
  
  // Mock implementation for development/testing
  console.log('Using mock Android interface');
  return new MockAndroidInterface();
}