export function formatCurrency(amount: number, currency: string = 'XAF'): string {
  // S'assurer que le montant est un nombre valide
  const validAmount = Number.isFinite(amount) ? amount : 0;
  
  const currencyMap: { [key: string]: { locale: string, currency: string } } = {
    'XAF': { locale: 'fr-FR', currency: 'XAF' },
    'EUR': { locale: 'fr-FR', currency: 'XAF' }, // Changed to XAF
    'USD': { locale: 'en-US', currency: 'USD' }
  };

  const { locale, currency: currencyCode } = currencyMap[currency] || currencyMap['XAF'];

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(validAmount);
}