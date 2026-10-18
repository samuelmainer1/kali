export const periodLabels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
};

export function periodLabel(type) {
    return periodLabels[type] || type;
}
