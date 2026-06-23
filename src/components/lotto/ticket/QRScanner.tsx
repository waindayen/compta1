import React, { useEffect, useState } from 'react';
import { QrScanner } from '@yudiel/react-qr-scanner';
import { AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  playBeep?: boolean;
}

export default function QRScanner({ onScan, onError, playBeep = false }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false);
      onError?.('Votre appareil ne supporte pas l\'accès à la caméra');
      return;
    }

    // Request camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setHasPermission(true);
      })
      .catch((err) => {
        console.error('Camera permission error:', err);
        setHasPermission(false);
        if (err.name === 'NotAllowedError') {
          onError?.('Veuillez autoriser l\'accès à la caméra pour scanner les tickets');
        } else {
          onError?.('Impossible d\'accéder à la caméra');
        }
      });

    // Cleanup
    return () => {
      // Stop all active video streams
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(() => {});
    };
  }, [onError]);

  const handleError = (error: any) => {
    // Filter out sound-related errors as they don't affect functionality
    if (error?.message?.includes('sound') || error?.message?.includes('sources')) {
      return;
    }

    console.error('QR Scanner error:', error);
    if (error.name === 'NotAllowedError') {
      onError?.('Veuillez autoriser l\'accès à la caméra pour scanner les tickets');
    } else if (error.constraint === 'height') {
      // Handle height constraint error specifically
      console.warn('Height constraint error, trying to continue anyway');
      // We don't report this to the user as we've adjusted the component to handle it
    } else {
      onError?.('Erreur lors du scan du QR code: ' + (error.message || JSON.stringify(error)));
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>Votre appareil ne supporte pas l'accès à la caméra</p>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-700">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">Accès à la caméra requis</p>
            <p className="text-sm">Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour scanner les tickets</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="aspect-square max-w-sm mx-auto overflow-hidden rounded-lg">
        {hasPermission && (
          <QrScanner
            onDecode={onScan}
            onError={handleError}
            containerStyle={{ borderRadius: '0.5rem', height: 'auto' }}
            videoStyle={{ objectFit: 'cover', width: '100%', height: '100%' }}
            constraints={{
              facingMode: 'environment',
              aspectRatio: 1
            }}
          />
        )}
      </div>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-800">
            Placez le code QR du ticket dans le cadre pour le scanner
          </p>
        </div>
      </div>
    </div>
  );
}