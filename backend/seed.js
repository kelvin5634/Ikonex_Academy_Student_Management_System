// Seeds: admin user, 16 streams (Form 1A..4D), starter subjects, assignments.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const root = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await root.query(schema);
  await root.end();

  const db = require('./db');

  // admin
  const hash = await bcrypt.hash('admin123', 10);
  await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    ['Administrator', 'admin@ikonex.com', hash]
  );

  // streams
  const letters = ['A', 'B', 'C', 'D'];
  for (let form = 1; form <= 4; form++) {
    for (const L of letters) {
      const name = `Form ${form}${L}`;
      await db.query(
        `INSERT IGNORE INTO streams (form_level, stream_letter, name) VALUES (?, ?, ?)`,
        [form, L, name]
      );
    }
  }

  // subjects
  const subjects = [
    ['ENG', 'English'],
    ['KIS', 'Kiswahili'],
    ['MAT', 'Mathematics'],
    ['BIO', 'Biology'],
    ['CHE', 'Chemistry'],
    ['PHY', 'Physics'],
    ['HIS', 'History'],
    ['GEO', 'Geography'],
    ['CRE', 'CRE'],
    ['BST', 'Business Studies'],
  ];
  for (const [code, name] of subjects) {
    await db.query(
      `INSERT IGNORE INTO subjects (code, name) VALUES (?, ?)`,
      [code, name]
    );
  }

  // assign all subjects to all streams by default
  const [streams] = await db.query(`SELECT id FROM streams`);
  const [subs] = await db.query(`SELECT id FROM subjects`);
  for (const s of streams) {
    for (const sub of subs) {
      await db.query(
        `INSERT IGNORE INTO stream_subjects (stream_id, subject_id) VALUES (?, ?)`,
        [s.id, sub.id]
      );
    }
  }

  console.log('✅ Seed complete. Admin: admin@ikonex.com / admin123');
  process.exit(0);
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
