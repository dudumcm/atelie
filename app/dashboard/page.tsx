'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface Card {
  id: string
  tipo: 'texto' | 'imagem'
  conteudo: string
  x: number
  y: number
  parecer: string
  indice: number
  analisando: boolean
}

interface Registro {
  id: string
  descricao: string
  parecer_etico: string
  indice_etico: number
  created_at: string
}

function indiceColor(indice: number) {
  if (indice >= 78) return '#6B8F5E'
  if (indice >= 55) return '#C4A237'
  return '#C4614A'
}

function formatarData(iso: string) {
  const d = new Date(iso)
  const dia = d.getDate().toString().padStart(2, '0')
  const mes = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')
  const ano = d.getFullYear()
  const hora = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${dia} ${mes} ${ano} · ${hora}:${min}`
}

async function comprimirImagem(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 800
      let w = img.width
      let h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
        else { w = Math.round((w * MAX) / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = url
  })
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<Card[]>([])
  const [registros, setRegistros] = useState<Registro[]>([])
  const [novoTexto, setNovoTexto] = useState('')
  const [indiceGeral, setIndiceGeral] = useState<number | null>(null)
  const [parecerGeral, setParecerGeral] = useState('')
  const [tempoCura, setTempoCura] = useState(false)
  const [countdown, setCountdown] = useState(7)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const boardRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/')
      } else {
        setUser(data.user)
        carregarRegistros(data.user.id)
        carregarCards(data.user.id)
      }
      setLoading(false)
    })
  }, [router])

  useEffect(() => {
    if (cards.length === 0) {
      setIndiceGeral(null)
      setParecerGeral('')
      return
    }
    const analisados = cards.filter(c => c.indice > 0)
    if (analisados.length === 0) return
    const media = Math.round(analisados.reduce((acc, c) => acc + c.indice, 0) / analisados.length)
    setIndiceGeral(media)
    if (media >= 78) setParecerGeral('Conjunto criativo com alta conformidade ética. O processo como um todo demonstra autoria e intencionalidade.')
    else if (media >= 55) setParecerGeral('Conformidade moderada no conjunto. Alguns elementos pedem maior contextualização da autoria.')
    else setParecerGeral('Conjunto com baixo índice ético. Revise as referências e reforce a presença humana no processo.')
  }, [cards])

  async function carregarRegistros(userId: string) {
    const { data } = await supabase
      .from('registros')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setRegistros(data)
  }

  async function carregarCards(userId: string) {
    const { data } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (data) {
      setCards(data.map(c => ({ ...c, analisando: false })))
    }
  }

  async function analisarCard(id: string, conteudo: string, userId: string) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, analisando: true } : c))

    const res = await fetch('/api/registros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao: conteudo, userId }),
    })

    const data = await res.json()
    const parecer = data.parecer ?? 'Sem parecer.'
    const indice = data.indice ?? 50

    setCards(prev => prev.map(c =>
      c.id === id ? { ...c, parecer, indice, analisando: false } : c
    ))

    await supabase.from('cards').update({ parecer, indice }).eq('id', id).eq('user_id', userId)

    carregarRegistros(userId)
  }

  async function adicionarTexto() {
    if (!novoTexto.trim() || !user) return
    const id = crypto.randomUUID()
    const x = 40 + Math.random() * 200
    const y = 40 + Math.random() * 100
    const conteudo = novoTexto

    setCards(prev => [...prev, { id, tipo: 'texto', conteudo, x, y, parecer: '', indice: 0, analisando: false }])
    setNovoTexto('')

    await supabase.from('cards').insert({ id, user_id: user.id, tipo: 'texto', conteudo, x, y, parecer: '', indice: 0 })

    analisarCard(id, conteudo, user.id)
  }

  async function adicionarImagem(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !user) return
    const file = e.target.files[0]
    e.target.value = ''

    const conteudo = await comprimirImagem(file)
    const id = crypto.randomUUID()
    const x = 40 + Math.random() * 200
    const y = 40 + Math.random() * 100

    setCards(prev => [...prev, { id, tipo: 'imagem', conteudo, x, y, parecer: '', indice: 0, analisando: false }])

    await supabase.from('cards').insert({ id, user_id: user.id, tipo: 'imagem', conteudo, x, y, parecer: '', indice: 0 })

    analisarCard(id, 'Imagem de referência visual adicionada ao processo criativo.', user.id)
  }

  async function removerCard(id: string) {
    if (!user) return
    setCards(prev => prev.filter(c => c.id !== id))
    await supabase.from('cards').delete().eq('id', id).eq('user_id', user.id)
  }

  const onMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const card = cards.find(c => c.id === id)
    if (!card) return
    setDragging(id)
    setDragOffset({ x: e.clientX - card.x, y: e.clientY - card.y })
  }, [cards])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setCards(prev => prev.map(c =>
      c.id === dragging
        ? { ...c, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }
        : c
    ))
  }, [dragging, dragOffset])

  const onMouseUp = useCallback(async () => {
    if (dragging && user) {
      const card = cards.find(c => c.id === dragging)
      if (card) {
        await supabase.from('cards').update({ x: card.x, y: card.y }).eq('id', dragging).eq('user_id', user.id)
      }
    }
    setDragging(null)
  }, [dragging, cards, user])

  function ativarTempoCura() {
    setTempoCura(true)
    setCountdown(7)
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); setTempoCura(false); return 0 }
        return c - 1
      })
    }, 1000)
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
    <main style={{ fontFamily: "'IM Fell English', Georgia, serif" }} className="min-h-screen bg-[#F4EFEA] flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#C4A882] bg-white/50 shrink-0">
        <div>
          <h1 className="text-2xl text-[#3B2F1E] tracking-wide">Ateliê</h1>
          <p className="text-xs text-[#8C7355] tracking-widest uppercase">Escudo ativo</p>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs text-[#8C7355]">{user?.email}</span>
          <button onClick={handleLogout} className="text-xs text-[#3B2F1E] border border-[#C4A882] px-4 py-1.5 hover:bg-[#3B2F1E] hover:text-[#F4EFEA] transition-colors tracking-widest uppercase">
            Sair
          </button>
        </div>
      </header>

      <div className="flex flex-1 divide-x divide-[#C4A882] overflow-hidden">

        {/* Berço */}
        <aside className="w-64 shrink-0 flex flex-col border-r border-[#C4A882] bg-white/30">
          <div className="p-4 border-b border-[#C4A882]">
            <h2 className="text-xs tracking-widest uppercase text-[#8C7355]">Berço</h2>
          </div>

          <div className="p-4 flex flex-col gap-3 border-b border-[#C4A882]">
            <p className="text-xs text-[#8C7355] uppercase tracking-widest">Adicionar ao board</p>

            <textarea
              value={novoTexto}
              onChange={e => setNovoTexto(e.target.value)}
              placeholder="Conceito, descrição ou ideia..."
              rows={3}
              className="w-full border border-[#C4A882] bg-[#FAF7F2] px-3 py-2 text-xs text-[#3B2F1E] placeholder-[#B0956E] focus:outline-none focus:ring-1 focus:ring-[#8C7355] resize-none rounded-sm"
            />
            <button
              onClick={adicionarTexto}
              disabled={!novoTexto.trim()}
              className="w-full bg-[#3B2F1E] text-[#F4EFEA] py-2 text-xs tracking-widest uppercase hover:bg-[#5C4530] transition-colors disabled:opacity-40"
            >
              + Adicionar texto
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border border-[#C4A882] text-[#8C7355] py-2 text-xs tracking-widest uppercase hover:bg-[#C4A882]/20 transition-colors"
            >
              + Adicionar imagem
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={adicionarImagem} className="hidden" />

            <button
              onClick={ativarTempoCura}
              className="w-full border border-dashed border-[#C4A882] text-[#8C7355] py-2 text-xs tracking-widest uppercase hover:bg-[#C4A882]/10 transition-colors"
            >
              ⧖ Tempo de Cura
            </button>
          </div>

          {/* Registros salvos */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            <p className="text-xs text-[#8C7355] uppercase tracking-widest mb-1">Histórico</p>
            {registros.length === 0 && <p className="text-xs text-[#B0956E] italic">Nenhum registro ainda.</p>}
            {registros.map(r => (
              <div key={r.id} className="border border-[#C4A882] rounded-sm p-2 bg-white/40">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs text-[#3B2F1E] line-clamp-2 flex-1">{r.descricao}</p>
                  <div className="relative shrink-0 group/clock">
                    <button className="text-[#C4A882] hover:text-[#8C7355] transition-colors leading-none mt-0.5 text-[11px]">◷</button>
                    <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/clock:block z-30 pointer-events-none">
                      <div className="bg-[#3B2F1E] text-[#F4EFEA] text-[10px] tracking-wide px-2 py-1 rounded-sm whitespace-nowrap">
                        {formatarData(r.created_at)}
                      </div>
                      <div className="w-1.5 h-1.5 bg-[#3B2F1E] rotate-45 ml-auto mr-1 -mt-1" />
                    </div>
                  </div>
                </div>
                <p className="text-xs mt-1" style={{ color: indiceColor(r.indice_etico) }}>{r.indice_etico}%</p>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-red-200">
            <div className="border border-red-400 rounded-sm p-2 bg-red-50/50">
              <p className="text-xs text-red-700 font-medium">Quarentena Ética</p>
              <p className="text-xs text-red-500 mt-0.5">Expira em 14h</p>
            </div>
          </div>
        </aside>

        {/* Tear — Board */}
        <main className="flex-1 relative overflow-hidden">
          <div className="absolute top-3 left-3 z-10">
            <p className="text-xs tracking-widest uppercase text-[#8C7355] bg-white/60 px-3 py-1 rounded-sm border border-[#C4A882]">Tear</p>
          </div>

          {tempoCura && (
            <div className="absolute inset-0 bg-[#F4EFEA]/90 flex items-center justify-center z-20">
              <div className="text-center">
                <div className="w-16 h-16 border-2 border-[#C4A882] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-[#8C7355]">⧖</span>
                </div>
                <p className="text-sm text-[#8C7355] tracking-wide">TEMPO DE CURA ATIVO</p>
                <p className="text-xs text-[#B0956E] mt-1">Board disponível em {countdown}s</p>
              </div>
            </div>
          )}

          {cards.length === 0 && !tempoCura && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-[#C4A882] tracking-wide italic">Adicione elementos pelo Berço</p>
            </div>
          )}

          <div
            ref={boardRef}
            className="w-full h-full relative"
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            {cards.map(card => (
              <div
                key={card.id}
                style={{ position: 'absolute', left: card.x, top: card.y, cursor: dragging === card.id ? 'grabbing' : 'grab', zIndex: dragging === card.id ? 50 : 10 }}
                className="w-56 bg-white border border-[#C4A882] rounded-sm shadow-md select-none"
                onMouseDown={e => onMouseDown(e, card.id)}
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#C4A882] bg-[#FAF7F2]">
                  <span className="text-xs text-[#8C7355] uppercase tracking-widest">{card.tipo}</span>
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => removerCard(card.id)}
                    className="text-xs text-[#C4A882] hover:text-red-500 transition-colors"
                  >✕</button>
                </div>

                {/* Card content */}
                <div className="p-3">
                  {card.tipo === 'texto' ? (
                    <p className="text-xs text-[#3B2F1E] leading-relaxed">{card.conteudo}</p>
                  ) : (
                    <img src={card.conteudo} alt="referência" className="w-full rounded-sm object-cover max-h-32" />
                  )}
                </div>

                {/* Card análise */}
                <div className="px-3 pb-3">
                  {card.analisando ? (
                    <p className="text-xs text-[#8C7355] italic">Analisando...</p>
                  ) : card.parecer ? (
                    <>
                      <div className="w-full bg-[#E8DDD0] rounded-full h-1.5 mb-1">
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{ width: `${card.indice}%`, backgroundColor: indiceColor(card.indice) }}
                        />
                      </div>
                      <p className="text-xs mb-1" style={{ color: indiceColor(card.indice) }}>{card.indice}%</p>
                      <p className="text-xs text-[#8C7355] leading-relaxed">{card.parecer}</p>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Escudo de Conformidade */}
        <aside className="w-56 shrink-0 flex flex-col border-l border-[#C4A882] bg-white/30">
          <div className="p-4 border-b border-[#C4A882]">
            <h2 className="text-xs tracking-widest uppercase text-[#8C7355]">Escudo de Conformidade</h2>
          </div>

          <div className="flex-1 p-4 flex flex-col gap-4">
            {indiceGeral !== null ? (
              <>
                <div>
                  <p className="text-xs text-[#8C7355] uppercase tracking-widest mb-2">Índice Geral</p>
                  <div className="w-full bg-[#E8DDD0] rounded-full h-2 mb-1">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${indiceGeral}%`, backgroundColor: indiceColor(indiceGeral) }}
                    />
                  </div>
                  <p className="text-xs text-right font-medium" style={{ color: indiceColor(indiceGeral) }}>{indiceGeral}%</p>
                </div>

                <div className="bg-[#FAF7F2] border border-[#C4A882] rounded-sm p-3">
                  <p className="text-xs text-[#8C7355] uppercase tracking-widest mb-2">Parecer Geral</p>
                  <p className="text-xs text-[#3B2F1E] leading-relaxed">{parecerGeral}</p>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#B0956E] italic">Adicione elementos ao board para ver o índice.</p>
            )}

            <div className="mt-auto">
              <p className="text-xs text-[#8C7355] uppercase tracking-widest mb-2">Log</p>
              <ul className="space-y-1 text-xs text-[#3B2F1E]">
                <li>· Cards no board: {cards.length}</li>
                <li>· Registros salvos: {registros.length}</li>
                <li>· Último índice: {registros[0]?.indice_etico ?? '—'}%</li>
              </ul>
            </div>
          </div>

          <div className="p-4 border-t border-[#C4A882]">
            <button
              onClick={() => user && carregarRegistros(user.id)}
              className="w-full bg-[#3B2F1E] text-[#F4EFEA] py-3 text-xs tracking-widest uppercase hover:bg-[#5C4530] transition-colors"
            >
              Gerar Log
            </button>
          </div>
        </aside>
      </div>
    </main>
  )
}
