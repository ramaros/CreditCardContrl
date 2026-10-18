import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import AuthScreen from './AuthScreen';

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setLoading(false);
    }, error => {
      console.error('Erro ao verificar sessão do Firebase:', error);
      setUser(null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div role="status" className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Verificando sua sessão...</div>;
  }

  if (!auth) {
    return <div role="alert" className="min-h-screen flex items-center justify-center p-6">Firebase não configurado. Verifique as configurações do aplicativo.</div>;
  }

  if (!user) return <AuthScreen />;
  return <>{children}</>;
}
