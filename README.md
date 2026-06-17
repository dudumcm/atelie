# Ateliê

Ferramenta de design especulativo que documenta e avalia eticamente o processo criativo. Inspirada em um cenário futuro de regulação do design, o Ateliê força o designer a pausar, refletir e registrar a autoria humana em cada decisão criativa.

## Conceito

O Ateliê parte da premissa de que, em um futuro próximo, processos criativos precisarão comprovar autoria e intencionalidade humana. A ferramenta funciona como um **escudo de conformidade** — não um obstáculo, mas um companheiro crítico que acompanha o processo em tempo real.

## Funcionalidades

### Berço
Painel de entrada do processo criativo. O designer adiciona **cards de texto** (conceitos, intenções, descrições) e **cards de imagem** (referências visuais, fotografias, moodboards). Cada card é analisado automaticamente por IA e recebe um parecer ético e um índice de 0 a 100%.

### Tear
Board livre onde os cards ficam dispostos e podem ser reorganizados por arrastar. Permite criar **conexões criativas** entre dois ou mais cards — a IA sugere uma nova ideia de projeto a partir das referências selecionadas, no tom de um colaborador: *"Você poderia fazer..."*.

### Tempo de Cura
Ao adicionar qualquer card, o board é bloqueado automaticamente por um período de contemplação. Durante esse tempo, o designer vê uma pergunta reflexiva sobre o elemento que acabou de adicionar. O tempo acumulado de contemplação é registrado no log.

### Escudo de Conformidade
Painel de auditoria do processo. Exibe o índice ético geral (média de todos os cards), um parecer sintetizado por IA sobre o conjunto e um log com métricas do processo. O botão **Gerar Log** aciona uma análise mais profunda via IA. O botão **Exportar PDF** gera um relatório editorial completo do processo.

## Stack

- [Next.js 16](https://nextjs.org/) — App Router, TypeScript, Tailwind CSS v4
- [Supabase](https://supabase.com/) — autenticação e banco de dados com RLS
- [OpenRouter](https://openrouter.ai/) — análise ética via `google/gemini-2.0-flash-exp:free`
- [@react-pdf/renderer](https://react-pdf.org/) — exportação do processo em PDF
- [Vercel](https://vercel.com/) — deploy

## Setup local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local
# Preencher as três chaves (ver seção abaixo)

# Rodar em desenvolvimento
npm run dev
```

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
OPENROUTER_API_KEY=sua_chave_do_openrouter
```

A análise ética funciona sem a chave do OpenRouter — há um fallback local baseado em palavras-chave. Com a chave, a análise é feita por IA generativa.

## Banco de dados (Supabase)

Duas tabelas com RLS ativo (cada usuário acessa apenas seus próprios dados):

**`cards`** — `id, user_id, tipo, conteudo, x, y, parecer, indice, created_at`

**`registros`** — `id, user_id, descricao, parecer_etico, indice_etico, created_at`
