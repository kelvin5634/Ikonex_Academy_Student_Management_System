import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { GradeBadge } from '../lib/grading';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FileText } from 'lucide-react';

export default function Results() {
  const [streams, setStreams] = useState([]);
  const [viewMode, setViewMode] = useState('stream'); // 'stream' or 'form'
  const [formLevel, setFormLevel] = useState(1);
  const [filter, setFilter] = useState({ stream_id: '', term: 1, year: new Date().getFullYear() });
  const [data, setData] = useState(null);

  // Load streams
  useEffect(() => {
    api.get('/streams').then(r => {
      setStreams(r.data);
      if (r.data[0]) setFilter(f => ({ ...f, stream_id: r.data[0].id }));
    });
  }, []);

  // Load data based on view mode
  useEffect(() => {
    if (viewMode === 'stream' && filter.stream_id) {
      api.get(`/results/stream/${filter.stream_id}`, { 
        params: { term: filter.term, year: filter.year } 
      }).then(r => setData(r.data));
    } 
    else if (viewMode === 'form') {
      api.get(`/results/form/${formLevel}`, { 
        params: { term: filter.term, year: filter.year } 
      }).then(r => setData(r.data));
    }
  }, [viewMode, filter.stream_id, formLevel, filter.term, filter.year]);

  const downloadPdf = () => {
    const token = localStorage.getItem('token');
    const params = `term=${filter.term}&year=${filter.year}&token=${token}`;

    if (viewMode === 'stream' && filter.stream_id) {
      window.open(`/api/reports/stream/${filter.stream_id}?${params}`, '_blank');
    } 
    else if (viewMode === 'form') {
      window.open(`/api/reports/form/${formLevel}?${params}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Results & Rankings</h1>
        <p className="text-sm text-slate-500">View per stream or whole form rankings</p>
      </div>

      {/* View Mode + Filters */}
      <div className="card grid sm:grid-cols-5 gap-3">
        <div>
          <label className="label">View</label>
          <select className="input" value={viewMode} onChange={e => setViewMode(e.target.value)}>
            <option value="stream">Per Stream</option>
            <option value="form">Whole Form</option>
          </select>
        </div>

        {viewMode === 'stream' ? (
          <div>
            <label className="label">Stream</label>
            <select className="input" value={filter.stream_id} onChange={e => setFilter({ ...filter, stream_id: e.target.value })}>
              {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        ) : (
          <div>
            <label className="label">Form Level</label>
            <select className="input" value={formLevel} onChange={e => setFormLevel(Number(e.target.value))}>
              {[1,2,3,4].map(f => <option key={f} value={f}>Form {f}</option>)}
            </select>
          </div>
        )}

        <div><label className="label">Term</label>
          <select className="input" value={filter.term} onChange={e => setFilter({ ...filter, term: Number(e.target.value) })}>
            {[1,2,3].map(t => <option key={t} value={t}>Term {t}</option>)}
          </select>
        </div>

        <div><label className="label">Year</label>
          <input type="number" className="input" value={filter.year} onChange={e => setFilter({ ...filter, year: Number(e.target.value) })}/>
        </div>

        <div className="flex items-end">
          <button className="btn-primary w-full" onClick={downloadPdf}>
            <FileText size={16}/> Download PDF
          </button>
        </div>
      </div>

      {data && (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card">
              <div className="text-xs uppercase font-semibold text-slate-500">
                {viewMode === 'form' ? 'Form' : 'Class'} Average
              </div>
              <div className="text-3xl font-bold text-brand-800 mt-1">{data.overall_average || data.average}</div>
              <GradeBadge grade={data.overall_grade || data.grade} />
            </div>
            <div className="card">
              <div className="text-xs uppercase font-semibold text-slate-500">Students</div>
              <div className="text-3xl font-bold text-brand-800 mt-1">{data.total_students || data.students?.length}</div>
            </div>
            <div className="card">
              <div className="text-xs uppercase font-semibold text-slate-500">Subjects</div>
              <div className="text-3xl font-bold text-brand-800 mt-1">{data.subject_averages?.length || '-'}</div>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="card p-0 overflow-x-auto">
            <div className="px-5 py-3 border-b border-brand-100 font-bold text-brand-800">
              Ranking — {viewMode === 'form' ? `Form ${data.form_level}` : data.stream?.name}, Term {data.term} {data.academic_year}
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">#</th>
                  <th className="th">Adm No</th>
                  <th className="th">Student</th>
                  <th className="th">Stream</th>
                  <th className="th">Total</th>
                  <th className="th">Average</th>
                  <th className="th">Grade</th>
                  <th className="th">Position</th>
                  <th className="th">Remark</th>
                </tr>
              </thead>
              <tbody>
                {data.students?.map((s, i) => (
                  <tr key={s.student_id || i} className="hover:bg-brand-50/50">
                    <td className="td font-bold">{s.overall_position || i+1}</td>
                    <td className="td font-mono">{s.admission_no}</td>
                    <td className="td font-medium">{s.first_name} {s.last_name}</td>
                    <td className="td">{s.stream_name}</td>
                    <td className="td">{s.total}</td>
                    <td className="td font-bold text-brand-800">{s.average}</td>
                    <td className="td"><GradeBadge grade={s.average_grade || s.grade} /></td>
                    <td className="td">#{s.stream_position || s.overall_position}</td>
                    <td className="td text-sm">{s.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}