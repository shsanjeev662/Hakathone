export const formatCurrency = (value: number) =>
  `NPR ${Math.round(value).toLocaleString('en-US')}`;

export const formatDate = (value?: string | Date | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
