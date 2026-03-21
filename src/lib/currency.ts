/**
 * Format a monetary amount with the correct currency symbol and locale.
 * Uses the Intl.NumberFormat API for proper locale-aware formatting.
 *
 * Examples:
 *   formatCurrency(1250, "GBP") → "£1,250.00"
 *   formatCurrency(1250, "USD") → "$1,250.00"
 *   formatCurrency(1250, "EUR") → "€1,250.00"
 */
export function formatCurrency(amount: number, currency: string = "GBP"): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
    }).format(amount);
  } catch {
    return `${currency}${amount.toFixed(2)}`;
  }
}
