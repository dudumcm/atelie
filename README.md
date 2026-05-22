# Ateliê

Ferramenta especulativa de design com rastreabilidade ética e autoria humana.

## User Story do MVP

**Como** designer em um contexto de regulação ética rigorosa,
**quero** registrar meu processo criativo com marcadores de humanidade e conformidade,
**para que** meu trabalho seja rastreável, autoral e eticamente documentado.

## Funcionalidade núcleo do MVP

- Autenticação de usuário (login/logout)
- Rota protegida com dashboard do Ateliê
- Interface com as três colunas: Berço, Tear e Escudo de Conformidade

## Stack

- [Next.js](https://nextjs.org/) (App Router, TypeScript, Tailwind)
- [Supabase](https://supabase.com/) (autenticação)
- [Vercel](https://vercel.com/) (deploy)

## Setup local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local
# Preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

# Rodar em desenvolvimento
npm run dev
```

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```
