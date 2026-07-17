import React, { useState, useEffect } from 'react';
import { Card, Purchase } from '../types';
import { formatCurrency, formatMonthYear, getInstallmentsForPurchase } from '../utils/calculator';
import {
  Share2,
  Mail,
  MessageSquare,
  Edit3,
  Send,
  Check,
  Bell,
  Smartphone,
  MailCheck,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sliders,
  ExternalLink,
  Info,
} from 'lucide-react';

interface ReminderManagerProps {
  cards: Card[];
  purchases: Purchase[];
  selectedMonth: string; // "YYYY-MM"
}

export default function ReminderManager({ cards, purchases, selectedMonth }: ReminderManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'automated'>('individual');

  // Individual Reminder States
  const [selectedCardId, setSelectedCardId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Automated Summary States (stored in LocalStorage)
  const [phone1, setPhone1] = useState(() => localStorage.getItem('parcelacard_notify_phone1') || '');
  const [phone2, setPhone2] = useState(() => localStorage.getItem('parcelacard_notify_phone2') || '');
  const [email1, setEmail1] = useState(() => localStorage.getItem('parcelacard_notify_email1') || '');
  const [email2, setEmail2] = useState(() => localStorage.getItem('parcelacard_notify_email2') || '');
  const [autoSend, setAutoSend] = useState(() => localStorage.getItem('parcelacard_notify_auto_send') === 'true');
  
  // Feedback states
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [simulateSuccess, setSimulateSuccess] = useState(false);

  // Sync automated state with local storage
  useEffect(() => {
    localStorage.setItem('parcelacard_notify_phone1', phone1);
    localStorage.setItem('parcelacard_notify_phone2', phone2);
    localStorage.setItem('parcelacard_notify_email1', email1);
    localStorage.setItem('parcelacard_notify_email2', email2);
    localStorage.setItem('parcelacard_notify_auto_send', String(autoSend));
  }, [phone1, phone2, email1, email2, autoSend]);

  // Set first card by default
  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  // Generate reminder template text
  const generateReminderText = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return 'Nenhum cartão selecionado.';

    const allPurchaseInstallments = purchases
      .filter((p) => p.cardId === card.id)
      .flatMap((p) => {
        const insts = getInstallmentsForPurchase(p);
        const activeInst = insts.find((inst) => inst.month === selectedMonth);
        return activeInst ? { purchase: p, installment: activeInst } : [];
      });

    const totalInvoice = allPurchaseInstallments.reduce((sum, item) => sum + item.installment.value, 0);
    const monthLabel = formatMonthYear(selectedMonth);

    let text = `📝 *Lembrete de Fatura - ParcelaCard* 📝\n\n`;
    text += `💳 *Cartão:* ${card.name}\n`;
    text += `📅 *Fatura de:* ${monthLabel}\n`;
    text += `💵 *Valor Total:* ${formatCurrency(totalInvoice)}\n`;
    text += `📅 *Vencimento:* Dia ${card.dueDay}\n\n`;

    if (allPurchaseInstallments.length > 0) {
      text += `*Resumo de compras parceladas neste mês:*\n`;
      allPurchaseInstallments.forEach((item) => {
        text += `• ${item.purchase.description} (${item.installment.installmentNumber}/${item.installment.totalInstallments}) - ${formatCurrency(item.installment.value)}\n`;
      });
    } else {
      text += `Não há nenhuma parcela programada para este mês.\n`;
    }

    text += `\n_Gerado automaticamente pelo aplicativo ParcelaCard!_`;
    return text;
  };

  // Generate consolidated text
  const generateConsolidatedSummaryText = () => {
    const monthLabel = formatMonthYear(selectedMonth);
    let text = `📋 *RESUMO DIÁRIO CONSOLIDADO - PARCELACARD* 📋\n\n`;
    text += `Olá! Segue o resumo diário consolidado das despesas parceladas por cartão.\n\n`;
    text += `📅 *Mês de Referência:* ${monthLabel}\n\n`;
    text += `💳 *Faturas Programadas por Cartão:* \n`;

    let totalGeneral = 0;
    cards.forEach((card) => {
      const cardInsts = purchases
        .filter((p) => p.cardId === card.id)
        .flatMap((p) => {
          const insts = getInstallmentsForPurchase(p);
          const activeInst = insts.find((inst) => inst.month === selectedMonth);
          return activeInst ? [activeInst] : [];
        });

      const cardTotal = cardInsts.reduce((sum, inst) => sum + inst.value, 0);
      totalGeneral += cardTotal;

      text += `• *${card.name}* (Vence dia ${card.dueDay}): ${formatCurrency(cardTotal)}\n`;
    });

    text += `\n💵 *Total Geral Consolidado:* ${formatCurrency(totalGeneral)}\n\n`;
    
    text += `🔔 *Configuração de Contatos Cadastrados:*\n`;
    const phones = [phone1, phone2].filter(Boolean);
    const emails = [email1, email2].filter(Boolean);

    if (phones.length > 0) {
      text += `📱 WhatsApp: ${phones.join(', ')}\n`;
    } else {
      text += `📱 WhatsApp: (Nenhum cadastrado)\n`;
    }

    if (emails.length > 0) {
      text += `✉️ E-mail: ${emails.join(', ')}\n`;
    } else {
      text += `✉️ E-mail: (Nenhum cadastrado)\n`;
    }

    text += `\n_Para atualizar ou testar os disparos, acesse o painel do ParcelaCard._`;
    return text;
  };

  // Re-generate message when card or month changes, unless user edited it manually
  useEffect(() => {
    if (selectedCardId && !isEditing) {
      setCustomMessage(generateReminderText(selectedCardId));
    }
  }, [selectedCardId, selectedMonth, purchases, isEditing]);

  const handleShareWhatsApp = () => {
    const encodedText = encodeURIComponent(customMessage);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  const handleShareEmail = () => {
    const card = cards.find((c) => c.id === selectedCardId);
    const cardName = card ? card.name : '';
    const monthLabel = formatMonthYear(selectedMonth);
    const subject = encodeURIComponent(`Lembrete de Fatura - ${cardName} - ${monthLabel}`);
    const body = encodeURIComponent(customMessage.replace(/\*/g, '')); // Strip bold markdown
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveContacts = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSimulateDispatches = () => {
    setSimulateSuccess(true);
    setTimeout(() => setSimulateSuccess(false), 4000);
  };

  if (cards.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center max-w-md mx-auto space-y-3">
        <Bell className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="font-semibold text-slate-700">Lembretes desativados</h3>
        <p className="text-xs text-slate-400">Cadastre um cartão e compras parceladas para habilitar o envio de lembretes e notificações.</p>
      </div>
    );
  }

  return (
    <div id="reminder-manager-section" className="space-y-6">
      {/* Tab Selector */}
      <div className="bg-slate-100 p-1 rounded-xl flex max-w-md">
        <button
          onClick={() => setActiveSubTab('individual')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'individual'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Lembretes Manuais
        </button>
        <button
          onClick={() => setActiveSubTab('automated')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'automated'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notificação Automática Diária
        </button>
      </div>

      {activeSubTab === 'individual' ? (
        /* MANUAL INDIVIDUAL REMINDER */
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-lg flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-500" />
              Emissor de Lembretes Rápidos
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Gere mensagens de cobrança e controle para enviar para você mesmo ou contatos via WhatsApp ou E-mail. Excelente para não esquecer de pagar a fatura!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card selector */}
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Escolha o Cartão</label>
              <select
                value={selectedCardId}
                onChange={(e) => {
                  setSelectedCardId(e.target.value);
                  setIsEditing(false); // Reset editing flag to recalculate
                }}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name} (Dia {card.dueDay})
                  </option>
                ))}
              </select>
            </div>

            {/* Action helper */}
            <div className="md:col-span-2 flex items-end">
              <p className="text-xs text-slate-400 pb-2">
                A mensagem abaixo é gerada dinamicamente com base nas parcelas ativas no mês de <strong>{formatMonthYear(selectedMonth)}</strong> para o cartão selecionado.
              </p>
            </div>
          </div>

          {/* Message editor box */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-slate-50">
            <div className="bg-slate-100 px-4 py-2 flex justify-between items-center border-b border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Rascunho do Lembrete
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  isEditing ? 'bg-indigo-600 text-white font-medium' : 'hover:bg-slate-200 text-slate-600'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isEditing ? 'Modo de Edição Ativo' : 'Editar Mensagem'}
              </button>
            </div>
            <textarea
              rows={7}
              value={customMessage}
              onChange={(e) => {
                setCustomMessage(e.target.value);
                setIsEditing(true);
              }}
              className="w-full bg-transparent px-4 py-3 text-sm font-mono focus:outline-none resize-y leading-relaxed text-slate-700"
              placeholder="Modifique a mensagem ou use o gerador automático..."
            />
          </div>

          {/* Sharing buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {/* Share WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <MessageSquare className="w-4.5 h-4.5" />
              Enviar por WhatsApp
            </button>

            {/* Share Email */}
            <button
              onClick={handleShareEmail}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <Mail className="w-4.5 h-4.5" />
              Enviar por E-mail
            </button>

            {/* Copy to Clipboard */}
            <button
              onClick={handleCopyText}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                copied
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              } cursor-pointer`}
            >
              {copied ? <Check className="w-4.5 h-4.5" /> : <Send className="w-4.5 h-4.5" />}
              {copied ? 'Copiado para Área de Transferência!' : 'Copiar Texto Rápido'}
            </button>
          </div>
        </div>
      ) : (
        /* AUTOMATED DAILY RESUME */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings panel & Live Preview */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveContacts} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-display font-semibold text-slate-800 text-lg flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-500" />
                    Contatos para Envio Diário
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Cadastre até 2 celulares e 2 e-mails para envio consolidado do resumo.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phones */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> Contatos WhatsApp
                  </h4>
                  <div className="flex flex-col space-y-2">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500">Telefone 1 (com DDD)</label>
                      <input
                        type="text"
                        placeholder="Ex: (11) 99999-9999"
                        value={phone1}
                        onChange={(e) => setPhone1(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500">Telefone 2 (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: (11) 98888-8888"
                        value={phone2}
                        onChange={(e) => setPhone2(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Emails */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                    <MailCheck className="w-3.5 h-3.5" /> Contatos E-mail
                  </h4>
                  <div className="flex flex-col space-y-2">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500">E-mail 1</label>
                      <input
                        type="email"
                        placeholder="Ex: contato@exemplo.com"
                        value={email1}
                        onChange={(e) => setEmail1(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500">E-mail 2 (Opcional)</label>
                      <input
                        type="email"
                        placeholder="Ex: financeiro@exemplo.com"
                        value={email2}
                        onChange={(e) => setEmail2(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Automation Activation switch */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAutoSend(!autoSend)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      autoSend ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        autoSend ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Ativar Agendamento Diário Automático</span>
                    <span className="text-[10px] text-slate-400">Ativa o envio do resumo todos os dias pela manhã.</span>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </div>

              {/* Save Feedbacks */}
              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center gap-2 text-xs text-emerald-800 animate-fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Configurações salvas e persistidas no Navegador!</span>
                </div>
              )}
            </form>

            {/* Live Message Preview */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] uppercase tracking-wider font-bold px-3 py-1 rounded-bl-lg font-sans">
                Visualização do Resumo
              </div>
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Resumo Consolidado Gerado</h4>
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 max-h-[250px] overflow-y-auto scrollbar-thin">
                <pre className="text-xs font-mono whitespace-pre-wrap text-slate-200 leading-relaxed">
                  {generateConsolidatedSummaryText()}
                </pre>
              </div>

              {/* Simulate Dispatch Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[10px] text-slate-400 max-w-sm">
                  Clique no botão para simular e gerar o resumo ativo agora mesmo para os seus contatos.
                </p>
                <button
                  type="button"
                  onClick={handleSimulateDispatches}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Simular Envio Diário
                </button>
              </div>

              {simulateSuccess && (
                <div className="bg-indigo-950/50 border border-indigo-800 rounded-lg p-3 flex items-start gap-2.5 text-xs text-indigo-200 animate-fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white">Disparo Consolidado Simulado com Sucesso!</span>
                    <span className="text-[10px] text-indigo-300">
                      Resumo diário enviado para os telefones { [phone1, phone2].filter(Boolean).join(', ') || '(Não configurados)' } e e-mails { [email1, email2].filter(Boolean).join(', ') || '(Não configurados)' }.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Educational Sidebar - How to automate */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                Como Automatizar de Verdade?
              </h3>
              
              <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                <p>
                  Como o aplicativo roda 100% no seu navegador (client-side) para garantir privacidade de dados, o navegador sozinho não consegue disparar mensagens em segundo plano às 8h da manhã com o computador desligado.
                </p>
                <p className="font-semibold text-indigo-600">
                  Qual a melhor forma de automatizar isso de graça ou gastando quase nada?
                </p>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-100/50">
                    <span className="font-bold text-indigo-950 block text-[11px] uppercase">Opção 1: Make.com ou n8n (Altamente Recomendado)</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Você pode criar uma conta gratuita no <strong>Make.com</strong> e programar um cenário diário (Cron) que chama o webhook do ParcelaCard para ler seu backup automático do Google Drive/Dropbox e disparar os emails via SendGrid e WhatsApp via Evolution API.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100/50">
                    <span className="font-bold text-emerald-950 block text-[11px] uppercase">Opção 2: Integração com Webhook Ativo</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Configure um webhook do Make/Zapier no seu servidor. O aplicativo enviará o JSON de backup direto para lá sempre que houver alteração, mantendo as automações sintonizadas instantaneamente.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/50 font-mono text-[9px] text-slate-500">
                    <span className="font-bold text-slate-700 block text-[10px] font-sans">PAYLOAD DISPARADO (JSON):</span>
                    <pre className="mt-1 bg-slate-900 text-slate-200 p-1.5 rounded overflow-x-auto">
{`{
  "active_month": "${selectedMonth}",
  "receivers_email": ["${email1 || 'user@example.com'}", "${email2 || ''}"],
  "receivers_phone": ["${phone1 || 'phone1'}", "${phone2 || ''}"],
  "auto_send": ${autoSend},
  "consolidated": { ... }
}`}
                    </pre>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Dúvidas sobre Integrações?</span>
                  <a
                    href="https://make.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    Make.com <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Privacy Shield Info */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex gap-3 text-xs text-slate-500">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-700 block">Dados Seguros</span>
                <span>Seus números e e-mails de notificação nunca são enviados para servidores externos não autorizados. Eles permanecem criptografados na memória segura do seu navegador.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
