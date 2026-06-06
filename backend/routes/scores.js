const router = require('express').Router();
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { gradeFor } = require('../utils/grading');

router.use(authRequired);

// list scores (filterable)
router.get('/', async (req, res, next) => {
  try {
    const { student_id, subject_id, stream_id, term, academic_year } = req.query;
    const where = []; const p = [];
    if (student_id) { where.push('sc.student_id = ?'); p.push(student_id); }
    if (subject_id) { where.push('sc.subject_id = ?'); p.push(subject_id); }
    if (stream_id)  { where.push('st.id = ?');        p.push(stream_id); }
    if (term)       { where.push('sc.term = ?');      p.push(term); }
    if (academic_year) { where.push('sc.academic_year = ?'); p.push(academic_year); }
    const wsql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await db.query(
      `SELECT sc.*, s.first_name, s.last_name, st.name AS stream_name, sub.name AS subject_name, sub.code AS subject_code
       FROM scores sc
       JOIN students s ON s.id = sc.student_id
       JOIN streams st ON st.id = s.stream_id
       JOIN subjects sub ON sub.id = sc.subject_id
       ${wsql}
       ORDER BY sc.admission_no, sub.name`,
      p
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// create / upsert single score
router.post('/', async (req, res, next) => {
  try {
    const { student_id, subject_id, term, academic_year, cat_score = 0, exam_score = 0 } = req.body;
    if (!student_id || !subject_id || !term || !academic_year)
      return res.status(400).json({ error: 'student_id, subject_id, term, academic_year required' });
    const cat = Number(cat_score), ex = Number(exam_score);
    if (cat < 0 || cat > 30) return res.status(400).json({ error: 'CAT must be 0-30' });
    if (ex < 0 || ex > 70)   return res.status(400).json({ error: 'Exam must be 0-70' });

    const [[student]] = await db.query(`SELECT admission_no FROM students WHERE id = ?`, [student_id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const grade = gradeFor(cat + ex);

    // prevent duplicate
    const [exist] = await db.query(
      `SELECT id FROM scores WHERE student_id=? AND subject_id=? AND term=? AND academic_year=?`,
      [student_id, subject_id, term, academic_year]
    );
    if (exist.length) return res.status(409).json({ error: 'Score already exists for this term — use update instead' });

    const [r] = await db.query(
      `INSERT INTO scores (admission_no, student_id, subject_id, term, academic_year, cat_score, exam_score, grade)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [student.admission_no, student_id, subject_id, term, academic_year, cat, ex, grade]
    );
    res.json({ id: r.insertId, grade });
  } catch (e) { next(e); }
});

// update score
router.put('/:id', async (req, res, next) => {
  try {
    const { cat_score = 0, exam_score = 0 } = req.body;
    const cat = Number(cat_score), ex = Number(exam_score);
    if (cat < 0 || cat > 30) return res.status(400).json({ error: 'CAT must be 0-30' });
    if (ex < 0 || ex > 70)   return res.status(400).json({ error: 'Exam must be 0-70' });
    const grade = gradeFor(cat + ex);
    await db.query(`UPDATE scores SET cat_score=?, exam_score=?, grade=? WHERE id=?`,
      [cat, ex, grade, req.params.id]);
    res.json({ ok: true, grade });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try { await db.query(`DELETE FROM scores WHERE id=?`, [req.params.id]); res.json({ ok: true }); }
  catch (e) { next(e); }
});

module.exports = router;
