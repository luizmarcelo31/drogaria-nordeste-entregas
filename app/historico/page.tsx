'use client'

import Link from 'next/link'
import { ArrowLeft, Clock3, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { listAccessEvents, type AccessEvent } from '@/lib/supabase/queries'

export default function HistoricoPage() {
  const [events, setEvents] = useState<AccessEvent[]>([]); const [loading, setLoading] = useState(true)
  useEffect(() => { listAccessEvents().then(setEvents).finally(() => setLoading(false)) }, [])
  return <main className="min-h-screen bg-[#f7f8fa] px-5 py-6 text-slate-950 md:px-10 md:py-9"><div className="mx-auto max-w-[1000px]"><Link href="/" className="flex w-fit items-center gap-2 text-sm font-bold text-[#c92228]"><ArrowLeft size={16}/> Portaria</Link><div className="mb-8 mt-8"><p className="text-xs font-semibold text-[#c92228]">Operação / Histórico</p><h1 className="mt-2 text-3xl font-extrabold">Histórico de acessos</h1><p className="mt-1 text-sm text-slate-500">Consulte entradas, saídas e tentativas bloqueadas.</p></div><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18}/> Carregando histórico...</div> : events.map((event) => <div key={event.id} className="flex items-start gap-4 border-b border-slate-100 p-5 last:border-0"><div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"><Clock3 size={18}/></div><div className="flex-1"><p className="font-bold">{event.type === 'entrada' ? 'Entrada registrada' : 'Saída registrada'}{event.status === 'bloqueado' ? ' · bloqueada' : ''}</p><p className="mt-1 text-sm text-slate-500">{event.rider.name} · {event.rider.plate}</p></div><time className="text-sm font-bold text-slate-400">{new Date(event.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time></div>)}{!loading && events.length === 0 && <p className="p-10 text-center text-sm text-slate-500">Nenhum acesso registrado.</p>}</section></div></main>
}
