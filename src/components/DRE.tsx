import React, { useState } from 'react';
import { Database } from '../types';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DREProps {
  db: Database;
  theme: 'light' | 'dark';
}

export default function DRE({ db, theme }: DREProps) {
  const ops = db.ops || [];
  const mesesData: Record<string, any> = {};
  
  ops.forEach(o => {
    if (!o.data) return;
    const mes = o.data.substring(0, 7);
    if (!mesesData[mes]) {
      mesesData[mes] = { 
        receitas: 0, 
        custos: 0, 
        taxas: 0, 
        qtdVendas: 0, 
        qtdCompras: 0,
        milhasVendidas: 0,
        milhasCompradas: 0
      };
    }
    if (o.tipo === 'VENDA') {
      mesesData[mes].receitas += o.valor_total;
      mesesData[mes].qtdVendas++;
      mesesData[mes].milhasVendidas += o.quantidade;
    } else if (o.tipo === 'COMPRA') {
      mesesData[mes].custos += o.valor_total;
      mesesData[mes].qtdCompras++;
      mesesData[mes].milhasCompradas += o.quantidade;
    } else if (o.tipo === 'TRANSF') {
      mesesData[mes].taxas += o.valor_total;
    }
  });

  const sortedMeses = Object.keys(mesesData).sort().reverse();
  const [selectedMes, setSelectedMes] = useState(sortedMeses[0] || '');

  if (!sortedMeses.length) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">DRE Mensal</h2>
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 text-center text-slate-400 dark:text-slate-500">
          Nenhuma operação registrada para gerar o DRE.
        </div>
      </div>
    );
  }

  const m = mesesData[selectedMes];
  const lucro = m.receitas - m.custos - m.taxas;
  const margem = m.receitas > 0 ? (lucro / m.receitas * 100) : 0;
  const cpmMedio = m.milhasCompradas > 0 ? (m.custos / m.milhasCompradas * 1000) : 0;
  const cpvMedio = m.milhasVendidas > 0 ? (m.receitas / m.milhasVendidas * 1000) : 0;

  return (
    <div className="space-y-6 pb-12">
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">DRE — Resultado Mensal</h2>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {sortedMeses.map(mes => (
          <button
            key={mes}
            onClick={() => setSelectedMes(mes)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
              selectedMes === mes 
                ? "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900" 
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            {format(parseISO(mes + '-01'), 'MMM yy', { locale: ptBR }).toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 capitalize">
          {format(parseISO(selectedMes + '-01'), 'MMMM yyyy', { locale: ptBR })}
        </h3>

        <div className="space-y-4">
          <DRERow 
            label="📥 Receita de Vendas" 
            sublabel={`${m.qtdVendas} vendas · ${formatNumber(m.milhasVendidas)} milhas`}
            value={m.receitas}
            type="pos"
          />
          <DRERow 
            label="📤 Custo de Compras" 
            sublabel={`${m.qtdCompras} compras · ${formatNumber(m.milhasCompradas)} milhas`}
            value={m.custos}
            type="neg"
          />
          <DRERow 
            label="💸 Taxas e Clubes" 
            value={m.taxas}
            type="neg"
          />

          <div className="pt-6 mt-6 border-t-2 border-slate-900 dark:border-white/20 flex justify-between items-center">
            <span className="text-lg font-black text-slate-900 dark:text-white">💰 Lucro Líquido</span>
            <span className={cn("text-2xl font-black", lucro >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
              {formatCurrency(lucro)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          <MetricBox 
            label="Margem" 
            value={margem.toFixed(1) + '%'} 
            valueClass={margem >= 20 ? "text-green-600 dark:text-green-400" : margem >= 10 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}
          />
          <MetricBox label="CPM Médio" value={cpmMedio > 0 ? formatCurrency(cpmMedio) : '—'} />
          <MetricBox label="CPV Médio" value={cpvMedio > 0 ? formatCurrency(cpvMedio) : '—'} />
        </div>
      </div>
    </div>
  );
}

function DRERow({ label, sublabel, value, type }: { label: string; sublabel?: string; value: number; type: 'pos' | 'neg' }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        {sublabel && <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">{sublabel}</span>}
      </div>
      <span className={cn("font-bold", type === 'pos' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
        {type === 'neg' ? `(${formatCurrency(value)})` : formatCurrency(value)}
      </span>
    </div>
  );
}

function MetricBox({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl text-center">
      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">{label}</div>
      <div className={cn("text-2xl font-black text-slate-900 dark:text-white", valueClass)}>{value}</div>
    </div>
  );
}
