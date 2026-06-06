import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { FileText, User, Users } from 'lucide-react';

export default function Reports() {
  const [streams, setStreams] = useState([]);
  const [students, setStudents] = useState([]);
  const [streamId, setStreamId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [term, setTerm] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => { api.get('/streams').then(r => setStreams(r.data)); }, []);
  useEffect(() => {
    if (streamId) api.get('/students', { params: { stream_id: streamId, limit: 200 } }).then(r => setStudents(r.data.data));
    else setStudents([]);
  }, [streamId]);

  const downloadStudent = () => {
    if (!studentId) return;
    const token = localStorage.getItem('token');
    window.open(`/api/reports/student/${studentId}?term=${term}&year=${year}&token=${token}`, '_blank');
  };
  const downloadClass = () => {
    if (!streamId) return;
    const token = localStorage.getItem('token');
    window.open(`/api/reports/stream/${streamId}?term=${term}&year=${year}&token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Reports</h1>
        <p className="text-sm text-slate-500">Generate beautiful PDF reports for individual students or full classes.</p>
      </div>

      <div className="card grid sm:grid-cols-4 gap-3">
        <div><label className="label">Stream</label>
          <select className="input" value={streamId} onChange={e => { setStreamId(e.target.value); setStudentId(''); }}>
            <option value="">Choose…</option>
            {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div><label className="label">Term</label>
          <select className="input" value={term} onChange={e => setTerm(Number(e.target.value))}>
            {[1,2,3].map(t => <option key={t} value={t}>Term {t}</option>)}
          </select>
        </div>
        <div><label className="label">Year</label>
          <input type="number" className="input" value={year} onChange={e => setYear(Number(e.target.value))}/>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 grid place-items-center"><User size={22}/></div>
            <div>
              <h2 className="font-bold text-brand-800">Individual Report Card</h2>
              <p className="text-xs text-slate-500">Scores, grades, positions, remarks</p>
            </div>
          </div>
          <label className="label">Student</label>
          <select className="input" value={studentId} onChange={e => setStudentId(e.target.value)} disabled={!streamId}>
            <option value="">{streamId ? 'Choose…' : 'Select a stream first'}</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.admission_no} — {s.first_name} {s.last_name}</option>)}
          </select>
          <button className="btn-primary w-full mt-4" onClick={downloadStudent} disabled={!studentId}>
            <FileText size={16}/> Download student PDF
          </button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 grid place-items-center"><Users size={22}/></div>
            <div>
              <h2 className="font-bold text-brand-800">Class Performance Report</h2>
              <p className="text-xs text-slate-500">Full ranking, subject averages, comments</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">Generates a landscape PDF with every student in the selected stream, ranked, with per-subject scores and grades, plus subject averages and overall class average.</p>
          <button className="btn-primary w-full mt-4" onClick={downloadClass} disabled={!streamId}>
            <FileText size={16}/> Download class PDF
          </button>
        </div>
      </div>
    </div>
  );
}
