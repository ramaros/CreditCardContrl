import React from 'react';
import { Card } from '../types';
import { formatCurrency } from '../utils/calculator';
import { CreditCard, Eye, EyeOff, Calendar, AlertCircle } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface CardWidgetProps {
  card: Card;
  invoiceValue: number;
  onEdit?: (card: Card) => void;
  onDelete?: (id: string) => void;
  selectedMonthLabel?: string;
  isInteractive?: boolean;
}

export default function CardWidget({
  card,
  invoiceValue,
  onEdit,
  onDelete,
  selectedMonthLabel = '',
  isInteractive = true,
}: CardWidgetProps & { key?: React.Key }) {
  const [showLimit, setShowLimit] = React.useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  // Determine brand icon or generic credit card
  const getBrandLogo = () => {
    switch (card.brand) {
      case 'visa':
        return <span className="font-display italic font-bold text-xl text-white tracking-widest">VISA</span>;
      case 'mastercard':
        return (
          <div className="flex -space-x-2">
            <div className="w-5 h-5 rounded-full bg-red-500 opacity-90" />
            <div className="w-5 h-5 rounded-full bg-amber-500 opacity-90" />
          </div>
        );
      case 'amex':
        return <span className="font-sans font-black text-sm bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded">AMEX</span>;
      case 'elo':
        return (
          <div className="flex space-x-0.5 items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-white ml-1">elo</span>
          </div>
        );
      default:
        return <CreditCard className="w-5 h-5 text-white/80" />;
    }
  };

  const limitProgress = card.limit ? (invoiceValue / card.limit) * 100 : 0;
  const isOverLimit = card.limit ? invoiceValue > card.limit : false;

  return (
    <div
      id={`card-${card.id}`}
      className={`relative rounded-2xl p-6 text-white shadow-lg overflow-hidden transition-all duration-300 bg-gradient-to-br ${card.color} hover:shadow-xl hover:-translate-y-0.5`}
    >
      {/* Glossy Overlay card pattern */}
      <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent opacity-60 pointer-events-none" />
      <div className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="font-display font-semibold text-lg text-white/90 drop-shadow-sm truncate max-w-[150px]">
            {card.name}
          </h3>
          <p className="text-xs text-white/60 font-mono tracking-wider">
            Vence dia {card.dueDay}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getBrandLogo()}
        </div>
      </div>

      {/* Simulated Credit Card Chip & Contactless */}
      <div className="flex items-center space-x-3 my-4 relative z-10">
        <div className="w-8 h-6 rounded-md bg-amber-400/80 border border-amber-300/40 relative overflow-hidden">
          <div className="absolute inset-y-0 left-1/3 w-px bg-neutral-900/10" />
          <div className="absolute inset-y-0 right-1/3 w-px bg-neutral-900/10" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-neutral-900/10" />
        </div>
      </div>

      {/* Invoice Details */}
      <div className="mt-4 relative z-10">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-white/70 block">
              Fatura {selectedMonthLabel ? `(${selectedMonthLabel})` : 'do Mês'}
            </span>
            <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
              {formatCurrency(invoiceValue)}
            </span>
          </div>
          {card.limit && (
            <button
              onClick={() => setShowLimit(!showLimit)}
              className="text-white/60 hover:text-white p-1 rounded-full transition-colors"
              title={showLimit ? 'Ocultar limite' : 'Mostrar limite'}
            >
              {showLimit ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Limit progress bar */}
        {card.limit && showLimit && (
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-white/70 mb-1">
              <span>Limite Usado: {limitProgress.toFixed(0)}%</span>
              <span>Total: {formatCurrency(card.limit)}</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverLimit ? 'bg-red-400' : limitProgress > 80 ? 'bg-amber-400' : 'bg-white'
                }`}
                style={{ width: `${Math.min(limitProgress, 100)}%` }}
              />
            </div>
            {isOverLimit && (
              <div className="flex items-center text-red-300 text-[10px] mt-1 space-x-1">
                <AlertCircle className="w-3 h-3" />
                <span>Atenção: Limite ultrapassado!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Actions for Editing/Deleting */}
      {isInteractive && (onEdit || onDelete) && (
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-end space-x-2 relative z-10">
          {onEdit && (
            <button
              onClick={() => onEdit(card)}
              className="text-xs bg-white/15 hover:bg-white/25 active:bg-white/35 text-white px-2.5 py-1 rounded transition-colors font-medium cursor-pointer"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-xs bg-red-500/20 hover:bg-red-500/45 text-red-100 px-2.5 py-1 rounded transition-colors font-medium cursor-pointer"
              >
                Excluir
              </button>

              <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => onDelete(card.id)}
                title="Excluir Cartão?"
                message={
                  <span>
                    Deseja excluir o cartão <strong className="text-slate-800">"{card.name}"</strong> permanentemente?
                    <span className="text-red-500 font-semibold mt-1 block">
                      Isso também removerá todas as compras associadas a ele. Esta ação não pode ser desfeita.
                    </span>
                  </span>
                }
                confirmText="Excluir Cartão"
                cancelText="Cancelar"
                variant="danger"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
