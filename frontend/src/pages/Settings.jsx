import { useState } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { Lock } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [f, setF] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.post('/auth/change-password', f); toast.success('Password updated'); setF({ currentPassword:'', newPassword:'', confirmPassword:'' }); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-brand-800">Settings</h1>
        <p className="text-sm text-slate-500">Manage your administrator account</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 pb-4 border-b border-brand-100">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white grid place-items-center font-bold">A</div>
          <div>
            <div className="font-bold text-brand-800">{user?.name}</div>
            <div className="text-sm text-slate-500">{user?.email}</div>
            <div className="text-xs text-brand-600 mt-1">Role: {user?.role}</div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 mt-5">
          <h3 className="font-bold text-brand-800 flex items-center gap-2"><Lock size={16}/> Change password</h3>
          <div><label className="label">Current password</label>
            <input type="password" className="input" required value={f.currentPassword} onChange={e => setF({ ...f, currentPassword: e.target.value })}/>
          </div>
          <div><label className="label">New password</label>
            <input type="password" className="input" required minLength={6} value={f.newPassword} onChange={e => setF({ ...f, newPassword: e.target.value })}/>
          </div>
          <div><label className="label">Confirm password</label>
            <input type="password" className="input" required value={f.confirmPassword} onChange={e => setF({ ...f, confirmPassword: e.target.value })}/>
          </div>
          <button disabled={busy} className="btn-primary">{busy ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>
    </div>
  );
}
