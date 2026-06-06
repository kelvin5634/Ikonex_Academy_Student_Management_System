const router = require('express').Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { buildRanking, subjectPositions } = require('./results');
const { gradeFor, remarkFor } = require('../utils/grading');
const { generateStudentReport, generateClassReport, generateFormReport } = require('../utils/pdf');

// allow token via query (so window.open downloads work)
function authFlexible(req, res, next) {
  const h = req.headers.authorization || '';
  const token = (h.startsWith('Bearer ') ? h.slice(7) : null) || req.query.token;
  if (!token) return res.status(401).json({ error: 'No token' });
  try { 
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev'); 
    next(); 
  }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

router.use(authFlexible);

// ====================== EXISTING ROUTES ======================
router.get('/student/:id', async (req, res, next) => {
  try {
    const term = Number(req.query.term) || 1;
    const academic_year = Number(req.query.year) || new Date().getFullYear();
    const [[student]] = await db.query(
      `SELECT s.*, st.id AS stream_id, st.name AS stream_name, st.form_level
       FROM students s JOIN streams st ON st.id = s.stream_id WHERE s.id = ?`, [req.params.id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const streamRanking = await buildRanking({ stream_id: student.stream_id, term, academic_year });
    const formRanking   = await buildRanking({ form_level: student.form_level, term, academic_year });
    const subjPos       = await subjectPositions({ stream_id: student.stream_id, term, academic_year });
    const me = streamRanking.find(s => s.student_id === student.id);
    if (me) me.subjects.forEach(sub => { sub.position = subjPos[`${student.id}_${sub.subject_id}`] || null; });
    const meForm = formRanking.find(s => s.student_id === student.id);

    generateStudentReport({
      student, term, academic_year,
      result: me || { subjects: [], total: 0, average: 0, average_grade: 'E', remark: 'No scores' },
      stream_position: me?.stream_position || null,
      stream_size: streamRanking.length,
      form_position: meForm?.overall_position || null,
      form_size: formRanking.length,
    }, res);
  } catch (e) { next(e); }
});

router.get('/stream/:id', async (req, res, next) => {
  try {
    const term = Number(req.query.term) || 1;
    const academic_year = Number(req.query.year) || new Date().getFullYear();
    const [[stream]] = await db.query(`SELECT * FROM streams WHERE id = ?`, [req.params.id]);
    if (!stream) return res.status(404).json({ error: 'Stream not found' });

    const students = await buildRanking({ stream_id: req.params.id, term, academic_year });
    const subjPos = await subjectPositions({ stream_id: req.params.id, term, academic_year });
    students.forEach(s => s.subjects.forEach(sub => {
      sub.position = subjPos[`${s.student_id}_${sub.subject_id}`] || null;
    }));

    const subjAgg = {};
    for (const s of students) for (const sub of s.subjects) {
      (subjAgg[sub.subject_id] ||= { subject_id: sub.subject_id, subject_name: sub.subject_name, total: 0, count: 0 });
      subjAgg[sub.subject_id].total += sub.total; subjAgg[sub.subject_id].count += 1;
    }
    const subject_averages = Object.values(subjAgg).map(s => ({
      ...s, average: s.count ? +(s.total / s.count).toFixed(2) : 0,
      grade: gradeFor(s.count ? s.total / s.count : 0),
    }));
    const overall_average = students.length
      ? +(students.reduce((a, s) => a + s.average, 0) / students.length).toFixed(2) : 0;

    generateClassReport({
      stream, term, academic_year, students, subject_averages,
      overall_average, overall_grade: gradeFor(overall_average),
    }, res);
  } catch (e) { next(e); }
});

// ====================== NEW: FORM LEVEL REPORT ======================
router.get('/form/:form_level', async (req, res, next) => {
  try {
    const form_level = Number(req.params.form_level);
    const term = Number(req.query.term) || 1;
    const academic_year = Number(req.query.year) || new Date().getFullYear();

    if (![1, 2, 3, 4].includes(form_level)) {
      return res.status(400).json({ error: 'Form level must be 1, 2, 3 or 4' });
    }

    const students = await buildRanking({ form_level, term, academic_year });

    if (students.length === 0) {
      return res.status(404).json({ error: 'No results found for this form' });
    }

    // Calculate overall statistics
    const overall_average = students.length
      ? +(students.reduce((sum, s) => sum + s.average, 0) / students.length).toFixed(2)
      : 0;

    const overall_grade = gradeFor(overall_average);

    generateFormReport({
      form_level,
      term,
      academic_year,
      students,
      overall_average,
      overall_grade,
      total_students: students.length
    }, res);

  } catch (e) {
    next(e);
  }
});

module.exports = router;