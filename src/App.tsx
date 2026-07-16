import React, { useState, useEffect } from 'react';
import { Card, Purchase, AppData } from './types';
import { addMonths } from './utils/calculator';
import Dashboard from './components/Dashboard';
import CardWidget from './components/CardWidget';
import CardForm from './components/CardForm';
import PurchaseForm from './components/PurchaseForm';
import PurchaseList from './components/PurchaseList';
import ImportExport from './components/ImportExport';
import ReminderManager from './components/ReminderManager';
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
import { isFirebaseConfigured } from './lib/firebase';
import {
  getOrCreateSyncId,
  saveSyncId,
  loadCards,
  saveCard,
  deleteCard,
  loadPurchases,
  savePurchase,
  deletePurchase,
  uploadAllDataToCloud,
} from './lib/dbService';

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
  const [syncId, setSyncId] = useState(getOrCreateSyncId);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'disconnected' | 'error' | 'syncing'>(
    isFirebaseConfigured ? 'syncing' : 'disconnected'
  );

  // Modals & Edits
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);


  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState<Purchase | null>(null);

  // Load data initially
  useEffect(() => {
    async function initData() {
      if (isFirebaseConfigured) {
        setCloudStatus('syncing');
        try {
          const cloudCards = await loadCards(syncId);
          const cloudPurchases = await loadPurchases(syncId);
          
          if (cloudCards.length > 0) {
            setCards(cloudCards);
            setPurchases(cloudPurchases);
            setCloudStatus('connected');
            // Cache to localstorage as fallback
            localStorage.setItem('parcelacard_cards', JSON.stringify(cloudCards));
            localStorage.setItem('parcelacard_purchases', JSON.stringify(cloudPurchases));
          } else {
            // Firestore empty. Any local cards to upload?
            const storedCards = localStorage.getItem('parcelacard_cards');
            const storedPurchases = localStorage.getItem('parcelacard_purchases');
            
            if (storedCards && storedPurchases) {
              const parsedCards = JSON.parse(storedCards);
              const parsedPurchases = JSON.parse(storedPurchases);
              setCards(parsedCards);
              setPurchases(parsedPurchases);
              
              await uploadAllDataToCloud(syncId, parsedCards, parsedPurchases);
              setCloudStatus('connected');
            } else {
              // Both empty, seed demo data!
              const today = new Date();
              const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
              
              const demoCards: Card[] = [
                {
                  id: 'card-demo-1',
                  name: 'Nubank Roxo',
                  brand: 'mastercard',
                  dueDay: 12,
                  limit: 6000,
                  color: 'from-purple-600 to-indigo-700',
                },
                {
                  id: 'card-demo-2',
                  name: 'Inter Laranja',
                  brand: 'visa',
                  dueDay: 17,
                  limit: 4500,
                  color: 'from-orange-500 to-amber-600',
                },
              ];
              
              const demoPurchases: Purchase[] = [
                {
                  id: 'purch-demo-1',
                  description: 'Geladeira Frost Free',
                  totalValue: 2400,
                  installmentsCount: 12,
                  startMonth: addMonths(currentMonthStr, -2),
                  cardId: 'card-demo-1',
                  createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                },
                {
                  id: 'purch-demo-2',
                  description: 'Notebook de Trabalho',
                  totalValue: 3600,
                  installmentsCount: 10,
                  startMonth: addMonths(currentMonthStr, -1),
                  cardId: 'card-demo-2',
                  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                },
                {
                  id: 'purch-demo-3',
                  description: 'Compras Supermercado',
                  totalValue: 450,
                  installmentsCount: 3,
                  startMonth: currentMonthStr,
                  cardId: 'card-demo-1',
                  createdAt: new Date().toISOString(),
                },
                {
                  id: 'purch-demo-4',
                  description: 'Passagem Aérea Viagem',
                  totalValue: 1500,
                  installmentsCount: 6,
                  startMonth: addMonths(currentMonthStr, 1),
                  cardId: 'card-demo-2',
                  createdAt: new Date().toISOString(),
                },
              ];
              
              setCards(demoCards);
              setPurchases(demoPurchases);
              
              localStorage.setItem('parcelacard_cards', JSON.stringify(demoCards));
              localStorage.setItem('parcelacard_purchases', JSON.stringify(demoPurchases));
              
              await uploadAllDataToCloud(syncId, demoCards, demoPurchases);
              setCloudStatus('connected');
            }
          }
        } catch (error) {
          console.error('Erro ao inicializar do Firestore:', error);
          setCloudStatus('error');
          // Fallback to local cache
          const storedCards = localStorage.getItem('parcelacard_cards');
          const storedPurchases = localStorage.getItem('parcelacard_purchases');
          if (storedCards && storedPurchases) {
            setCards(JSON.parse(storedCards));
            setPurchases(JSON.parse(storedPurchases));
          }
        }
      } else {
        // Local-only mode
        const storedCards = localStorage.getItem('parcelacard_cards');
        const storedPurchases = localStorage.getItem('parcelacard_purchases');
        
        if (storedCards && storedPurchases) {
          setCards(JSON.parse(storedCards));
          setPurchases(JSON.parse(storedPurchases));
        } else {
          const today = new Date();
          const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
          
          const demoCards: Card[] = [
            {
              id: 'card-demo-1',
              name: 'Nubank Roxo',
              brand: 'mastercard',
              dueDay: 12,
              limit: 6000,
              color: 'from-purple-600 to-indigo-700',
            },
            {
              id: 'card-demo-2',
              name: 'Inter Laranja',
              brand: 'visa',
              dueDay: 17,
              limit: 4500,
              color: 'from-orange-500 to-amber-600',
            },
          ];
          
          const demoPurchases: Purchase[] = [
            {
              id: 'purch-demo-1',
              description: 'Geladeira Frost Free',
              totalValue: 2400,
              installmentsCount: 12,
              startMonth: addMonths(currentMonthStr, -2),
              cardId: 'card-demo-1',
              createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'purch-demo-2',
              description: 'Notebook de Trabalho',
              totalValue: 3600,
              installmentsCount: 10,
              startMonth: addMonths(currentMonthStr, -1),
              cardId: 'card-demo-2',
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'purch-demo-3',
              description: 'Compras Supermercado',
              totalValue: 450,
              installmentsCount: 3,
              startMonth: currentMonthStr,
              cardId: 'card-demo-1',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'purch-demo-4',
              description: 'Passagem Aérea Viagem',
              totalValue: 1500,
              installmentsCount: 6,
              startMonth: addMonths(currentMonthStr, 1),
              cardId: 'card-demo-2',
              createdAt: new Date().toISOString(),
            },
          ];
          
          setCards(demoCards);
          setPurchases(demoPurchases);
          
          localStorage.setItem('parcelacard_cards', JSON.stringify(demoCards));
          localStorage.setItem('parcelacard_purchases', JSON.stringify(demoPurchases));
        }
      }
    }
    initData();
  }, [syncId]);

  // Save helpers
  const saveCards = async (newCards: Card[], cardToSave?: Card) => {
    setCards(newCards);
    localStorage.setItem('parcelacard_cards', JSON.stringify(newCards));
    if (isFirebaseConfigured && cardToSave) {
      try {
        await saveCard(syncId, cardToSave);
      } catch (error) {
        console.error('Erro ao salvar cartão no Firestore:', error);
      }
    }
  };

  const savePurchases = async (newPurchases: Purchase[], purchaseToSave?: Purchase) => {
    setPurchases(newPurchases);
    localStorage.setItem('parcelacard_purchases', JSON.stringify(newPurchases));
    if (isFirebaseConfigured && purchaseToSave) {
      try {
        await savePurchase(syncId, purchaseToSave);
      } catch (error) {
        console.error('Erro ao salvar compra no Firestore:', error);
      }
    }
  };

  // --- Handlers for Credit Cards ---
  const handleSaveCard = (card: Card) => {
    const exists = cards.some((c) => c.id === card.id);
    let updated: Card[];
    if (exists) {
      updated = cards.map((c) => (c.id === card.id ? card : c));
    } else {
      updated = [...cards, card];
    }
    saveCards(updated, card);
    setShowCardForm(false);
    setCardToEdit(null);
  };

  const handleDeleteCard = async (cardId: string) => {
    const updatedCards = cards.filter((c) => c.id !== cardId);
    const updatedPurchases = purchases.filter((p) => p.cardId !== cardId);
    
    setCards(updatedCards);
    setPurchases(updatedPurchases);
    localStorage.setItem('parcelacard_cards', JSON.stringify(updatedCards));
    localStorage.setItem('parcelacard_purchases', JSON.stringify(updatedPurchases));
    
    if (isFirebaseConfigured) {
      try {
        await deleteCard(syncId, cardId);
        // Cascade delete purchases of this card in Firestore
        const purchasesToDelete = purchases.filter((p) => p.cardId === cardId);
        for (const p of purchasesToDelete) {
          await deletePurchase(syncId, p.id);
        }
      } catch (error) {
        console.error('Erro ao deletar cartão do Firestore:', error);
      }
    }
  };

  const handleEditCardClick = (card: Card) => {
    setCardToEdit(card);
    setShowCardForm(true);
  };

  // --- Handlers for Purchases ---
  const handleSavePurchase = (purchase: Purchase) => {
    const exists = purchases.some((p) => p.id === purchase.id);
    let updated: Purchase[];
    if (exists) {
      updated = purchases.map((p) => (p.id === purchase.id ? purchase : p));
    } else {
      updated = [...purchases, purchase];
    }
    savePurchases(updated, purchase);
    setShowPurchaseForm(false);
    setPurchaseToEdit(null);
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    const updatedPurchases = purchases.filter((p) => p.id !== purchaseId);
    setPurchases(updatedPurchases);
    localStorage.setItem('parcelacard_purchases', JSON.stringify(updatedPurchases));
    
    if (isFirebaseConfigured) {
      try {
        await deletePurchase(syncId, purchaseId);
      } catch (error) {
        console.error('Erro ao deletar compra do Firestore:', error);
      }
    }
  };

  const handleEditPurchaseClick = (purchase: Purchase) => {
    setPurchaseToEdit(purchase);
    setShowPurchaseForm(true);
  };

  // --- Backup Handlers ---
  const handleImportData = async (importedData: AppData) => {
    setCards(importedData.cards);
    setPurchases(importedData.purchases);
    localStorage.setItem('parcelacard_cards', JSON.stringify(importedData.cards));
    localStorage.setItem('parcelacard_purchases', JSON.stringify(importedData.purchases));
    
    if (isFirebaseConfigured) {
      try {
        await uploadAllDataToCloud(syncId, importedData.cards, importedData.purchases);
      } catch (error) {
        console.error('Erro ao subir dados importados para o Firestore:', error);
      }
    }
  };

  const handleUpdateSyncId = (newSyncId: string) => {
    saveSyncId(newSyncId);
    setSyncId(newSyncId);
  };

  const handleForcePushCloud = async () => {
    await uploadAllDataToCloud(syncId, cards, purchases);
  };

  const handleForcePullCloud = async () => {
    const cloudCards = await loadCards(syncId);
    const cloudPurchases = await loadPurchases(syncId);
    
    setCards(cloudCards);
    setPurchases(cloudPurchases);
    localStorage.setItem('parcelacard_cards', JSON.stringify(cloudCards));
    localStorage.setItem('parcelacard_purchases', JSON.stringify(cloudPurchases));
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
              <h1 className="font-display font-black text-lg text-slate-900 tracking-tight leading-none">
                Parcela<span className="text-indigo-600">Card</span>
              </h1>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Controle de Cartões
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
            <ImportExport
              cards={cards}
              purchases={purchases}
              onImport={handleImportData}
              syncId={syncId}
              cloudStatus={cloudStatus}
              onUpdateSyncId={handleUpdateSyncId}
              onForcePushCloud={handleForcePushCloud}
              onForcePullCloud={handleForcePullCloud}
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
    </div>
  );
}
