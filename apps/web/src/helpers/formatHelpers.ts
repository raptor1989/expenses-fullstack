export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2
    }).format(amount);
};

export const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('pl-PL');
};
