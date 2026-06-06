const PDFDocument = require('pdfkit');
const { gradeFor } = require('./grading');   // ← Add this line

const BRAND = '#0d7a5f';
const LIGHT = '#ecfdf5';
const DARK  = '#064e3b';

function header(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 90).fill(BRAND);
  doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('IKONEX ACADEMY', 40, 28);
  doc.fontSize(10).font('Helvetica').text('Excellence in Education', 40, 56);
  doc.fontSize(13).font('Helvetica-Bold').text(title, 0, 30, { align: 'right', width: doc.page.width - 40 });
  doc.fontSize(9).font('Helvetica').text(subtitle, 0, 50, { align: 'right', width: doc.page.width - 40 });
  doc.fillColor('black').moveDown(2);
  doc.y = 110;
}

function tableRow(doc, x, y, widths, cells, opts = {}) {
  const h = opts.height || 22;
  if (opts.fill) { doc.rect(x, y, widths.reduce((a, b) => a + b, 0), h).fill(opts.fill); }
  doc.fillColor(opts.color || 'black').font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(opts.size || 9);
  let cx = x;
  cells.forEach((c, i) => {
    doc.text(String(c ?? ''), cx + 4, y + 6, { width: widths[i] - 8, align: opts.align?.[i] || 'left', ellipsis: true });
    cx += widths[i];
  });
  doc.fillColor('black');
  return y + h;
}

function generateStudentReport(payload, res) {
  const { student, result, stream_position, stream_size, form_position, form_size, term, academic_year } = payload;
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `attachment; filename="report_${student.admission_no}_T${term}_${academic_year}.pdf"`);
  doc.pipe(res);

  header(doc, `Student Report Card`, `Term ${term} · ${academic_year}`);

  // student info box
  doc.rect(40, doc.y, doc.page.width - 80, 70).fill(LIGHT).stroke(BRAND);
  doc.fillColor(DARK).fontSize(11).font('Helvetica-Bold');
  doc.text(`${student.first_name} ${student.last_name}`, 50, doc.y + 8);
  doc.font('Helvetica').fontSize(10).fillColor('black');
  doc.text(`Admission No: ${student.admission_no}`, 50, doc.y + 4);
  doc.text(`Stream: ${student.stream_name}    Form: ${student.form_level}    Gender: ${student.gender || '-'}`);
  doc.y += 20;

  // subjects table
  const widths = [30, 150, 60, 60, 60, 50, 60];
  const headers = ['#', 'Subject', 'CAT /30', 'Exam /70', 'Total /100', 'Grade', 'Position'];
  let y = tableRow(doc, 40, doc.y, widths, headers, { fill: BRAND, color: 'white', bold: true, height: 24 });
  result.subjects.forEach((s, i) => {
    y = tableRow(doc, 40, y, widths, [
      i + 1, s.subject_name, s.cat_score, s.exam_score, s.total, s.grade, s.position ? `#${s.position}` : '-'
    ], { fill: i % 2 ? '#f7fdfa' : 'white' });
  });

  // summary
  y += 10;
  doc.rect(40, y, doc.page.width - 80, 90).fill(LIGHT).stroke(BRAND);
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(11).text('Summary', 50, y + 8);
  doc.fillColor('black').font('Helvetica').fontSize(10);
  const ly = y + 28;
  doc.text(`Total Marks: ${result.total}`, 50, ly);
  doc.text(`Average: ${result.average} (${result.average_grade})`, 50, ly + 16);
  doc.text(`Stream Position: ${stream_position || '-'} / ${stream_size}`, 260, ly);
  doc.text(`Form Position: ${form_position || '-'} / ${form_size}`, 260, ly + 16);
  doc.font('Helvetica-Bold').text(`Teacher's Remark: `, 50, ly + 40, { continued: true })
     .font('Helvetica').text(result.remark);

  y += 110;
  doc.fontSize(8).fillColor('#666')
    .text(`Generated on ${new Date().toLocaleString()}`, 40, doc.page.height - 60, { align: 'center', width: doc.page.width - 80 });
  doc.text('Ikonex Academy · Student Management System', { align: 'center', width: doc.page.width - 80 });

  doc.end();
}

function generateClassReport(payload, res) {
  const { stream, term, academic_year, students, subject_averages, overall_average, overall_grade } = payload;
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `attachment; filename="class_report_${stream.name.replace(/\s/g, '_')}_T${term}_${academic_year}.pdf"`);
  doc.pipe(res);

  header(doc, `Class Performance Report`, `${stream.name} · Term ${term} · ${academic_year}`);

  // subjects list ordered by subject_averages
  const subs = subject_averages;
  const subjW = Math.max(40, Math.min(70, Math.floor((doc.page.width - 40 - 30 - 110 - 110 - 60 - 60) / Math.max(1, subs.length))));
  const fixedW = [30, 110, ...subs.map(() => subjW), 60, 60, 60];
  const headers = ['#', 'Student (Adm No)', ...subs.map(s => s.subject_name.slice(0, 10)), 'Total', 'Avg', 'Grade'];
  let y = tableRow(doc, 30, doc.y, fixedW, headers, { fill: BRAND, color: 'white', bold: true, height: 22, size: 8 });

  students.forEach((s, i) => {
    const subMap = Object.fromEntries(s.subjects.map(x => [x.subject_id, x]));
    const cells = [
      s.overall_position,
      `${s.last_name} ${s.first_name[0]}. (${s.admission_no})`,
      ...subs.map(sub => {
        const x = subMap[sub.subject_id];
        return x ? `${x.total} ${x.grade}` : '-';
      }),
      s.total, s.average, s.average_grade,
    ];
    y = tableRow(doc, 30, y, fixedW, cells, { fill: i % 2 ? '#f7fdfa' : 'white', size: 8, height: 18 });
    if (y > doc.page.height - 100) { doc.addPage({ size: 'A4', layout: 'landscape', margin: 30 }); y = 40; }
  });

  // averages row
  y += 6;
  const avgCells = ['', 'SUBJECT AVERAGE',
    ...subs.map(sub => `${sub.average} ${sub.grade}`),
    '', overall_average, overall_grade];
  y = tableRow(doc, 30, y, fixedW, avgCells, { fill: LIGHT, bold: true, size: 8, height: 22, color: DARK });

  y += 16;
  doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text(`Overall Class Average: ${overall_average} (${overall_grade})`, 30, y);
  doc.font('Helvetica').fillColor('black').fontSize(9).text(
    `Teacher's Comment: ${overall_average >= 80 ? 'Excellent performance from the class.'
      : overall_average >= 70 ? 'Well done — class is performing well.'
      : overall_average >= 60 ? 'Good progress — keep pushing.'
      : overall_average >= 50 ? 'Fair performance — more effort needed.'
      : 'Class needs significant improvement.'}`, 30, y + 18, { width: doc.page.width - 60 });

  doc.fontSize(8).fillColor('#666').text(
    `Generated on ${new Date().toLocaleString()} · Ikonex Academy SMS`,
    30, doc.page.height - 40, { align: 'center', width: doc.page.width - 60 });

  doc.end();
}

// ====================== FORM REPORT ======================
function generateFormReport(data, res) {
  const { form_level, term, academic_year, students, overall_average, overall_grade, total_students } = data;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Header
  doc.fontSize(22).text('IKONEX ACADEMY', { align: 'center' });
  doc.fontSize(16).text(`FORM ${form_level} OVERALL PERFORMANCE REPORT`, { align: 'center' });
  doc.fontSize(12).text(`Term ${term} • Academic Year ${academic_year}`, { align: 'center' });
  doc.moveDown(1);

  // Summary
  doc.fontSize(13).text(`Total Students: ${total_students}`, { align: 'center' });
  doc.text(`Overall Average: ${overall_average} (${overall_grade})`, { align: 'center' });
  doc.moveDown(2);

  // Table
  const tableTop = doc.y;
  const colWidths = [35, 75, 160, 55, 55, 50, 55];
  const headers = ['Rank', 'Adm No', 'Student Name', 'Stream', 'Total', 'Average', 'Grade'];

  doc.fontSize(10).font('Helvetica-Bold');
  let x = 50;
  headers.forEach((header, i) => {
    doc.text(header, x, tableTop, { width: colWidths[i], align: 'center' });
    x += colWidths[i];
  });

  doc.moveTo(50, tableTop + 15).lineTo(x, tableTop + 15).stroke();
  doc.moveDown(0.5);

  // Rows
  doc.font('Helvetica').fontSize(9);
  let y = tableTop + 35;

  students.forEach((s, index) => {
    if (y > 750) {
      doc.addPage();
      y = 50;
    }

    x = 50;
    const rowData = [
      (index + 1).toString(),
      s.admission_no,
      `${s.first_name} ${s.last_name}`,
      s.stream_name || '-',
      s.total || 0,
      s.average.toFixed(1),
      gradeFor(s.average)
    ];

    rowData.forEach((text, i) => {
      doc.text(text.toString(), x, y, { 
        width: colWidths[i], 
        align: i === 2 ? 'left' : 'center' 
      });
      x += colWidths[i];
    });

    y += 18;
  });

  doc.end();
  doc.pipe(res);
}

module.exports = { 
  generateStudentReport, 
  generateClassReport, 
  generateFormReport 
};
