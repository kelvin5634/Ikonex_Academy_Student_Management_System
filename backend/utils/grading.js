function gradeFor(score) {
  const s = Number(score) || 0;
  if (s >= 80) return 'A';
  if (s >= 70) return 'B';
  if (s >= 60) return 'C';
  if (s >= 50) return 'D';
  return 'E';
}

function remarkFor(score) {
  const s = Number(score) || 0;
  if (s >= 80) return 'Excellent';
  if (s >= 70) return 'Well done';
  if (s >= 60) return 'Good';
  if (s >= 50) return 'Pass';
  return 'Fail';
}

module.exports = { gradeFor, remarkFor };
