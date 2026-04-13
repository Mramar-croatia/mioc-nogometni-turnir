import { useEffect, useState } from 'react';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function Admins() {
  const [list, setList] = useState<{ uid: string; email: string }[]>([]);
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function load() {
    const snap = await getDocs(collection(db, 'admins'));
    setList(snap.docs.map((d) => ({ uid: d.id, email: (d.data() as any).email })));
  }

  useEffect(() => { load(); }, []);

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOk(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pwd);
      await setDoc(doc(db, 'admins', cred.user.uid), { email, addedAt: Date.now() });
      setOk(`Dodano: ${email}. (Vi ste sad prijavljeni kao novi korisnik — odjavite se i prijavite svojim računom ako želite nastaviti.)`);
      setEmail(''); setPwd('');
      load();
    } catch (ex: any) {
      setErr(ex.message ?? 'Greška');
    }
  }

  async function remove(uid: string) {
    if (!confirm('Ukloniti ovog organizatora?')) return;
    await deleteDoc(doc(db, 'admins', uid));
    load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-4 tracking-wide">Organizatori</h1>

      <div className="card p-4 mb-5">
        <h2 className="font-cond font-extrabold text-xs uppercase tracking-widest text-black/50 mb-3">Trenutni admini</h2>
        <ul className="divide-y divide-black/5">
          {list.map((a) => (
            <li key={a.uid} className="py-2 flex items-center justify-between">
              <span>{a.email}</span>
              <button onClick={() => remove(a.uid)} className="text-brand-red text-xs font-cond uppercase tracking-widest">Ukloni</button>
            </li>
          ))}
          {list.length === 0 && <li className="py-2 text-sm text-black/40">Nema admina.</li>}
        </ul>
      </div>

      <form onSubmit={addAdmin} className="card p-4">
        <h2 className="font-cond font-extrabold text-xs uppercase tracking-widest text-black/50 mb-3">Dodaj novog organizatora</h2>
        <input className="input mb-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input mb-3" type="password" placeholder="Privremena lozinka (min 6 znakova)" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={6} />
        {err && <div className="text-brand-red text-sm mb-2">{err}</div>}
        {ok && <div className="text-brand-blue text-sm mb-2">{ok}</div>}
        <button className="btn-primary w-full">Kreiraj admina</button>
        <p className="text-xs text-black/40 mt-2">
          Napomena: nakon dodavanja bit ćete prijavljeni kao novi korisnik. Odjavite se i ponovno prijavite svojim računom za nastavak rada.
        </p>
      </form>
    </div>
  );
}
