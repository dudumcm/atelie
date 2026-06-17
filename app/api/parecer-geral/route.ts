import { NextRequest, NextResponse } from 'next/server'

interface CardResumo {
  parecer: string
  indice: number
}

function fallback(indiceGeral: number): string {
  if (indiceGeral >= 78) return 'Conjunto criativo com alta conformidade ética. O processo como um todo demonstra autoria e intencionalidade.'
  if (indiceGeral >= 55) return 'Conformidade moderada no conjunto. Alguns elementos pedem maior contextualização da autoria.'
  return 'Conjunto com baixo índice ético. Revise as referências e reforce a presença humana no processo.'
}

export async function POST(req: NextRequest) {
  let indiceGeral = 50
  try {
    const { cards, indiceGeral: ig } = await req.json()
    indiceGeral = ig ?? 50

    if (!cards || cards.length === 0) {
      return NextResponse.json({ error: 'Sem cards' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) throw new Error('Chave não configurada')

    const resumo = (cards as CardResumo[])
      .map((c, i) => `Card ${i + 1} (índice ${c.indice}%): ${c.parecer}`)
      .join('\n')

    const prompt = `Você é um auditor ético de processos criativos em design especulativo. Com base nas avaliações individuais abaixo, escreva uma síntese do conjunto do processo criativo. Responda APENAS com JSON válido, sem markdown: {"parecer": "texto de 2 a 4 frases em português"}

Índice geral do conjunto: ${indiceGeral}%

Avaliações individuais:
${resumo}`

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
    const cleaned = content.replace(/```(?:json)?\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    if (typeof parsed.parecer !== 'string') throw new Error('Formato inválido')

    return NextResponse.json({ parecer: parsed.parecer })
  } catch (err) {
    console.warn('Parecer geral: usando fallback local:', err)
    return NextResponse.json({ parecer: fallback(indiceGeral) })
  }
}
