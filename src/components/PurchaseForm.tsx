import React, { useState, useEffect } from 'react';
import { Card, CATEGORIES, Purchase } from '../types';
import { formatCurrency, getFinalMonth, formatMonthYear } from '../utils/calculator';
import { Calendar, ShoppingBag, Save, X, AlertTriangle } from 'lucide-react';

interface PurchaseFormProps {
  purchaseToEdit?: Purchase | null;
  cards: Card[];
  onSave: (purchase: Purchase) => void;
  onCancel: () => void;
}

export default function PurchaseForm({ purchaseToEdit, cards, onSave, onCancel }: PurchaseFormProps) {
  const [description, setDescription] = useState('');
  const [totalValue, setTotalValue] = useState<number | ''>('');
  const [installmentsCount, setInstallmentsCount] = useState<number>(12);
  const [startMonth, setStartMonth] = useState('');
  const [cardId, setCardId] = useState('');

  // Set today's month/year as default startMonth
  useEffect(() => {
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    if (purchaseToEdit) {
      setDescription(purchaseToEdit.description);
      setTotalValue(purchaseToEdit.totalValue);
      setInstallmentsCount(purchaseToEdit.installmentsCount);
      setStartMonth(purchaseToEdit.startMonth);
      setCardId(purchaseToEdit.cardId);
    } else {
      setDescription('');
      setTotalValue('');
      setInstallmentsCount(12);
      setStartMonth(currentMonthStr);
      setCardId(cards.length > 0 ? cards[0].id : '');
    }
  }, [purchaseToEdit, cards]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || totalValue === '' || installmentsCount <= 0 || !startMonth || !cardId) return;

    onSave({
      id: purchaseToEdit ? purchaseToEdit.id : crypto.randomUUID(),
      description: description.trim(),
      totalValue: Number(totalValue),
      installmentsCount: Number(installmentsCount),
      startMonth,
      cardId,
      createdAt: purchaseToEdit ? purchaseToEdit.createdAt : new Date().toISOString(),
    });
  };

  const calculatedFinalMonth = startMonth && installmentsCount > 0
    ? getFinalMonth(startMonth, installmentsCount)
    : '';

  const installmentValue = totalValue && installmentsCount > 0
    ? Number(totalValue) / installmentsCount
    : 0;

  if (cards.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center space-y-3">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="font-display font-semibold text-amber-800 text-lg">Nenhum Cartão Cadastrado</h3>
        <p className="text-sm text-amber-700 max-w-sm mx-auto">
          Você precisa cadastrar pelo menos um cartão de crédito antes de registrar suas compras parceladas!
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  return (
    <form id="purchase-form" onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <h3 className="font-display font-semibold text-slate-800 text-lg flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-indigo-500" />
          {purchaseToEdit ? 'Editar Compra Parcelada' : 'Cadastrar Nova Compra'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Description */}
        <div className="flex flex-col space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Descrição da Compra</label>
          <input
            type="text"
            required
            placeholder="Ex: Geladeira Frost Free, Notebook de Trabalho, Tênis de Corrida"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Card Select */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Cartão de Crédito</label>
          <select
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.name} (Vence dia {card.dueDay})
              </option>
            ))}
          </select>
        </div>

        {/* Total Value */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Valor Total da Compra (R$)</label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            placeholder="Ex: 1200.00"
            value={totalValue}
            onChange={(e) => setTotalValue(e.target.value !== '' ? Number(e.target.value) : '')}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Installments count */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Número de Parcelas</label>
          <input
            type="number"
            required
            min="1"
            max="120"
            placeholder="Ex: 12"
            value={installmentsCount}
            onChange={(e) => setInstallmentsCount(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Start Month */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Mês de Início (1ª Parcela)</label>
          <input
            type="month"
            required
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Auto Calculation Preview Panel */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col justify-center space-y-2 md:col-span-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Valor de cada parcela:</span>
            <span className="font-semibold text-slate-800">
              {installmentsCount > 0 ? `${installmentsCount}x de ` : ''}
              {formatCurrency(installmentValue)}
            </span>
          </div>
          {calculatedFinalMonth && (
            <div className="flex justify-between text-xs text-slate-500">
              <span>Última parcela em:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                {formatMonthYear(calculatedFinalMonth)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {purchaseToEdit ? 'Atualizar Compra' : 'Confirmar Compra'}
        </button>
      </div>
    </form>
  );
}
