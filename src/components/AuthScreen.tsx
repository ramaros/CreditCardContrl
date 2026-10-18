import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

function describeError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/email-already-in-use': return 'Este e-mail já está cadastrado.';
    case 'auth/invalid-email': return 'Digite um e-mail válido.';
    case 'auth/weak-password': return 'Use uma senha mais forte, com pelo menos 6 caracteres.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'E-mail ou senha incorretos.';
    case 'auth/too-many-requests': return 'Muitas tentativas. Aguarde e tente novamente.';
    case 'auth/network-request-failed': return 'Falha de conexão. Verifique sua internet.';
    case 'auth/operation-not-allowed': return 'O login por e-mail ainda não está habilitado no Firebase.';
    case 'auth/unauthorized-domain': return 'Este domínio não está autorizado no Firebase Authentication.';
    default: return 'Não foi possível concluir a operação. Tente novamente.';
  }
}

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      setPassword('');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!auth || busy) return;
    if (!email.trim()) {
      setError('Digite seu e-mail antes de recuperar a senha.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage('Se o endereço estiver cadastrado, você receberá instruções para redefinir a senha.');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <section className="w-full max-w-md bg-white rounded-2xl p-7 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">ParcelaCard</h1>
        <p className="mt-2 text-slate-600">{mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            E-mail
            <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-slate-900" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Senha
            <input type="password" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required value={password} onChange={e => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-slate-900" />
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="text-sm text-green-700">{message}</p>}
          <button type="submit" disabled={busy || !auth}
            className="w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white disabled:opacity-50">
            {busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
        <div className="mt-5 flex flex-col gap-3 text-sm">
          {mode === 'login' && <button type="button" disabled={busy} onClick={resetPassword} className="text-indigo-700">Esqueci minha senha</button>}
          <button type="button" disabled={busy} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage(''); }}
            className="text-indigo-700">{mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}</button>
        </div>
        {!auth && <p role="alert" className="mt-4 text-sm text-red-700">Firebase não configurado.</p>}
      </section>
    </main>
  );
}
