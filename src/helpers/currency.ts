const defaultInstance = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const instance = (digits: number = 2) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits });

export function currency(val: number | undefined, digits?: number) {
  const formatter = digits !== undefined ? instance(digits) : defaultInstance;
  return val || val === 0 ? formatter.format(val) : formatter.format(0);
}
