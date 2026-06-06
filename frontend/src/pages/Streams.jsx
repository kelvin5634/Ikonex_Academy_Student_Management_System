import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Users, BookOpen, Eye } from 'lucide-react';

export default function Streams() {
  const [streams, setStreams] = useState([]);
  useEffect(() => { api.get('/streams').then(r => setStreams(r.data)); }, []);

  const byForm = streams.reduce((acc, s) => { (acc[s.form_level] ||= []).push(s); return acc; }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Class Streams</h1>
        <p className="text-sm text-slate-500">All 16 streams (Form 1A–4D) are auto-created on seed.</p>
      </div>

      {Object.keys(byForm).sort().map(form => (
        <div key={form}>
          <h2 className="text-lg font-bold text-brand-700 mb-3">Form {form}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {byForm[form].map(s => (
              <Link key={s.id} to={`/streams/${s.id}`} className="card hover:shadow-lg transition group">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white grid place-items-center font-bold">
                    {s.stream_letter}
                  </div>
                  <Eye size={16} className="text-brand-500 group-hover:text-brand-700"/>
                </div>
                <div className="mt-3 font-bold text-brand-800">{s.name}</div>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Users size={12}/> {s.student_count}</span>
                  <span className="flex items-center gap-1"><BookOpen size={12}/> {s.subject_count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
