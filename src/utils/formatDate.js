// Xử lý định dạng ngày tháng. console.log(formatDate(" 01-04-2025")); // 01/04/2025
export const formatDate = dateString => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
