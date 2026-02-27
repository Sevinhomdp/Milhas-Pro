import React, { useState, useEffect } from 'react';
import { formatCurrency, cn } from '../lib/utils';

export default function Simulador({ theme }: { theme: 'light' | 'dark' }) {
  const [data, setData] = useState({
    compradas: 0,
    saldoB: 0,
    saldoS: 0,
    bonus: 100,
    custoCompra: 0,
    taxas: 0,
    valorVenda: 0
  });

  const [res, setRes] = useState({
    milhasFinais: 0,
    custoTotal: 0,
    cpm: 0,
    cpv: 0,
    lucro: 0,
    roi: 0,
    roiText: '',
    roiColor: '',
    roiColorDark: '',
    cpm20: 0,
    cpm30: 0
  });

  useEffect(() => {
    const milhasFinais = ((data.compradas + data.saldoB) * (1 + data.bonus / 100)) + data.saldoS;
    const custoTotal = data.custoCompra + data.taxas;
    const cpm = milhasFinais > 0 ? (custoTotal / milhasFinais * 1000) : 0;
    const cpv = milhasFinais > 0 ? (data.valorVenda / milhasFinais * 1000) : 0;
    const lucro = data.valorVenda - custoTotal;
    const roi = custoTotal > 0 ? (lucro / custoTotal) * 100 : 0;

    const cpm20 = milhasFinais > 0 ? ((data.valorVenda / 1.2) * 1000) / milhasFinais : 0;
    const cpm30 = milhasFinais > 0 ? ((data.valorVenda / 1.3) * 1000) / milhasFinais : 0;

    let roiText = '', roiColor = '', roiColorDark = '';
    if (roi < 10) { 
      roiText = '❌ Evitar (< 10%)'; 
      roiColor = 'text-red-600'; 
      roiColorDark = 'dark:text-red-400';
    }
    else if (roi < 20) { 
      roiText = '⚠ Só se giro rápido (10–19%)'; 
      roiColor = 'text-amber-600'; 
      roiColorDark = 'dark:text-amber-400';
    }
    else if (roi < 30) { 
      roiText = '✔ Bom / Aceitável (20–29%)'; 
      roiColor = 'text-green-600'; 
      roiColorDark = 'dark:text-green-400';
    }
    else if (roi <= 50) { 
      roiText = '✔✔ Excelente (30–50%)'; 
      roiColor = 'text-green-600'; 
      roiColorDark = 'dark:text-green-400';
    }
    else { 
      roiText = '🚀 Prioridade Absoluta (> 50%)'; 
      roiColor = 'text-amber-500'; 
      roiColorDark = 'dark:text-amber-400';
    }

    setRes({ milhasFinais, custoTotal, cpm, cpv, lucro, roi, roiText, roiColor, roiColorDark, cpm20, cpm30 });
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setData(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Laboratório de Testes</h2>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Input label="Milhas Compradas" id="compradas" value={data.compradas} onChange={handleChange} />
          <Input label="Saldo Bonificável" id="saldoB" value={data.saldoB} onChange={handleChange} />
          <Input label="Saldo Seco" id="saldoS" value={data.saldoS} onChange={handleChange} />
          <Input label="Bônus (%)" id="bonus" value={data.bonus} onChange={handleChange} />
          <Input label="Custo Compra (R$)" id="custoCompra" value={data.custoCompra} onChange={handleChange} />
          <Input label="Taxas/Clubes (R$)" id="taxas" value={data.taxas} onChange={handleChange} />
          <div className="col-span-2">
            <Input label="VALOR TOTAL DA VENDA (R$)" id="valorVenda" value={data.valorVenda} onChange={handleChange} />
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border-l-4 border-amber-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <ResultItem label="Milhas Geradas" value={Math.floor(res.milhasFinais).toLocaleString()} />
            <ResultItem label="Lucro Líquido" value={formatCurrency(res.lucro)} valueClass={res.lucro >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} />
            <ResultItem label="CPM Compra" value={formatCurrency(res.cpm)} />
            <ResultItem label="CPV Venda" value={formatCurrency(res.cpv)} />
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/5 text-center">
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">ROI da Operação</div>
            <div className={cn("text-3xl font-black", res.roiColor, res.roiColorDark)}>
              {res.roi.toFixed(2)}% <span className="text-lg font-bold block md:inline">— {res.roiText}</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
              <div className="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase tracking-widest mb-1">Para ROI de 20%</div>
              <div className="text-lg font-bold text-green-800 dark:text-green-300">Compre a CPM máx de {formatCurrency(res.cpm20)}</div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/40 p-4 rounded-xl border border-green-200 dark:border-green-900/50">
              <div className="text-[10px] text-green-700 dark:text-green-300 font-bold uppercase tracking-widest mb-1">Para ROI de 30%</div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100">Compre a CPM máx de {formatCurrency(res.cpm30)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, id, value, onChange }: { label: string; id: string; value: number; onChange: any }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 block">{label}</label>
      <input
        type="number"
        id={id}
        value={value || ''}
        onChange={onChange}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-amber-500 outline-none transition-all dark:text-white"
      />
    </div>
  );
}

function ResultItem({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">{label}</div>
      <div className={cn("text-xl font-black text-slate-900 dark:text-white", valueClass)}>{value}</div>
    </div>
  );
}
