const router = require('express').Router();
const db = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

// list with search/filter/pagination
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const streamId = req.query.stream_id;
    const formLevel = req.query.form_level;

    const where = [];
    const params = [];
    if (search) {
      where.push(`(CONCAT(s.first_name,' ',s.last_name) LIKE ? OR s.admission_no LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }
    if (streamId) { where.push(`s.stream_id = ?`); params.push(streamId); }
    if (formLevel) { where.push(`st.form_level = ?`); params.push(formLevel); }
    const wsql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT s.*, st.name AS stream_name, st.form_level
       FROM students s JOIN streams st ON st.id = s.stream_id
       ${wsql} ORDER BY s.last_name, s.first_name
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM students s JOIN streams st ON st.id = s.stream_id ${wsql}`,
      params
    );
    res.json({ data: rows, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [[student]] = await db.query(
      `SELECT s.*, st.name AS stream_name, st.form_level
       FROM students s JOIN streams st ON st.id = s.stream_id WHERE s.id = ?`,
      [req.params.id]
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const [scores] = await db.query(
      `SELECT sc.*, sub.name AS subject_name, sub.code AS subject_code
       FROM scores sc JOIN subjects sub ON sub.id = sc.subject_id
       WHERE sc.student_id = ? ORDER BY sc.academic_year DESC, sc.term DESC, sub.name`,
      [req.params.id]
    );
    res.json({ ...student, scores });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { admission_no, first_name, last_name, gender, dob, guardian_name, guardian_phone, stream_id } = req.body;
    if (!admission_no || !first_name || !last_name || !stream_id)
      return res.status(400).json({ error: 'admission_no, first_name, last_name, stream_id required' });
    const [r] = await db.query(
      `INSERT INTO students (admission_no, first_name, last_name, gender, dob, guardian_name, guardian_phone, stream_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [admission_no, first_name, last_name, gender || 'Other', dob || null, guardian_name || null, guardian_phone || null, stream_id]
    );
    res.json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Admission number already exists' });
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { first_name, last_name, gender, dob, guardian_name, guardian_phone, stream_id, admission_no } = req.body;
    await db.query(
      `UPDATE students SET admission_no=?, first_name=?, last_name=?, gender=?, dob=?, guardian_name=?, guardian_phone=?, stream_id=?
       WHERE id=?`,
      [admission_no, first_name, last_name, gender, dob || null, guardian_name || null, guardian_phone || null, stream_id, req.params.id]
    );
    // keep scores admission_no in sync
    await db.query(`UPDATE scores SET admission_no=? WHERE student_id=?`, [admission_no, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Admission number already exists' });
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query(`DELETE FROM students WHERE id = ?`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
