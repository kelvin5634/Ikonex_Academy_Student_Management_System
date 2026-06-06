import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, FileText } from 'lucide-react';
import { GradeBadge } from '../lib/grading';

export default function StudentDetail() {
  const { id } = useParams();
  const [s, setS] = useState(null);
  useEffect(() => { api.get(`/students/${id}`).then(r => setS(r.data)); }, [id]);
  if (!s) return <div>Loading…</div>;

  const downloadReport = (term, year) => {
    const token = localStorage.getItem('token');
    window.open(`/api/reports/student/${id}?term=${term}&year=${year}&token=${token}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <Link to="/students" className="inline-flex items-center gap-1 text-brand-700 hover:underline text-sm"><ArrowLeft size={14}/> Back to students</Link>

      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white grid place-items-center font-bold text-xl">
              {s.first_name[0]}{s.last_name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-brand-800">{s.first_name} {s.last_name}</h1>
              <div className="text-sm text-slate-500 font-mono">{s.admission_no}</div>
              <div className="text-sm text-brand-700 mt-1">{s.stream_name} · {s.gender}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => downloadReport(1, new Date().getFullYear())}>
              <FileText size={16}/> Download Students' Report
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-6 text-sm">
          <div><div className="label">Guardian</div><div>{s.guardian_name || '-'}</div></div>
          <div><div className="label">Guardian phone</div><div>{s.guardian_phone || '-'}</div></div>
          <div><div className="label">DOB</div><div>{s.dob ? new Date(s.dob).toLocaleDateString() : '-'}</div></div>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <div className="px-5 py-3 border-b border-brand-100 font-bold text-brand-800">Scores</div>
        <table className="w-full">
          <thead><tr>
            <th className="th">Adm No</th><th className="th">Subject</th><th className="th">Year</th><th className="th">Term</th>
            <th className="th">CAT</th><th className="th">Exam</th><th className="th">Total</th><th className="th">Grade</th>
          </tr></thead>
          <tbody>
            {s.scores.map(sc => (
              <tr key={sc.id}>
                <td className="td font-mono">{sc.admission_no}</td>
                <td className="td font-medium">{sc.subject_name}</td>
                <td className="td">{sc.academic_year}</td>
                <td className="td">{sc.term}</td>
                <td className="td">{sc.cat_score}</td>
                <td className="td">{sc.exam_score}</td>
                <td className="td font-bold text-brand-800">{sc.total_score}</td>
                <td className="td"><GradeBadge grade={sc.grade}/></td>
              </tr>
            ))}
            {s.scores.length === 0 && <tr><td className="td text-center text-slate-500" colSpan={8}>No scores recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
