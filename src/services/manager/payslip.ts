import { PayrollRecord } from './payroll';
import { Employee } from './employeeManagement';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CompanySettingsService } from '../admin/companySettings';

export interface PayslipData {
  payroll: PayrollRecord;
  employee: Employee;
  companyInfo: CompanyInfo;
  generatedDate: Date;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  registrationNumber?: string;
  taxId?: string;
  logo?: string;
}

export class PayslipService {
  static generatePayslipHTML(data: PayslipData): string {
    const { payroll, employee, companyInfo, generatedDate } = data;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fiche de Paie - ${employee.firstName} ${employee.lastName} - ${payroll.period}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: white;
      color: #333;
    }

    .payslip {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #333;
      padding: 30px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }

    .company-info, .employee-info {
      flex: 1;
    }

    .company-info h1 {
      font-size: 24px;
      margin-bottom: 10px;
      color: #2563eb;
    }

    .company-info p, .employee-info p {
      font-size: 12px;
      line-height: 1.6;
      color: #666;
    }

    .title {
      text-align: center;
      margin: 20px 0;
      font-size: 20px;
      font-weight: bold;
      text-transform: uppercase;
      color: #333;
    }

    .period {
      text-align: center;
      font-size: 14px;
      color: #666;
      margin-bottom: 30px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }

    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      border: 1px solid #ddd;
    }

    td {
      padding: 10px 12px;
      font-size: 13px;
      border: 1px solid #ddd;
    }

    td.amount {
      text-align: right;
      font-weight: 600;
    }

    .section-title {
      background: #e5e7eb;
      font-weight: bold;
      padding: 12px;
      margin-top: 20px;
      border: 1px solid #ddd;
      font-size: 14px;
      text-transform: uppercase;
    }

    .total-row {
      background: #f9fafb;
      font-weight: bold;
      font-size: 14px;
    }

    .net-pay-row {
      background: #dbeafe;
      font-weight: bold;
      font-size: 16px;
      color: #1e40af;
    }

    .summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 30px 0;
    }

    .summary-box {
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 8px;
      background: #f9fafb;
    }

    .summary-box h3 {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .summary-box p {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #333;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #666;
    }

    .signature {
      text-align: center;
      margin-top: 40px;
    }

    .signature-line {
      border-top: 1px solid #333;
      width: 200px;
      margin: 50px auto 10px;
    }

    @media print {
      body {
        padding: 0;
      }

      .payslip {
        border: none;
        max-width: 100%;
      }

      @page {
        margin: 1cm;
      }
    }
  </style>
</head>
<body>
  <div class="payslip">
    <div class="header">
      <div class="company-info">
        <h1>${companyInfo.name}</h1>
        <p>${companyInfo.address}</p>
        <p>Tél: ${companyInfo.phone}</p>
        <p>Email: ${companyInfo.email}</p>
        ${companyInfo.registrationNumber ? `<p>N° Enregistrement: ${companyInfo.registrationNumber}</p>` : ''}
        ${companyInfo.taxId ? `<p>N° Fiscal: ${companyInfo.taxId}</p>` : ''}
      </div>
      <div class="employee-info">
        <p><strong>Employé:</strong> ${employee.firstName} ${employee.lastName}</p>
        <p><strong>Poste:</strong> ${employee.position}</p>
        <p><strong>Département:</strong> ${employee.department}</p>
        <p><strong>Date d'embauche:</strong> ${format(employee.hireDate, 'dd/MM/yyyy')}</p>
        ${employee.email ? `<p><strong>Email:</strong> ${employee.email}</p>` : ''}
        ${employee.phone ? `<p><strong>Téléphone:</strong> ${employee.phone}</p>` : ''}
      </div>
    </div>

    <div class="title">Fiche de Paie</div>
    <div class="period">Période: ${payroll.period}</div>

    <div class="summary">
      <div class="summary-box">
        <h3>Heures Régulières</h3>
        <p>${payroll.regularHours.toFixed(2)} h</p>
      </div>
      <div class="summary-box">
        <h3>Heures Supplémentaires</h3>
        <p>${payroll.overtimeHours.toFixed(2)} h</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Montant (FCFA)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="2" class="section-title">Rémunération</td>
        </tr>
        <tr>
          <td>Salaire de base</td>
          <td class="amount">${payroll.baseSalary.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Paie régulière (${payroll.regularHours.toFixed(2)} heures)</td>
          <td class="amount">${payroll.regularPay.toFixed(2)}</td>
        </tr>
        ${payroll.overtimeHours > 0 ? `
        <tr>
          <td>Heures supplémentaires (${payroll.overtimeHours.toFixed(2)} heures)</td>
          <td class="amount">${payroll.overtimePay.toFixed(2)}</td>
        </tr>
        ` : ''}

        ${payroll.bonuses && payroll.bonuses.length > 0 ? `
        <tr>
          <td colspan="2" class="section-title">Primes et Bonus</td>
        </tr>
        ${payroll.bonuses.map(bonus => `
        <tr>
          <td>${bonus.label}</td>
          <td class="amount">+${bonus.amount.toFixed(2)}</td>
        </tr>
        `).join('')}
        ` : ''}

        <tr class="total-row">
          <td>Salaire Brut</td>
          <td class="amount">${payroll.grossPay.toFixed(2)}</td>
        </tr>

        <tr>
          <td colspan="2" class="section-title">Déductions</td>
        </tr>
        ${payroll.deductions.map(deduction => `
        <tr>
          <td>${deduction.label}${deduction.percentage ? ` (${deduction.percentage.toFixed(1)}%)` : ''}</td>
          <td class="amount">-${deduction.amount.toFixed(2)}</td>
        </tr>
        `).join('')}

        <tr class="total-row">
          <td>Total Déductions</td>
          <td class="amount">-${payroll.totalDeductions.toFixed(2)}</td>
        </tr>

        <tr class="net-pay-row">
          <td><strong>Salaire Net à Payer</strong></td>
          <td class="amount"><strong>${payroll.netPay.toFixed(2)}</strong></td>
        </tr>
      </tbody>
    </table>

    ${payroll.notes ? `
    <div style="margin: 20px 0; padding: 15px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px;">
      <strong>Notes:</strong> ${payroll.notes}
    </div>
    ` : ''}

    <div class="signature">
      <p>Signature de l'employeur</p>
      <div class="signature-line"></div>
      <p>Date: ${format(generatedDate, 'dd/MM/yyyy')}</p>
    </div>

    <div class="footer">
      <div>
        <p>Document généré le ${format(generatedDate, 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
      </div>
      <div>
        <p>Ce document est confidentiel</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  static printPayslip(html: string): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }

  static downloadPayslip(html: string, filename: string): void {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  static async getCompanyInfo(managerId: string): Promise<CompanyInfo> {
    const settings = await CompanySettingsService.getSettings(managerId);

    if (settings) {
      return {
        name: settings.companyName,
        address: settings.companyAddress,
        phone: settings.companyPhone,
        email: settings.companyEmail,
        logo: settings.companyLogoUrl
      };
    }

    const defaultSettings = CompanySettingsService.getDefaultSettings(managerId);
    return {
      name: defaultSettings.companyName,
      address: defaultSettings.companyAddress,
      phone: defaultSettings.companyPhone,
      email: defaultSettings.companyEmail,
      logo: defaultSettings.companyLogoUrl
    };
  }
}
