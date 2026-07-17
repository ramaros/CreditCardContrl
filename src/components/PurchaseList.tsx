import React, { useState } from 'react';
import { Card, Purchase, CATEGORIES } from '../types';
import { formatCurrency, formatMonthYear, getFinalMonth, getInstallmentsForPurchase } from '../utils/calculator';
import { Search, Filter, Trash2, Edit2, ChevronDown, ChevronUp, Calendar, CreditCard, Tag, ShoppingBag, CheckCircle2, Circle } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface PurchaseListProps {
  purchases: Purchase[];
  cards: Card[];
  selectedMonth: string; // "YYYY-MM"
  onEdit: (purchase: Purchase) => void;
  onDelete: (id: string) => void;
  onToggleInstallmentPaid: (purchaseId: string, installmentNumber: number) => void;
}

export default function PurchaseList({
  purchases,
  cards,
  selectedMonth,
  onEdit,
  onDelete,
  onToggleInstallmentPaid,
}: PurchaseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('all');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);

  // Filter purchases
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch = purchase.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCard = selectedCardId === 'all' || purchase.cardId === selectedCardId;
    
    const min = minValue !== '' ? parseFloat(minValue) : NaN;
    const max = maxValue !== '' ? parseFloat(maxValue) : NaN;
    
    const matchesMin = isNaN(min) || purchase.totalValue >= min;
    const matchesMax = isNaN(max) || purchase.totalValue <= max;

    return matchesSearch && matchesCard && matchesMin && matchesMax;
  });

  const getCardInfo = (cardId: string) => {
    return cards.find((c) => c.id === cardId);
  };

  const toggleExpand = (id: string) => {
    setExpandedPurchaseId(expandedPurchaseId === id ? null : id);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCardId('all');
    setMinValue('');
    setMaxValue('');
  };

  const isFiltered = searchTerm !== '' || selectedCardId !== 'all' || minValue !== '' || maxValue !== '';

  /**
   * Checks if and which installment of the purchase is active in the selected month
   */
  const getInstallmentStatusForMonth = (purchase: Purchase, targetMonth: string) => {
    const installments = getInstallmentsForPurchase(purchase);
    const activeInst = installments.find((inst) => inst.month === targetMonth);
    
    if (activeInst) {
      return {
        isActive: true,
        text: `Parcela ${activeInst.installmentNumber} de ${activeInst.totalInstallments}`,
        value: activeInst.value,
      };
    }

    // Check if it's future or past
    if (purchase.startMonth > targetMonth) {
      return {
        isActive: false,
        text: 'Começa no futuro',
        value: 0,
      };
    } else {
      return {
        isActive: false,
        text: 'Finalizada/Quitada',
        value: 0,
      };
    }
  };

  return (
    <div id="purchase-list-container" className="space-y-4">
      {/* Search and Filters panel */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Pesquisar compra por descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Card Filter */}
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/30 text-sm shrink-0 md:w-56">
            <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-full cursor-pointer text-slate-700 text-xs font-semibold"
            >
              <option value="all">Todos Cartões</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Value range and clear filters row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Intervalo de Valor:
            </span>
            <div className="flex items-center gap-1.5">
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/30 px-2.5 py-1 flex items-center">
                <span className="text-[10px] font-semibold text-slate-400 mr-1">Mín R$</span>
                <input
                  type="number"
                  placeholder="0"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="w-16 bg-transparent border-none p-0 text-xs font-semibold text-slate-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="0"
                />
              </div>
              <span className="text-slate-300 text-xs">—</span>
              <div className="relative rounded-xl border border-slate-200 bg-slate-50/30 px-2.5 py-1 flex items-center">
                <span className="text-[10px] font-semibold text-slate-400 mr-1">Máx R$</span>
                <input
                  type="number"
                  placeholder="Qualquer"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className="w-16 bg-transparent border-none p-0 text-xs font-semibold text-slate-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="0"
                />
              </div>
            </div>
          </div>

          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50/60 active:bg-indigo-100/60 transition-colors self-end sm:self-auto cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredPurchases.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">Nenhuma compra parcelada encontrada</p>
            <p className="text-xs text-slate-400 mt-1">Crie uma nova compra ou ajuste os filtros de pesquisa.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPurchases.map((purchase) => {
              const card = getCardInfo(purchase.cardId);
              const status = getInstallmentStatusForMonth(purchase, selectedMonth);
              const finalMonth = getFinalMonth(purchase.startMonth, purchase.installmentsCount);
              const isExpanded = expandedPurchaseId === purchase.id;

              const paidCount = purchase.paidInstallments?.length || 0;
              const totalCount = purchase.installmentsCount;
              const percentPaid = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

              return (
                <div key={purchase.id} className="transition-colors hover:bg-slate-50/40">
                  {/* Item Header / Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                    {/* Left: Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        onClick={() => toggleExpand(purchase.id)}
                        className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors text-slate-500 mt-0.5 select-none shrink-0"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-800 truncate" title={purchase.description}>
                            {purchase.description}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5" />
                            {card ? (
                              <span className="font-medium text-slate-600">{card.name}</span>
                            ) : (
                              <span className="text-red-400">Cartão Excluído</span>
                            )}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatMonthYear(purchase.startMonth, true)} até {formatMonthYear(finalMonth, true)}
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="mt-2.5 flex items-center gap-2 max-w-xs sm:max-w-sm">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 shrink-0 font-mono">
                            {paidCount}/{totalCount} pagas ({percentPaid}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Values and Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <div className="text-slate-500 text-xs font-mono">
                          Valor total: <span className="font-bold text-slate-700">{formatCurrency(purchase.totalValue)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 sm:justify-end">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              status.isActive
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {status.text}
                          </span>
                          {status.isActive && (
                            <span className="font-bold font-mono text-slate-900">
                              {formatCurrency(status.value)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Edit/Delete Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEdit(purchase)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar compra"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPurchaseToDelete(purchase)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Excluir compra"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Installment History */}
                  {isExpanded && (
                    <div className="px-12 pb-4 pt-1 bg-slate-50 border-t border-slate-100">
                      <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Cronograma Completo de Parcelas ({purchase.installmentsCount} meses)
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {getInstallmentsForPurchase(purchase).map((inst) => {
                          const isCurrent = inst.month === selectedMonth;
                          const isPaid = inst.isPaid;
                          return (
                            <div
                              key={`${inst.purchaseId}-${inst.installmentNumber}`}
                              onClick={() => onToggleInstallmentPaid(purchase.id, inst.installmentNumber)}
                              className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between h-[72px] transition-all cursor-pointer select-none relative group ${
                                isPaid
                                  ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50 text-emerald-800'
                                  : isCurrent
                                  ? 'bg-indigo-50 border-indigo-200 shadow-sm hover:border-indigo-300'
                                  : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
                              }`}
                              title={isPaid ? 'Marcar como pendente' : 'Marcar como paga'}
                            >
                              <div className="flex justify-between items-start font-mono font-semibold">
                                <span className={isPaid ? 'text-emerald-600' : isCurrent ? 'text-indigo-600' : 'text-slate-500'}>
                                  {inst.installmentNumber}/{inst.totalInstallments}
                                </span>
                                
                                {/* Status Icon */}
                                <div className="shrink-0">
                                  {isPaid ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-end justify-between mt-1">
                                <span className="text-[9px] text-slate-400 font-medium font-sans">
                                  {formatMonthYear(inst.month, true)}
                                </span>
                                <div className={`font-bold font-mono text-right ${isPaid ? 'text-emerald-700 line-through decoration-emerald-400/30' : isCurrent ? 'text-indigo-700' : 'text-slate-800'}`}>
                                  {formatCurrency(inst.value)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={purchaseToDelete !== null}
        onClose={() => setPurchaseToDelete(null)}
        onConfirm={() => {
          if (purchaseToDelete) {
            onDelete(purchaseToDelete.id);
          }
        }}
        title="Excluir Compra?"
        message={
          purchaseToDelete ? (
            <span>
              Deseja excluir a compra <strong className="text-slate-800">"{purchaseToDelete.description}"</strong> permanentemente?
              <span className="text-red-500 font-semibold mt-1 block">
                Todas as {purchaseToDelete.installmentsCount} parcelas futuras serão removidas do cronograma. Esta ação não pode ser desfeita.
              </span>
            </span>
          ) : null
        }
        confirmText="Excluir Compra"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
