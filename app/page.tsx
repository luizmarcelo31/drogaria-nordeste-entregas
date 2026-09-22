'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, Bell, Bike, BookOpen, ClipboardList, CircleHelp, FileWarning, History, LayoutDashboard, LogOut, Search, ShieldAlert, UsersRound, X } from 'lucide-react'
import { formatDocumentOrPlate } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import { findRider, listAccessEvents, listAlerts, listOccurrences, listRiders, registerAccess, type AccessEvent, type Alert, type Occurrence, type Rider } from '@/lib/supabase/queries'

const routeMap = { Portaria: '/', Entregadores: '/entregadores', Ocorrências: '/ocorrencias', Relatórios: '/relatorios', Histórico: '/historico', Alertas: '/alertas', Manual: '/manual' }
const colors = ['bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700']
type DashboardRider = Rider & { entry: string; tone: string; accessCount?: number }
type Operation = 'entrada' | 'saida'
type Notice = { kind: 'success' | 'error'; message: string } | null

export default function Page() {
  const [operation, setOperation] = useState<Operation>('entrada')
  const [localRiders, setLocalRiders] = useState<DashboardRider[]>([])
  const [registeredRiders, setRegisteredRiders] = useState<Rider[]>([])
  const [accessEvents, setAccessEvents] = useState<AccessEvent[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [occurrence, setOccurrence] = useState<Occurrence | null>(null)
  const [stats, setStats] = useState({ entries: 0, exits: 0, blocked: 0 })
  const [search, setSearch] = useState('')
  const [showAlerts, setShowAlerts] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice>(null)

  async function loadDashboard() {
    try {
      const [events, databaseAlerts, riders, occurrences] = await Promise.all([listAccessEvents(), listAlerts(), listRiders(), listOccurrences()])
      setAccessEvents(events)
      setRegisteredRiders(riders)
      const today = new Date().toISOString().slice(0, 10)
      const todayEvents = events.filter((event) => event.createdAt.slice(0, 10) === today)
      setStats({ entries: todayEvents.filter((event) => event.type === 'entrada' && event.status === 'registrado').length, exits: todayEvents.filter((event) => event.type === 'saida' && event.status === 'registrado').length, blocked: riders.filter((rider) => rider.status === 'bloqueado').length })
      setAlerts(databaseAlerts)
      setOccurrence(occurrences[0] ?? null)
      const latest = new Map<string, AccessEvent>()
      events.forEach((event) => { if (!latest.has(event.riderId)) latest.set(event.riderId, event) })
      setLocalRiders([...latest.values()].filter((event) => event.type === 'entrada' && event.status === 'registrado').map((event, index) => ({ ...event.rider, entry: new Date(event.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), tone: colors[index % colors.length] })))
    } catch { setNotice({ kind: 'error', message: 'Não foi possível atualizar a portaria. Tente novamente.' }) } finally { setLoading(false) }
  }

  useEffect(() => { void loadDashboard() }, [])

  const matches = useMemo(() => {
    const source = operation === 'entrada' ? registeredRiders : localRiders
    const normalized = normalizeSearch(search)
    return source.filter((rider) => !normalized || normalizeSearch(`${rider.name} ${rider.plate} ${rider.cpf}`).includes(normalized)).slice(0, 8)
  }, [localRiders, operation, registeredRiders, search])

  const frequent = useMemo(() => {
    const counts = new Map<string, DashboardRider>()
    accessEvents.filter((event) => event.type === 'entrada' && event.status === 'registrado').forEach((event, index) => {
      const current = counts.get(event.riderId)
      counts.set(event.riderId, { ...event.rider, entry: '', tone: colors[index % colors.length], accessCount: (current?.accessCount ?? 0) + 1 })
    })
    return [...counts.values()].sort((a, b) => (b.accessCount ?? 0) - (a.accessCount ?? 0)).slice(0, 3)
  }, [accessEvents])

  async function runOperation(rider: Rider) {
    setBusyId(rider.id)
    setNotice(null)
    try {
      if (operation === 'entrada') {
        if (rider.status === 'bloqueado') await registerAccess(rider, 'entrada', 'bloqueado', 'Entregador bloqueado')
        else if (localRiders.some((item) => item.id === rider.id)) { setNotice({ kind: 'error', message: `${rider.name} já está marcado como presente.` }); return }
        else await registerAccess(rider, 'entrada')
        setNotice({ kind: 'success', message: `Entrada registrada para ${rider.name}.` })
      } else {
        await registerAccess(rider, 'saida')
        setNotice({ kind: 'success', message: `Saída registrada para ${rider.name}.` })
      }
      setSearch('')
      await loadDashboard()
    } catch { setNotice({ kind: 'error', message: `Não foi possível registrar a ${operation === 'entrada' ? 'entrada' : 'saída'}. Verifique sua conexão e tente novamente.` }) } finally { setBusyId(null) }
  }

  async function submitSearch() {
    if (!search.trim()) return
    if (operation === 'saida') { if (matches[0]) await runOperation(matches[0]); return }
    const rider = matches[0] ?? await findRider(search)
    if (rider) await runOperation(rider)
    else setNotice({ kind: 'error', message: 'Nenhum cadastro encontrado. Confira o nome, CPF ou placa.' })
  }

  async function signOut() { await createClient().auth.signOut() }

  return <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-slate-200 bg-white lg:flex">
      <Brand />
      <div className="px-4 pt-7"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Operação</p><nav className="flex flex-col gap-1">{Object.entries(routeMap).map(([label, href]) => <Link key={label} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${label === 'Portaria' ? 'bg-[#c92228] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{iconFor(label)} {label}</Link>)}</nav></div>
      <div className="mt-auto p-4"><div className="rounded-2xl bg-[#fff4f3] p-4"><CircleHelp size={18} className="mb-3 text-[#c92228]"/><p className="text-xs font-bold">Precisa de ajuda?</p><Link href="/manual" className="mt-3 inline-block text-xs font-bold text-[#c92228]">Abrir manual</Link></div><button onClick={() => void signOut()} className="mt-4 flex w-full items-center gap-3 border-t border-slate-100 pt-4 text-left text-xs font-bold"><span className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-white">AM</span><span className="flex-1">Ana Martins</span><LogOut size={16} className="text-slate-400"/></button></div>
    </aside>
    <main className="pb-24 lg:pb-0 lg:pl-[250px]">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur md:h-[76px] md:px-9"><div><p className="hidden text-xs font-medium text-slate-400 sm:block">Operação Drogaria Nordeste</p><h1 className="text-lg font-extrabold tracking-tight md:text-2xl">Portaria</h1></div><div className="relative"><button onClick={() => setShowAlerts((value) => !value)} aria-label={`Notificações${alerts.length ? `, ${alerts.length} pendentes` : ''}`} className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500"><Bell size={19}/>{alerts.length > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-[#c92228] ring-2 ring-white"/>}</button>{showAlerts && <div className="absolute right-0 top-12 w-[min(310px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"><div className="flex justify-between px-2 pb-2"><p className="text-sm font-bold">Notificações</p><button onClick={() => setShowAlerts(false)} aria-label="Fechar notificações"><X size={15}/></button></div>{alerts.map((alert) => <div key={alert.id} className="border-t border-slate-100 px-2 py-3"><p className="text-xs font-bold">{alert.title}</p><p className="mt-1 text-[11px] text-slate-500">{alert.description}</p></div>)}</div>}</div></header>
      <div className="mx-auto max-w-[1240px] px-4 py-5 md:px-9 md:py-8">
        <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c92228]">Posto de controle</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Movimentação de hoje</h2><p className="mt-1 text-sm text-slate-500">Registre quem entra e quem sai da unidade.</p></div><Link href="/ocorrencias" aria-label="Abrir nova ocorrência" className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-red-200 hover:text-[#c92228] md:h-11 md:w-auto md:gap-2 md:px-4 md:text-sm md:font-bold"><FileWarning size={18}/><span className="hidden md:inline">Nova ocorrência</span></Link></div>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6" aria-labelledby="operation-title"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h3 id="operation-title" className="text-base font-extrabold">O que você quer registrar?</h3><p className="mt-1 text-xs text-slate-500">Escolha uma operação e busque o entregador.</p></div><div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Tipo de movimentação"><button type="button" aria-pressed={operation === 'entrada'} onClick={() => { setOperation('entrada'); setSearch(''); setNotice(null) }} className={`flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition ${operation === 'entrada' ? 'bg-white text-[#c92228] shadow-sm' : 'text-slate-500'}`}><ArrowDownToLine size={16}/>Entrada</button><button type="button" aria-pressed={operation === 'saida'} onClick={() => { setOperation('saida'); setSearch(''); setNotice(null) }} className={`flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition ${operation === 'saida' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><ArrowUpFromLine size={16}/>Saída</button></div></div><div className="mt-4 flex flex-col gap-2.5 sm:flex-row"><div className="relative min-w-0 flex-1"><label htmlFor="rider-search" className="sr-only">Buscar entregador por nome, CPF ou placa</label><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input id="rider-search" value={search} onChange={(event) => setSearch(formatDocumentOrPlate(event.target.value))} onKeyDown={(event) => event.key === 'Enter' && void submitSearch()} placeholder={operation === 'entrada' ? 'Nome, CPF ou placa' : 'Buscar quem está no local'} autoComplete="off" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#c92228] focus:bg-white focus:ring-4 focus:ring-red-100"/></div><button type="button" onClick={() => void submitSearch()} disabled={!search.trim() || loading || busyId !== null} className={`flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${operation === 'entrada' ? 'bg-[#c92228] hover:bg-[#a91d22]' : 'bg-slate-900 hover:bg-slate-700'}`}>{operation === 'entrada' ? <ArrowDownToLine size={17}/> : <ArrowUpFromLine size={17}/>}Registrar {operation}</button></div>{notice && <div role="status" aria-live="polite" className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold ${notice.kind === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}><span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-current"/>{notice.message}</div>}{search.trim() && <div className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white" role="listbox" aria-label="Resultados de entregadores">{matches.map((rider) => <div key={rider.id} className="flex items-center gap-3 px-3 py-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${colors[registeredRiders.findIndex((item) => item.id === rider.id) % colors.length]}`}>{rider.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{rider.name}</p><p className="text-[11px] text-slate-500">{rider.plate} · {rider.phone}</p></div>{operation === 'entrada' && rider.status === 'bloqueado' && <span className="text-[10px] font-bold text-red-600">Bloqueado</span>}<button type="button" onClick={() => void runOperation(rider)} disabled={busyId !== null} className={`min-h-10 shrink-0 rounded-lg px-3 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 ${operation === 'entrada' && rider.status === 'bloqueado' ? 'bg-red-700' : operation === 'entrada' ? 'bg-[#c92228]' : 'bg-slate-900'}`}>{busyId === rider.id ? 'Salvando...' : operation === 'entrada' && rider.status === 'bloqueado' ? 'Registrar tentativa' : operation === 'entrada' ? 'Dar entrada' : 'Dar saída'}</button></div>)}{matches.length === 0 && <p className="px-3 py-4 text-xs text-slate-500">{operation === 'saida' ? 'Ninguém presente corresponde à busca.' : 'Nenhum cadastro encontrado.'}</p>}</div>}</section>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs"><span className="flex items-center gap-2 font-bold"><UsersRound size={15} className="text-[#c92228]"/>{localRiders.length} no local</span><span><strong>{stats.entries}</strong> entradas hoje</span><span><strong>{stats.exits}</strong> saídas hoje</span><span className="flex items-center gap-1 text-amber-700"><ShieldAlert size={14}/><strong>{stats.blocked}</strong> bloqueados</span></div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="present-title"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 md:px-5"><div><h3 id="present-title" className="font-extrabold">No local agora <span className="ml-1 rounded-full bg-slate-100 px-2 py-1 text-[10px]">{localRiders.length}</span></h3><p className="mt-1 text-xs text-slate-500">Selecione “Saída” acima para registrar a retirada.</p></div></div>{loading ? <p className="p-8 text-center text-xs text-slate-500">Carregando presença...</p> : localRiders.length === 0 ? <div className="p-8 text-center"><UsersRound className="mx-auto text-slate-300" size={28}/><p className="mt-2 text-sm font-semibold text-slate-600">A unidade está vazia</p><p className="mt-1 text-xs text-slate-400">Use “Entrada” acima para registrar o primeiro entregador.</p></div> : <div className="divide-y divide-slate-100">{localRiders.map((rider) => <div key={rider.id} className="flex items-center gap-3 px-4 py-3 md:px-5"><span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${rider.tone}`}>{rider.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{rider.name}</p><p className="text-[11px] text-slate-400">{rider.plate} · entrou às {rider.entry}</p></div><button type="button" onClick={() => { setOperation('saida'); setSearch(rider.plate); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="min-h-10 shrink-0 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-slate-700 hover:border-slate-400">Preparar saída</button></div>)}</div>}</section>
          <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="font-extrabold">Mais frequentes</h3>{frequent.length === 0 ? <p className="mt-3 text-xs text-slate-400">Sem histórico de entradas.</p> : frequent.map((rider, index) => <div key={rider.id} className="mt-3 flex items-center gap-2.5"><span className="text-[10px] font-bold text-slate-400">0{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{rider.name}</p><p className="text-[10px] text-slate-400">{rider.accessCount} entradas</p></div></div>)}</section><section className="rounded-2xl border border-red-100 bg-[#fff9f8] p-4"><h3 className="flex items-center gap-2 font-extrabold"><ShieldAlert size={17} className="text-[#c92228]"/>Atenção</h3><p className="mt-2 text-sm font-bold">{stats.blocked} bloqueados</p><p className="mt-1 text-xs text-slate-500">{occurrence ? `Última ocorrência: ${occurrence.type}.` : 'Nenhuma ocorrência recente.'}</p></section></aside>
        </div>
      </div>
    </main>
  </div>
}

function Brand() { return <div className="flex h-[92px] items-center gap-3 border-b border-slate-100 px-7"><img src="/icon-192.png" alt="Drogaria Nordeste" className="size-11 rounded-xl object-cover"/><div><p className="text-[11px] font-bold tracking-[0.12em] text-[#c92228]">DROGARIA</p><p className="text-lg font-extrabold leading-5 tracking-tight">Nordeste</p></div></div> }
function iconFor(label: string) { return label === 'Portaria' ? <LayoutDashboard size={18}/> : label === 'Entregadores' ? <Bike size={18}/> : label === 'Ocorrências' ? <FileWarning size={18}/> : label === 'Histórico' ? <History size={18}/> : label === 'Alertas' ? <Bell size={18}/> : label === 'Manual' ? <BookOpen size={18}/> : <ClipboardList size={18}/> }
function normalizeSearch(value: string) { return value.toLowerCase().replace(/[^a-z0-9]/g, '') }
