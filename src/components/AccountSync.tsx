import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import type { Card, Purchase } from '../types';
import { auth } from '../lib/firebase';

interface Props {
  cards: Card[];
  purchases: Purchase[];
  cloudStatus: string;
  onImportLegacy: () => Promise<void>;
  onPush: () => Promise<void>;
  onPull: () => Promise<void>;
  onImportFile: (cards: Card[], purchases: Purchase[]) => Promise<void>;
}

export default function AccountSync({ cards, purchases, cloudStatus, onImportLegacy, onPush, onPull, onImportFile }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function run(action: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(true); setMessage('');
    try { await action(); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Falha na operação.'); }
    finally { setBusy(false); }
  }
  function download() {
    const blob = new Blob([JSON.stringify({ cards, purchases }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'ParcelaCard-Backup.json'; link.click();
    URL.revokeObjectURL(url);
  }
  async function importFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    await run(async () => {
      const data = JSON.parse(await file.text()) as { cards?: unknown; purchases?: unknown };
      if (!Array.isArray(data.cards) || !Array.isArray(data.purchases)) throw new Error('Arquivo inválido: cartões e compras não encontrados.');
      if (!window.confirm('Importar os dados deste arquivo para sua conta? Os registros de mesmo ID serão atualizados.')) return;
      await onImportFile(data.cards as Card[], data.purchases as Purchase[]);
    }, 'Arquivo importado.');
    event.target.value = '';
  }
  return <section className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
    <h2 className="text-xl font-bold text-slate-900">Conta e sincronização</h2>
    <p className="text-sm text-slate-600">Conta: {auth?.currentUser?.email ?? 'Não identificada'}</p>
    <p className="text-sm text-slate-600">Nuvem: {cloudStatus}. Seus dados antigos não são apagados durante a importação.</p>
    <div className="flex flex-wrap gap-3">
      <button disabled={busy} onClick={() => run(onImportLegacy, 'Dados locais antigos copiados para sua conta.')} className="bg-amber-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">Importar dados antigos deste navegador</button>
      <button disabled={busy} onClick={() => run(onPush, 'Dados enviados.')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">Enviar dados atuais</button>
      <button disabled={busy} onClick={() => run(onPull, 'Dados da nuvem mesclados.')} className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg disabled:opacity-50">Baixar e mesclar da nuvem</button>
      <button onClick={download} className="bg-slate-100 px-4 py-2 rounded-lg">Exportar JSON</button>
      <label className="bg-slate-100 px-4 py-2 rounded-lg cursor-pointer">Importar JSON<input type="file" accept=".json" className="hidden" onChange={importFile}/></label>
    </div>
    <p className="text-xs text-slate-500">A importação antiga usa somente os dados locais deste navegador. Dados existentes apenas no Firestore antigo exigem migração administrativa separada.</p>
    {message && <p role="status" className="text-sm text-slate-800">{message}</p>}
    <button disabled={busy} onClick={() => auth && signOut(auth)} className="text-red-700 underline">Sair da conta</button>
  </section>;
}
