// Helper function to format currency
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: 'PLN',
        minimumFractionDigits: 2
    }).format(amount);
};

// Helper function to format date
export const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('pl-PL');
};
