'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'motion/react'
import { Mail, Lock, LogIn, Chrome, AlertCircle, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('Iniciando autenticação para:', email)
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome: email.split('@')[0],
            },
          },
        })
        if (error) throw error
        alert('Verifique seu e-mail para confirmar o cadastro!')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        console.log('Login bem-sucedido:', data.user?.id)
        
        // Pequeno delay para garantir que o cookie seja processado pelo browser no iframe
        setTimeout(() => {
          console.log('Redirecionando para a dashboard...')
          window.location.href = '/'
        }, 800)
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err)
      setError(err.message || 'Erro ao processar autenticação')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <span className="text-3xl text-black font-bold">✈</span>
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MILHAS PRO</h1>
          <p className="text-amber-500/60 text-sm mt-2 uppercase tracking-[0.2em] font-medium">Gestão de Elite</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold py-4 rounded-2xl transition-all shadow-[0_10px_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Acessar Dashboard')}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900/50 px-4 text-zinc-500 tracking-widest">Ou continue com</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-white font-medium py-4 rounded-2xl transition-all flex items-center justify-center gap-3"
          >
            <Chrome size={20} className="text-amber-500" />
            Google
          </button>

          <div className="mt-8 text-center space-y-4">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-zinc-500 hover:text-amber-500 text-sm transition-colors"
            >
              {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Cadastre-se'}
            </button>
            <br />
            <button className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">
              Esqueceu sua senha?
            </button>
          </div>
        </div>

        <p className="text-center text-zinc-700 text-[10px] mt-8 uppercase tracking-[0.3em]">
          &copy; 2024 Milhas Pro &bull; Private Banking System
        </p>
      </motion.div>
    </div>
  )
}
