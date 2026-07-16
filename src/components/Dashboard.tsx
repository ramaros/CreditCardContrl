import React, { useState } from 'react';
import { Card, Purchase, CATEGORIES } from '../types';
import {
  formatCurrency,
  formatMonthYear,
  getMonthlyProjection,
  getAllInstallments,
} from '../utils/calculator';
import {
  TrendingUp,
  CreditCard,
  PieChart,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Info,
  CalendarCheck2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

interface DashboardProps {
  cards: Card[];
  purchases: Purchase[];
  selectedMonth: string; // "YYYY-MM"
  setSelectedMonth: (month: string) => void;
}

export default function Dashboard({
  cards,
  purchases,
  selectedMonth,
  setSelectedMonth,
}: DashboardProps) {
  const [projectionMonths, setProjectionMonths] = useState(6); // Projeção de 6 ou 12 meses (6 por padrão)

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-[11px] rounded-lg p-2.5 shadow-xl font-mono text-left min-w-[150px] border border-slate-700">
          <span className="block font-bold text-indigo-300 font-sans">{formatMonthYear(data.month)}</span>
          <span className="block text-white font-bold mt-1 text-xs">{formatCurrency(data.total)}</span>
          {Object.keys(data.byCard).length > 0 && (
            <div className="border-t border-slate-800 mt-1.5 pt-1 text-left space-y-0.5 text-[9px] text-slate-300">
              {Object.entries(data.byCard).map(([cardId, val]) => {
                const cardName = cards.find((c) => c.id === cardId)?.name || 'Cartão';
                return (
                  <div key={cardId} className="flex justify-between gap-4">
                    <span className="truncate max-w-[80px]">{cardName}:</span>
                    <span>{formatCurrency(val as number)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // General installments calculation
  const installments = getAllInstallments(purchases);

  // Active installments in selected month
  const activeInstallmentsThisMonth = installments.filter((inst) => inst.month === selectedMonth);
  const totalInvoicedThisMonth = activeInstallmentsThisMonth.reduce((sum, inst) => sum + inst.value, 0);

  // Active installment count vs total purchases
  const uniquePurchasesThisMonthCount = new Set(activeInstallmentsThisMonth.map((i) => i.purchaseId)).size;

  // Remaining future debt sum starting from next month
  const totalFutureDebt = installments
    .filter((inst) => inst.month > selectedMonth)
    .reduce((sum, inst) => sum + inst.value, 0);

  // Calculation of invoice per card for the selected month
  const cardInvoices = cards.map((card) => {
    const value = activeInstallmentsThisMonth
      .filter((inst) => inst.cardId === card.id)
      .reduce((sum, inst) => sum + inst.value, 0);
    return { card, value };
  });

  // Category distribution for selected month
  const categoryCosts = CATEGORIES.map((cat) => {
    const value = activeInstallmentsThisMonth
      .filter((inst) => inst.category === cat.name)
      .reduce((sum, inst) => sum + inst.value, 0);
    return { ...cat, value };
  }).filter((c) => c.value > 0);

  // Projections list for the SVG chart
  const projections = getMonthlyProjection(purchases, selectedMonth, projectionMonths);
  const maxProjectionValue = Math.max(...projections.map((p) => p.total), 1);

  // Date handlers (previous / next month navigation)
  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + (direction === 'prev' ? -1 : 1);

    if (newMonth === 0) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth === 13) {
      newMonth = 1;
      newYear += 1;
    }

    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  return (
    <div id="dashboard-main-container" className="space-y-6">
      {/* Month Selector & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-3">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="w-5 h-5 text-indigo-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Período de Referência
          </span>
        </div>

        {/* Navigator buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="font-display font-bold text-slate-800 text-lg min-w-[150px] text-center px-2">
            {formatMonthYear(selectedMonth)}
          </span>

          <button
            onClick={() => navigateMonth('next')}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-slate-600 cursor-pointer"
            title="Próximo Mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: General Total */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 uppercase">Fatura Geral Somada</span>
            <h4 className="text-2xl font-bold text-slate-800 tracking-tight font-mono mt-0.5">
              {formatCurrency(totalInvoicedThisMonth)}
            </h4>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {uniquePurchasesThisMonthCount} compra(s) com parcelas neste mês
            </span>
          </div>
        </div>

        {/* KPI 2: Future Debt */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 uppercase">Total Meses Futuros</span>
            <h4 className="text-2xl font-bold text-slate-800 tracking-tight font-mono mt-0.5">
              {formatCurrency(totalFutureDebt)}
            </h4>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Dívida parcelada restante a ser paga nos meses adiante
            </span>
          </div>
        </div>

        {/* KPI 3: active cards summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-medium text-slate-500 uppercase">Cartões Ativos</span>
            <h4 className="text-2xl font-bold text-slate-800 tracking-tight font-mono mt-0.5">
              {cardInvoices.filter((c) => c.value > 0).length} / {cards.length}
            </h4>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Cartões com faturas ativas no período selecionado
            </span>
          </div>
        </div>
      </div>

      {/* SVG Projections Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Projeção de Gastos Futuros
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Previsão mensal acumulada com base nas parcelas de compras cadastradas.
            </p>
          </div>

          {/* Time range selector */}
          <div className="flex border border-slate-150 rounded-xl overflow-hidden self-start">
            <button
              onClick={() => setProjectionMonths(6)}
              className={`px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                projectionMonths === 6
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              6 Meses
            </button>
            <button
              onClick={() => setProjectionMonths(12)}
              className={`px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                projectionMonths === 12
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              12 Meses
            </button>
          </div>
        </div>

        {/* Recharts Chart Drawing */}
        <div className="pt-2">
          <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
            <div className="min-w-[550px] md:min-w-0 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projections}
                  margin={{ top: 15, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 9, fontWeight: 500 }}
                    tickFormatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)', radius: 8 }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {projections.map((entry, index) => {
                      const isSelected = entry.month === selectedMonth;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={isSelected ? '#6366f1' : '#cbd5e1'}
                          className="transition-colors duration-200 cursor-pointer"
                          onClick={() => setSelectedMonth(entry.month)}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Note helper */}
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-2">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Toque ou clique em qualquer coluna do gráfico para navegar diretamente para a análise daquele mês.</span>
        </div>
      </div>

      {/* Two column visual: Category costs & Cards Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Total por Cartão */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-display font-semibold text-slate-800 text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            Gastos por Cartão de Crédito
          </h3>

          {cardInvoices.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Nenhum cartão cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {cardInvoices.map(({ card, value }) => {
                const limitPct = card.limit ? (value / card.limit) * 100 : 0;
                return (
                  <div key={card.id} className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors flex justify-between items-center gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Colored marker */}
                      <div className={`w-3 h-7 rounded-md bg-gradient-to-br ${card.color} shrink-0`} />
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 text-sm block truncate">{card.name}</span>
                        {card.limit && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Usado: {limitPct.toFixed(0)}% do limite
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right font-mono font-bold text-slate-950 text-sm shrink-0">
                      {formatCurrency(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Categories Breakdowns */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-display font-semibold text-slate-800 text-base flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-500" />
            Divisão por Categoria
          </h3>

          {categoryCosts.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">Nenhuma parcela ativa para este mês.</p>
          ) : (
            <div className="space-y-4">
              {categoryCosts.map((catCost) => {
                const pct = (catCost.value / totalInvoicedThisMonth) * 100;
                return (
                  <div key={catCost.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catCost.color }} />
                        {catCost.name}
                      </span>
                      <span className="font-mono text-slate-900">
                        {formatCurrency(catCost.value)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: catCost.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
