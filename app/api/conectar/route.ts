import { NextRequest, NextResponse } from 'next/server'

interface CardInput {
  tipo: string
  conteudo: string
  parecer: string
  indice: number
}

function gerarSinteseFallback(cards: CardInput[]): string {
  const temImagem = cards.some(c => c.tipo === 'imagem')
  const temTexto = cards.some(c => c.tipo === 'texto')
  if (temImagem && temTexto) {
    return 'Você poderia usar as formas e texturas da imagem como base para uma estampa ou padrão aplicado a um produto artesanal. Que tal explorar isso em um objeto de uso cotidiano?'
  }
  if (temImagem) {
    return 'Que tal transformar os elementos visuais dessas imagens em um padrão gráfico para tecido, cerâmica ou papel?'
  }
  return 'Você poderia materializar esse conceito em um objeto físico feito à mão — pense em qual técnica artesanal melhor carrega essa ideia.'
}

export async function POST(req: NextRequest) {
  let cards: CardInput[] = []
  try {
    const body = await req.json()
    cards = body.cards ?? []

    if (cards.length < 2) {
      return NextResponse.json({ error: 'Mínimo de 2 cards' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) throw new Error('Chave não configurada')

    const resumo = cards
      .map((c, i) => `Elemento ${i + 1} (índice ético ${c.indice}%): "${c.tipo === 'imagem' ? 'Referência visual' : c.conteudo}"`)
      .join('\n')

    const prompt = `Você é um colaborador criativo em design. Analise as referências abaixo e sugira UMA ideia concreta e específica para o designer explorar.

Regras obrigatórias:
- Fale diretamente com o designer, em segunda pessoa ("Você poderia...", "Que tal...", "Experimente...", "Pense em...")
- Seja específico: mencione um objeto, produto, material ou técnica real (ex: estampa de camisa, cerâmica utilitária, padrão têxtil, embalagem, cartaz)
- Máximo 2 frases curtas
- Proibido: síntese, integrar, conectar, elementos, referências, a partir de, combinar, processo criativo

Responda APENAS com JSON válido, sem markdown: {"conteudo": "a sugestão em português"}

Referências do designer:
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

    if (typeof parsed.conteudo !== 'string') throw new Error('Formato inválido')

    return NextResponse.json({ conteudo: parsed.conteudo })
  } catch (err) {
    console.warn('OpenRouter falhou, usando fallback local:', err)
    return NextResponse.json({ conteudo: gerarSinteseFallback(cards) })
  }
}
