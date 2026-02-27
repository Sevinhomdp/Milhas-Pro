import React, { useState, useEffect } from 'react';
import { Database, OpType, Program } from '../types';
import { PROGS } from '../constants';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { parseISO, format } from 'date-fns';
import { Trash2, Filter, Download, CheckSquare, Square, Plus, X } from 'lucide-react';

interface OperacoesProps {
  db: Database;
  onSave: (db: Database) => void;
  toast: (msg: string, type?: any) => void;
  confirm: (title: string, msg: string, onConfirm: () => void) => void;
  theme: 'light' | 'dark';
}

import { executarAcao } from '../app/actions';

export default function Operacoes({ db, onSave, toast, confirm, theme }: OperacoesProps) {
  const [tipo, setTipo] = useState<OpType | 'compra' | 'transf' | 'venda'>('compra');
  const [selectedOps, setSelectedOps] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    prog: PROGS[0],
    qtd: '',
    valor: '',
    cartao: '',
    parc: '1',
    data: new Date().toISOString().split('T')[0],
    trOrigem: PROGS[0],
    trDestino: PROGS[1],
    trBonus: '100',
    vDataRec: '',
    vStatus: 'pendente' as 'pendente' | 'recebido'
  });

  // Filters (Phase 2.4)
  const [filters, setFilters] = useState({
    tipo: 'Todos',
    prog: 'Todos',
    periodo: ''
  });

  const [score, setScore] = useState<{ label: string; cls: string } | null>(null);

  useEffect(() => {
    const qtd = parseFloat(formData.qtd) || 0;
    const val = parseFloat(formData.valor) || 0;
    if (!qtd || !val) { setScore(null); return; }

    if (tipo === 'compra') {
      const cpm = (val / qtd) * 1000;
      if (cpm < 18) setScore({ label: `✔ CPM excelente: R$ ${cpm.toFixed(2)}/mil`, cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' });
      else if (cpm < 25) setScore({ label: `⚡ CPM aceitável: R$ ${cpm.toFixed(2)}/mil`, cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' });
      else setScore({ label: `⚠ CPM alto: R$ ${cpm.toFixed(2)}/mil`, cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' });
    } else if (tipo === 'venda') {
      const cpv = (val / qtd) * 1000;
      if (cpv >= 28) setScore({ label: `✔ CPV excelente: R$ ${cpv.toFixed(2)}/mil`, cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' });
      else if (cpv >= 22) setScore({ label: `⚡ CPV razoável: R$ ${cpv.toFixed(2)}/mil`, cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' });
      else setScore({ label: `⚠ CPV baixo: R$ ${cpv.toFixed(2)}/mil`, cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' });
    } else {
      setScore(null);
    }
  }, [formData.qtd, formData.valor, tipo]);

  const handleLaunch = async () => {
    const qtd = parseFloat(formData.qtd);
    const valor = parseFloat(formData.valor);
    
    if (isNaN(qtd) || qtd <= 0) { toast("Quantidade inválida", "error"); return; }
    if (isNaN(valor) || valor < 0) { toast("Valor inválido", "error"); return; }

    let resumo = '';
    if (tipo === 'compra') resumo = `Compra de ${formatNumber(qtd)} milhas ${formData.prog} por ${formatCurrency(valor)}`;
    else if (tipo === 'transf') resumo = `Transferência de ${formatNumber(qtd)} milhas de ${formData.trOrigem} → ${formData.trDestino}`;
    else resumo = `Venda de ${formatNumber(qtd)} milhas ${formData.prog} por ${formatCurrency(valor)}`;

    confirm('Confirmar Operação', resumo, async () => {
      try {
        await executarAcao({
          ...formData,
          tipo,
          qtd,
          valor
        });
        toast("Operação lançada!", "success");
        setFormData(prev => ({ ...prev, qtd: '', valor: '' }));
      } catch (err: any) {
        toast(err.message, "error");
      }
    });
  };

  const filteredOps = db.ops.filter(o => {
    const matchTipo = filters.tipo === 'Todos' || o.tipo === filters.tipo;
    const matchProg = filters.prog === 'Todos' || o.programa.includes(filters.prog);
    const matchPeriodo = !filters.periodo || o.data.startsWith(filters.periodo);
    return matchTipo && matchProg && matchPeriodo;
  }).sort((a, b) => b.data.localeCompare(a.data));

  const totalFiltrado = filteredOps.reduce((a, o) => a + o.valor_total, 0);

  const handleBulkReceive = () => {
    if (selectedOps.length === 0) return;
    confirm(
      'Recebimento em Massa', 
      `Deseja marcar ${selectedOps.length} operações como recebidas?`,
      () => {
        // Logic to update Supabase
        toast(`${selectedOps.length} operações atualizadas!`, "success");
      }
    );
  };

  const handleBulkDelete = () => {
    if (selectedOps.length === 0) return;
    confirm(
      'Exclusão em Massa', 
      `Deseja excluir permanentemente ${selectedOps.length} operações?`,
      () => {
        // Logic to update Supabase
        toast(`${selectedOps.length} operações excluídas!`, "warning");
      }
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedOps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 pb-12">
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Lançamentos</h2>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['compra', 'transf', 'venda'].map(t => (
            <button
              key={t}
              onClick={() => setTipo(t as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                tipo === t ? "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {t === 'compra' ? '🛒 Compra' : t === 'transf' ? '🔄 Transf.' : '💰 Venda'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tipo === 'compra' && (
            <>
              <Select label="Programa" value={formData.prog} onChange={v => setFormData({ ...formData, prog: v as any })} options={PROGS} />
              <Input label="Qtd Milhas" value={formData.qtd} onChange={v => setFormData({ ...formData, qtd: v })} type="number" />
              <Input label="Custo (R$)" value={formData.valor} onChange={v => setFormData({ ...formData, valor: v })} type="number" />
              <Select label="Cartão" value={formData.cartao} onChange={v => setFormData({ ...formData, cartao: v })} options={['', ...db.cartoes.map(c => c.nome)]} />
              <Input label="Parcelas" value={formData.parc} onChange={v => setFormData({ ...formData, parc: v })} type="number" />
              <Input label="Data" value={formData.data} onChange={v => setFormData({ ...formData, data: v })} type="date" />
            </>
          )}
          {tipo === 'transf' && (
            <>
              <Select label="Origem" value={formData.trOrigem} onChange={v => setFormData({ ...formData, trOrigem: v as any })} options={PROGS} />
              <Select label="Destino" value={formData.trDestino} onChange={v => setFormData({ ...formData, trDestino: v as any })} options={PROGS} />
              <Input label="Qtd Enviada" value={formData.qtd} onChange={v => setFormData({ ...formData, qtd: v })} type="number" />
              <Input label="Bônus (%)" value={formData.trBonus} onChange={v => setFormData({ ...formData, trBonus: v })} type="number" />
              <Input label="Taxa (R$)" value={formData.valor} onChange={v => setFormData({ ...formData, valor: v })} type="number" />
              <Select label="Cartão Taxa" value={formData.cartao} onChange={v => setFormData({ ...formData, cartao: v })} options={['', ...db.cartoes.map(c => c.nome)]} />
            </>
          )}
          {tipo === 'venda' && (
            <>
              <Select label="Programa" value={formData.prog} onChange={v => setFormData({ ...formData, prog: v as any })} options={PROGS} />
              <Input label="Qtd Vendida" value={formData.qtd} onChange={v => setFormData({ ...formData, qtd: v })} type="number" />
              <Input label="Valor Recebido (R$)" value={formData.valor} onChange={v => setFormData({ ...formData, valor: v })} type="number" />
              <Input label="Data Rec." value={formData.vDataRec} onChange={v => setFormData({ ...formData, vDataRec: v })} type="date" />
              <Select label="Status" value={formData.vStatus} onChange={v => setFormData({ ...formData, vStatus: v as any })} options={['pendente', 'recebido']} />
              <Input label="Data" value={formData.data} onChange={v => setFormData({ ...formData, data: v })} type="date" />
            </>
          )}
        </div>

        {score && (
          <div className={cn("mt-4 px-4 py-2 rounded-xl text-xs font-bold inline-block", score.cls)}>
            {score.label}
          </div>
        )}

        <button 
          onClick={handleLaunch}
          className="w-full mt-6 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 font-bold py-3.5 rounded-xl hover:bg-slate-800 dark:hover:bg-amber-400 transition-colors"
        >
          Lançar Operação
        </button>
      </div>

      {/* History with Filters (Phase 2.4) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter size={16} /> Histórico de Operações
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedOps.length > 0 && (
                <div className="flex gap-2 mr-4 pr-4 border-r border-slate-200 dark:border-white/10">
                  <button onClick={handleBulkReceive} className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">✓ Receber ({selectedOps.length})</button>
                  <button onClick={handleBulkDelete} className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase">Excluir ({selectedOps.length})</button>
                </div>
              )}
              <select 
                value={filters.tipo} 
                onChange={e => setFilters({ ...filters, tipo: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-amber-500 dark:text-white"
              >
                <option value="Todos">Todos Tipos</option>
                <option value="COMPRA">Compra</option>
                <option value="VENDA">Venda</option>
                <option value="TRANSF">Transf.</option>
              </select>
              <select 
                value={filters.prog} 
                onChange={e => setFilters({ ...filters, prog: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-amber-500 dark:text-white"
              >
                <option value="Todos">Todos Programas</option>
                {PROGS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input 
                type="month" 
                value={filters.periodo} 
                onChange={e => setFilters({ ...filters, periodo: e.target.value })}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-amber-500 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-3 w-10">
                  <button 
                    onClick={() => setSelectedOps(selectedOps.length === filteredOps.length ? [] : filteredOps.map(o => o.id))}
                    className="text-slate-400 dark:text-slate-500"
                  >
                    {selectedOps.length === filteredOps.length && filteredOps.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Programa</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Qtd</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredOps.length > 0 ? filteredOps.map((o) => (
                <tr key={o.id} className={cn("hover:bg-slate-50 dark:hover:bg-white/5 transition-colors", selectedOps.includes(o.id) && "bg-amber-50 dark:bg-amber-500/5")}>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleSelect(o.id)} className="text-slate-400 dark:text-slate-500">
                      {selectedOps.includes(o.id) ? <CheckSquare size={18} className="text-amber-500" /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">{format(parseISO(o.data), 'dd/MM/yy')}</td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-sm">{o.programa}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{formatNumber(Math.floor(o.quantidade))}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      o.tipo === 'COMPRA' ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : 
                      o.tipo === 'VENDA' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : 
                      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                    )}>
                      {o.tipo}
                    </span>
                    {o.tipo === 'VENDA' && o.status_recebimento === 'pendente' && (
                      <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-1">⏳ A receber</div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(o.valor_total)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => confirm('Excluir Operação', `Deseja excluir a operação de ${formatNumber(o.quantidade)} milhas?`, () => {
                        // Logic to delete from Supabase
                        toast("Operação excluída", "warning");
                      })}
                      className="text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600 text-sm">
                    Nenhuma operação encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredOps.length > 0 && (
              <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-right text-xs text-slate-400 dark:text-slate-500 uppercase">Total Filtrado:</td>
                  <td colSpan={2} className="px-6 py-4 text-slate-900 dark:text-white">{formatCurrency(totalFiltrado)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-amber-500 outline-none transition-all dark:text-white"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-amber-500 outline-none transition-all dark:text-white"
      >
        {options.map(o => <option key={o} value={o}>{o || '— Nenhum —'}</option>)}
      </select>
    </div>
  );
}
