const router = require('express').Router();
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { gradeFor } = require('../utils/grading');

router.use(authRequired);

router.get('/', async (_req, res, next) => {
  try {
    const [[{ total_students }]] = await db.query(`SELECT COUNT(*) AS total_students FROM students`);
    const [[{ total_subjects }]] = await db.query(`SELECT COUNT(*) AS total_subjects FROM subjects`);
    const [[{ total_streams }]]  = await db.query(`SELECT COUNT(*) AS total_streams FROM streams`);

    const [byForm] = await db.query(`
      SELECT st.form_level AS form,
             COALESCE(AVG(sc.total_score), 0) AS average
      FROM streams st
      LEFT JOIN students s ON s.stream_id = st.id
      LEFT JOIN scores sc ON sc.student_id = s.id
      GROUP BY st.form_level ORDER BY st.form_level
    `);
    const formAverages = byForm.map(r => ({
      form: `Form ${r.form}`, average: +Number(r.average).toFixed(2),
      grade: gradeFor(Number(r.average)),
    }));

    const [[gen]] = await db.query(`SELECT COALESCE(AVG(total_score),0) AS avg FROM scores`);
    const general_average = +Number(gen.avg).toFixed(2);

    const [topStudents] = await db.query(`
      SELECT s.id, s.admission_no, CONCAT(s.first_name,' ',s.last_name) AS name,
             st.name AS stream_name, AVG(sc.total_score) AS average
      FROM students s
      JOIN streams st ON st.id = s.stream_id
      JOIN scores sc ON sc.student_id = s.id
      GROUP BY s.id ORDER BY average DESC LIMIT 5
    `);

    const [subjectAvg] = await db.query(`
      SELECT sub.name, COALESCE(AVG(sc.total_score),0) AS average
      FROM subjects sub LEFT JOIN scores sc ON sc.subject_id = sub.id
      GROUP BY sub.id ORDER BY average DESC
    `);

    const [streamCounts] = await db.query(`
      SELECT st.name, COUNT(s.id) AS students
      FROM streams st LEFT JOIN students s ON s.stream_id = st.id
      GROUP BY st.id ORDER BY st.form_level, st.stream_letter
    `);

    res.json({
      totals: { students: total_students, subjects: total_subjects, streams: total_streams },
      form_averages: formAverages,
      general_average, general_grade: gradeFor(general_average),
      top_students: topStudents.map(t => ({ ...t, average: +Number(t.average).toFixed(2) })),
      subject_averages: subjectAvg.map(s => ({ ...s, average: +Number(s.average).toFixed(2) })),
      stream_counts: streamCounts,
    });
  } catch (e) { next(e); }
});

module.exports = router;
