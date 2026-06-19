const locale = import.meta.env.VITE_LOCALE || 'pl-PL';
const defaultCurrency = import.meta.env.VITE_CURRENCY || 'PLN';

export const formatCurrency = (amount: number, currency: string = defaultCurrency): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2
    }).format(amount);
};

export const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString(locale);
};
