import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// --- Fallback local (usado se a API falhar) ---

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
      if (texto.includes(palavra)) pontos += criterio.peso
    }
  }
  if (descricao.length > 200) pontos += 8
  else if (descricao.length > 100) pontos += 4
  pontos = Math.max(10, Math.min(100, pontos))

  const pareceres: Record<string, string[]> = {
    alto: [
      'Processo criativo com autoria humana consolidada. O relato demonstra intencionalidade ética e domínio do percurso projetual. Escudo aprovado.',
      'Alta conformidade detectada. A descrição evidencia presença humana ativa no processo, com referências conscientes e propósito claro.',
    ],
    medio: [
      'Processo com autoria razoável. Recomenda-se documentar melhor as referências utilizadas e explicitar a intenção por trás das escolhas.',
      'Conformidade moderada. O relato apresenta autoria, mas alguns elementos carecem de maior contextualização ética.',
    ],
    baixo: [
      'Baixa conformidade ética detectada. O processo carece de autoria explícita. Revise as referências e reforce a presença humana no relato.',
      'Processo com alto risco ético. Recomenda-se ativar o Tempo de Cura e revisitar o conceito antes de prosseguir.',
    ],
  }

  const nivel = pontos >= 78 ? 'alto' : pontos >= 55 ? 'medio' : 'baixo'
  const opcoes = pareceres[nivel]
  return { parecer: opcoes[Math.floor(Math.random() * opcoes.length)], indice: pontos }
}

// --- Chamada à API do OpenRouter ---

async function gerarParecerIA(descricao: string): Promise<{ parecer: string; indice: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY não configurada')

  const prompt = `Você é um auditor ético de processos criativos em design especulativo. Avalie o relato abaixo e responda APENAS com JSON válido, sem markdown, sem texto adicional.

Formato obrigatório: {"parecer": "texto em português de 1 a 3 frases", "indice": número inteiro de 0 a 100}

Critérios de avaliação:
- Autoria humana explícita (intenção, escolhas, reflexão pessoal)
- Presença e materialidade no processo
- Consciência ética e sustentabilidade
- Referências e pesquisa documentadas
- Originalidade e contextualização cultural

Relato: "${descricao}"`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://atelie.vercel.app',
      'X-Title': 'Ateliê',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`OpenRouter retornou ${res.status}`)

  const data = await res.json()
  const content: string = data.choices?.[0]?.message?.content ?? ''

  // Remove blocos de código markdown caso o modelo os inclua
  const cleaned = content.replace(/```(?:json)?\n?/g, '').trim()
  const parsed = JSON.parse(cleaned)

  if (typeof parsed.parecer !== 'string' || typeof parsed.indice !== 'number') {
    throw new Error('Formato de resposta inválido')
  }

  return {
    parecer: parsed.parecer,
    indice: Math.max(0, Math.min(100, Math.round(parsed.indice))),
  }
}

// --- Handler da rota ---

export async function POST(req: NextRequest) {
  try {
    const { descricao, userId } = await req.json()

    if (!descricao || !userId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    let parecer: string
    let indice: number

    try {
      const resultado = await gerarParecerIA(descricao)
      parecer = resultado.parecer
      indice = resultado.indice
    } catch (err) {
      console.warn('OpenRouter falhou, usando fallback local:', err)
      const resultado = gerarParecer(descricao)
      parecer = resultado.parecer
      indice = resultado.indice
    }

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
