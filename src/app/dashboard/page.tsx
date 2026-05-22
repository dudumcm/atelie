'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/')
      } else {
        setUser(data.user)
      }
      setLoading(false)
    })
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EFEA] flex items-center justify-center">
        <p className="text-[#8C7355] text-sm tracking-widest uppercase">Carregando...</p>
      </div>
    )
  }

  return (
    <main
      style={{ fontFamily: "'IM Fell English', Georgia, serif" }}
      className="min-h-screen bg-[#F4EFEA] flex flex-col"
    >
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#C4A882] bg-white/50">
        <div>
          <h1 className="text-2xl text-[#3B2F1E] tracking-wide">Ateliê</h1>
          <p className="text-xs text-[#8C7355] tracking-widest uppercase">Escudo ativo</p>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs text-[#8C7355]">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-[#3B2F1E] border border-[#C4A882] px-4 py-1.5 hover:bg-[#3B2F1E] hover:text-[#F4EFEA] transition-colors tracking-widest uppercase"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Three columns */}
      <div className="flex flex-1 divide-x divide-[#C4A882]">

        {/* Berço */}
        <aside className="w-1/5 p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-widest uppercase text-[#8C7355] border-b border-[#C4A882] pb-2">
            Berço
          </h2>
          <div className="border border-dashed border-[#C4A882] rounded-sm p-4 text-xs text-[#8C7355] text-center cursor-pointer hover:bg-white/50 transition-colors">
            + Adicionar arquivo
          </div>
          <div className="border border-red-400 rounded-sm p-3 bg-red-50/50">
            <p className="text-xs text-red-700 font-medium">Quarentena Ética</p>
            <p className="text-xs text-red-500 mt-1">Expira em 14h</p>
          </div>
        </aside>

        {/* Tear */}
        <main className="flex-1 p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-widest uppercase text-[#8C7355] border-b border-[#C4A882] pb-2">
            Tear
          </h2>
          <div className="flex-1 border border-[#C4A882] rounded-sm bg-white/30 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-2 border-[#C4A882] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-[#8C7355]">⧖</span>
              </div>
              <p className="text-sm text-[#8C7355] tracking-wide">TEMPO DE CURA ATIVO</p>
              <p className="text-xs text-[#B0956E] mt-1">Canvas disponível em 7s</p>
            </div>
          </div>
        </main>

        {/* Escudo de Conformidade */}
        <aside className="w-1/4 p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-widest uppercase text-[#8C7355] border-b border-[#C4A882] pb-2">
            Escudo de Conformidade
          </h2>

          <div className="space-y-3">
            <div className="bg-white/50 border border-[#C4A882] rounded-sm p-3">
              <p className="text-xs text-[#8C7355] uppercase tracking-widest mb-2">Índice Ético</p>
              <div className="w-full bg-[#E8DDD0] rounded-full h-2">
                <div className="bg-[#8C7355] h-2 rounded-full" style={{ width: '82%' }} />
              </div>
              <p className="text-xs text-[#3B2F1E] mt-1 text-right">82%</p>
            </div>

            <div className="bg-white/50 border border-[#C4A882] rounded-sm p-3">
              <p className="text-xs text-[#8C7355] uppercase tracking-widest mb-2">Autoria</p>
              <div className="w-full bg-[#E8DDD0] rounded-full h-2">
                <div className="bg-[#3B2F1E] h-2 rounded-full" style={{ width: '95%' }} />
              </div>
              <p className="text-xs text-[#3B2F1E] mt-1 text-right">95%</p>
            </div>
          </div>

          <div className="bg-white/30 border border-[#C4A882] rounded-sm p-3 flex-1">
            <p className="text-xs text-[#8C7355] uppercase tracking-widest mb-2">Log</p>
            <ul className="space-y-1 text-xs text-[#3B2F1E]">
              <li>· Tempo de contemplação: 4min</li>
              <li>· Vetos éticos: 1</li>
              <li>· Curas ativadas: 2</li>
            </ul>
          </div>

          <button className="w-full bg-[#3B2F1E] text-[#F4EFEA] py-3 text-xs tracking-widest uppercase hover:bg-[#5C4530] transition-colors">
            Gerar Log do Processo
          </button>
        </aside>
      </div>
    </main>
  )
}
