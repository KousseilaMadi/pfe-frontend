export function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr + 'Z').toLocaleString();
}
export function formatQuantity(quantity) {
    return Number(quantity).toLocaleString();
}