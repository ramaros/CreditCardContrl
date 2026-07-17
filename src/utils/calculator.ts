import { Purchase, InstallmentInfo } from '../types';

/**
 * Adds a specific number of months to a "YYYY-MM" date string.
 */
export function addMonths(startMonthStr: string, monthsToAdd: number): string {
  if (!startMonthStr || !startMonthStr.includes('-')) return startMonthStr;
  const [year, month] = startMonthStr.split('-').map(Number);
  const zeroBasedMonth = month - 1;
  const totalMonths = zeroBasedMonth + monthsToAdd;
  const newYear = year + Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
}

/**
 * Calculates the final month of a purchase based on installments.
 */
export function getFinalMonth(startMonthStr: string, installmentsCount: number): string {
  return addMonths(startMonthStr, installmentsCount - 1);
}

/**
 * Generates all individual installments for a purchase, handling rounding on the last installment.
 */
export function getInstallmentsForPurchase(purchase: Purchase): InstallmentInfo[] {
  const installments: InstallmentInfo[] = [];
  const { totalValue, installmentsCount, startMonth, id, description, cardId, category, paidInstallments = [] } = purchase;

  if (installmentsCount <= 0) return [];

  // Calculate base installment value
  const baseValue = Math.floor((totalValue / installmentsCount) * 100) / 100;
  let accumulated = 0;

  for (let i = 1; i <= installmentsCount; i++) {
    const installmentMonth = addMonths(startMonth, i - 1);
    let value = baseValue;

    if (i === installmentsCount) {
      // The last installment absorbs any rounding discrepancies
      value = Math.round((totalValue - accumulated) * 100) / 100;
    } else {
      accumulated += baseValue;
    }

    installments.push({
      purchaseId: id,
      purchaseDescription: description,
      installmentNumber: i,
      totalInstallments: installmentsCount,
      value,
      month: installmentMonth,
      cardId,
      category,
      isPaid: paidInstallments.includes(i),
    });
  }

  return installments;
}

/**
 * Returns all installments from a list of purchases.
 */
export function getAllInstallments(purchases: Purchase[]): InstallmentInfo[] {
  return purchases.flatMap(getInstallmentsForPurchase);
}

/**
 * Formats a "YYYY-MM" string to a human-readable Portuguese format like "Julho de 2026".
 */
export function formatMonthYear(monthStr: string, short = false): string {
  if (!monthStr || !monthStr.includes('-')) return '';
  const [year, month] = monthStr.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthNamesShort = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const monthIdx = parseInt(month, 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return monthStr;

  if (short) {
    return `${monthNamesShort[monthIdx]}/${year.substring(2)}`;
  }
  return `${monthNames[monthIdx]} de ${year}`;
}

/**
 * Generates an array of "YYYY-MM" strings starting from current, going N months forward.
 */
export function getMonthRange(startMonthStr: string, count: number): string[] {
  const range: string[] = [];
  for (let i = 0; i < count; i++) {
    range.push(addMonths(startMonthStr, i));
  }
  return range;
}

/**
 * Formats standard BRL currency values.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Generates monthly projection data for charts.
 */
export function getMonthlyProjection(purchases: Purchase[], startMonth: string, duration = 12) {
  const installments = getAllInstallments(purchases);
  const monthRange = getMonthRange(startMonth, duration);

  return monthRange.map((month) => {
    const monthInstallments = installments.filter((inst) => inst.month === month);
    const total = monthInstallments.reduce((sum, inst) => sum + inst.value, 0);
    
    // Group by card
    const byCard: { [cardId: string]: number } = {};
    monthInstallments.forEach((inst) => {
      byCard[inst.cardId] = (byCard[inst.cardId] || 0) + inst.value;
    });

    return {
      month,
      label: formatMonthYear(month, true),
      total,
      byCard,
    };
  });
}
