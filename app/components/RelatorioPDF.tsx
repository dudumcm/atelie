import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'

interface Card {
  id: string
  tipo: 'texto' | 'imagem'
  conteudo: string
  parecer: string
  indice: number
}

interface Conexao {
  de: string
  para: string
  cardGeradoId: string
}

interface Props {
  cards: Card[]
  conexoes: Conexao[]
  indiceGeral: number | null
  parecerGeral: string
  tempoCuraTotal: number
  userEmail: string
}

function corIndice(indice: number) {
  if (indice >= 78) return '#6B8F5E'
  if (indice >= 55) return '#C4A237'
  return '#C4614A'
}

function formatarTempoCura(segundos: number) {
  if (segundos === 0) return '—'
  if (segundos < 60) return `${segundos}s`
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return s === 0 ? `${m}min` : `${m}min ${s}s`
}

const s = StyleSheet.create({
  page: {
    backgroundColor: '#FAFAF8',
    fontFamily: 'Times-Roman',
    paddingTop: 52,
    paddingBottom: 64,
    paddingHorizontal: 52,
  },
  // --- Cabeçalho ---
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  titulo: {
    fontSize: 26,
    color: '#3B2F1E',
    letterSpacing: 2,
  },
  subtitulo: {
    fontSize: 8,
    color: '#8C7355',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaTexto: {
    fontSize: 8,
    color: '#8C7355',
    letterSpacing: 1,
    textAlign: 'right',
  },
  divisor: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#C4A882',
    marginVertical: 14,
  },
  // --- Escudo ---
  secaoLabel: {
    fontSize: 7,
    color: '#8C7355',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  indiceNumero: {
    fontSize: 40,
    color: '#3B2F1E',
    letterSpacing: -1,
    lineHeight: 1,
  },
  indiceUnidade: {
    fontSize: 14,
    color: '#8C7355',
    letterSpacing: 1,
  },
  barraContainer: {
    height: 4,
    backgroundColor: '#E8DDD0',
    borderRadius: 2,
    marginVertical: 8,
    overflow: 'hidden',
  },
  barraFill: {
    height: 4,
    borderRadius: 2,
  },
  parecerTexto: {
    fontSize: 9,
    color: '#3B2F1E',
    lineHeight: 1.6,
    fontFamily: 'Times-Italic',
  },
  logGrid: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 10,
  },
  logItem: {
    fontSize: 8,
    color: '#8C7355',
    letterSpacing: 0.5,
  },
  // --- Cards ---
  cardContainer: {
    marginBottom: 18,
    borderWidth: 0.5,
    borderColor: '#C4A882',
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTipo: {
    fontSize: 7,
    color: '#8C7355',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardIndiceTexto: {
    fontSize: 8,
    letterSpacing: 0.5,
    fontFamily: 'Times-Bold',
  },
  cardConteudo: {
    fontSize: 9,
    color: '#3B2F1E',
    lineHeight: 1.7,
    marginBottom: 8,
  },
  cardImagem: {
    width: '100%',
    maxHeight: 160,
    objectFit: 'cover',
    marginBottom: 8,
  },
  cardParecer: {
    fontSize: 8,
    color: '#8C7355',
    lineHeight: 1.6,
    fontFamily: 'Times-Italic',
  },
  // --- Conexões ---
  conexaoItem: {
    marginBottom: 14,
    paddingLeft: 10,
    borderLeftWidth: 1.5,
    borderLeftColor: '#6B8F5E',
  },
  conexaoLabel: {
    fontSize: 7,
    color: '#6B8F5E',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  conexaoTexto: {
    fontSize: 9,
    color: '#3B2F1E',
    lineHeight: 1.6,
  },
  // --- Rodapé ---
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 52,
    right: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#C4A882',
    paddingTop: 8,
  },
  footerTexto: {
    fontSize: 7,
    color: '#B0956E',
    letterSpacing: 1,
  },
})

export function RelatorioPDF({ cards, conexoes, indiceGeral, parecerGeral, tempoCuraTotal, userEmail }: Props) {
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const cardsTexto = cards.filter(c => c.tipo === 'texto')
  const cardsImagem = cards.filter(c => c.tipo === 'imagem')

  // Mapeia id → conteudo para montar as conexões
  const mapaCards = Object.fromEntries(cards.map(c => [c.id, c]))

  // Agrupa conexões por cardGeradoId (cada grupo = uma conexão criativa)
  const conexoesUnicas = Array.from(new Set(conexoes.map(c => c.cardGeradoId)))
    .map(geradoId => {
      const grupo = conexoes.filter(c => c.cardGeradoId === geradoId)
      const cardGerado = mapaCards[geradoId]
      return { grupo, cardGerado }
    })
    .filter(c => c.cardGerado)

  return (
    <Document title="Ateliê — Relatório de Processo" author={userEmail}>
      <Page size="A4" style={s.page}>

        {/* Cabeçalho */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.titulo}>Ateliê</Text>
            <Text style={[s.subtitulo, { marginTop: 2 }]}>Relatório de Processo Criativo</Text>
          </View>
          <View>
            <Text style={s.metaTexto}>{userEmail}</Text>
            <Text style={s.metaTexto}>{hoje}</Text>
          </View>
        </View>
        <View style={s.divisor} />

        {/* Escudo de Conformidade */}
        <Text style={s.secaoLabel}>Escudo de Conformidade</Text>
        {indiceGeral !== null ? (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
              <Text style={[s.indiceNumero, { color: corIndice(indiceGeral) }]}>{indiceGeral}</Text>
              <Text style={[s.indiceUnidade, { color: corIndice(indiceGeral), marginBottom: 6 }]}>%</Text>
            </View>
            <View style={s.barraContainer}>
              <View style={[s.barraFill, { width: `${indiceGeral}%`, backgroundColor: corIndice(indiceGeral) }]} />
            </View>
            {parecerGeral ? <Text style={s.parecerTexto}>{parecerGeral}</Text> : null}
          </View>
        ) : (
          <Text style={s.parecerTexto}>Nenhum índice gerado.</Text>
        )}

        <View style={s.logGrid}>
          <Text style={s.logItem}>· Cards: {cards.length}</Text>
          <Text style={s.logItem}>· Conexões: {conexoesUnicas.length}</Text>
          <Text style={s.logItem}>· Contemplação: {formatarTempoCura(tempoCuraTotal)}</Text>
        </View>

        <View style={s.divisor} />

        {/* Cards de texto */}
        {cardsTexto.length > 0 && (
          <>
            <Text style={s.secaoLabel}>Conceitos e Ideias</Text>
            {cardsTexto.map((card, i) => (
              <View key={card.id} style={s.cardContainer} wrap={false}>
                <View style={s.cardHeader}>
                  <Text style={s.cardTipo}>Texto · {i + 1}</Text>
                  {card.indice > 0 && (
                    <Text style={[s.cardIndiceTexto, { color: corIndice(card.indice) }]}>{card.indice}%</Text>
                  )}
                </View>
                {card.indice > 0 && (
                  <View style={s.barraContainer}>
                    <View style={[s.barraFill, { width: `${card.indice}%`, backgroundColor: corIndice(card.indice) }]} />
                  </View>
                )}
                <Text style={s.cardConteudo}>{card.conteudo}</Text>
                {card.parecer ? <Text style={s.cardParecer}>{card.parecer}</Text> : null}
              </View>
            ))}
            <View style={s.divisor} />
          </>
        )}

        {/* Cards de imagem */}
        {cardsImagem.length > 0 && (
          <>
            <Text style={s.secaoLabel}>Referências Visuais</Text>
            {cardsImagem.map((card, i) => (
              <View key={card.id} style={s.cardContainer} wrap={false}>
                <View style={s.cardHeader}>
                  <Text style={s.cardTipo}>Imagem · {i + 1}</Text>
                  {card.indice > 0 && (
                    <Text style={[s.cardIndiceTexto, { color: corIndice(card.indice) }]}>{card.indice}%</Text>
                  )}
                </View>
                <Image src={card.conteudo} style={s.cardImagem} />
                {card.indice > 0 && (
                  <View style={s.barraContainer}>
                    <View style={[s.barraFill, { width: `${card.indice}%`, backgroundColor: corIndice(card.indice) }]} />
                  </View>
                )}
                {card.parecer ? <Text style={s.cardParecer}>{card.parecer}</Text> : null}
              </View>
            ))}
            <View style={s.divisor} />
          </>
        )}

        {/* Conexões criativas */}
        {conexoesUnicas.length > 0 && (
          <>
            <Text style={s.secaoLabel}>Conexões Criativas</Text>
            {conexoesUnicas.map(({ grupo, cardGerado }, i) => {
              const origens = Array.from(new Set([...grupo.map(c => c.de), ...grupo.map(c => c.para)]))
                .filter(id => id !== cardGerado.id)
                .map(id => mapaCards[id])
                .filter(Boolean)

              return (
                <View key={cardGerado.id} style={s.conexaoItem} wrap={false}>
                  <Text style={s.conexaoLabel}>Ideia gerada · {i + 1}</Text>
                  {origens.map((o, j) => (
                    <Text key={j} style={[s.footerTexto, { marginBottom: 2, color: '#8C7355' }]}>
                      ↳ {o.tipo === 'texto' ? o.conteudo.slice(0, 80) + (o.conteudo.length > 80 ? '…' : '') : '[Imagem]'}
                    </Text>
                  ))}
                  <Text style={[s.conexaoTexto, { marginTop: 4 }]}>{cardGerado.conteudo}</Text>
                </View>
              )
            })}
          </>
        )}

        {/* Rodapé */}
        <View style={s.footer} fixed>
          <Text style={s.footerTexto}>Ateliê · Design com autoria humana</Text>
          <Text style={s.footerTexto} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
