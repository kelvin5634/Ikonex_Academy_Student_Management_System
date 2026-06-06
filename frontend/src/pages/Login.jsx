import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth.jsx';
import { GraduationCap, Mail, Lock } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { 
      await login(email, password); 
      toast.success('Welcome back!'); 
      nav('/'); 
    }
    catch (err) { 
      toast.error(err.response?.data?.error || 'Login failed'); 
    }
    finally { 
      setBusy(false); 
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 grid place-items-center font-bold text-xl">IA</div>
          <div className="font-bold text-xl">Ikonex Academy</div>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">Welcome back.<br/>Manage your school with ease.</h1>
          <p className="text-brand-100/90 mt-4 text-lg">Streams, students, subjects, scores, and beautiful reports — all in one place.</p>
        </div>
        <div className="text-brand-100/70 text-sm">© {new Date().getFullYear()} Ikonex Academy</div>
      </div>

      <div className="grid place-items-center p-6">
        <form onSubmit={submit} className="w-full max-w-md card" autoComplete="off">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-100 grid place-items-center mb-3">
              <GraduationCap className="text-brand-700" size={28}/>
            </div>
            <h2 className="text-2xl font-bold text-brand-800">Admin Login</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to continue</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-brand-600" />
                <input 
                  className="input pl-9" 
                  type="email"
                  placeholder="Enter your email"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  autoComplete="off"
                  name="new-email"           // ← Helps prevent autofill
                  required 
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-brand-600" />
                <input 
                  className="input pl-9" 
                  type="password" 
                  placeholder="Enter your password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  autoComplete="new-password"     // ← Strongest anti-autofill
                  name="new-password"
                  required 
                />
              </div>
            </div>
            <button disabled={busy} className="btn-primary w-full py-3 text-base">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>

          
        </form>
      </div>
    </div>
  );
}