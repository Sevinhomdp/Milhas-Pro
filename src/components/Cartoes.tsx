import React, { useState } from 'react';
import { Database } from '../types';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { RefreshCw } from 'lucide-react';

interface CartoesProps {
  db: Database;
  onSave: (db: Database) => void;
  toast: (msg: string, type?: any) => void;
  confirm: (title: string, msg: string, onConfirm: () => void) => void;
  theme: 'light' | 'dark';
}

export default function Cartoes({ db, onSave, toast, confirm, theme }: CartoesProps) {
  const [newCard, setNewCard] = useState({ nome: '', fecha: '', vence: '' });
  const [c6, setC6] = useState({ gasto: '', dolar: '5.80' });
  const [isUpdatingDolar, setIsUpdatingDolar] = useState(false);

  const handleAddCard = () => {
    if (!newCard.nome || !newCard.fecha || !newCard.vence) {
      toast("Preencha todos os campos", "error");
      return;
    }
    // Logic to save to Supabase
    toast("Cartão adicionado!", "success");
    setNewCard({ nome: '', fecha: '', vence: '' });
  };

  const buscarDolar = async () => {
    setIsUpdatingDolar(true);
    try {
      const r = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
      const data = await r.json();
      const cotacao = parseFloat(data.USDBRL.bid).toFixed(2);
      setC6({ ...c6, dolar: cotacao });
      toast(`Dólar atualizado: R$ ${cotacao}`, 'success');
    } catch (e) {
      toast('Erro ao buscar cotação', 'error');
    } finally {
      setIsUpdatingDolar(false);
    }
  };

  const pontosC6 = Math.floor((parseFloat(c6.gasto) || 0) / (parseFloat(c6.dolar) || 1) * 2.5);

  return (
    <div className="space-y-6 pb-12">
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Gerenciar Cartões</h2>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Adicionar Novo</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Input label="Nome" value={newCard.nome} onChange={v => setNewCard({ ...newCard, nome: v })} placeholder="Ex: Nubank UV" />
          <Input label="Fechamento (dia)" value={newCard.fecha} onChange={v => setNewCard({ ...newCard, fecha: v })} type="number" placeholder="Ex: 5" />
          <Input label="Vencimento (dia)" value={newCard.vence} onChange={v => setNewCard({ ...newCard, vence: v })} type="number" placeholder="Ex: 12" />
          <button 
            onClick={handleAddCard}
            className="bg-green-600 dark:bg-green-500 text-white dark:text-slate-900 font-bold py-2.5 rounded-xl hover:bg-green-700 dark:hover:bg-green-400 transition-colors"
          >
            + Adicionar
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cartões Salvos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fechamento</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {db.cartoes.length > 0 ? db.cartoes.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{c.nome}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Dia {c.dia_fechamento}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">Dia {c.dia_vencimento}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => confirm('Remover Cartão', `Deseja remover o cartão <b>${c.nome}</b>?`, () => {
                        // Logic to remove from Supabase
                        toast("Cartão removido", "warning");
                      })}
                      className="text-red-600 dark:text-red-400 font-bold text-xs hover:underline"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600 text-sm">Nenhum cartão cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-black p-8 rounded-2xl shadow-xl border border-white/5">
        <h3 className="text-amber-500 font-black text-lg mb-6 uppercase tracking-widest">Calculadora C6 Black</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Gasto R$</label>
            <input
              type="number"
              value={c6.gasto}
              onChange={e => setC6({ ...c6, gasto: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-amber-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Dólar</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={c6.dolar}
                onChange={e => setC6({ ...c6, dolar: e.target.value })}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-amber-500 outline-none transition-all"
              />
              <button 
                onClick={buscarDolar}
                disabled={isUpdatingDolar}
                className="bg-amber-500 text-slate-900 p-3 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={20} className={cn(isUpdatingDolar && "animate-spin")} />
              </button>
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Pontos Gerados</div>
            <div className="text-4xl font-black text-amber-500">{formatNumber(pontosC6)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-amber-500 outline-none transition-all dark:text-white"
      />
    </div>
  );
}
