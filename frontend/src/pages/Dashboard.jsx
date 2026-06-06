import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Users, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { GradeBadge } from '../lib/grading';

const COLORS = ['#0d7a5f', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

function Stat({ icon: Icon, label, value, sub, color = 'from-brand-600 to-brand-700' }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} text-white grid place-items-center`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-xs text-slate-500 uppercase font-semibold">{label}</div>
        <div className="text-2xl font-bold text-brand-800">{value}</div>
        {sub && <div className="text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)); }, []);
  if (!data) return <div className="text-brand-700">Loading dashboard…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Dashboard</h1>
        <p className="text-sm text-slate-500">School-wide overview & performance analytics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users}        label="Students" value={data.totals.students} />
        <Stat icon={BookOpen}     label="Subjects" value={data.totals.subjects} color="from-emerald-500 to-emerald-700" />
        <Stat icon={GraduationCap}label="Streams"  value={data.totals.streams}  color="from-teal-500 to-teal-700" />
        <Stat icon={TrendingUp}   label="School Average" value={`${data.general_average}`} sub={`Grade ${data.general_grade}`} color="from-green-500 to-green-700" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-brand-800 mb-4">Average Performance per Form</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data.form_averages}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="form" stroke="#064e3b" />
                <YAxis stroke="#064e3b" domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="average" fill="#0d7a5f" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-brand-800 mb-4">Subject Averages</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data.subject_averages}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                <XAxis dataKey="name" stroke="#064e3b" />
                <YAxis stroke="#064e3b" domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="average" stroke="#10b981" strokeWidth={3} dot={{ fill: '#0d7a5f' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-brand-800 mb-4">Students per Stream</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.stream_counts} dataKey="students" nameKey="name" outerRadius={90} label>
                  {data.stream_counts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-brand-800 mb-4">Top 5 Students</h3>
          {data.top_students.length === 0 ? (
            <p className="text-sm text-slate-500">No scores recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.top_students.map((s, i) => (
                <li key={s.id} className="flex items-center justify-between p-3 bg-brand-50/70 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white grid place-items-center font-bold text-sm">{i + 1}</div>
                    <div>
                      <div className="font-semibold text-brand-800">{s.name}</div>
                      <div className="text-xs text-slate-500">{s.admission_no} · {s.stream_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-brand-700">{s.average}</div>
                    <GradeBadge grade={s.average >= 80 ? 'A' : s.average >= 70 ? 'B' : s.average >= 60 ? 'C' : s.average >= 50 ? 'D' : 'E'} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
