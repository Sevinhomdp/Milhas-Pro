import React from 'react';
import { Database, Operation } from '../types';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { differenceInDays, parseISO, addMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle } from 'lucide-react';

interface DashboardProps {
  db: Database;
  onSave: (db: Database) => void;
  toast: (msg: string, type?: any) => void;
  confirm: (title: string, msg: string, onConfirm: () => void) => void;
  theme: 'light' | 'dark';
}

export default function Dashboard({ db, onSave, toast, confirm, theme }: DashboardProps) {
  const totalMilhas = db.saldos.reduce((a, v) => a + (v.saldo_atual || 0), 0);
  
  const isDark = theme === 'dark';
  const chartGridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';
  const chartTextColor = isDark ? '#64748b' : '#94a3b8';
  const tooltipBg = isDark ? '#0f172a' : '#1e293b';
  const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : 'none';
  // Calculate Profit
  let lucroRealizado = 0;
  let lucroAReceber = 0;
  const ops = db.ops || [];

  ops.forEach(o => {
    if (o.tipo === 'VENDA') {
      if (o.status_recebimento === 'recebido') {
        lucroRealizado += (o.valor_total || 0);
      } else {
        lucroAReceber += (o.valor_total || 0);
      }
    } else if (o.tipo === 'COMPRA') {
      lucroRealizado -= (o.valor_total || 0);
    } else if (o.tipo === 'TRANSF') {
      lucroRealizado -= (o.valor_total || 0);
    }
  });

  const faturasAbertas = db.parcelas.filter(p => !p.pago).reduce((a, p) => a + p.valor, 0);

  // ROI Médio
  const totalVendas = ops.filter(o => o.tipo === 'VENDA').reduce((a, o) => a + o.valor_total, 0);
  const totalCompras = ops.filter(o => o.tipo === 'COMPRA').reduce((a, o) => a + o.valor_total, 0);
  const totalTaxas = ops.filter(o => o.tipo === 'TRANSF').reduce((a, o) => a + o.valor_total, 0);
  const roiGeral = totalCompras > 0 ? ((totalVendas - totalCompras - totalTaxas) / totalCompras) * 100 : 0;

  // CPM Médio (Current Month)
  const now = new Date();
  const mesAtual = format(now, 'yyyy-MM');
  const comprasMes = ops.filter(o => o.tipo === 'COMPRA' && o.data.startsWith(mesAtual));
  const totalQtdMes = comprasMes.reduce((a, o) => a + o.quantidade, 0);
  const totalValMes = comprasMes.reduce((a, o) => a + o.valor_total, 0);
  const cpmMedio = totalQtdMes > 0 ? (totalValMes / totalQtdMes) * 1000 : 0;

  // Chart Data: Evolution
  const sortedOps = [...ops].sort((a, b) => a.data.localeCompare(b.data));
  let runningMilhas = 0;
  let runningProfit = 0;
  const evolutionData = sortedOps.map(o => {
    if (o.tipo === 'COMPRA') {
      runningMilhas += o.quantidade;
      runningProfit -= o.valor_total;
    } else if (o.tipo === 'VENDA') {
      runningMilhas -= o.quantidade;
      runningProfit += o.valor_total;
    } else if (o.tipo === 'TRANSF') {
      runningMilhas += 0;
      runningProfit -= o.valor_total;
    }
    return {
      data: format(parseISO(o.data), 'dd/MM'),
      milhas: runningMilhas,
      lucro: runningProfit
    };
  }).slice(-20);

  // Chart Data: Profit by Program
  const lucrosPorProg: Record<string, number> = {};
  ops.forEach(o => {
    if (o.tipo === 'VENDA') lucrosPorProg[o.programa] = (lucrosPorProg[o.programa] || 0) + o.valor_total;
    else if (o.tipo === 'COMPRA') lucrosPorProg[o.programa] = (lucrosPorProg[o.programa] || 0) - o.valor_total;
  });
  const barData = Object.entries(lucrosPorProg)
    .map(([prog, lucro]) => ({ prog, lucro }))
    .sort((a, b) => b.lucro - a.lucro)
    .slice(0, 5);

  // Upcoming Bills
  const hoje = new Date();
  const faturas = db.cartoes.map(c => {
    let proximo = new Date(hoje.getFullYear(), hoje.getMonth(), c.dia_vencimento);
    if (proximo <= hoje) proximo = addMonths(proximo, 1);
    const diasRestantes = differenceInDays(proximo, hoje);
    const proximoMes = format(proximo, 'yyyy-MM');

    const valorFatura = db.parcelas
      .filter(p => !p.pago && p.cartao_id === c.id && p.mes_referencia === proximoMes)
      .reduce((a, p) => a + p.valor, 0);

    const parcelasFuturas = db.parcelas
      .filter(p => !p.pago && p.cartao_id === c.id && p.mes_referencia > proximoMes);
    const totalFuturo = parcelasFuturas.reduce((a, p) => a + p.valor, 0);
    const mesesFuturos = [...new Set(parcelasFuturas.map(p => p.mes_referencia))].length;

    return { ...c, diasRestantes, proximo, proximoMes, valorFatura, totalFuturo, mesesFuturos };
  }).sort((a, b) => a.diasRestantes - b.diasRestantes);

  const handlePay = (cartaoId: string, mesReferencia: string, valor: number) => {
    confirm(
      'Confirmar Pagamento',
      `Confirmar pagamento de <b>${formatCurrency(valor)}</b> referente ao mês <b>${mesReferencia}</b>?`,
      () => {
        // Logic to update Supabase would go here via Server Action or API
        toast("Pagamento registrado!", "success");
      }
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Dashboard</h2>
        
        {/* Phase 4: Due Date Alerts */}
        {faturas.some(f => f.diasRestantes <= 3 && f.valorFatura > 0) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 px-4 py-2 rounded-xl flex items-center gap-3 animate-pulse">
            <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
            <div className="text-xs font-bold text-red-800 dark:text-red-300">
              Atenção: Há faturas vencendo em breve!
            </div>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard title="Total de Milhas" value={formatNumber(Math.floor(totalMilhas))} color="border-amber-500" />
        <MetricCard 
          title="Lucro Realizado" 
          value={formatCurrency(lucroRealizado)} 
          color={lucroRealizado >= 0 ? "border-green-500" : "border-red-500"}
          valueClass={lucroRealizado >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
        />
        <MetricCard title="Lucro a Receber" value={formatCurrency(lucroAReceber)} color="border-blue-500" />
        <MetricCard title="Faturas Abertas" value={formatCurrency(faturasAbertas)} color="border-amber-500" />
        <MetricCard 
          title="ROI Médio" 
          value={roiGeral.toFixed(1) + '%'} 
          color={roiGeral >= 20 ? "border-green-500" : roiGeral >= 10 ? "border-amber-500" : "border-red-500"}
          valueClass={roiGeral >= 20 ? "text-green-600 dark:text-green-400" : roiGeral >= 10 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}
        />
        <MetricCard title="CPM Médio Compra" value={cpmMedio > 0 ? formatCurrency(cpmMedio) : '—'} color="border-slate-400" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex justify-between items-center">
            Evolução Financeira
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Milhas vs Lucro</span>
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTextColor }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTextColor }} tickFormatter={v => (v/1000).toFixed(0) + 'k'} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTextColor }} tickFormatter={v => 'R$' + (v/1000).toFixed(0) + 'k'} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: tooltipBorder, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: tooltipBg, color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any, name: string) => [name === 'milhas' ? formatNumber(value) : formatCurrency(value), name === 'milhas' ? 'Milhas' : 'Lucro Acum.']}
                />
                <Line yAxisId="left" type="monotone" dataKey="milhas" stroke="#d4af37" strokeWidth={3} dot={{ r: 4, fill: '#d4af37' }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="lucro" stroke="#16a34a" strokeWidth={2} dot={{ r: 3, fill: '#16a34a' }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Lucro por Programa (Top 5)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTextColor }} tickFormatter={v => 'R$' + v} />
                <YAxis dataKey="prog" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTextColor, fontWeight: 600 }} width={80} />
                <Tooltip 
                  cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc', opacity: 0.1 }}
                  contentStyle={{ borderRadius: '12px', border: tooltipBorder, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: tooltipBg, color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => [formatCurrency(value), 'Lucro']}
                />
                <Bar dataKey="lucro" radius={[0, 4, 4, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.lucro >= 0 ? '#16a34a' : '#dc2626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Upcoming Bills */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Vencimentos Próximos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cartão</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Valor do Mês</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {faturas.length > 0 ? faturas.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">{c.nome}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "font-medium",
                      c.diasRestantes <= 5 ? "text-red-600 dark:text-red-400" : c.diasRestantes <= 10 ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"
                    )}>
                      {format(c.proximo, 'dd/MM')} <span className="text-xs opacity-60">({c.diasRestantes}d)</span>
                      {c.diasRestantes <= 5 && <span className="ml-1">⚠</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {c.valorFatura > 0 ? formatCurrency(c.valorFatura) : <span className="text-slate-300 dark:text-slate-600">R$ 0,00</span>}
                    </div>
                    {c.mesesFuturos > 0 && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        + {c.mesesFuturos} meses · {formatCurrency(c.totalFuturo)} comprometidos
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {c.valorFatura > 0 && (
                      <button 
                        onClick={() => handlePay(c.nome, c.proximoMes, c.valorFatura)}
                        className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                      >
                        ✓ Pagar
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600 text-sm">
                    Nenhum cartão cadastrado ou faturas pendentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color, valueClass }: { title: string; value: string; color: string; valueClass?: string }) {
  return (
    <div className={cn("bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border-l-4 border-slate-200 dark:border-white/5", color)}>
      <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
      <div className={cn("text-xl font-extrabold text-slate-900 dark:text-white", valueClass)}>{value}</div>
    </div>
  );
}
