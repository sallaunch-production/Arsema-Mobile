import { useLanguage } from '../contexts/language-context';

export function formatCurrency(
  value: number | string,
  language: 'en' | 'id' = 'id',
  options?: Intl.NumberFormatOptions,
): string {
  const num = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
  const locale = language === 'en' ? 'en-US' : 'id-ID';
  return num.toLocaleString(locale, options);
}

export function formatCurrencyWithCode(
  value: number | string,
  currency: string,
  language: 'en' | 'id' = 'id',
  options?: Intl.NumberFormatOptions,
): string {
  return `${currency} ${formatCurrency(value, language, { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options })}`;
}

export function useFormatCurrency() {
  const { language } = useLanguage();

  const fmt = (value: number | string, options?: Intl.NumberFormatOptions) =>
    formatCurrency(value, language, options);

  const fmtWithCode = (value: number | string, currency: string, options?: Intl.NumberFormatOptions) =>
    formatCurrencyWithCode(value, currency, language, options);

  return { formatCurrency: fmt, formatCurrencyWithCode: fmtWithCode };
}
