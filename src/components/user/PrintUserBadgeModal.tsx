import React, { useRef, useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import UserBadge from './UserBadge';
import { useReactToPrint } from 'react-to-print';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintUserBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: string;
  };
}

export default function PrintUserBadgeModal({ isOpen, onClose, user }: PrintUserBadgeModalProps) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handlePrint = useReactToPrint({
    content: () => badgeRef.current,
    documentTitle: `Badge_${user.firstName}_${user.lastName}`,
    onAfterPrint: () => {
      console.log('Impression terminée');
    },
    pageStyle: `
      @page {
        size: 85mm 54mm;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .user-badge {
          width: 85mm;
          height: 54mm;
          page-break-inside: avoid;
          visibility: visible !important;
        }
        .badge-container {
          border: 1px solid black;
          padding: 4mm;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
        .badge-header {
          text-align: center;
          border-bottom: 1px solid black;
          padding-bottom: 2mm;
          margin-bottom: 3mm;
        }
        .badge-content {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          margin-bottom: 3mm;
        }
        .badge-info {
          width: 60%;
        }
        .badge-qr {
          width: 35%;
        }
        .badge-footer {
          text-align: center;
          border-top: 1px solid black;
          padding-top: 2mm;
          font-size: 8pt;
        }
      }
    `
  });

  const handleDownloadPDF = async () => {
    if (!badgeRef.current) return;

    try {
      setIsDownloading(true);
      
      // Créer un canvas à partir du badge
      const canvas = await html2canvas(badgeRef.current, {
        scale: 2, // Meilleure qualité
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF'
      });
      
      // Créer un PDF au format carte de crédit
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85, 54] // Format carte de crédit standard
      });
      
      // Ajouter l'image du canvas au PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 85, 54);
      
      // Télécharger le PDF
      pdf.save(`Badge_${user.firstName}_${user.lastName}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Badge utilisateur</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6">
            {/* Aperçu du badge */}
            <UserBadge ref={badgeRef} user={user} />
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Imprimer
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Génération...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Télécharger en PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}