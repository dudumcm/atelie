import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function gerarParecer(descricao: string): { parecer: string; indice: number } {
  const texto = descricao.toLowerCase()

  const criterios = {
    autoria: {
      palavras: ['autoral', 'criativo', 'original', 'minha ideia', 'concebi', 'imaginei', 'desenvolvi', 'projetei'],
      peso: 8,
    },
    materialidade: {
      palavras: ['artesanal', 'manual', 'tátil', 'físico', 'papelão', 'madeira', 'tecido', 'papel', 'couro', 'natural', 'reciclado'],
      peso: 6,
    },
    etica: {
      palavras: ['ético', 'sustentável', 'consciente', 'responsável', 'humano', 'cuidado', 'intenção', 'propósito'],
      peso: 7,
    },
    referencia: {
      palavras: ['referência', 'inspirado', 'baseado', 'influência', 'pesquisa', 'estudo', 'observei'],
      peso: 4,
    },
    local: {
      palavras: ['brasileiro', 'local', 'regional', 'cultura', 'tradição', 'nordeste', 'popular'],
      peso: 5,
    },
    negativos: {
      palavras: ['cópia', 'plágio', 'roubei', 'copiei', 'gerado por ia', 'ia fez', 'automático'],
      peso: -20,
    },
  }

  let pontos = 55

  for (const [, criterio] of Object.entries(criterios)) {
    for (const palavra of criterio.palavras) {
      if (texto.includes(palavra)) {
        pontos += criterio.peso
      }
    }
  }

  // Bônus por extensão do texto (mais detalhe = mais autoria)
  if (descricao.length > 200) pontos += 8
  else if (descricao.length > 100) pontos += 4

  pontos = Math.max(10, Math.min(100, pontos))

  const pareceres: Record<string, string[]> = {
    alto: [
      'Processo criativo com autoria humana consolidada. O relato demonstra intencionalidade ética e domínio do percurso projetual. Escudo aprovado.',
      'Alta conformidade detectada. A descrição evidencia presença humana ativa no processo, com referências conscientes e propósito claro.',
      'Registro exemplar de autoria. O designer demonstra controle criativo e consciência sobre as escolhas do processo. Aprovado pelo Escudo.',
    ],
    medio: [
      'Processo com autoria razoável. Recomenda-se documentar melhor as referências utilizadas e explicitar a intenção por trás das escolhas.',
      'Conformidade moderada. O relato apresenta autoria, mas alguns elementos carecem de maior contextualização ética.',
      'Índice satisfatório, porém com margem para aprofundamento. Descreva com mais detalhe o percurso e as decisões criativas.',
    ],
    baixo: [
      'Baixa conformidade ética detectada. O processo carece de autoria explícita. Revise as referências e reforce a presença humana no relato.',
      'Registro insuficiente para aprovação pelo Escudo. Documente com mais clareza sua intenção criativa e as escolhas feitas.',
      'Processo com alto risco ético. Recomenda-se ativar o Tempo de Cura e revisitar o conceito antes de prosseguir.',
    ],
  }

  let nivel: 'alto' | 'medio' | 'baixo'
  if (pontos >= 78) nivel = 'alto'
  else if (pontos >= 55) nivel = 'medio'
  else nivel = 'baixo'

  const opcoes = pareceres[nivel]
  const parecer = opcoes[Math.floor(Math.random() * opcoes.length)]

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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ parecer, indice })
  } catch (err) {
    console.error('Erro geral:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}