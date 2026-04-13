import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../../lib/firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      nav('/admin');
    } catch (ex: any) {
      setErr('Pogrešan email ili lozinka.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={submit} className="card p-6 w-full max-w-sm">
        <Link to="/" className="font-cond text-xs uppercase tracking-widest text-black/40">← Natrag</Link>
        <h1 className="font-display text-3xl mt-2 mb-1 tracking-wide">Admin prijava</h1>
        <p className="text-sm text-black/50 mb-5">Samo organizatori turnira.</p>
        <label className="block mb-3">
          <span className="font-cond text-xs uppercase tracking-widest text-black/50">Email</span>
          <input className="input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block mb-4">
          <span className="font-cond text-xs uppercase tracking-widest text-black/50">Lozinka</span>
          <input className="input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {err && <div className="text-brand-red text-sm mb-3">{err}</div>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Prijava...' : 'Prijavi se'}</button>
      </form>
    </div>
  );
}
