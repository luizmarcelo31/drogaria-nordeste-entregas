'use client'

import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, LockKeyhole, Loader2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DesktopNav } from '@/components/desktop-nav'
import { MobileNav } from '@/components/mobile-nav'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sessionReady, setSessionReady] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setAuthenticated(Boolean(data.session))
      setSessionReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setAuthenticated(Boolean(nextSession))
      setSessionReady(true)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await createClient().auth.signInWithPassword({ email, password })
    if (signInError) setError('E-mail ou senha inválidos. Tente novamente.')
    setLoading(false)
  }

  if (!sessionReady) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f8fa]"><Loader2 className="animate-spin text-[#c92228]" size={24} /></div>
  }

  if (authenticated) return <>{pathname !== '/' && <DesktopNav />}<div className={pathname !== '/' ? 'desktop-page' : undefined}>{children}</div><MobileNav /></>

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 py-10 text-slate-950">
      <section className="w-full max-w-[420px] rounded-[28px] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 md:p-9">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-[24px] bg-white shadow-lg shadow-red-100 ring-1 ring-red-100">
            <img src="/icon-192.png" alt="Drogaria Nordeste" className="size-16 rounded-[20px] object-cover" />
          </div>
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#c92228]">DROGARIA</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Nordeste</h1>
          <p className="mt-3 text-sm leading-5 text-slate-500">Acesse a operação de entregas da unidade.</p>
        </div>

        <form onSubmit={signIn} className="space-y-4">
          <label className="block text-xs font-bold text-slate-700">E-mail do atendente<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" placeholder="atendimento@drogaria.com" className="field mt-2 h-12 bg-slate-50" /></label>
          <label className="block text-xs font-bold text-slate-700">Senha<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required autoComplete="current-password" placeholder="Digite sua senha" className="field mt-2 h-12 bg-slate-50" /></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">{error}</p>}
          <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#c92228] text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-[#ad1e24] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? <Loader2 className="animate-spin" size={17} /> : <><LockKeyhole size={16} /> Entrar na operação <ArrowRight size={16} /></>}
          </button>
        </form>
        <p className="mt-6 text-center text-[11px] leading-4 text-slate-400">Acesso restrito ao atendente autorizado da farmácia.</p>
      </section>
    </main>
  )
}
