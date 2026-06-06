-- Ikonex Academy SMS — database schema
CREATE DATABASE IF NOT EXISTS ikonex_academy_sms
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ikonex_academy_sms;

-- ---------- USERS (admin) ----------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- CLASS STREAMS ----------
CREATE TABLE IF NOT EXISTS streams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_level TINYINT NOT NULL,                -- 1..4
  stream_letter CHAR(1) NOT NULL,             -- A..D
  name VARCHAR(20) NOT NULL UNIQUE,           -- e.g. Form 1A
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- STUDENTS ----------
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admission_no VARCHAR(30) NOT NULL UNIQUE,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  gender ENUM('Male','Female','Other') DEFAULT 'Other',
  dob DATE NULL,
  guardian_name VARCHAR(120) NULL,
  guardian_phone VARCHAR(30) NULL,
  stream_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_stream FOREIGN KEY (stream_id) REFERENCES streams(id) ON DELETE RESTRICT,
  INDEX idx_student_stream (stream_id),
  INDEX idx_student_name (last_name, first_name)
) ENGINE=InnoDB;

-- ---------- SUBJECTS ----------
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- SUBJECT <-> STREAM assignment ----------
CREATE TABLE IF NOT EXISTS stream_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stream_id INT NOT NULL,
  subject_id INT NOT NULL,
  UNIQUE KEY uq_stream_subject (stream_id, subject_id),
  CONSTRAINT fk_ss_stream  FOREIGN KEY (stream_id)  REFERENCES streams(id)  ON DELETE CASCADE,
  CONSTRAINT fk_ss_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- SCORES ----------
CREATE TABLE IF NOT EXISTS scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admission_no VARCHAR(30) NOT NULL,          
  student_id   INT NOT NULL,
  subject_id   INT NOT NULL,
  term         TINYINT NOT NULL,              -- 1, 2, 3
  academic_year SMALLINT NOT NULL,            -- e.g. 2025
  cat_score    DECIMAL(5,2) NOT NULL DEFAULT 0,  -- 0..30
  exam_score   DECIMAL(5,2) NOT NULL DEFAULT 0,  -- 0..70
  total_score  DECIMAL(5,2) GENERATED ALWAYS AS (cat_score + exam_score) STORED,
  grade        CHAR(1) NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_score (student_id, subject_id, term, academic_year),
  CONSTRAINT fk_score_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  INDEX idx_score_admission (admission_no),
  INDEX idx_score_term_year (term, academic_year)
) ENGINE=InnoDB;
