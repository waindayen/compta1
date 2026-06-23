import React from 'react';
import BaseDashboard from '../BaseDashboard';
import PrinterConfig from '../../../components/printer/PrinterConfig';
import PrinterTestPage from '../../../components/printer/PrinterTestPage';
import PrinterHelp from '../../../components/printer/PrinterHelp';

export default function PrinterSettings() {
  return (
    <BaseDashboard title="Configuration de l'imprimante">
      <div className="space-y-6">
        <PrinterConfig />
        <PrinterTestPage />
        <PrinterHelp />
      </div>
    </BaseDashboard>
  );
}