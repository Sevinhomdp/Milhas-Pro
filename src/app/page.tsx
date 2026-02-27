import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'
import { Database } from '@/types'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all user data
  const [
    { data: profile },
    { data: saldos },
    { data: cartoes },
    { data: ops },
    { data: parcelas }
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('programas_saldos').select('*').eq('user_id', user.id),
    supabase.from('cartoes').select('*').eq('user_id', user.id),
    supabase.from('operacoes').select('*').eq('user_id', user.id),
    supabase.from('faturas_parcelas').select('*').eq('user_id', user.id)
  ])

  const initialData: Database = {
    profile: profile || null,
    saldos: saldos || [],
    cartoes: cartoes || [],
    ops: ops || [],
    parcelas: parcelas || []
  }

  return <DashboardClient initialData={initialData} user={user} />
}
