const router = require('express').Router();
const db = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM students st WHERE st.stream_id = s.id) AS student_count,
        (SELECT COUNT(*) FROM stream_subjects ss WHERE ss.stream_id = s.id) AS subject_count
      FROM streams s ORDER BY s.form_level, s.stream_letter
    `);
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [[stream]] = await db.query(`SELECT * FROM streams WHERE id = ?`, [req.params.id]);
    if (!stream) return res.status(404).json({ error: 'Not found' });
    const [students] = await db.query(
      `SELECT id, admission_no, first_name, last_name, gender FROM students WHERE stream_id = ? ORDER BY last_name`,
      [req.params.id]
    );
    const [subjects] = await db.query(
      `SELECT sub.* FROM subjects sub
       JOIN stream_subjects ss ON ss.subject_id = sub.id
       WHERE ss.stream_id = ? ORDER BY sub.name`,
      [req.params.id]
    );
    res.json({ ...stream, students, subjects });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { form_level, stream_letter } = req.body;
    if (!form_level || !stream_letter) return res.status(400).json({ error: 'Missing fields' });
    const name = `Form ${form_level}${String(stream_letter).toUpperCase()}`;
    const [r] = await db.query(
      `INSERT INTO streams (form_level, stream_letter, name) VALUES (?, ?, ?)`,
      [form_level, String(stream_letter).toUpperCase(), name]
    );
    res.json({ id: r.insertId, name });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Stream already exists' });
    next(e);
  }
});

module.exports = router;
