const router = require('express').Router();
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { gradeFor, remarkFor } = require('../utils/grading');

router.use(authRequired);

// Build ranked results for a stream OR whole form, for given term/year.
async function buildRanking({ stream_id = null, form_level = null, term, academic_year }) {
  const where = []; const p = [];
  if (stream_id)  { where.push('s.stream_id = ?'); p.push(stream_id); }
  if (form_level) { where.push('st.form_level = ?'); p.push(form_level); }
  where.push('sc.term = ?'); p.push(term);
  where.push('sc.academic_year = ?'); p.push(academic_year);

  const [rows] = await db.query(`
    SELECT s.id AS student_id, s.admission_no, s.first_name, s.last_name,
           st.id AS stream_id, st.name AS stream_name, st.form_level,
           sub.id AS subject_id, sub.code AS subject_code, sub.name AS subject_name,
           sc.cat_score, sc.exam_score, sc.total_score, sc.grade
    FROM students s
    JOIN streams  st ON st.id = s.stream_id
    LEFT JOIN scores sc ON sc.student_id = s.id AND sc.term = ? AND sc.academic_year = ?
    LEFT JOIN subjects sub ON sub.id = sc.subject_id
    WHERE ${where.slice(0, -2).join(' AND ') || '1=1'}
    ORDER BY s.last_name, s.first_name
  `, [term, academic_year, ...p.slice(0, -2)]);

  // group by student
  const byStudent = new Map();
  for (const r of rows) {
    if (!byStudent.has(r.student_id)) {
      byStudent.set(r.student_id, {
        student_id: r.student_id, admission_no: r.admission_no,
        first_name: r.first_name, last_name: r.last_name,
        stream_id: r.stream_id, stream_name: r.stream_name, form_level: r.form_level,
        subjects: [], total: 0, count: 0,
      });
    }
    const s = byStudent.get(r.student_id);
    if (r.subject_id) {
      const total = Number(r.total_score) || 0;
      s.subjects.push({
        subject_id: r.subject_id, subject_code: r.subject_code, subject_name: r.subject_name,
        cat_score: Number(r.cat_score) || 0, exam_score: Number(r.exam_score) || 0,
        total, grade: r.grade || gradeFor(total),
      });
      s.total += total; s.count += 1;
    }
  }
  const students = [...byStudent.values()].map(s => ({
    ...s,
    average: s.count ? +(s.total / s.count).toFixed(2) : 0,
    average_grade: gradeFor(s.count ? s.total / s.count : 0),
    remark: remarkFor(s.count ? s.total / s.count : 0),
  }));

  // overall ranking (across whole result set — i.e. form if form_level passed, else stream)
  students.sort((a, b) => b.average - a.average);
  students.forEach((s, i) => { s.overall_position = i + 1; });

  // stream position
  const byStream = {};
  for (const s of students) (byStream[s.stream_id] ||= []).push(s);
  for (const sid of Object.keys(byStream)) {
    byStream[sid].sort((a, b) => b.average - a.average).forEach((s, i) => { s.stream_position = i + 1; });
  }

  return students;
}

// subject position within a stream
async function subjectPositions({ stream_id, term, academic_year }) {
  const [rows] = await db.query(`
    SELECT sc.student_id, sc.subject_id, sc.total_score
    FROM scores sc
    JOIN students s ON s.id = sc.student_id
    WHERE s.stream_id = ? AND sc.term = ? AND sc.academic_year = ?
  `, [stream_id, term, academic_year]);
  const bySub = {};
  for (const r of rows) (bySub[r.subject_id] ||= []).push(r);
  const pos = {}; // key student_id_subject_id -> position
  for (const sid of Object.keys(bySub)) {
    bySub[sid].sort((a, b) => Number(b.total_score) - Number(a.total_score))
      .forEach((r, i) => { pos[`${r.student_id}_${sid}`] = i + 1; });
  }
  return pos;
}



// GET /api/results/stream/:id?term=1&year=2025
router.get('/stream/:id', async (req, res, next) => {
  try {
    const term = Number(req.query.term) || 1;
    const academic_year = Number(req.query.year) || new Date().getFullYear();
    const [[stream]] = await db.query(`SELECT * FROM streams WHERE id = ?`, [req.params.id]);
    if (!stream) return res.status(404).json({ error: 'Stream not found' });

    const streamStudents = await buildRanking({ stream_id: req.params.id, term, academic_year });
    const formStudents   = await buildRanking({ form_level: stream.form_level, term, academic_year });
    const subjPos = await subjectPositions({ stream_id: req.params.id, term, academic_year });

    // merge form overall position into stream students
    const formPosMap = new Map(formStudents.map(s => [s.student_id, s.overall_position]));
    streamStudents.forEach(s => {
      s.form_position = formPosMap.get(s.student_id) || null;
      s.subjects.forEach(sub => {
        sub.position = subjPos[`${s.student_id}_${sub.subject_id}`] || null;
      });
    });

    // subject averages for the stream
    const subjAgg = {};
    for (const s of streamStudents) for (const sub of s.subjects) {
      (subjAgg[sub.subject_id] ||= { subject_id: sub.subject_id, subject_name: sub.subject_name, total: 0, count: 0 });
      subjAgg[sub.subject_id].total += sub.total; subjAgg[sub.subject_id].count += 1;
    }
    const subjectAverages = Object.values(subjAgg).map(s => ({
      ...s, average: s.count ? +(s.total / s.count).toFixed(2) : 0,
      grade: gradeFor(s.count ? s.total / s.count : 0),
    }));
    const overallAvg = streamStudents.length
      ? +(streamStudents.reduce((a, s) => a + s.average, 0) / streamStudents.length).toFixed(2) : 0;

    res.json({
      stream, term, academic_year,
      students: streamStudents,
      subject_averages: subjectAverages,
      overall_average: overallAvg,
      overall_grade: gradeFor(overallAvg),
    });
  } catch (e) { next(e); }
});

// GET /api/results/student/:id?term=1&year=2025
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
    const meForm = formRanking.find(s => s.student_id === student.id);
    if (me) me.subjects.forEach(sub => { sub.position = subjPos[`${student.id}_${sub.subject_id}`] || null; });

    res.json({
      student, term, academic_year,
      result: me || { subjects: [], total: 0, average: 0, average_grade: 'E', remark: 'No scores' },
      stream_position: me?.stream_position || null,
      stream_size: streamRanking.length,
      form_position: meForm?.overall_position || null,
      form_size: formRanking.length,
    });
  } catch (e) { next(e); }
});

// ==================== WHOLE FORM RESULTS ====================
// GET /api/results/form/:form_level?term=1&year=2025
router.get('/form/:form_level', async (req, res, next) => {
  try {
    const form_level = Number(req.params.form_level);
    const term = Number(req.query.term) || 1;
    const academic_year = Number(req.query.year) || new Date().getFullYear();

    if (![1,2,3,4].includes(form_level)) {
      return res.status(400).json({ error: "Form level must be 1-4" });
    }

    const students = await buildRanking({ 
      form_level, 
      term, 
      academic_year 
    });

    const totalStudents = students.length;
    const overallAverage = totalStudents 
      ? Number((students.reduce((sum, s) => sum + (s.average || 0), 0) / totalStudents).toFixed(2)) 
      : 0;

    res.json({
      form_level,
      term,
      academic_year,
      total_students: totalStudents,
      overall_average: overallAverage,
      overall_grade: gradeFor(overallAverage),
      students: students.sort((a, b) => b.average - a.average), // ranked
      subject_averages: [] // can be enhanced later
    });
  } catch (error) {
    next(error);
  }
});

module.exports = { router, buildRanking, subjectPositions };
router.buildRanking = buildRanking;
router.subjectPositions = subjectPositions;
module.exports = router;
module.exports.buildRanking = buildRanking;
module.exports.subjectPositions = subjectPositions;
