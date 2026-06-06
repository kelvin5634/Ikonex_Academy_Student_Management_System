import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { GradeBadge } from '../lib/grading';

export default function Scores() {
  const [streams, setStreams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState([]);
  const [filter, setFilter] = useState({ stream_id:'', subject_id:'', term:1, academic_year:new Date().getFullYear() });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ student_id:'', subject_id:'', term:1, academic_year:new Date().getFullYear(), cat_score:0, exam_score:0 });
  const [confirm, setConfirm] = useState(null);

  useEffect(() => { api.get('/streams').then(r => setStreams(r.data)); api.get('/subjects').then(r => setSubjects(r.data)); }, []);
  useEffect(() => {
    if (filter.stream_id) api.get('/students', { params: { stream_id: filter.stream_id, limit: 100 } }).then(r => setStudents(r.data.data));
    else setStudents([]);
  }, [filter.stream_id]);
  const loadScores = () => api.get('/scores', { params: filter }).then(r => setScores(r.data));
  useEffect(() => { loadScores(); }, [filter]);

  const openAdd = () => { setEditing(null); setForm({ student_id:'', subject_id: filter.subject_id || '', term: filter.term, academic_year: filter.academic_year, cat_score:0, exam_score:0 }); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s }); setModalOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/scores/${editing.id}`, form);
      else await api.post('/scores', form);
      toast.success(editing ? 'Score updated' : 'Score recorded');
      setModalOpen(false); loadScores();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const remove = async () => {
    try { await api.delete(`/scores/${confirm.id}`); toast.success('Deleted'); setConfirm(null); loadScores(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-800">Scores</h1>
          <p className="text-sm text-slate-500">Record CAT (0–30) + Exam (0–70) per subject per term</p>
        </div>
        <button className="btn-primary" onClick={openAdd}><Plus size={16}/> Record score</button>
      </div>

      <div className="card grid sm:grid-cols-4 gap-3">
        <div><label className="label">Stream</label>
          <select className="input" value={filter.stream_id} onChange={e => setFilter({ ...filter, stream_id: e.target.value })}>
            <option value="">All</option>
            {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div><label className="label">Subject</label>
          <select className="input" value={filter.subject_id} onChange={e => setFilter({ ...filter, subject_id: e.target.value })}>
            <option value="">All</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div><label className="label">Term</label>
          <select className="input" value={filter.term} onChange={e => setFilter({ ...filter, term: Number(e.target.value) })}>
            {[1,2,3].map(t => <option key={t} value={t}>Term {t}</option>)}
          </select>
        </div>
        <div><label className="label">Year</label>
          <input type="number" className="input" value={filter.academic_year} onChange={e => setFilter({ ...filter, academic_year: Number(e.target.value) })}/>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="th">Adm No</th><th className="th">Student</th><th className="th">Stream</th>
            <th className="th">Subject</th><th className="th">CAT</th><th className="th">Exam</th>
            <th className="th">Total</th><th className="th">Grade</th><th className="th text-right">Actions</th>
          </tr></thead>
          <tbody>
            {scores.map(s => (
              <tr key={s.id} className="hover:bg-brand-50/50">
                <td className="td font-mono font-semibold text-brand-800">{s.admission_no}</td>
                <td className="td font-medium">{s.first_name} {s.last_name}</td>
                <td className="td">{s.stream_name}</td>
                <td className="td">{s.subject_name}</td>
                <td className="td">{s.cat_score}</td>
                <td className="td">{s.exam_score}</td>
                <td className="td font-bold">{s.total_score}</td>
                <td className="td"><GradeBadge grade={s.grade}/></td>
                <td className="td text-right">
                  <div className="inline-flex gap-1">
                    <button className="btn-ghost p-1.5" onClick={() => openEdit(s)}><Pencil size={16}/></button>
                    <button className="btn-ghost p-1.5 text-red-600 hover:bg-red-50" onClick={() => setConfirm(s)}><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {scores.length === 0 && <tr><td className="td text-center text-slate-500" colSpan={9}>No scores. Use the filter above or add one.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Score' : 'Record Score'} onClose={() => setModalOpen(false)}>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          {!editing && (
            <>
              <div className="sm:col-span-2">
                <label className="label">Stream (to pick student)</label>
                <select className="input" value={filter.stream_id} onChange={e => setFilter({ ...filter, stream_id: e.target.value })}>
                  <option value="">Choose…</option>
                  {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label className="label">Student *</label>
                <select className="input" required value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
                  <option value="">Choose…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.admission_no} — {s.first_name} {s.last_name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label className="label">Subject *</label>
                <select className="input" required value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">Choose…</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div><label className="label">Term</label>
                <select className="input" value={form.term} onChange={e => setForm({ ...form, term: Number(e.target.value) })}>
                  {[1,2,3].map(t => <option key={t} value={t}>Term {t}</option>)}
                </select>
              </div>
              <div><label className="label">Year</label>
                <input type="number" className="input" value={form.academic_year} onChange={e => setForm({ ...form, academic_year: Number(e.target.value) })}/>
              </div>
            </>
          )}
          <div><label className="label">CAT (/30)</label>
            <input type="number" min="0" max="30" step="0.5" className="input" value={form.cat_score} onChange={e => setForm({ ...form, cat_score: e.target.value })}/>
          </div>
          <div><label className="label">Exam (/70)</label>
            <input type="number" min="0" max="70" step="0.5" className="input" value={form.exam_score} onChange={e => setForm({ ...form, exam_score: e.target.value })}/>
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary">{editing ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} title="Delete score?" danger confirmText="Delete" message="This score will be permanently removed." onConfirm={remove} onCancel={() => setConfirm(null)}/>
    </div>
  );
}
