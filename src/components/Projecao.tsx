import React from 'react';
import { Database } from '../types';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { addMonths, format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProjecaoProps {
  db: Database;
  theme: 'light' | 'dark';
}

export default function Projecao({ db, theme }: ProjecaoProps) {
  const hoje = startOfMonth(new Date());
  const mesesProjecao = Array.from({ length: 6 }, (_, i) => addMonths(hoje, i));

  const totalVendasPendentes = db.ops
    .filter(o => o.tipo === 'VENDA' && o.status_recebimento === 'pendente')
    .reduce((a, o) => a + o.valor_total, 0);

  const totalMilhasAtuais = db.saldos.reduce((a, v) => a + (v.saldo_atual || 0), 0);

  const projectionData = mesesProjecao.map(mes => {
    const mesStr = format(mes, 'yyyy-MM');
    
    // Total installments for this month
    const parcelasMes = db.parcelas
      .filter(p => !p.pago && p.mes_referencia === mesStr)
      .reduce((a, p) => a + p.valor, 0);

    // Group by card for details
    const porCartao = db.cartoes.map(c => {
      const val = db.parcelas
        .filter(p => !p.pago && p.cartao_id === c.id && p.mes_referencia === mesStr)
        .reduce((a, p) => a + p.valor, 0);
      return { nome: c.nome, valor: val };
    }).filter(c => c.valor > 0);

    // Simple status suggestion (Phase 2.2)
    let status = "✅ Caixa ok";
    let statusClass = "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
    if (parcelasMes > 5000) {
      status = "⚠ Atenção";
      statusClass = "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400";
    }
    if (parcelasMes > 10000) {
      status = "❌ Déficit";
      statusClass = "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
    }

    return {
      mes: format(mes, 'MMMM yyyy', { locale: ptBR }),
      total: parcelasMes,
      porCartao,
      status,
      statusClass
    };
  });

  return (
    <div className="space-y-6 pb-12">
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Projeção de Caixa</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Saldo de Milhas Estimado</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatNumber(Math.floor(totalMilhasAtuais))} <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">milhas</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 uppercase">Atual - Vendas Pendentes</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Total a Receber (Vendas)</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{formatCurrency(totalVendasPendentes)}</div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 uppercase">Soma de todas as vendas pendentes</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Próximos 6 Meses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mês</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Parcelas</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Detalhes por Cartão</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status Sugerido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {projectionData.map((d, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white capitalize">{d.mes}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900 dark:text-white">{formatCurrency(d.total)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {d.porCartao.map((c, i) => (
                        <span key={i} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
                          {c.nome}: {formatCurrency(c.valor)}
                        </span>
                      ))}
                      {d.porCartao.length === 0 && <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider", d.statusClass)}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
