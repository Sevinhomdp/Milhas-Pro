import React from 'react';
import { Database } from '../types';
import { PROGS } from '../constants';
import { formatNumber, formatCurrency } from '../lib/utils';

interface SaldosProps {
  db: Database;
  onSave: (db: Database) => void;
  toast: (msg: string, type?: any) => void;
  theme: 'light' | 'dark';
}

export default function Saldos({ db, onSave, toast, theme }: SaldosProps) {
  const handleUpdate = (prog: string, val: string) => {
    // Logic to update Supabase would go here
    toast("Saldo atualizado!", "success");
  };

  const totalMilhas = db.saldos.reduce((a, v) => a + (v.saldo_atual || 0), 0);
  const totalInvestido = db.saldos.reduce((acc, s) => {
    return acc + (s.saldo_atual * s.custo_medio / 1000);
  }, 0);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Saldos e Estoque</h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Patrimônio em Milhas</div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(totalInvestido)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {PROGS.map(prog => {
          const s = db.saldos.find(x => x.nome_programa === prog);
          const saldo = s?.saldo_atual || 0;
          const custoMedio = s?.custo_medio || 0;

          return (
            <div key={prog} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 border-t-4 border-t-amber-500 transition-all">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{prog}</h3>
              <div className="space-y-2">
                <input
                  type="number"
                  defaultValue={saldo}
                  onBlur={(e) => handleUpdate(prog, e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-lg font-bold text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all"
                />
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {formatNumber(saldo)} milhas
                </div>
                {custoMedio > 0 && (
                  <div className="text-[9px] text-green-600 dark:text-green-400 font-bold uppercase">
                    Custo Médio: {formatCurrency(custoMedio)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-slate-900 dark:bg-black p-6 rounded-2xl shadow-lg border border-white/10 relative overflow-hidden group">
        <div className="relative z-10">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total em Estoque</div>
          <div className="text-3xl font-black text-white">{formatNumber(Math.floor(totalMilhas))} milhas</div>
        </div>
      </div>
    </div>
  );
}
