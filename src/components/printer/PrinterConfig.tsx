import React, { useState, useEffect } from 'react';
import { Printer, RefreshCw, Save, AlertCircle, Check, Info, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { printerService } from '../../services/printer';
import { PrinterConfig as PrinterConfigType } from '../../services/printer/config';

export default function PrinterConfig() {
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<PrinterConfigType | null>(null);
  const [availablePrinters, setAvailablePrinters] = useState<Array<{name: string, address: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [printerProtocol, setPrinterProtocol] = useState<'escpos' | 'tspl'>('escpos');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [scanAttempts, setScanAttempts] = useState(0);

  useEffect(() => {
    if (currentUser) {
      loadConfig();
    }
  }, [currentUser]);

  const loadConfig = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      const config = await printerService.loadConfig(currentUser.uid);
      setConfig(config);
      setPrinterProtocol(config.protocol || 'escpos');
      setLastSyncedAt(config.lastSyncedAt || null);
      console.log('Configuration chargée:', config);
    } catch (err) {
      setError('Erreur lors du chargement de la configuration');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const scanForPrinters = async () => {
    try {
      setScanning(true);
      setError(null);
      setScanAttempts(prev => prev + 1);
      console.log('Recherche d\'imprimantes... (tentative ' + (scanAttempts + 1) + ')');
      
      // Forcer la déconnexion avant de scanner pour éviter les conflits
      try {
        await printerService.checkPrinterStatus();
      } catch (e) {
        console.log('Erreur lors de la vérification du statut avant scan:', e);
      }
      
      // Vider la liste des imprimantes disponibles avant de scanner
      setAvailablePrinters([]);
      
      const printers = await printerService.getAvailablePrinters();
      console.log('Imprimantes trouvées:', printers);
      
      if (printers.length === 0) {
        if (scanAttempts < 2) {
          // Réessayer automatiquement une fois
          setTimeout(() => {
            scanForPrinters();
          }, 1000);
          return;
        }
        setError('Aucune imprimante Bluetooth trouvée. Assurez-vous que le Bluetooth est activé et que l\'imprimante est appairée avec l\'appareil.');
      } else {
        setAvailablePrinters(printers);
        setError(null);
      }
    } catch (err) {
      console.error('Erreur lors de la recherche d\'imprimantes:', err);
      setError('Erreur lors de la recherche d\'imprimantes. Vérifiez que le Bluetooth est activé.');
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser || !config) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      console.log('Sauvegarde de la configuration:', {...config, protocol: printerProtocol});
      await printerService.saveConfig(currentUser.uid, {
        ...config,
        protocol: printerProtocol
      });
      
      setSuccess('Configuration sauvegardée avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la configuration:', err);
      setError('Erreur lors de la sauvegarde de la configuration');
    } finally {
      setSaving(false);
    }
  };

  const handlePrinterSelect = (address: string) => {
    const printer = availablePrinters.find(p => p.address === address);
    if (printer && config) {
      console.log('Sélection de l\'imprimante:', printer);
      // Si l'imprimante n'a pas de nom, utiliser l'adresse comme nom
      const deviceName = printer.name || `Imprimante (${printer.address})`;
      setConfig({
        ...config,
        deviceName,
        deviceAddress: printer.address
      });
    }
  };

  const handlePaperWidthChange = (width: number) => {
    if (!config) return;
    
    const characterPerLine = width === 58 ? 32 : 48;
    console.log('Changement de largeur de papier:', width, 'mm,', characterPerLine, 'caractères par ligne');
    setConfig({
      ...config,
      paperWidth: width,
      characterPerLine
    });
  };

  const handleDeletePrinter = async () => {
    if (!currentUser || !config) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Supprimer la configuration de l'imprimante
      const success = await printerService.deletePrinterConfig(currentUser.uid);
      
      if (success) {
        // Recharger la configuration
        const newConfig = await printerService.loadConfig(currentUser.uid);
        setConfig(newConfig);
        setPrinterProtocol(newConfig.protocol || 'escpos');
        setSuccess('Imprimante supprimée avec succès');
        
        // Vider la liste des imprimantes disponibles
        setAvailablePrinters([]);
      } else {
        setError('Erreur lors de la suppression de l\'imprimante');
      }
      
      setShowDeleteConfirm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'imprimante:', err);
      setError('Erreur lors de la suppression de l\'imprimante');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Printer className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Configuration de l'imprimante</h2>
          <p className="text-sm text-gray-600">
            Configurez votre imprimante thermique Bluetooth
          </p>
        </div>
      </div>

      {lastSyncedAt && (
        <div className="mb-4 text-xs text-gray-500 flex items-center gap-1">
          <Info className="w-3 h-3" />
          <span>Dernière synchronisation: {new Date(lastSyncedAt).toLocaleString('fr-FR')}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Activer/désactiver l'imprimante */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Activer l'impression</p>
            <p className="text-sm text-gray-600">
              Activez ou désactivez l'impression des tickets
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config?.enabled || false}
              onChange={(e) => setConfig(prev => prev ? {...prev, enabled: e.target.checked} : null)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Protocole d'impression */}
        <div>
          <p className="font-medium mb-2">Protocole d'impression</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="printerProtocol"
                checked={printerProtocol === 'escpos'}
                onChange={() => setPrinterProtocol('escpos')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span>ESC/POS (Imprimantes thermiques standard)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="printerProtocol"
                checked={printerProtocol === 'tspl'}
                onChange={() => setPrinterProtocol('tspl')}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span>TSPL (Imprimantes d'étiquettes)</span>
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Sélectionnez le protocole compatible avec votre imprimante
          </p>
        </div>

        {/* Recherche d'imprimantes */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="font-medium">Imprimantes disponibles</p>
            <button
              onClick={scanForPrinters}
              disabled={scanning}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Recherche...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Rechercher</span>
                </>
              )}
            </button>
          </div>

          {availablePrinters.length > 0 ? (
            <div className="space-y-2 mt-2">
              {availablePrinters.map((printer) => (
                <div
                  key={printer.address}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${
                    config?.deviceAddress === printer.address
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handlePrinterSelect(printer.address)}
                >
                  <div className="flex items-center gap-3">
                    <Printer className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">
                        {printer.name || `Imprimante (${printer.address})`}
                      </p>
                      <p className="text-xs text-gray-500">{printer.address}</p>
                    </div>
                  </div>
                  {config?.deviceAddress === printer.address && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
              {scanning ? 'Recherche d\'imprimantes...' : 'Aucune imprimante trouvée'}
            </div>
          )}
        </div>

        {/* Largeur du papier */}
        <div>
          <p className="font-medium mb-2">Largeur du papier</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paperWidth"
                checked={config?.paperWidth === 58}
                onChange={() => handlePaperWidthChange(58)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span>58mm</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paperWidth"
                checked={config?.paperWidth === 80}
                onChange={() => handlePaperWidthChange(80)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span>80mm</span>
            </label>
          </div>
        </div>

        {/* Informations sur la configuration */}
        {config?.deviceAddress && (
          <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800">
                Imprimante configurée: <span className="font-medium">{config.deviceName || `Imprimante (${config.deviceAddress})`}</span>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Adresse: {config.deviceAddress}, Largeur: {config.paperWidth}mm, Protocole: {printerProtocol.toUpperCase()}
              </p>
            </div>
          </div>
        )}

        {/* Bouton de suppression de l'imprimante */}
        {config?.deviceAddress && (
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer l'imprimante</span>
            </button>
            <p className="text-xs text-gray-500">
              Supprimez cette imprimante pour en configurer une nouvelle
            </p>
          </div>
        )}

        {/* Messages d'erreur ou de succès */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Sauvegarde...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Sauvegarder</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Supprimer l'imprimante</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette imprimante ? Vous devrez la reconfigurer pour l'utiliser à nouveau.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeletePrinter}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Supprimer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}