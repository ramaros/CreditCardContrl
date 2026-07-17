import React, { useRef, useState } from 'react';
import { Card, Purchase, AppData } from '../types';
import { 
  Download, 
  Upload, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Info, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Copy, 
  Check, 
  Lock,
  Database,
  Smartphone,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase';

interface ImportExportProps {
  cards: Card[];
  purchases: Purchase[];
  onImport: (importedData: AppData) => void;
  syncId: string;
  cloudStatus: 'connected' | 'disconnected' | 'error' | 'syncing';
  onUpdateSyncId: (newSyncId: string) => void;
  onForcePushCloud: () => Promise<void>;
  onForcePullCloud: () => Promise<void>;
  pinEnabled: boolean;
  pinCode: string;
  onUpdatePin: (enabled: boolean, pin: string) => void;
}

export default function ImportExport({ 
  cards, 
  purchases, 
  onImport,
  syncId,
  cloudStatus,
  onUpdateSyncId,
  onForcePushCloud,
  onForcePullCloud,
  pinEnabled,
  pinCode,
  onUpdatePin
}: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error' | 'syncing'; message: string }>({
    type: 'idle',
    message: '',
  });

  const [inputSyncId, setInputSyncId] = useState(syncId);
  const [copied, setCopied] = useState(false);
  const [isEditingSyncId, setIsEditingSyncId] = useState(false);

  // Local state for PIN security
  const [isConfiguringPin, setIsConfiguringPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSetupError, setPinSetupError] = useState('');
  const [pinSetupSuccess, setPinSetupSuccess] = useState('');
  
  const [isDisablingPin, setIsDisablingPin] = useState(false);
  const [pinToDisable, setPinToDisable] = useState('');
  const [disableError, setDisableError] = useState('');

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinSetupError('');
    setPinSetupSuccess('');

    if (!/^\d{4}$/.test(newPin)) {
      setPinSetupError('O PIN deve conter exatamente 4 dígitos numéricos.');
      return;
    }

    if (newPin !== confirmPin) {
      setPinSetupError('Os PINs digitados não são idênticos.');
      return;
    }

    onUpdatePin(true, newPin);
    setPinSetupSuccess('PIN configurado com sucesso! A proteção está ativa.');
    setIsConfiguringPin(false);
    setNewPin('');
    setConfirmPin('');
    
    // Clear success message after 5s
    setTimeout(() => setPinSetupSuccess(''), 5000);
  };

  const handleDisablePin = (e: React.FormEvent) => {
    e.preventDefault();
    setDisableError('');

    if (pinToDisable !== pinCode) {
      setDisableError('PIN incorreto. Não foi possível desativar a segurança.');
      return;
    }

    onUpdatePin(false, '');
    setIsDisablingPin(false);
    setPinToDisable('');
    setPinSetupSuccess('Proteção por PIN desativada com sucesso.');
    setTimeout(() => setPinSetupSuccess(''), 5000);
  };


  const handleExport = () => {
    try {
      const dataToExport: AppData = { cards, purchases };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataToExport, null, 2)
      )}`;
      
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `parcelacard-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatus({
        type: 'success',
        message: 'Backup exportado com sucesso! Salve este arquivo para importar em outros dispositivos.',
      });
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 5000);
    } catch (err) {
      setStatus({ type: 'error', message: 'Erro ao exportar os dados.' });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];

    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target?.result as string);

        if (
          parsedData &&
          Array.isArray(parsedData.cards) &&
          Array.isArray(parsedData.purchases)
        ) {
          onImport(parsedData as AppData);
          setStatus({
            type: 'success',
            message: `Dados importados com sucesso! Carregamos ${parsedData.cards.length} cartões e ${parsedData.purchases.length} compras.`,
          });
          setTimeout(() => setStatus({ type: 'idle', message: '' }), 6000);
        } else {
          setStatus({
            type: 'error',
            message: 'O arquivo de backup é inválido ou está corrompido.',
          });
        }
      } catch (error) {
        setStatus({
          type: 'error',
          message: 'Erro ao processar o arquivo. Certifique-se de que é um arquivo JSON válido.',
        });
      }
    };

    fileReader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCopySyncId = () => {
    navigator.clipboard.writeText(syncId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSyncId = () => {
    if (inputSyncId.trim()) {
      onUpdateSyncId(inputSyncId.trim());
      setIsEditingSyncId(false);
      setStatus({
        type: 'success',
        message: 'Código de sincronização atualizado! Carregando dados da nova conta...',
      });
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 4000);
    }
  };

  const handleCloudPush = async () => {
    setStatus({ type: 'syncing', message: 'Enviando seus dados locais para o banco de dados nuvem Firestore...' });
    try {
      await onForcePushCloud();
      setStatus({
        type: 'success',
        message: 'Seus dados locais foram enviados com sucesso e estão salvos com segurança no Firestore!',
      });
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 5000);
    } catch (err) {
      setStatus({
        type: 'error',
        message: 'Erro ao enviar dados para a nuvem. Verifique sua conexão e tente novamente.',
      });
    }
  };

  const handleCloudPull = async () => {
    setStatus({ type: 'syncing', message: 'Carregando os dados da nuvem Firestore...' });
    try {
      await onForcePullCloud();
      setStatus({
        type: 'success',
        message: 'Sincronização concluída! Dados atualizados com as informações mais recentes da nuvem.',
      });
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 5000);
    } catch (err) {
      setStatus({
        type: 'error',
        message: 'Erro ao buscar dados da nuvem. Verifique se o código de sincronização está correto ou se há dados salvos.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. CLOUD FIRESTORE PERSISTENCE */}
      <div id="firestore-cloud-section" className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <h3 className="font-display font-semibold text-slate-800 text-lg flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              Sincronização em Nuvem (Google Firestore)
            </h3>
            <p className="text-xs text-slate-500">
              Mantenha seus cartões e compras parceladas sincronizados de forma segura na nuvem entre celular e computador.
            </p>
          </div>

          <div>
            {isFirebaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-150 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Firestore Ativo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Modo Offline Local
              </span>
            )}
          </div>
        </div>

        {isFirebaseConfigured ? (
          <div className="space-y-5">
            {/* Sync Key Management */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">ID de Sincronização Único</span>
                  <p className="text-xs text-slate-400">
                    Copie este código para sintonizar a mesma conta em outro dispositivo (celular, tablet ou PC).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isEditingSyncId ? (
                    <div className="flex items-center gap-1.5 w-full md:w-auto">
                      <input
                        type="text"
                        value={inputSyncId}
                        onChange={(e) => setInputSyncId(e.target.value)}
                        className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono w-48"
                        placeholder="Insira um ID"
                      />
                      <button
                        onClick={handleSaveSyncId}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingSyncId(false);
                          setInputSyncId(syncId);
                        }}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-mono text-xs text-slate-700 flex items-center gap-1 shadow-sm">
                        <span>{syncId}</span>
                      </div>
                      <button
                        onClick={handleCopySyncId}
                        className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors shadow-sm cursor-pointer"
                        title="Copiar ID de Sincronização"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setIsEditingSyncId(true)}
                        className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs text-slate-600 font-semibold shadow-sm cursor-pointer"
                      >
                        Mudar Conta / ID
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cloud Pull & Push Commands */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pull Cloud Data */}
              <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/20 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Cloud className="w-4.5 h-4.5 text-indigo-500" />
                    Baixar Dados da Nuvem
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Substitui seus cartões e compras locais pelas informações que estão salvas no banco de dados Firestore neste ID.
                  </p>
                </div>
                <button
                  onClick={handleCloudPull}
                  className="w-full py-2.5 bg-white border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  Sincronizar e Baixar da Nuvem
                </button>
              </div>

              {/* Push Local Data */}
              <div className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/10 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                    Enviar Dados Locais para Nuvem
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Salva todas as suas compras e cartões atuais no Firestore sob este ID, mesclando e garantindo que as modificações fiquem salvas na nuvem.
                  </p>
                </div>
                <button
                  onClick={handleCloudPush}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Salvar Dados Locais na Nuvem
                </button>
              </div>
            </div>

            {/* Live Status indicator */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-2.5 text-xs text-slate-500">
              <Info className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                <strong>Sincronização em Tempo Real:</strong> Suas alterações de adição, edição e deleção de compras e cartões são sincronizadas <strong>automaticamente</strong> com o Firestore sempre que você as realiza!
              </span>
            </div>
          </div>
        ) : (
          /* Firebase not configured banner helper */
          <div className="space-y-4">
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
                <CloudOff className="w-6 h-6" />
              </div>
              <div className="space-y-1 leading-relaxed">
                <h4 className="text-sm font-bold text-amber-900">Banco de Dados em Nuvem não Configurado</h4>
                <p className="text-xs text-amber-800">
                  O aplicativo está funcionando atualmente no <strong>Modo Offline Local</strong>. Seus dados estão 100% seguros, mas salvos apenas na memória do seu navegador atual.
                </p>
                <div className="text-xs text-amber-700 pt-2 space-y-1.5">
                  <p><strong>Como ativar o banco de dados nuvem Firestore para sincronizar?</strong></p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Configure as chaves do Firebase nas variáveis de ambiente (.env ou no painel de segredos do AI Studio).</li>
                    <li>As variáveis necessárias são: <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px] font-mono">VITE_FIREBASE_API_KEY</code>, <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px] font-mono">VITE_FIREBASE_PROJECT_ID</code> e <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px] font-mono">VITE_FIREBASE_APP_ID</code>.</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50/30 border border-indigo-150 rounded-xl p-4 flex gap-3 text-xs text-slate-600">
              <Lock className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-700 block">Privacidade e Criptografia do Firestore</span>
                <span>Seus dados são armazenados na nuvem em documentos associados ao seu ID exclusivo gerado localmente. Somente quem possuir o código exato de sincronização terá acesso para baixar ou modificar os cartões e compras registradas.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. MANUAL FILE BACKUP (JSON) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Backup Físico de Segurança (Arquivo JSON)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Se preferir não usar nuvem, você pode gerar backups físicos em formato de arquivo JSON para guardar no seu computador ou pen drive.
          </p>
        </div>

        {/* Info helper */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-700 leading-relaxed">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <strong>Recomendação de Backup:</strong> É sempre uma boa prática exportar e salvar um backup local em arquivo antes de fazer migrações de dados ou trocar de dispositivo.
          </div>
        </div>

        {/* Trigger Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Export Button */}
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4.5 h-4.5" />
            Exportar Backup Local (JSON)
          </button>

          {/* Import Button */}
          <button
            onClick={triggerFileInput}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200 cursor-pointer"
          >
            <Upload className="w-4.5 h-4.5" />
            Importar Backup Local (JSON)
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
        </div>

        {/* Status Messages */}
        {status.type !== 'idle' && (
          <div
            className={`flex items-start gap-2.5 p-3 rounded-xl text-xs transition-all ${
              status.type === 'success'
                ? 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                : status.type === 'syncing'
                ? 'bg-indigo-50 border border-indigo-100 text-indigo-800'
                : 'bg-red-50 border border-red-100 text-red-800'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
            ) : status.type === 'syncing' ? (
              <RefreshCw className="w-4.5 h-4.5 text-indigo-500 shrink-0 mt-0.5 animate-spin" />
            ) : (
              <ShieldAlert className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{status.message}</span>
          </div>
        )}
      </div>

      {/* 3. APP PIN PROTECTION */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-0.5">
            <h3 className="font-display font-semibold text-slate-800 text-lg flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-500" />
              Bloqueio de Segurança por PIN
            </h3>
            <p className="text-xs text-slate-500">
              Proteja seus dados contra visualizações de terceiros ao abrir o aplicativo no celular ou computador.
            </p>
          </div>

          <div>
            {pinEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-150">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Segurança Ativa (PIN)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Acesso Livre
              </span>
            )}
          </div>
        </div>

        {/* Setup messages */}
        {pinSetupSuccess && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
            <span>{pinSetupSuccess}</span>
          </div>
        )}

        {/* PIN Configuration Form */}
        {isConfiguringPin && (
          <form onSubmit={handleSavePin} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-4 animate-fade-in">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Configurar Novo PIN de Acesso</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-medium">Digite um PIN de 4 dígitos:</label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d*"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono text-center tracking-widest"
                  placeholder="****"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500 font-medium">Confirme o PIN de 4 dígitos:</label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="\d*"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono text-center tracking-widest"
                  placeholder="****"
                  required
                />
              </div>
            </div>

            {pinSetupError && (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {pinSetupError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
              >
                Salvar PIN e Ativar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfiguringPin(false);
                  setNewPin('');
                  setConfirmPin('');
                  setPinSetupError('');
                }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* PIN Disabling Form */}
        {isDisablingPin && (
          <form onSubmit={handleDisablePin} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-4 animate-fade-in">
            <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider">Desativar Proteção por PIN</h4>
            <div className="max-w-xs space-y-1.5">
              <label className="text-xs text-slate-500 font-medium">Digite o seu PIN atual para confirmar:</label>
              <input
                type="password"
                maxLength={4}
                pattern="\d*"
                inputMode="numeric"
                value={pinToDisable}
                onChange={(e) => setPinToDisable(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-mono text-center tracking-widest"
                placeholder="****"
                required
              />
            </div>

            {disableError && (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {disableError}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors"
              >
                Confirmar Desativação
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDisablingPin(false);
                  setPinToDisable('');
                  setDisableError('');
                }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Action triggers (when not editing) */}
        {!isConfiguringPin && !isDisablingPin && (
          <div className="flex flex-wrap gap-3">
            {pinEnabled ? (
              <>
                <button
                  onClick={() => setIsConfiguringPin(true)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                >
                  Alterar PIN Existente
                </button>
                <button
                  onClick={() => setIsDisablingPin(true)}
                  className="px-4 py-2.5 border border-rose-200 hover:border-rose-300 bg-rose-50/40 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Desativar Bloqueio por PIN
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsConfiguringPin(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Ativar e Configurar PIN de Acesso
              </button>
            )}
          </div>
        )}

        {/* Info notice */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs text-slate-500 leading-relaxed space-y-2">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>Segurança de Privacidade:</strong> O bloqueio é executado totalmente no seu navegador ou dispositivo e não é transmitido de forma aberta. O PIN serve para impedir bisbilhoteiros locais de visualizarem seus dados financeiros.
            </span>
          </div>
          <div className="pl-6 text-[11px] text-slate-400">
            <strong>Dica de Segurança:</strong> Caso precise formatar seu aparelho, lembre-se de salvar um arquivo de backup local (JSON) ou sintonizar a sincronização com o banco de dados em nuvem.
          </div>
        </div>
      </div>
    </div>
  );
}
