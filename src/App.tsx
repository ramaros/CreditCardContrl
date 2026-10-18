import React, { useState, useEffect } from 'react';
import { Card, Purchase, AppData } from './types';
import { addMonths } from './utils/calculator';
import Dashboard from './components/Dashboard';
import CardWidget from './components/CardWidget';
import CardForm from './components/CardForm';
import PurchaseForm from './components/PurchaseForm';
import PurchaseList from './components/PurchaseList';
import AccountSync from './components/AccountSync';
import ReminderManager from './components/ReminderManager';
import PinLockScreen from './components/PinLockScreen';
import {
  CreditCard,
  Plus,
  LayoutDashboard,
  ShoppingBag,
  Bell,
  RefreshCw,
  FolderSync,
  Info,
  CalendarDays,
  Menu,
  X,
  Cloud,
  CloudOff,
  Database,
} from 'lucide-react';
import { auth } from './lib/firebase';
import { loadMyCards, loadMyPurchases, saveMyCard, saveMyPurchase, deleteMyCard, deleteMyPurchase, uploadMyData } from './lib/authDbService';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'purchases' | 'cards' | 'reminders' | 'sync'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data State
  const [cards, setCards] = useState<Card[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  // Cloud Sync State
  const uid = auth?.currentUser?.uid ?? '';
  const cacheKey = (type: 'cards' | 'purchases') => `parcelacard_account_${uid}_${type}`;
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'disconnected' | 'error' | 'syncing'>('syncing');

  // Modals & Edits
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);


  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null);

  // PIN lock protection state
  const [pinEnabled, setPinEnabled] = useState(() => localStorage.getItem('parcelacard_pin_enabled') === 'true');
  const [pinCode, setPinCode] = useState(() => localStorage.getItem('parcelacard_pin') || '');
  const [isLocked, setIsLocked] = useState(() => {
    const enabled = localStorage.getItem('parcelacard_pin_enabled') === 'true';
    const pin = localStorage.getItem('parcelacard_pin') || '';
    return enabled && pin.length === 4;
  });

  // Re-lock the app when page visibility changes (user locks screen or leaves tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const enabled = localStorage.getItem('parcelacard_pin_enabled') === 'true';
        const pin = localStorage.getItem('parcelacard_pin') || '';
        if (enabled && pin.length === 4) {
          setIsLocked(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleUpdatePin = (enabled: boolean, pin: string) => {
    setPinEnabled(enabled);
    setPinCode(pin);
    localStorage.setItem('parcelacard_pin_enabled', String(enabled));
    localStorage.setItem('parcelacard_pin', pin);
    if (!enabled) {
      setIsLocked(false);
    }
  };


  // Load only this authenticated account; never auto-import legacy records.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setCloudStatus('syncing');
      try {
        const [remoteCards, remotePurchases] = await Promise.all([loadMyCards(), loadMyPurchases()]);
        if (cancelled) return;
        setCards(remoteCards); setPurchases(remotePurchases);
        localStorage.setItem(cacheKey('cards'), JSON.stringify(remoteCards));
        localStorage.setItem(cacheKey('purchases'), JSON.stringify(remotePurchases));
        setCloudStatus('connected');
      } catch (error) {
        if (cancelled) return;
        console.error('Falha ao carregar conta:', error);
        setCloudStatus('error');
        try {
          setCards(JSON.parse(localStorage.getItem(cacheKey('cards')) || '[]'));
          setPurchases(JSON.parse(localStorage.getItem(cacheKey('purchases')) || '[]'));
        } catch { setCards([]); setPurchases([]); }
      }
    }
    void init();
    return () => { cancelled = true; };
  }, [uid]);

  function store(nextCards: Card[], nextPurchases: Purchase[]) {
    setCards(nextCards); setPurchases(nextPurchases);
    localStorage.setItem(cacheKey('cards'), JSON.stringify(nextCards));
    localStorage.setItem(cacheKey('purchases'), JSON.stringify(nextPurchases));
  }

  const saveCards = async (newCards: Card[], cardToSave?: Card) => {
    if (cardToSave) await saveMyCard(cardToSave);
    store(newCards, purchases);
  };
  const savePurchases = async (newPurchases: Purchase[], purchaseToSave?: Purchase) => {
    if (purchaseToSave) await saveMyPurchase(purchaseToSave);
    store(cards, newPurchases);
  };
  const handleSaveCard = (card: Card) => {
    const updated = cards.some(c => c.id === card.id) ? cards.map(c => c.id === card.id ? card : c) : [...cards, card];
    void saveCards(updated, card).catch(error => { console.error(error); alert('Não foi possível salvar o cartão na nuvem.'); });
    setShowCardForm(false); setCardToEdit(null);
  };
  const handleDeleteCard = async (cardId: string) => {
    if (!window.confirm('Excluir cartão e compras associadas?')) return;
    try {
      await deleteMyCard(cardId);
      for (const purchase of purchases.filter(p => p.cardId === cardId)) await deleteMyPurchase(purchase.id);
      store(cards.filter(c => c.id !== cardId), purchases.filter(p => p.cardId !== cardId));
    } catch (error) { console.error(error); alert('Não foi possível excluir o cartão na nuvem.'); }
  };
  const handleEditCardClick = (card: Card) => { setCardToEdit(card); setShowCardForm(true); };
  const handleSavePurchase = (purchase: Purchase) => {
    const updated = purchases.some(p => p.id === purchase.id) ? purchases.map(p => p.id === purchase.id ? purchase : p) : [...purchases, purchase];
    void savePurchases(updated, purchase).catch(error => { console.error(error); alert('Não foi possível salvar a compra na nuvem.'); });
    setShowPurchaseForm(false); setPurchaseToEdit(null);
  };
  const handleDeletePurchase = async (purchaseId: string) => {
    try {
      await deleteMyPurchase(purchaseId);
      store(cards, purchases.filter(p => p.id !== purchaseId));
    } catch (error) { console.error(error); alert('Não foi possível excluir a compra na nuvem.'); }
  };
  const handleEditPurchaseClick = (purchase: Purchase) => { setPurchaseToEdit(purchase); setShowPurchaseForm(true); };
  const handleToggleInstallmentPaid = (purchaseId: string, installmentNumber: number) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    const paid = purchase.paidInstallments || [];
    handleSavePurchase({ ...purchase, paidInstallments: paid.includes(installmentNumber) ? paid.filter(n => n !== installmentNumber) : [...paid, installmentNumber] });
  };

  const handleForcePullCloud = async () => {
    const [remoteCards, remotePurchases] = await Promise.all([loadMyCards(), loadMyPurchases()]);
    const mergedCards = [...cards.filter(c => !remoteCards.some(r => r.id === c.id)), ...remoteCards];
    const mergedPurchases = [...purchases.filter(p => !remotePurchases.some(r => r.id === p.id)), ...remotePurchases];
    store(mergedCards, mergedPurchases);
  };
  const handleForcePushCloud = async () => { await uploadMyData(cards, purchases); };
  const handleImportData = async (importedCards: Card[], importedPurchases: Purchase[]) => {
    await uploadMyData(importedCards, importedPurchases);
    store([...cards.filter(c => !importedCards.some(r => r.id === c.id)), ...importedCards],
      [...purchases.filter(p => !importedPurchases.some(r => r.id === p.id)), ...importedPurchases]);
  };
  const handleImportLegacy = async () => {
    const oldCards = JSON.parse(localStorage.getItem('parcelacard_cards') || '[]') as Card[];
    const oldPurchases = JSON.parse(localStorage.getItem('parcelacard_purchases') || '[]') as Purchase[];
    if (!Array.isArray(oldCards) || !Array.isArray(oldPurchases)) throw new Error('Dados locais antigos inválidos.');
    if (!oldCards.length && !oldPurchases.length) throw new Error('Não há dados antigos neste navegador.');
    if (!window.confirm(`Copiar ${oldCards.length} cartões e ${oldPurchases.length} compras antigas para esta conta? Os dados antigos permanecerão intactos.`)) return;
    await handleImportData(oldCards, oldPurchases);
  };

  // Calculate invoices for selected month to display card totals
  const getCardInvoiceValue = (cardId: string) => {
    return purchases
      .filter((p) => p.cardId === cardId)
      .flatMap((p) => {
        const insts = p.installmentsCount;
        const baseValue = Math.floor((p.totalValue / insts) * 100) / 100;
        const list = [];
        let accumulated = 0;
        for (let i = 1; i <= insts; i++) {
          const installmentMonth = addMonths(p.startMonth, i - 1);
          let value = baseValue;
          if (i === insts) {
            value = Math.round((p.totalValue - accumulated) * 100) / 100;
          } else {
            accumulated += baseValue;
          }
          if (installmentMonth === selectedMonth) {
            list.push(value);
          }
        }
        return list;
      })
      .reduce((sum, val) => sum + val, 0);
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 flex flex-col pb-16 md:pb-6">
      {/* Top Banner / Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-100">
              <CreditCard className="w-5.5 h-5.5 text-white transform -rotate-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display font-black text-lg text-slate-900 tracking-tight leading-none">
                  Parcela<span className="text-indigo-600">Card</span>
                </h1>
                <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                  VERSÃO DO GIT ATIVA (v1.2)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase block mt-0.5">
                Controle de Cartões • Arquivo atualizado via Git!
              </span>
            </div>
          </div>

          {/* Navigation Rails - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Painel Geral
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'purchases'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Minhas Compras
            </button>
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'cards'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Cartões
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'reminders'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              Lembretes
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'sync'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FolderSync className="w-4 h-4" />
              Sincronizar
            </button>
          </nav>

          {/* Quick Add Buttons & Mobile Burger */}
          <div className="flex items-center gap-2">
            {/* Cloud Sync Status Indicator */}
            <button
              onClick={() => setActiveTab('sync')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                cloudStatus === 'connected'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-150 hover:bg-indigo-100/50'
                  : cloudStatus === 'syncing'
                  ? 'bg-slate-50 text-slate-600 border-slate-200 animate-pulse'
                  : cloudStatus === 'error'
                  ? 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100/50'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
              title={
                cloudStatus === 'connected'
                  ? 'Conectado ao Firestore (Nuvem)'
                  : cloudStatus === 'syncing'
                  ? 'Sincronizando com a nuvem...'
                  : cloudStatus === 'error'
                  ? 'Erro de Sincronização Cloud'
                  : 'Modo Offline Local'
              }
            >
              {cloudStatus === 'connected' ? (
                <>
                  <Cloud className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nuvem Ativa</span>
                </>
              ) : cloudStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  <span className="hidden sm:inline">Carregando...</span>
                </>
              ) : cloudStatus === 'error' ? (
                <>
                  <CloudOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Erro de Nuvem</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Modo Local</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowPurchaseForm(true)}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nova Compra
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-50 active:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-inner">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              Painel Geral
            </button>
            <button
              onClick={() => {
                setActiveTab('purchases');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'purchases' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              Minhas Compras
            </button>
            <button
              onClick={() => {
                setActiveTab('cards');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'cards' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-4.5 h-4.5" />
              Meus Cartões
            </button>
            <button
              onClick={() => {
                setActiveTab('reminders');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'reminders' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bell className="w-4.5 h-4.5" />
              Lembretes Rápidos
            </button>
            <button
              onClick={() => {
                setActiveTab('sync');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'sync' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FolderSync className="w-4.5 h-4.5" />
              Sincronizar Backup
            </button>
            
            {/* Quick Add mobile */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setShowPurchaseForm(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer"
              >
                <Plus className="w-4.5 h-4.5" />
                Nova Compra Parcelada
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Floating Action Button (FAB) for Mobile Quick Add */}
      <div className="sm:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setShowPurchaseForm(true)}
          className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
          title="Nova Compra"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Active Forms Area */}
        {showCardForm && (
          <div className="animate-fade-in">
            <CardForm
              cardToEdit={cardToEdit}
              onSave={handleSaveCard}
              onCancel={() => {
                setShowCardForm(false);
                setCardToEdit(null);
              }}
            />
          </div>
        )}

        {showPurchaseForm && (
          <div className="animate-fade-in">
            <PurchaseForm
              purchaseToEdit={purchaseToEdit}
              cards={cards}
              onSave={handleSavePurchase}
              onCancel={() => {
                setShowPurchaseForm(false);
                setPurchaseToEdit(null);
              }}
            />
          </div>
        )}

        {/* Tab Selection Render */}
        <div className="space-y-6">
          {activeTab === 'dashboard' && (
            <Dashboard
              cards={cards}
              purchases={purchases}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          )}

          {activeTab === 'purchases' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-800">Controle de Compras</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Cadastre, edite e acompanhe o cronograma de suas parcelas.</p>
                </div>
                <button
                  onClick={() => {
                    setPurchaseToEdit(null);
                    setShowPurchaseForm(true);
                  }}
                  className="px-3.5 py-1.5 border border-indigo-200 hover:border-indigo-300 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Adicionar Compra
                </button>
              </div>

              <PurchaseList
                purchases={purchases}
                cards={cards}
                selectedMonth={selectedMonth}
                onEdit={handleEditPurchaseClick}
                onDelete={handleDeletePurchase}
                onToggleInstallmentPaid={handleToggleInstallmentPaid}
              />
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-display font-bold text-xl text-slate-800">Meus Cartões de Crédito</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Configure seus limites, datas de vencimento e cores visuais.</p>
                </div>
                <button
                  onClick={() => {
                    setCardToEdit(null);
                    setShowCardForm(true);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Adicionar Cartão
                </button>
              </div>

              {cards.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
                  <CreditCard className="w-16 h-16 text-slate-300 mx-auto" />
                  <div>
                    <h4 className="font-semibold text-slate-700">Nenhum cartão cadastrado</h4>
                    <p className="text-xs text-slate-400 mt-1">Crie seu primeiro cartão de crédito para começar a registrar suas compras parceladas.</p>
                  </div>
                  <button
                    onClick={() => setShowCardForm(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    Cadastrar Cartão
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((card) => (
                    <CardWidget
                      key={card.id}
                      card={card}
                      invoiceValue={getCardInvoiceValue(card.id)}
                      onEdit={handleEditCardClick}
                      onDelete={handleDeleteCard}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reminders' && (
            <ReminderManager
              cards={cards}
              purchases={purchases}
              selectedMonth={selectedMonth}
            />
          )}

          {activeTab === 'sync' && (
            <AccountSync
              cards={cards}
              purchases={purchases}
              cloudStatus={cloudStatus}
              onImportLegacy={handleImportLegacy}
              onPush={handleForcePushCloud}
              onPull={handleForcePullCloud}
              onImportFile={handleImportData}
            />
          )}
        </div>
      </main>

      {/* Sticky Bottom Nav - Mobile ONLY */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-150 h-16 flex items-center justify-around px-2 shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5.5 h-5.5" />
          Painel
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'purchases' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShoppingBag className="w-5.5 h-5.5" />
          Compras
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'cards' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <CreditCard className="w-5.5 h-5.5" />
          Cartões
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'reminders' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Bell className="w-5.5 h-5.5" />
          Lembretes
        </button>
        <button
          onClick={() => setActiveTab('sync')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'sync' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FolderSync className="w-5.5 h-5.5" />
          Backup
        </button>
      </footer>

      {isLocked && (
        <PinLockScreen
          onUnlock={() => setIsLocked(false)}
          storedPin={pinCode}
        />
      )}
    </div>
  );
}
