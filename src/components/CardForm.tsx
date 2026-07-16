import React, { useState, useEffect } from 'react';
import { Card, CARD_COLORS, CardBrand } from '../types';
import { CreditCard, Save, X } from 'lucide-react';

interface CardFormProps {
  cardToEdit?: Card | null;
  onSave: (card: Card) => void;
  onCancel: () => void;
}

export default function CardForm({ cardToEdit, onSave, onCancel }: CardFormProps) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<CardBrand>('visa');
  const [dueDay, setDueDay] = useState(15);
  const [limit, setLimit] = useState<number | ''>('');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].class);

  useEffect(() => {
    if (cardToEdit) {
      setName(cardToEdit.name);
      setBrand(cardToEdit.brand);
      setDueDay(cardToEdit.dueDay);
      setLimit(cardToEdit.limit !== undefined ? cardToEdit.limit : '');
      setSelectedColor(cardToEdit.color);
    } else {
      setName('');
      setBrand('visa');
      setDueDay(15);
      setLimit('');
      setSelectedColor(CARD_COLORS[0].class);
    }
  }, [cardToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: cardToEdit ? cardToEdit.id : crypto.randomUUID(),
      name: name.trim(),
      brand,
      dueDay: Number(dueDay),
      limit: limit !== '' ? Number(limit) : undefined,
      color: selectedColor,
    });
  };

  return (
    <form id="card-form" onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <h3 className="font-display font-semibold text-slate-800 text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-500" />
          {cardToEdit ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
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
        {/* Name */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Nome do Cartão / Banco</label>
          <input
            type="text"
            required
            placeholder="Ex: Nubank, Inter, Itaú"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Brand */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Bandeira</label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value as CardBrand)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="elo">Elo</option>
            <option value="amex">American Express</option>
            <option value="other">Outra</option>
          </select>
        </div>

        {/* Due Day */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Dia do Vencimento</label>
          <input
            type="number"
            required
            min="1"
            max="31"
            placeholder="Ex: 15"
            value={dueDay}
            onChange={(e) => setDueDay(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Limit */}
        <div className="flex flex-col space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase">Limite do Cartão (Opcional)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex: 5000.00 (deixe em branco se ilimitado)"
            value={limit}
            onChange={(e) => setLimit(e.target.value !== '' ? Number(e.target.value) : '')}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Color presets selection */}
        <div className="flex flex-col space-y-1 md:col-span-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Aparência do Cartão</label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
            {CARD_COLORS.map((colorObj) => (
              <button
                key={colorObj.class}
                type="button"
                onClick={() => setSelectedColor(colorObj.class)}
                className={`h-12 rounded-lg bg-gradient-to-br ${colorObj.class} relative flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200`}
                title={colorObj.name}
              >
                {selectedColor === colorObj.class && (
                  <div className="absolute inset-0 border-2 border-slate-800 rounded-lg flex items-center justify-center bg-black/10">
                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow" />
                  </div>
                )}
              </button>
            ))}
          </div>
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
          {cardToEdit ? 'Atualizar Cartão' : 'Salvar Cartão'}
        </button>
      </div>
    </form>
  );
}
