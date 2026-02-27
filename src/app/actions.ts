'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addMonths, format, parseISO } from 'date-fns'

export async function executarAcao(formData: any) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')

  const { tipo, prog, qtd, valor, cartao, parc, data, trOrigem, trDestino, trBonus, vDataRec, vStatus } = formData

  if (tipo === 'compra') {
    // 1. Inserir Operação
    const { data: op, error: opErr } = await supabase.from('operacoes').insert({
      user_id: user.id,
      data,
      tipo: 'COMPRA',
      programa: prog,
      quantidade: qtd,
      valor_total: valor,
      cpm: (valor / qtd) * 1000,
      cartao_id: cartao // Assumindo que o ID do cartão é passado
    }).select().single()

    if (opErr) throw opErr

    // 2. Atualizar Saldo (e custo médio)
    // Busca saldo atual
    const { data: saldoData } = await supabase
      .from('programas_saldos')
      .select('*')
      .eq('user_id', user.id)
      .eq('nome_programa', prog)
      .single()

    const currentQtd = saldoData?.saldo_atual || 0
    const currentCusto = saldoData?.custo_medio || 0
    const totalQtd = currentQtd + qtd
    const totalInvestido = (currentQtd * currentCusto) + valor
    const novoCustoMedio = totalQtd > 0 ? totalInvestido / totalQtd : 0

    if (saldoData) {
      await supabase.from('programas_saldos').update({
        saldo_atual: totalQtd,
        custo_medio: novoCustoMedio
      }).eq('id', saldoData.id)
    } else {
      await supabase.from('programas_saldos').insert({
        user_id: user.id,
        nome_programa: prog,
        saldo_atual: totalQtd,
        custo_medio: novoCustoMedio
      })
    }

    // 3. Gerar Parcelas
    if (cartao && parc > 1) {
      const { data: card } = await supabase.from('cartoes').select('*').eq('id', cartao).single()
      const dataCompra = parseISO(data)
      const numParc = parseInt(parc)
      
      const parcelas = []
      for (let i = 0; i < numParc; i++) {
        const deslocamento = (card && dataCompra.getDate() >= card.dia_fechamento) ? i + 1 : i
        const dtVenc = new Date(dataCompra.getFullYear(), dataCompra.getMonth() + deslocamento, card ? card.dia_vencimento : 1)
        const dueMonth = format(dtVenc, 'yyyy-MM')
        
        parcelas.push({
          user_id: user.id,
          cartao_id: cartao,
          valor: valor / numParc,
          mes_referencia: dueMonth,
          parc_num: i + 1,
          total_parc: numParc,
          pago: false
        })
      }
      await supabase.from('faturas_parcelas').insert(parcelas)
    }
  } else if (tipo === 'venda') {
    // Lógica de venda...
    // Inserir operação, subtrair saldo, calcular ROI (opcional aqui ou no client)
    const { data: saldoData } = await supabase
      .from('programas_saldos')
      .select('*')
      .eq('user_id', user.id)
      .eq('nome_programa', prog)
      .single()

    if (!saldoData || saldoData.saldo_atual < qtd) throw new Error('Saldo insuficiente')

    const custoMedio = saldoData.custo_medio || 0
    const lucro = valor - (qtd * custoMedio)
    const roi = (lucro / (qtd * custoMedio)) * 100

    await supabase.from('operacoes').insert({
      user_id: user.id,
      data,
      tipo: 'VENDA',
      programa: prog,
      quantidade: qtd,
      valor_total: valor,
      roi: roi,
      status_recebimento: vStatus || 'pendente'
    })

    await supabase.from('programas_saldos').update({
      saldo_atual: saldoData.saldo_atual - qtd
    }).eq('id', saldoData.id)
  }

  revalidatePath('/')
  return { success: true }
}
