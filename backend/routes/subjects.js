const router = require('express').Router();
const db = require('../db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM stream_subjects ss WHERE ss.subject_id = s.id) AS stream_count
      FROM subjects s ORDER BY s.name`);
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [[s]] = await db.query(`SELECT * FROM subjects WHERE id = ?`, [req.params.id]);
    if (!s) return res.status(404).json({ error: 'Not found' });
    const [streams] = await db.query(
      `SELECT st.* FROM streams st JOIN stream_subjects ss ON ss.stream_id = st.id
       WHERE ss.subject_id = ? ORDER BY st.form_level, st.stream_letter`,
      [req.params.id]
    );
    res.json({ ...s, streams });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) return res.status(400).json({ error: 'code and name required' });
    const [r] = await db.query(`INSERT INTO subjects (code, name) VALUES (?, ?)`, [code.toUpperCase(), name]);
    res.json({ id: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Subject already exists' });
    next(e);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { code, name } = req.body;
    await db.query(`UPDATE subjects SET code=?, name=? WHERE id=?`, [code.toUpperCase(), name, req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query(`DELETE FROM subjects WHERE id=?`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// assign / unassign
router.post('/:id/assign', async (req, res, next) => {
  try {
    const { stream_ids } = req.body; // array
    if (!Array.isArray(stream_ids)) return res.status(400).json({ error: 'stream_ids array required' });
    await db.query(`DELETE FROM stream_subjects WHERE subject_id = ?`, [req.params.id]);
    for (const sid of stream_ids) {
      await db.query(`INSERT IGNORE INTO stream_subjects (subject_id, stream_id) VALUES (?, ?)`, [req.params.id, sid]);
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
