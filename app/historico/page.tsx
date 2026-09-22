'use client'

import Link from 'next/link'
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, Clock3, Loader2, Search, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { listAccessEvents, type AccessEvent } from '@/lib/supabase/queries'

type Filter = 'todos' | 'entradas' | 'saidas' | 'bloqueios'
type Period = 'hoje' | '7dias' | 'todos'

export default function HistoricoPage() {
  const [events, setEvents] = useState<AccessEvent[]>([])
  const [filter, setFilter] = useState<Filter>('todos')
  const [period, setPeriod] = useState<Period>('hoje')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { listAccessEvents().then(setEvents).catch(() => setError('Não foi possível carregar o histórico. Tente novamente.')).finally(() => setLoading(false)) }, [])

  const visible = useMemo(() => {
    const now = new Date()
    const start = period === 'hoje' ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : period === '7dias' ? now.getTime() - 7 * 86400000 : 0
    const normalized = search.toLowerCase().trim()
    return events.filter((event) => {
      const typeMatches = filter === 'todos' || (filter === 'entradas' && event.type === 'entrada' && event.status === 'registrado') || (filter === 'saidas' && event.type === 'saida') || (filter === 'bloqueios' && event.status === 'bloqueado')
      const textMatches = !normalized || `${event.rider.name} ${event.rider.plate}`.toLowerCase().includes(normalized)
      return typeMatches && textMatches && new Date(event.createdAt).getTime() >= start
    })
  }, [events, filter, period, search])

  return <main className="min-h-screen bg-[#f7f8fa] px-4 py-5 pb-24 text-slate-950 md:px-10 md:py-8"><div className="mx-auto max-w-[1050px]"><Link href="/" className="flex w-fit items-center gap-2 text-sm font-bold text-[#c92228]"><ArrowLeft size={16}/> Portaria</Link><header className="mb-5 mt-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c92228]">Operação</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Livro de movimentação</h1><p className="mt-1 text-sm text-slate-500">Consulte quem entrou, saiu ou teve o acesso bloqueado.</p></header>{error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-800">{error}</p>}<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="space-y-3 border-b border-slate-100 p-4"><div className="relative"><label htmlFor="history-search" className="sr-only">Buscar por nome ou placa</label><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input id="history-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou placa" className="field h-10 pl-10" /></div><div className="flex flex-col gap-2 sm:flex-row sm:justify-between"><div className="flex overflow-x-auto rounded-lg bg-slate-100 p-1" role="group" aria-label="Tipo de acesso">{(['todos', 'entradas', 'saidas', 'bloqueios'] as Filter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`whitespace-nowrap rounded-md px-3 py-2 text-[10px] font-bold capitalize ${filter === value ? 'bg-white text-[#c92228] shadow-sm' : 'text-slate-500'}`}>{value}</button>)}</div><select aria-label="Período do histórico" value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="field h-10 py-2 text-xs sm:w-32"><option value="hoje">Hoje</option><option value="7dias">Últimos 7 dias</option><option value="todos">Todo período</option></select></div></div><div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold text-slate-500">{visible.length} movimentação{visible.length === 1 ? '' : 'ões'} encontrada{visible.length === 1 ? '' : 's'}</div>{loading ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><Loader2 className="animate-spin" size={18}/> Carregando histórico...</div> : visible.length === 0 ? <div className="p-10 text-center"><Clock3 className="mx-auto text-slate-300" size={28}/><p className="mt-2 text-sm font-bold text-slate-700">Nenhuma movimentação encontrada</p><p className="mt-1 text-xs text-slate-500">Ajuste o período, o filtro ou a busca.</p></div> : <div className="divide-y divide-slate-100">{visible.map((event) => <article key={event.id} className="flex items-center gap-3 px-4 py-3 md:px-5"><span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${event.status === 'bloqueado' ? 'bg-red-100 text-red-600' : event.type === 'entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{event.status === 'bloqueado' ? <ShieldAlert size={17}/> : event.type === 'entrada' ? <ArrowDownToLine size={17}/> : <ArrowUpFromLine size={17}/>}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{event.rider.name}</p><p className="text-[11px] text-slate-500">{event.rider.plate} · {event.status === 'bloqueado' ? 'Tentativa bloqueada' : event.type === 'entrada' ? 'Entrada registrada' : 'Saída registrada'}</p></div><time className="shrink-0 text-xs font-bold text-slate-400">{new Date(event.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time></article>)}</div>}</section></div></main>
}
