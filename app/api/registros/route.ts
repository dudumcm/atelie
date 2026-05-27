import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function gerarParecer(descricao: string): { parecer: string; indice: number } {
  const texto = descricao.toLowerCase()

  const positivos = ['artesanal', 'sustentável', 'autoral', 'manual', 'original', 'ético', 'humano', 'natural', 'papelão', 'reciclado', 'brasileiro', 'local']
  const negativos = ['cópia', 'plágio', 'comercial', 'genérico', 'automático', 'ia gerou', 'gerado por']

  let pontos = 70
  positivos.forEach(p => { if (texto.includes(p)) pontos += 5 })
  negativos.forEach(n => { if (texto.includes(n)) pontos -= 15 })
  pontos = Math.max(0, Math.min(100, pontos))

  let parecer = ''
  if (pontos >= 80) {
    parecer = 'Processo criativo com forte autoria humana e intenção ética clara. Aprovado pelo Escudo.'
  } else if (pontos >= 60) {
    parecer = 'Processo apresenta autoria razoável. Recomenda-se documentar melhor as referências utilizadas.'
  } else {
    parecer = 'Processo com baixo índice de conformidade. Revise as referências e reforce a autoria humana.'
  }

  return { parecer, indice: pontos }
}

export async function POST(req: NextRequest) {
  try {
    const { descricao, userId } = await req.json()

    if (!descricao || !userId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const { parecer, indice } = gerarParecer(descricao)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.from('registros').insert({
      user_id: userId,
      descricao,
      parecer_etico: parecer,
      indice_etico: indice,
    })

    if (error) {
      console.log('Erro Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ parecer, indice })
  } catch (err) {
    console.error('Erro geral:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}