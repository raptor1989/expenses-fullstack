const locale = (import.meta as any).env.VITE_LOCALE || 'pl-PL';
const currency = (import.meta as any).env.VITE_CURRENCY || 'PLN';

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2
    }).format(amount);
};

export const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString(locale);
};
