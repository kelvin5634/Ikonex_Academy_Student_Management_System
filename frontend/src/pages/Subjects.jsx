import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { Plus, Pencil, Trash2, Link as LinkIcon } from 'lucide-react';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [streams, setStreams] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code:'', name:'' });
  const [streamIds, setStreamIds] = useState([]);
  const [confirm, setConfirm] = useState(null);

  const load = () => api.get('/subjects').then(r => setSubjects(r.data));
  useEffect(() => { load(); api.get('/streams').then(r => setStreams(r.data)); }, []);

  const openCreate = () => { setEditing(null); setForm({ code:'', name:'' }); setModalOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm({ code: s.code, name: s.name }); setModalOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/subjects/${editing.id}`, form);
      else await api.post('/subjects', form);
      toast.success(editing ? 'Updated' : 'Created'); setModalOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openAssign = async (s) => {
    const { data } = await api.get(`/subjects/${s.id}`);
    setStreamIds(data.streams.map(x => x.id));
    setAssignOpen(s);
  };
  const saveAssign = async () => {
    try { await api.post(`/subjects/${assignOpen.id}/assign`, { stream_ids: streamIds }); toast.success('Assignments saved'); setAssignOpen(null); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const remove = async () => {
    try { await api.delete(`/subjects/${confirm.id}`); toast.success('Deleted'); setConfirm(null); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-800">Subjects</h1>
          <p className="text-sm text-slate-500">{subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={16}/> Add subject</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(s => (
          <div key={s.id} className="card">
            <div className="flex justify-between">
              <div>
                <div className="font-bold text-brand-800">{s.name}</div>
                <div className="text-xs font-mono text-brand-600">{s.code}</div>
              </div>
              <div className="flex gap-1">
                <button className="btn-ghost p-1.5" onClick={() => openAssign(s)}><LinkIcon size={16}/></button>
                <button className="btn-ghost p-1.5" onClick={() => openEdit(s)}><Pencil size={16}/></button>
                <button className="btn-ghost p-1.5 text-red-600 hover:bg-red-50" onClick={() => setConfirm(s)}><Trash2 size={16}/></button>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">Assigned to {s.stream_count} stream{s.stream_count !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} title={editing ? 'Edit Subject' : 'New Subject'} onClose={() => setModalOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          <div><label className="label">Code *</label><input className="input" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}/></div>
          <div><label className="label">Name *</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></div>
          <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn-primary">Save</button></div>
        </form>
      </Modal>

      <Modal open={!!assignOpen} title={`Assign "${assignOpen?.name}" to streams`} onClose={() => setAssignOpen(null)} size="lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {streams.map(s => (
            <label key={s.id} className="flex items-center gap-2 p-2 border border-brand-200 rounded-lg cursor-pointer hover:bg-brand-50">
              <input type="checkbox" checked={streamIds.includes(s.id)} onChange={e => setStreamIds(prev => e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id))} />
              <span className="text-sm">{s.name}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4"><button className="btn-secondary" onClick={() => setAssignOpen(null)}>Cancel</button><button className="btn-primary" onClick={saveAssign}>Save</button></div>
      </Modal>

      <ConfirmDialog open={!!confirm} title="Delete subject?" message={`This will also delete all scores in ${confirm?.name}.`} danger confirmText="Delete" onConfirm={remove} onCancel={() => setConfirm(null)}/>
    </div>
  );
}
