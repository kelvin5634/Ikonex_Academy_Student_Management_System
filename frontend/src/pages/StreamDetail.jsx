import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Users, BookOpen } from 'lucide-react';

export default function StreamDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/streams/${id}`).then(r => setData(r.data)); }, [id]);
  if (!data) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <Link to="/streams" className="inline-flex items-center gap-1 text-brand-700 hover:underline text-sm"><ArrowLeft size={14}/> Back to streams</Link>
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white grid place-items-center text-2xl font-bold">{data.stream_letter}</div>
        <div>
          <h1 className="text-2xl font-bold text-brand-800">{data.name}</h1>
          <div className="text-sm text-slate-500">Form {data.form_level} · Stream {data.stream_letter}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold text-brand-800 mb-3 flex items-center gap-2"><Users size={18}/> Students ({data.students.length})</h2>
          {data.students.length === 0 ? <p className="text-sm text-slate-500">No students assigned yet.</p> : (
            <ul className="divide-y divide-brand-100">
              {data.students.map(s => (
                <li key={s.id} className="py-2 flex justify-between">
                  <Link to={`/students/${s.id}`} className="font-medium text-brand-800 hover:underline">{s.first_name} {s.last_name}</Link>
                  <span className="text-xs text-slate-500">{s.admission_no}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="font-bold text-brand-800 mb-3 flex items-center gap-2"><BookOpen size={18}/> Subjects ({data.subjects.length})</h2>
          <div className="flex flex-wrap gap-2">
            {data.subjects.map(s => (
              <span key={s.id} className="px-3 py-1 bg-brand-50 text-brand-800 rounded-full text-sm font-medium border border-brand-200">{s.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
