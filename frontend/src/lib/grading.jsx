export const gradeFor = (s) => {
  s = Number(s) || 0;
  if (s >= 80) return 'A';
  if (s >= 70) return 'B';
  if (s >= 60) return 'C';
  if (s >= 50) return 'D';
  return 'E';
};
export const remarkFor = (s) => {
  s = Number(s) || 0;
  if (s >= 80) return 'Excellent';
  if (s >= 70) return 'Well done';
  if (s >= 60) return 'Good';
  if (s >= 50) return 'Pass';
  return 'Fail';
};
export const GradeBadge = ({ grade }) => {
  const g = String(grade || 'E').toUpperCase();
  return <span className={`badge-${g}`}>{g}</span>;
};
