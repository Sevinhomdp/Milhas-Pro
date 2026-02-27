'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  LayoutDashboard, 
  Wallet, 
  Calculator, 
  History, 
  PieChart, 
  CreditCard, 
  TrendingUp, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon,
  User
} from 'lucide-react'
import { Database, ViewType } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

// Components (we'll need to update these too)
import Dashboard from '@/components/Dashboard'
import Saldos from '@/components/Saldos'
import Simulador from '@/components/Simulador'
import Operacoes from '@/components/Operacoes'
import DRE from '@/components/DRE'
import Cartoes from '@/components/Cartoes'
import Projecao from '@/components/Projecao'
import Toast from '@/components/Toast'
import Modal from '@/components/Modal'

interface DashboardClientProps {
  initialData: Database;
  user: any;
}

export default function DashboardClient({ initialData, user }: DashboardClientProps) {
  const [view, setView] = useState<ViewType>('dashboard')
  const [db, setDb] = useState<Database>(initialData)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('milhas-pro-theme')
      return (saved as 'light' | 'dark') || 'dark'
    }
    return 'dark'
  })
  const [toast, setToast] = useState<{ msg: string; type: any } | null>(null)
  const [confirmModal, setConfirmModal] = useState<{ title: string; msg: string; onConfirm: () => void } | null>(null)

  const supabase = createClient()

  useEffect(() => {
    localStorage.setItem('milhas-pro-theme', theme)
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.style.colorScheme = theme
  }, [theme])

  const showToast = (msg: string, type: any = 'info') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'saldos', label: 'Meus Saldos', icon: Wallet },
    { id: 'operacoes', label: 'Lançamentos', icon: History },
    { id: 'dre', label: 'DRE Mensal', icon: PieChart },
    { id: 'projecao', label: 'Projeção', icon: TrendingUp },
    { id: 'simulador', label: 'Simulador', icon: Calculator },
    { id: 'cartoes', label: 'Cartões', icon: CreditCard },
  ]

  const renderView = () => {
    const props = { 
      db, 
      onSave: (newDb: Database) => setDb(newDb), // Temporary, will need real save logic
      toast: showToast,
      confirm: (title: string, msg: string, onConfirm: () => void) => setConfirmModal({ title, msg, onConfirm }),
      theme
    }

    switch (view) {
      case 'dashboard': return <Dashboard {...props} />
      case 'saldos': return <Saldos {...props} />
      case 'simulador': return <Simulador theme={theme} />
      case 'operacoes': return <Operacoes {...props} />
      case 'dre': return <DRE db={db} theme={theme} />
      case 'cartoes': return <Cartoes {...props} />
      case 'projecao': return <Projecao db={db} theme={theme} />
      default: return <Dashboard {...props} />
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 z-50 overflow-hidden flex flex-col"
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-black text-slate-900 dark:text-amber-500 tracking-tighter"
            >
              ✈ MILHAS PRO
            </motion.div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-500">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewType)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all group",
                view === item.id 
                  ? "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-900 shadow-lg shadow-slate-900/10 dark:shadow-amber-500/10" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
              )}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="text-sm font-bold">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-white/5 space-y-2">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-full flex items-center gap-4 p-3 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            {sidebarOpen && <span className="text-sm font-bold">{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>}
          </button>
          
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-bold text-xs">
              {user?.email?.[0].toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-500 font-medium">Plano Pro</p>
              </div>
            )}
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm font-bold">Sair</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 p-8",
        sidebarOpen ? "ml-[280px]" : "ml-[80px]"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {toast && <Toast message={toast.msg} type={toast.type} />}
        {confirmModal && (
          <Modal 
            title={confirmModal.title}
            message={confirmModal.msg}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
