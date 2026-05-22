'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const router = useRouter()

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <main
      style={{ fontFamily: "'IM Fell English', Georgia, serif" }}
      className="min-h-screen flex items-center justify-center bg-[#F4EFEA]"
    >
      <div className="bg-white/70 backdrop-blur border border-[#C4A882] rounded-sm p-10 w-full max-w-sm shadow-md">
        <h1 className="text-3xl text-[#3B2F1E] mb-1 tracking-wide">Ateliê</h1>
        <p className="text-xs text-[#8C7355] mb-8 tracking-widest uppercase">
          Design com autoria humana
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-[#C4A882] bg-[#FAF7F2] px-4 py-2 text-sm text-[#3B2F1E] placeholder-[#B0956E] focus:outline-none focus:ring-1 focus:ring-[#8C7355]"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#C4A882] bg-[#FAF7F2] px-4 py-2 text-sm text-[#3B2F1E] placeholder-[#B0956E] focus:outline-none focus:ring-1 focus:ring-[#8C7355]"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#3B2F1E] text-[#F4EFEA] py-2 text-sm tracking-widest uppercase hover:bg-[#5C4530] transition-colors disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>

          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="w-full text-xs text-[#8C7355] underline underline-offset-2 hover:text-[#3B2F1E] transition-colors"
          >
            {mode === 'login' ? 'Criar uma conta nova' : 'Já tenho conta'}
          </button>
        </div>
      </div>
    </main>
  )
}
