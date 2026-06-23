/// <reference types="vite/client" />

interface Window {
  Android?: {
    getBluetoothDevices: () => string;
    connectPrinter: (address: string) => string;
    printData: (base64Data: string) => string;
    getPrinterStatus: () => string;
    disconnectPrinter: () => string;
    setPrinterProtocol?: (protocol: string) => string;
    deletePrinterConfig?: () => string;
    refreshBluetoothDevices?: () => string;
    resetPrinter?: () => string;
  };
}