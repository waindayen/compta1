import React, { useState, useEffect } from 'react';
import { Printer, Check, AlertCircle, Info, RefreshCw, RotateCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { printerService } from '../../services/printer';

export default function PrinterTestPage() {
  const { currentUser } = useAuth();
  const [printing, setPrinting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [printerStatus, setPrinterStatus] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Vérifier le statut de l'imprimante au chargement
  useEffect(() => {
    if (currentUser) {
      checkPrinterStatus();
    }
  }, [currentUser]);

  const checkPrinterStatus = async () => {
    try {
      if (!currentUser) return;
      
      setCheckingStatus(true);
      setDebugInfo(null);
      
      // Charger la configuration
      const config = await printerService.loadConfig(currentUser.uid);
      
      if (!config.enabled) {
        setPrinterStatus('disabled');
        return;
      }
      
      if (!config.deviceAddress) {
        setPrinterStatus('not_configured');
        return;
      }
      
      // Vérifier la connexion à l'imprimante
      const status = await printerService.checkPrinterStatus();
      setPrinterStatus(status);
      setDebugInfo(`Statut de l'imprimante: ${status}, Adresse: ${config.deviceAddress}, Protocole: ${config.protocol || 'escpos'}`);
    } catch (err) {
      console.error('Erreur lors de la vérification du statut:', err);
      setPrinterStatus('error');
      setDebugInfo(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handlePrintTest = async () => {
    if (!currentUser) return;
    
    try {
      setPrinting(true);
      setError(null);
      setSuccess(null);
      setDebugInfo(null);
      
      // Charger la configuration
      const config = await printerService.loadConfig(currentUser.uid);
      
      if (!config.enabled) {
        throw new Error('L\'impression est désactivée. Veuillez l\'activer dans les paramètres.');
      }
      
      if (!config.deviceAddress) {
        throw new Error('Aucune imprimante configurée. Veuillez configurer une imprimante.');
      }
      
      // Créer un ticket de test
      const testTicket = {
        ticketNumber: 'TEST-' + Date.now().toString().slice(-8),
        playerName: 'Test',
        selectedNumbers: [1, 2, 3, 4, 5, 6],
        ticketPrice: 100,
        currency: 'XAF',
        purchaseDate: new Date().toISOString(),
        gameParameters: {
          eventName: 'Test d\'impression',
          numbersToSelect: 6,
          endDate: new Date().toISOString()
        }
      };
      
      console.log('Impression du ticket de test:', testTicket);
      setDebugInfo(`Tentative d'impression: ${config.deviceName || config.deviceAddress} (${config.protocol || 'escpos'})`);
      
      // Imprimer le ticket de test
      await printerService.printTicket(testTicket);
      
      setSuccess('Page de test imprimée avec succès');
      await checkPrinterStatus(); // Mettre à jour le statut après l'impression
    } catch (err) {
      console.error('Erreur lors de l\'impression de test:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'impression de test');
      setDebugInfo(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setPrinting(false);
    }
  };
  
  const handleResetPrinter = async () => {
    if (!currentUser) return;
    
    try {
      setResetting(true);
      setError(null);
      setSuccess(null);
      setDebugInfo("Réinitialisation de l'imprimante en cours...");
      
      // Réinitialiser l'imprimante
      const result = await printerService.resetPrinter();
      
      if (result) {
        setSuccess('Imprimante réinitialisée avec succès');
        setDebugInfo("Imprimante réinitialisée. Vérification du statut...");
        await checkPrinterStatus();
      } else {
        setError('Erreur lors de la réinitialisation de l\'imprimante');
        setDebugInfo("Échec de la réinitialisation de l'imprimante");
      }
    } catch (err) {
      console.error('Erreur lors de la réinitialisation de l\'imprimante:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation de l\'imprimante');
      setDebugInfo(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setResetting(false);
    }
  };

  const renderStatusMessage = () => {
    switch (printerStatus) {
      case 'connected':
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 mb-4">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-600">Imprimante connectée et prête à imprimer</p>
          </div>
        );
      case 'disconnected':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-600">Imprimante non connectée. Vérifiez que l'imprimante est allumée et que le Bluetooth est activé.</p>
              <button 
                onClick={handleResetPrinter}
                disabled={resetting}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {resetting ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                ) : (
                  <RotateCw className="w-3 h-3" />
                )}
                <span>Réinitialiser l'imprimante</span>
              </button>
            </div>
          </div>
        );
      case 'disabled':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-600">L'impression est désactivée. Activez-la dans les paramètres.</p>
          </div>
        );
      case 'not_configured':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-600">Aucune imprimante configurée. Veuillez sélectionner une imprimante.</p>
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-600">Erreur lors de la vérification du statut de l'imprimante.</p>
              <button 
                onClick={handleResetPrinter}
                disabled={resetting}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {resetting ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                ) : (
                  <RotateCw className="w-3 h-3" />
                )}
                <span>Réinitialiser l'imprimante</span>
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Printer className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Test d'impression</h2>
            <p className="text-sm text-gray-600">
              Imprimez une page de test pour vérifier la configuration
            </p>
          </div>
        </div>
        
        <button
          onClick={checkPrinterStatus}
          disabled={checkingStatus}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          {checkingStatus ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Vérifier</span>
        </button>
      </div>

      <div className="space-y-4">
        {renderStatusMessage()}

        <p className="text-gray-600">
          Cette action imprimera une page de test contenant un ticket fictif pour vérifier que votre imprimante est correctement configurée.
        </p>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {debugInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
            <p className="text-xs text-gray-600 font-mono">{debugInfo}</p>
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={handleResetPrinter}
            disabled={resetting || printerStatus === 'disabled' || printerStatus === 'not_configured'}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Réinitialisation...</span>
              </>
            ) : (
              <>
                <RotateCw className="w-5 h-5" />
                <span>Réinitialiser l'imprimante</span>
              </>
            )}
          </button>
          
          <button
            onClick={handlePrintTest}
            disabled={printing || printerStatus === 'disabled' || printerStatus === 'not_configured'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {printing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Impression...</span>
              </>
            ) : (
              <>
                <Printer className="w-5 h-5" />
                <span>Imprimer une page de test</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}