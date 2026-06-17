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

interface Conexao {
  de: string
  para: string
  cardGeradoId: string
}

const TEMPO_CURA_DURACAO = 45

const REFLEXOES = {
  texto: [
    'Esta ideia é genuinamente sua ou uma influência ainda não processada?',
    'Quem poderia ser impactado por este conceito — para o bem e para o mal?',
    'Esta ideia respeita a cultura que a inspirou? Como aprofundar essa relação?',
    'Se você não pudesse usar IA neste projeto, o que mudaria no processo?',
    'Qual a intenção por trás deste conceito? Ela é clara para você?',
    'Este registro documenta uma escolha consciente ou um impulso não refletido?',
  ],
  imagem: [
    'De onde vem esta imagem? Você tem autoridade para usá-la como referência?',
    'O que esta imagem carrega que palavras não conseguem descrever?',
    'Esta imagem pertence a uma cultura específica. Como você pode honrá-la?',
    'Como você transformará esta influência em algo genuinamente seu?',
    'Que memória ou emoção esta referência visual desperta em você?',
    'O que nesta imagem ainda não foi visto ou explorado por outros?',
  ],
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

function formatarTempoCura(segundos: number) {
  if (segundos === 0) return '—'
  if (segundos < 60) return `${segundos}s`
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return s === 0 ? `${m}min` : `${m}min ${s}s`
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
  const [gerandoParecer, setGerandoParecer] = useState(false)
  const [tempoCura, setTempoCura] = useState(false)
  const [tempoCuraMensagem, setTempoCuraMensagem] = useState('')
  const [tempoCuraTotal, setTempoCuraTotal] = useState(0)
  const [countdown, setCountdown] = useState(TEMPO_CURA_DURACAO)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [modoConexao, setModoConexao] = useState(false)
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [conexoes, setConexoes] = useState<Conexao[]>([])
  const [gerandoConexao, setGerandoConexao] = useState(false)
  const [erroConexao, setErroConexao] = useState('')
  const [cardParaRemover, setCardParaRemover] = useState<string | null>(null)
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
    if (data) setCards(data.map(c => ({ ...c, analisando: false })))
  }

  function iniciarTempoCura(tipo: 'texto' | 'imagem') {
    const lista = REFLEXOES[tipo]
    setTempoCuraMensagem(lista[Math.floor(Math.random() * lista.length)])
    setTempoCura(true)
    setCountdown(TEMPO_CURA_DURACAO)
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          setTempoCura(false)
          setTempoCuraTotal(prev => prev + TEMPO_CURA_DURACAO)
          return 0
        }
        return c - 1
      })
    }, 1000)
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
    if (!novoTexto.trim() || !user || tempoCura) return
    const id = crypto.randomUUID()
    const x = 40 + Math.random() * 200
    const y = 40 + Math.random() * 100
    const conteudo = novoTexto

    setCards(prev => [...prev, { id, tipo: 'texto', conteudo, x, y, parecer: '', indice: 0, analisando: false }])
    setNovoTexto('')

    await supabase.from('cards').insert({ id, user_id: user.id, tipo: 'texto', conteudo, x, y, parecer: '', indice: 0 })

    analisarCard(id, conteudo, user.id)
    iniciarTempoCura('texto')
  }

  async function adicionarImagem(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !user || tempoCura) return
    const file = e.target.files[0]
    e.target.value = ''

    const conteudo = await comprimirImagem(file)
    const id = crypto.randomUUID()
    const x = 40 + Math.random() * 200
    const y = 40 + Math.random() * 100

    setCards(prev => [...prev, { id, tipo: 'imagem', conteudo, x, y, parecer: '', indice: 0, analisando: false }])

    await supabase.from('cards').insert({ id, user_id: user.id, tipo: 'imagem', conteudo, x, y, parecer: '', indice: 0 })

    analisarCard(id, 'Imagem de referência visual adicionada ao processo criativo.', user.id)
    iniciarTempoCura('imagem')
  }

  async function removerCard(id: string) {
    if (!user) return
    setCards(prev => prev.filter(c => c.id !== id))
    setConexoes(prev => prev.filter(c => c.de !== id && c.para !== id && c.cardGeradoId !== id))
    setSelecionados(prev => prev.filter(s => s !== id))
    setCardParaRemover(null)
    await supabase.from('cards').delete().eq('id', id).eq('user_id', user.id)
  }

  function toggleModoConexao() {
    setModoConexao(prev => !prev)
    setSelecionados([])
  }

  async function gerarConexao() {
    if (!user || selecionados.length < 2) return
    const cardsSel = cards.filter(c => selecionados.includes(c.id))

    setGerandoConexao(true)
    setErroConexao('')
    try {
      const res = await fetch('/api/conectar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: cardsSel.map(c => ({
            tipo: c.tipo,
            conteudo: c.tipo === 'texto' ? c.conteudo : 'Referência visual',
            parecer: c.parecer,
            indice: c.indice,
          }))
        }),
      })

      const data = await res.json()

      if (data.error) {
        setErroConexao('Não foi possível gerar a ideia. Tente novamente.')
      } else if (data.conteudo) {
        const id = crypto.randomUUID()

        for (let i = 0; i < selecionados.length - 1; i++) {
          setConexoes(prev => [...prev, { de: selecionados[i], para: selecionados[i + 1], cardGeradoId: id }])
        }

        const avgX = cardsSel.reduce((a, c) => a + c.x, 0) / cardsSel.length
        const maxY = Math.max(...cardsSel.map(c => c.y))
        const x = Math.max(20, avgX - 112)
        const y = maxY + 190

        setCards(prev => [...prev, { id, tipo: 'texto', conteudo: data.conteudo, x, y, parecer: '', indice: 0, analisando: false }])
        await supabase.from('cards').insert({ id, user_id: user.id, tipo: 'texto', conteudo: data.conteudo, x, y, parecer: '', indice: 0 })
        analisarCard(id, data.conteudo, user.id)
        setSelecionados([])
        setModoConexao(false)
        iniciarTempoCura('texto')
      }
    } catch {
      setErroConexao('Erro de conexão. Verifique o servidor.')
    } finally {
      setGerandoConexao(false)
    }
  }

  const onMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault()
    if (modoConexao) {
      setSelecionados(prev =>
        prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
      )
      return
    }
    const card = cards.find(c => c.id === id)
    if (!card) return
    setDragging(id)
    setDragOffset({ x: e.clientX - card.x, y: e.clientY - card.y })
  }, [cards, modoConexao])

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

  async function handleGerarLog() {
    if (!user || indiceGeral === null) return
    const analisados = cards.filter(c => c.indice > 0)
    if (analisados.length === 0) return

    setGerandoParecer(true)
    try {
      const res = await fetch('/api/parecer-geral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: analisados.map(c => ({ parecer: c.parecer, indice: c.indice })),
          indiceGeral,
        }),
      })
      const data = await res.json()
      if (data.parecer) setParecerGeral(data.parecer)
    } finally {
      setGerandoParecer(false)
      carregarRegistros(user.id)
    }
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
              disabled={tempoCura}
              className="w-full border border-[#C4A882] bg-[#FAF7F2] px-3 py-2 text-xs text-[#3B2F1E] placeholder-[#B0956E] focus:outline-none focus:ring-1 focus:ring-[#8C7355] resize-none rounded-sm disabled:opacity-40"
            />
            <button
              onClick={adicionarTexto}
              disabled={!novoTexto.trim() || tempoCura}
              className="w-full bg-[#3B2F1E] text-[#F4EFEA] py-2 text-xs tracking-widest uppercase hover:bg-[#5C4530] transition-colors disabled:opacity-40"
            >
              + Adicionar texto
            </button>

            <button
              onClick={() => !tempoCura && fileInputRef.current?.click()}
              disabled={tempoCura}
              className="w-full border border-[#C4A882] text-[#8C7355] py-2 text-xs tracking-widest uppercase hover:bg-[#C4A882]/20 transition-colors disabled:opacity-40"
            >
              + Adicionar imagem
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={adicionarImagem} className="hidden" />

            {tempoCura && (
              <p className="text-[10px] text-[#C4A237] italic text-center tracking-wide">
                Board disponível em {countdown}s
              </p>
            )}
          </div>

          {/* Conexão criativa */}
          <div className="p-4 flex flex-col gap-2 border-b border-[#C4A882]">
            <p className="text-xs text-[#8C7355] uppercase tracking-widest">Conexão criativa</p>

            <button
              onClick={toggleModoConexao}
              disabled={tempoCura}
              className={`w-full py-2 text-xs tracking-widest uppercase transition-colors border disabled:opacity-40 ${
                modoConexao
                  ? 'bg-[#6B8F5E] text-white border-[#6B8F5E]'
                  : 'border-[#C4A882] text-[#8C7355] hover:bg-[#C4A882]/20'
              }`}
            >
              {modoConexao ? '× Cancelar' : '⊕ Ligar Cards'}
            </button>

            {modoConexao && (
              <>
                <p className="text-xs text-[#8C7355] italic leading-relaxed">
                  {selecionados.length < 2
                    ? `Selecione ${2 - selecionados.length} card${2 - selecionados.length === 1 ? '' : 's'} no board.`
                    : `${selecionados.length} cards selecionados.`}
                </p>
                <button
                  onClick={gerarConexao}
                  disabled={selecionados.length < 2 || gerandoConexao}
                  className="w-full bg-[#6B8F5E] text-white py-2 text-xs tracking-widest uppercase hover:bg-[#5a7a50] transition-colors disabled:opacity-40"
                >
                  {gerandoConexao ? 'Gerando...' : '✦ Gerar Ideia'}
                </button>
                {erroConexao && (
                  <p className="text-[10px] text-red-500 leading-relaxed">{erroConexao}</p>
                )}
              </>
            )}
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

          {modoConexao && !tempoCura && (
            <div className="absolute top-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
              <p className="text-xs text-[#6B8F5E] bg-white/90 px-4 py-1.5 border border-[#6B8F5E] rounded-sm tracking-widest uppercase">
                Modo Conexão — clique nos cards para selecionar
              </p>
            </div>
          )}

          {/* Overlay Tempo de Cura */}
          {tempoCura && (
            <div className="absolute inset-0 bg-[#F4EFEA]/95 flex items-center justify-center z-20">
              <div className="text-center max-w-sm px-8">
                <p className="text-[10px] text-[#C4A237] tracking-widest uppercase mb-6">Tempo de Cura</p>

                <p className="text-base text-[#3B2F1E] leading-relaxed mb-8 italic">
                  &ldquo;{tempoCuraMensagem}&rdquo;
                </p>

                <div className="w-full bg-[#E8DDD0] rounded-full h-1 mb-3">
                  <div
                    className="h-1 rounded-full bg-[#C4A237] transition-all duration-1000"
                    style={{ width: `${(countdown / TEMPO_CURA_DURACAO) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-[#B0956E] tracking-widest">{countdown}s</p>
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
            {/* SVG layer para linhas de conexão */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 5, pointerEvents: 'none' }}>
              {conexoes.map((conn, i) => {
                const from = cards.find(c => c.id === conn.de)
                const to = cards.find(c => c.id === conn.para)
                if (!from || !to) return null
                const x1 = from.x + 112; const y1 = from.y + 40
                const x2 = to.x + 112;   const y2 = to.y + 40
                const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2
                return (
                  <g key={`conn-${i}`}>
                    <line
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="#6B8F5E" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.6"
                    />
                    <g
                      style={{ pointerEvents: 'all', cursor: 'pointer' }}
                      onClick={async () => {
                        const cardGeradoId = conn.cardGeradoId
                        setConexoes(prev => prev.filter(c => c.cardGeradoId !== cardGeradoId))
                        setCards(prev => prev.filter(c => c.id !== cardGeradoId))
                        if (user) await supabase.from('cards').delete().eq('id', cardGeradoId).eq('user_id', user.id)
                      }}
                    >
                      <circle cx={mx} cy={my} r={9} fill="white" stroke="#C4A882" strokeWidth="1" />
                      <text x={mx} y={my + 4} textAnchor="middle" fontSize="10" fill="#8C7355">✕</text>
                    </g>
                  </g>
                )
              })}
              {modoConexao && selecionados.length >= 2 && selecionados.slice(0, -1).map((id, i) => {
                const from = cards.find(c => c.id === id)
                const to = cards.find(c => c.id === selecionados[i + 1])
                if (!from || !to) return null
                return (
                  <line
                    key={`sel-${i}`}
                    x1={from.x + 112} y1={from.y + 40}
                    x2={to.x + 112} y2={to.y + 40}
                    stroke="#C4A237"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.9"
                  />
                )
              })}
            </svg>

            {cards.map(card => (
              <div
                key={card.id}
                style={{
                  position: 'absolute',
                  left: card.x,
                  top: card.y,
                  cursor: modoConexao ? 'pointer' : dragging === card.id ? 'grabbing' : 'grab',
                  zIndex: dragging === card.id ? 50 : 10,
                }}
                className={`w-56 bg-white rounded-sm shadow-md select-none transition-all duration-150 border ${
                  selecionados.includes(card.id)
                    ? 'border-[#6B8F5E] ring-2 ring-[#6B8F5E]/30'
                    : 'border-[#C4A882]'
                }`}
                onMouseDown={e => onMouseDown(e, card.id)}
              >
                <div className={`flex items-center justify-between px-3 py-1.5 border-b rounded-t-sm ${
                  selecionados.includes(card.id) ? 'border-[#6B8F5E] bg-[#6B8F5E]/10' : 'border-[#C4A882] bg-[#FAF7F2]'
                }`}>
                  <span className="text-xs text-[#8C7355] uppercase tracking-widest">{card.tipo}</span>
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => setCardParaRemover(card.id)}
                    className="text-xs text-[#C4A882] hover:text-red-500 transition-colors"
                  >✕</button>
                </div>

                <div className="p-3">
                  {card.tipo === 'texto' ? (
                    <p className="text-xs text-[#3B2F1E] leading-relaxed">{card.conteudo}</p>
                  ) : (
                    <img src={card.conteudo} alt="referência" className="w-full rounded-sm object-cover max-h-32" />
                  )}
                </div>

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
                <li>· Conexões: {conexoes.length}</li>
                <li>· Registros salvos: {registros.length}</li>
                <li>· Contemplação: {formatarTempoCura(tempoCuraTotal)}</li>
                <li>· Último índice: {registros[0]?.indice_etico ?? '—'}%</li>
              </ul>
            </div>
          </div>

          <div className="p-4 border-t border-[#C4A882]">
            <button
              onClick={handleGerarLog}
              disabled={gerandoParecer || indiceGeral === null}
              className="w-full bg-[#3B2F1E] text-[#F4EFEA] py-3 text-xs tracking-widest uppercase hover:bg-[#5C4530] transition-colors disabled:opacity-40"
            >
              {gerandoParecer ? 'Analisando...' : 'Gerar Log'}
            </button>
          </div>
        </aside>
      </div>

      {/* Modal de confirmação */}
      {cardParaRemover && (
        <div className="fixed inset-0 bg-[#3B2F1E]/40 flex items-center justify-center z-50">
          <div style={{ fontFamily: "'IM Fell English', Georgia, serif" }} className="bg-[#FAF7F2] border border-[#C4A882] rounded-sm shadow-xl p-8 w-80 flex flex-col gap-5">
            <div>
              <p className="text-sm text-[#3B2F1E] tracking-wide">Remover card?</p>
              <p className="text-xs text-[#8C7355] mt-1 leading-relaxed">Esta ação também apaga as conexões e ideias geradas a partir dele.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCardParaRemover(null)}
                className="flex-1 border border-[#C4A882] text-[#8C7355] py-2 text-xs tracking-widest uppercase hover:bg-[#C4A882]/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => removerCard(cardParaRemover)}
                className="flex-1 bg-red-700 text-white py-2 text-xs tracking-widest uppercase hover:bg-red-800 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
