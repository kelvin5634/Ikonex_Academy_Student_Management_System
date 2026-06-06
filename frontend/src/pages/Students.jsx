import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { Plus, Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const empty = { admission_no:'', first_name:'', last_name:'', gender:'Male', dob:'', guardian_name:'', guardian_phone:'', stream_id:'' };

export default function Students() {
  const [list, setList] = useState({ data: [], page:1, pages:1, total:0 });
  const [streams, setStreams] = useState([]);
  const [search, setSearch] = useState('');
  const [streamFilter, setStreamFilter] = useState('');
  const [formFilter, setFormFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState(null);

  const load = () => {
    api.get('/students', { params: { search, stream_id: streamFilter, form_level: formFilter, page, limit: 10 } })
      .then(r => setList(r.data));
  };
  useEffect(() => { api.get('/streams').then(r => setStreams(r.data)); }, []);
  useEffect(() => { load(); }, [search, streamFilter, formFilter, page]);

  const openCreate = () => { setEditing(null); setForm(empty); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...empty, ...s, dob: s.dob ? s.dob.slice(0,10) : '' }); setModalOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/students/${editing.id}`, form); toast.success('Student updated'); }
      else { await api.post('/students', form); toast.success('Student registered'); }
      setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const remove = async () => {
    try { await api.delete(`/students/${confirm.id}`); toast.success('Deleted'); setConfirm(null); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-800">Students</h1>
          <p className="text-sm text-slate-500">{list.total} student{list.total !== 1 ? 's' : ''} registered</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16}/> Register student</button>
      </div>

      <div className="card flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-3 text-brand-600"/>
          <input className="input pl-9" placeholder="Search by name or admission no…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>
        <select className="input max-w-[150px]" value={formFilter} onChange={e => { setFormFilter(e.target.value); setPage(1); }}>
          <option value="">All forms</option>
          {[1,2,3,4].map(f => <option key={f} value={f}>Form {f}</option>)}
        </select>
        <select className="input max-w-[180px]" value={streamFilter} onChange={e => { setStreamFilter(e.target.value); setPage(1); }}>
          <option value="">All streams</option>
          {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full">
          <thead><tr>
            <th className="th">Adm No</th><th className="th">Name</th><th className="th">Gender</th>
            <th className="th">Stream</th><th className="th">Guardian</th><th className="th text-right">Actions</th>
          </tr></thead>
          <tbody>
            {list.data.map(s => (
              <tr key={s.id} className="hover:bg-brand-50/50">
                <td className="td font-mono font-semibold text-brand-800">{s.admission_no}</td>
                <td className="td font-medium">{s.first_name} {s.last_name}</td>
                <td className="td">{s.gender}</td>
                <td className="td">{s.stream_name}</td>
                <td className="td text-xs">{s.guardian_name || '-'}<br/><span className="text-slate-500">{s.guardian_phone || ''}</span></td>
                <td className="td text-right">
                  <div className="inline-flex gap-1">
                    <Link to={`/students/${s.id}`} className="btn-ghost p-1.5"><Eye size={16}/></Link>
                    <button className="btn-ghost p-1.5" onClick={() => openEdit(s)}><Pencil size={16}/></button>
                    <button className="btn-ghost p-1.5 text-red-600 hover:bg-red-50" onClick={() => setConfirm(s)}><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data.length === 0 && <tr><td className="td text-center text-slate-500" colSpan={6}>No students found.</td></tr>}
          </tbody>
        </table>
      </div>

      {list.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">Page {list.page} of {list.pages}</div>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16}/> Prev</button>
            <button className="btn-secondary" disabled={page >= list.pages} onClick={() => setPage(p => p + 1)}>Next <ChevronRight size={16}/></button>
          </div>
        </div>
      )}

      <Modal open={modalOpen} title={editing ? 'Edit Student' : 'Register Student'} onClose={() => setModalOpen(false)}>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Admission No *</label><input className="input" required value={form.admission_no} onChange={e => setForm({ ...form, admission_no: e.target.value })}/></div>
          <div>
            <label className="label">Stream *</label>
            <select className="input" required value={form.stream_id} onChange={e => setForm({ ...form, stream_id: e.target.value })}>
              <option value="">Choose…</option>
              {streams.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="label">First name *</label><input className="input" required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })}/></div>
          <div><label className="label">Last name *</label><input className="input" required value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })}/></div>
          <div>
            <label className="label">Gender</label>
            <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          <div><label className="label">DOB</label><input type="date" className="input" value={form.dob || ''} onChange={e => setForm({ ...form, dob: e.target.value })}/></div>
          <div><label className="label">Guardian name</label><input className="input" value={form.guardian_name || ''} onChange={e => setForm({ ...form, guardian_name: e.target.value })}/></div>
          <div><label className="label">Guardian phone</label><input className="input" value={form.guardian_phone || ''} onChange={e => setForm({ ...form, guardian_phone: e.target.value })}/></div>
          <div className="sm:col-span-2 flex justify-end gap-2 mt-3">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary">{editing ? 'Update' : 'Register'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} title="Delete student?" message={`This will permanently delete ${confirm?.first_name} ${confirm?.last_name} and all their scores.`} danger confirmText="Delete" onConfirm={remove} onCancel={() => setConfirm(null)}/>
    </div>
  );
}
