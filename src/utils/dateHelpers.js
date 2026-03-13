export const isDateRangeOverlap = (start1, end1, start2, end2) => {
  return start1 <= end2 && start2 <= end1;
};

export const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const generateBookingNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${date}-${random}`;
};
