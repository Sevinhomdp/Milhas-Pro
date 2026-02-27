export type Program = "Livelo" | "Esfera" | "Átomos" | "Smiles" | "Azul" | "LATAM" | "Inter" | "Itaú";

export interface Profile {
  id: string;
  user_id: string;
  nome: string;
  avatar_url: string;
}

export interface ProgramaSaldo {
  id: string;
  user_id: string;
  nome_programa: string;
  saldo_atual: number;
  custo_medio: number;
}

export interface Card {
  id: string;
  user_id: string;
  nome: string;
  dia_fechamento: number;
  dia_vencimento: number;
}

export type OpType = 'COMPRA' | 'VENDA' | 'TRANSF';

export interface Operation {
  id: string;
  user_id: string;
  data: string;
  tipo: 'COMPRA' | 'VENDA' | 'TRANSF';
  programa: string;
  quantidade: number;
  valor_total: number;
  cpm?: number;
  roi?: number;
  status_recebimento: 'pendente' | 'recebido';
  cartao_id?: string;
}

export interface Installment {
  id: string;
  user_id: string;
  cartao_id: string;
  valor: number;
  mes_referencia: string;
  parc_num?: number;
  total_parc?: number;
  pago: boolean;
}

export interface Database {
  profile: Profile | null;
  saldos: ProgramaSaldo[];
  cartoes: Card[];
  ops: Operation[];
  parcelas: Installment[];
}

export type ViewType = 'dashboard' | 'saldos' | 'simulador' | 'operacoes' | 'dre' | 'cartoes' | 'projecao';
