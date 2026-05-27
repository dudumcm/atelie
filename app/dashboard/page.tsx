'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface Registro {
  id: string
  descricao: string
  parecer_etico: string
  indice_etico: number
  created_at: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [descricao, setDescricao] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [registros, setRegistros] = useState<Registro[]>([])
  const [parecer, setParecer] = useState('')
  const [indice, setIndice] = useState<number | null>(null)
  const [tempoCura, setTempoCura] = useState(false)
  const [countdown, setCountdown] = useState(7)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/')
      } else {
        setUser(data.user)
        carregarRegistros(data.user.id)
      }
      setLoading(false)
    })
  }, [router])

  async function carregarRegistros(userId: string) {
    const { data } = await supabase
      .from('registros')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setRegistros(data)
  }

  function ativarTempoCura() {
    setTempoCura(true)
    setCountdown(7)
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          setTempoCura(false)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  async function handleEnviar() {
    if (!descricao.trim() || !user) return
    setEnviando(true)
    setParecer('')
    setIndice(null)

    const res = await fetch('/api/registros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao, userId: user.id }),
    })

    const data = await res.json()
    setParecer(data.parecer ?? 'Erro ao obter parecer.')
    setIndice(data.indice ?? null)
    setDescricao('')
    carregarRegistros(user.id)
    setEnviando(false)
  }

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
        <aside className="w-1/5 p-6 flex flex-col gap-4 overflow-y-auto">
          <h2 className="text-xs tracking-widest uppercase text-[#8C7355] border-b border-[#C4A882] pb-2">
            Berço
          </h2>
          <p className="text-xs text-[#8C7355]">Últimos registros</p>
          {registros.length === 0 && (
            <p className="text-xs text-[#B0956E] italic">Nenhum registro ainda.</p>
          )}
          {registros.map((r) => (
            <div key={r.id} className="border border-[#C4A882] rounded-sm p-3 bg-white/40">
              <p className="text-xs text-[#3B2F1E] line-clamp-2">{r.descricao}</p>
              <p className="text-xs text-[#8C7355] mt-1">Índice: {r.indice_etico}%</p>
            </div>
          ))}
          <div className="border border-red-400 rounded-sm p-3 bg-red-50/50 mt-auto">
            <p className="text-xs text-red-700 font-medium">Quarentena Ética</p>
            <p className="text-xs text-red-500 mt-1">Expira em 14h</p>
          </div>
        </aside>

        {/* Tear */}
        <main className="flex-1 p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-widest uppercase text-[#8C7355] border-b border-[#C4A882] pb-2">
            Tear
          </h2>

          {tempoCura ? (
            <div className="flex-1 border border-[#C4A882] rounded-sm bg-white/30 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-2 border-[#C4A882] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-[#8C7355]">⧖</span>
                </div>
                <p className="text-sm text-[#8C7355] tracking-wide">TEMPO DE CURA ATIVO</p>
                <p className="text-xs text-[#B0956E] mt-1">Canvas disponível em {countdown}s</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-3">
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva sua atividade criativa... O que você está criando? Quais referências usou? Qual intenção guia o processo?"
                className="flex-1 w-full border border-[#C4A882] bg-white/40 p-4 text-sm text-[#3B2F1E] placeholder-[#B0956E] focus:outline-none focus:ring-1 focus:ring-[#8C7355] resize-none rounded-sm"
              />
              <div className="flex gap-3">
                <button
                  onClick={ativarTempoCura}
                  className="border border-[#C4A882] text-[#8C7355] px-4 py-2 text-xs tracking-widest uppercase hover:bg-[#C4A882]/20 transition-colors"
                >
                  Tempo de Cura
                </button>
                <button
                  onClick={handleEnviar}
                  disabled={enviando || !descricao.trim()}
                  className="flex-1 bg-[#3B2F1E] text-[#F4EFEA] py-2 text-xs tracking-widest uppercase hover:bg-[#5C4530] transition-colors disabled:opacity-50"
                >
                  {enviando ? 'Analisando...' : 'Registrar e Analisar'}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Escudo de Conformidade */}
        <aside className="w-1/4 p-6 flex flex-col gap-4">
          <h2 className="text-xs tracking-widest uppercase text-[#8C7355] border-b border-[#C4A882] pb-2">
            Escudo de Conformidade
          </h2>

          {indice !== null && (
            <div className="bg-white/50 border border-[#C4A882] rounded-sm p-3">
              <p className="text-xs text-[#8C7355] uppercase tracking-widest mb-2">Índice Ético</p>
              <div className="w-full bg-[#E8DDD0] rounded-full h-2">
                <div
                  className="bg-[#8C7355] h-2 rounded-full transition-all duration-700"
                  style={{ width: `${indice}%` }}
                />
              </div>
              <p className="text-xs text-[#3B2F1E] mt-1 text-right">{indice}%</p>
            </div>
          )}

          {parecer && (
            <div className="bg-white/30 border border-[#C4A882] rounded-sm p-3">
              <p className="text-xs text-[#8C7355] uppercase tracking-widest mb-2">
                Parecer do Auditor
              </p>
              <p className="text-xs text-[#3B2F1E] leading-relaxed">{parecer}</p>
            </div>
          )}

          {!parecer && (
            <div className="bg-white/30 border border-[#C4A882] rounded-sm p-3 flex-1">
              <p className="text-xs text-[#8C7355] uppercase tracking-widest mb-2">Log</p>
              <ul className="space-y-1 text-xs text-[#3B2F1E]">
                <li>· Registros: {registros.length}</li>
                <li>· Último índice: {registros[0]?.indice_etico ?? '—'}%</li>
              </ul>
            </div>
          )}

          <button
            onClick={() => carregarRegistros(user!.id)}
            className="w-full bg-[#3B2F1E] text-[#F4EFEA] py-3 text-xs tracking-widest uppercase hover:bg-[#5C4530] transition-colors mt-auto"
          >
            Gerar Log do Processo
          </button>
        </aside>
      </div>
    </main>
  )
}
