'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Bike,
  BookOpen,
  ClipboardList,
  FileWarning,
  History,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldAlert,
  UsersRound,
  X,
  Zap,
} from 'lucide-react'
import { formatDocumentOrPlate, unitDateKey } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import {
  findRider,
  listAccessEvents,
  listAlerts,
  listOccurrences,
  listRiders,
  registerAccess,
  type AccessEvent,
  type Alert,
  type Occurrence,
  type Rider,
} from '@/lib/supabase/queries'

const routeMap = {
  Portaria: '/',
  Entregadores: '/entregadores',
  Ocorrências: '/ocorrencias',
  Relatórios: '/relatorios',
  Histórico: '/historico',
  Alertas: '/alertas',
  Manual: '/manual',
}

const tones = [
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
]

type DashboardRider = Rider & { entry: string; tone: string; accessCount?: number }
type Notice = { kind: 'success' | 'error'; message: string } | null
type Variant = 'red' | 'green' | 'slate' | 'amber'

const variantStyles: Record<Variant, string> = {
  red: 'bg-red-50 text-[#c92228]',
  green: 'bg-emerald-50 text-emerald-700',
  slate: 'bg-slate-100 text-slate-500',
  amber: 'bg-amber-50 text-amber-600',
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, variant }: { icon: React.ElementType; label: string; value: string; variant: Variant }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={`inline-flex size-8 items-center justify-center rounded-xl ${variantStyles[variant]}`}>
        <Icon size={17} />
      </span>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  )
}

// ─── Brand ────────────────────────────────────────────────────────────────────
function Brand() {
  return (
    <div className="flex h-[92px] items-center gap-3 border-b border-slate-100 px-7">
      <img src="/icon-192.png" alt="Drogaria Nordeste" className="size-11 rounded-xl object-cover" />
      <div>
        <p className="text-[11px] font-bold tracking-[0.12em] text-[#c92228]">DROGARIA</p>
        <p className="text-lg font-extrabold leading-5 tracking-tight">Nordeste</p>
      </div>
    </div>
  )
}

function iconFor(label: string) {
  if (label === 'Portaria') return <LayoutDashboard size={18} />
  if (label === 'Entregadores') return <Bike size={18} />
  if (label === 'Ocorrências') return <FileWarning size={18} />
  if (label === 'Histórico') return <History size={18} />
  if (label === 'Alertas') return <Bell size={18} />
  if (label === 'Manual') return <BookOpen size={18} />
  return <ClipboardList size={18} />
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('')
}

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Page() {
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

  // ── Load ──────────────────────────────────────────────────────────────────
  async function loadDashboard() {
    try {
      const [events, databaseAlerts, riders, occurrences] = await Promise.all([
        listAccessEvents(),
        listAlerts(),
        listRiders(),
        listOccurrences(),
      ])
      setAccessEvents(events)
      setRegisteredRiders(riders)

      const today = unitDateKey(new Date())
      const todayEvents = events.filter((e) => unitDateKey(e.createdAt) === today)
      setStats({
        entries: todayEvents.filter((e) => e.type === 'entrada' && e.status === 'registrado').length,
        exits: todayEvents.filter((e) => e.type === 'saida' && e.status === 'registrado').length,
        blocked: riders.filter((r) => r.status === 'bloqueado').length,
      })
      setAlerts(databaseAlerts)
      setOccurrence(occurrences[0] ?? null)

      const latest = new Map<string, AccessEvent>()
      events.forEach((e) => { if (!latest.has(e.riderId)) latest.set(e.riderId, e) })
      setLocalRiders(
        [...latest.values()]
          .filter((e) => e.type === 'entrada' && e.status === 'registrado')
          .map((e, i) => ({
            ...e.rider,
            entry: new Date(e.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            tone: tones[i % tones.length],
          })),
      )
    } catch {
      setNotice({ kind: 'error', message: 'Não foi possível atualizar a portaria. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadDashboard() }, [])

  // ── Derived ───────────────────────────────────────────────────────────────
  const matches = useMemo(() => {
    const q = normalizeSearch(search)
    return registeredRiders
      .filter((r) => !q || normalizeSearch(`${r.name} ${r.plate} ${r.cpf}`).includes(q))
      .slice(0, 8)
  }, [registeredRiders, search])

  const frequent = useMemo(() => {
    const counts = new Map<string, DashboardRider>()
    accessEvents
      .filter((e) => e.type === 'entrada' && e.status === 'registrado')
      .forEach((e, i) => {
        const cur = counts.get(e.riderId)
        counts.set(e.riderId, {
          ...e.rider,
          entry: '',
          tone: tones[i % tones.length],
          accessCount: (cur?.accessCount ?? 0) + 1,
        })
      })
    return [...counts.values()].sort((a, b) => (b.accessCount ?? 0) - (a.accessCount ?? 0)).slice(0, 5)
  }, [accessEvents])

  // ── Actions ───────────────────────────────────────────────────────────────
  async function registerEntry(rider: Rider) {
    setBusyId(rider.id)
    setNotice(null)
    try {
      if (rider.status === 'bloqueado') {
        await registerAccess(rider, 'entrada', 'bloqueado', 'Entregador bloqueado')
        setNotice({ kind: 'error', message: `${rider.name} está bloqueado — tentativa registrada.` })
      } else if (localRiders.some((r) => r.id === rider.id)) {
        setNotice({ kind: 'error', message: `${rider.name} já está no local.` })
        return
      } else {
        await registerAccess(rider, 'entrada')
        setNotice({ kind: 'success', message: `Entrada confirmada — ${rider.name}.` })
      }
      setSearch('')
      await loadDashboard()
    } catch {
      setNotice({ kind: 'error', message: 'Não foi possível registrar a entrada. Tente novamente.' })
    } finally { setBusyId(null) }
  }

  async function registerExit(rider: Rider) {
    setBusyId(rider.id)
    setNotice(null)
    try {
      await registerAccess(rider, 'saida')
      setNotice({ kind: 'success', message: `Saída confirmada — ${rider.name}.` })
      await loadDashboard()
    } catch {
      setNotice({ kind: 'error', message: 'Não foi possível registrar a saída. Tente novamente.' })
    } finally { setBusyId(null) }
  }

  async function submitSearch() {
    if (!search.trim()) return
    const rider = matches[0] ?? (await findRider(search))
    if (rider) await registerEntry(rider)
    else setNotice({ kind: 'error', message: 'Nenhum cadastro encontrado. Confira o nome, CPF ou placa.' })
  }

  async function signOut() { await createClient().auth.signOut() }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950">

      {/* ── Desktop Sidebar ────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-slate-200 bg-white lg:flex">
        <Brand />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Operação</p>
          <nav className="flex flex-col gap-1">
            {Object.entries(routeMap).map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                  label === 'Portaria' ? 'bg-[#c92228] text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {iconFor(label)} {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="shrink-0 p-4">
          <button
            onClick={() => void signOut()}
            className="flex min-h-11 w-full items-center gap-3 border-t border-slate-100 pt-4 text-left text-xs font-bold"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-white">AM</span>
            <span className="min-w-0 flex-1 truncate">Ana Martins</span>
            <LogOut size={16} className="shrink-0 text-slate-400" />
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="pb-24 lg:pb-0 lg:pl-[250px]">

        {/* Header */}
        <header className="sticky top-0 z-20 flex h-[64px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur md:px-9">
          <div>
            <p className="hidden text-[11px] font-medium text-slate-400 sm:block">Drogaria Nordeste</p>
            <h1 className="text-lg font-extrabold tracking-tight">Portaria</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/ocorrencias"
              className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-amber-300 hover:text-amber-700 sm:flex"
            >
              <FileWarning size={15} />
              Nova ocorrência
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowAlerts((v) => !v)}
                aria-label={`Notificações${alerts.length ? `, ${alerts.length} pendentes` : ''}`}
                className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
              >
                <Bell size={19} />
                {alerts.length > 0 && (
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-[#c92228] ring-2 ring-white" />
                )}
              </button>
              {showAlerts && (
                <div className="absolute right-0 top-12 z-50 w-[min(310px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="flex justify-between px-2 pb-2">
                    <p className="text-sm font-bold">Notificações</p>
                    <button onClick={() => setShowAlerts(false)} aria-label="Fechar notificações"><X size={15} /></button>
                  </div>
                  {alerts.length === 0 && <p className="px-2 py-3 text-xs text-slate-400">Nenhuma notificação.</p>}
                  {alerts.map((a) => (
                    <div key={a.id} className="border-t border-slate-100 px-2 py-3">
                      <p className="text-xs font-bold">{a.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{a.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto max-w-[1240px] px-4 py-5 md:px-9 md:py-6">

          {/* ── Stat Cards ──────────────────────────────────────────────── */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={UsersRound}      label="No local"      value={loading ? '—' : String(localRiders.length)} variant="red" />
            <StatCard icon={ArrowDownToLine} label="Entradas hoje"  value={loading ? '—' : String(stats.entries)}      variant="green" />
            <StatCard icon={ArrowUpFromLine} label="Saídas hoje"    value={loading ? '—' : String(stats.exits)}        variant="slate" />
            <StatCard icon={ShieldAlert}     label="Bloqueados"     value={loading ? '—' : String(stats.blocked)}      variant={stats.blocked > 0 ? 'amber' : 'slate'} />
          </div>

          {/* ── Notice ──────────────────────────────────────────────────── */}
          {notice && (
            <div
              role="status"
              aria-live="polite"
              className={`mb-4 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold ${
                notice.kind === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
              }`}
            >
              <span className="size-2 shrink-0 rounded-full bg-current" />
              <span className="flex-1">{notice.message}</span>
              <button onClick={() => setNotice(null)} className="opacity-50 hover:opacity-100" aria-label="Fechar aviso">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Grid principal ──────────────────────────────────────────── */}
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">

            {/* Coluna principal */}
            <div className="flex flex-col gap-4">

              {/* ENTRADA ──────────────────────────────────────────────── */}
              <section
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5"
                aria-labelledby="entry-title"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[#c92228] text-white">
                    <ArrowDownToLine size={14} />
                  </span>
                  <h2 id="entry-title" className="font-extrabold">Registrar entrada</h2>
                </div>

                {/* Busca */}
                <div className="flex gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <label htmlFor="rider-search" className="sr-only">Buscar entregador por nome, CPF ou placa</label>
                    <input
                      id="rider-search"
                      value={search}
                      onChange={(e) => setSearch(formatDocumentOrPlate(e.target.value))}
                      onKeyDown={(e) => e.key === 'Enter' && void submitSearch()}
                      placeholder="Nome, CPF ou placa..."
                      autoComplete="off"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-[#c92228] focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void submitSearch()}
                    disabled={!search.trim() || busyId !== null}
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#c92228] px-4 text-sm font-bold text-white transition hover:bg-[#a91d22] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowDownToLine size={15} />
                    Entrar
                  </button>
                </div>

                {/* Resultados da busca */}
                {search.trim() && (
                  <div
                    className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white"
                    role="listbox"
                    aria-label="Entregadores encontrados"
                  >
                    {matches.map((rider) => (
                      <div key={rider.id} className="flex items-center gap-3 border-b border-slate-50 px-3 py-2.5 last:border-0 hover:bg-slate-50">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${tones[registeredRiders.findIndex((r) => r.id === rider.id) % tones.length]}`}>
                          {initials(rider.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold">{rider.name}</p>
                          <p className="text-[11px] text-slate-400">{rider.plate} · {rider.phone}</p>
                        </div>
                        {rider.status === 'bloqueado' && (
                          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            Bloqueado
                          </span>
                        )}
                        {localRiders.some((r) => r.id === rider.id) && (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            No local
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => void registerEntry(rider)}
                          disabled={busyId !== null}
                          className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white transition disabled:opacity-50 ${
                            rider.status === 'bloqueado' ? 'bg-red-700 hover:bg-red-800' : 'bg-[#c92228] hover:bg-[#a91d22]'
                          }`}
                        >
                          {busyId === rider.id ? '...' : rider.status === 'bloqueado' ? 'Registrar' : 'Dar entrada'}
                        </button>
                      </div>
                    ))}
                    {matches.length === 0 && (
                      <p className="px-3 py-4 text-xs text-slate-500">Nenhum cadastro encontrado.</p>
                    )}
                  </div>
                )}

                {/* Entrada rápida (frequentes) — visível quando busca está vazia */}
                {!search.trim() && frequent.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      <Zap size={11} />
                      Entrada rápida
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {frequent.map((rider) => {
                        const alreadyIn = localRiders.some((r) => r.id === rider.id)
                        return (
                          <button
                            key={rider.id}
                            type="button"
                            onClick={() => void registerEntry(rider)}
                            disabled={busyId !== null || alreadyIn}
                            title={alreadyIn ? `${rider.name.split(' ')[0]} já está no local` : `Registrar entrada — ${rider.name}`}
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                              alreadyIn
                                ? 'border-emerald-100 bg-emerald-50 text-emerald-600 opacity-60 cursor-default'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-[#c92228] hover:bg-red-50 hover:text-[#c92228]'
                            } disabled:cursor-not-allowed`}
                          >
                            <span className={`flex size-5 items-center justify-center rounded-full text-[9px] font-bold ${rider.tone}`}>
                              {initials(rider.name)}
                            </span>
                            {rider.name.split(' ')[0]}
                            <span className="font-normal text-slate-400">×{rider.accessCount}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* NO LOCAL AGORA ─────────────────────────────────────────── */}
              <section
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                aria-labelledby="present-title"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 md:px-5">
                  <div className="flex items-center gap-2">
                    <h2 id="present-title" className="font-extrabold">No local agora</h2>
                    <span className="rounded-full bg-[#c92228] px-2 py-0.5 text-[10px] font-bold text-white">
                      {localRiders.length}
                    </span>
                  </div>
                  <Link
                    href="/historico"
                    className="text-[11px] font-bold text-[#c92228] hover:underline"
                  >
                    Ver histórico
                  </Link>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-2.5 p-8 text-sm text-slate-400">
                    <span className="size-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#c92228]" />
                    Carregando...
                  </div>
                ) : localRiders.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <UsersRound className="mx-auto text-slate-200" size={36} />
                    <p className="mt-3 text-sm font-bold text-slate-500">Nenhum entregador no local</p>
                    <p className="mt-1 text-xs text-slate-400">Use o campo acima para registrar a primeira entrada.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {localRiders.map((rider) => (
                      <div key={rider.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                        <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${rider.tone}`}>
                          {initials(rider.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{rider.name}</p>
                          <p className="text-[11px] text-slate-400">{rider.plate} · entrou {rider.entry}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void registerExit(rider)}
                          disabled={busyId !== null}
                          aria-label={`Registrar saída de ${rider.name}`}
                          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {busyId === rider.id
                            ? <span className="size-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                            : <ArrowUpFromLine size={13} />
                          }
                          Saída
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Coluna lateral */}
            <aside className="flex flex-col gap-4 sm:grid sm:grid-cols-2 lg:grid lg:grid-cols-1">

              {/* Alerta de bloqueados / ocorrência */}
              {(stats.blocked > 0 || occurrence) && (
                <section className="rounded-2xl border border-red-100 bg-[#fff9f8] p-4">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold">
                    <ShieldAlert size={15} className="text-[#c92228]" />
                    Atenção
                  </h3>
                  {stats.blocked > 0 && (
                    <p className="mt-2 text-xs text-slate-600">
                      <span className="font-bold text-red-600">{stats.blocked}</span>
                      {stats.blocked === 1 ? ' entregador bloqueado' : ' entregadores bloqueados'}
                    </p>
                  )}
                  {occurrence && (
                    <p className="mt-1 text-xs text-slate-500">Última: {occurrence.type}</p>
                  )}
                  <Link href="/ocorrencias" className="mt-3 block text-xs font-bold text-[#c92228] hover:underline">
                    Ver ocorrências →
                  </Link>
                </section>
              )}

              {/* Atalho — Nova ocorrência */}
              <Link
                href="/ocorrencias"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-200 hover:shadow-md"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <FileWarning size={17} />
                </span>
                <div>
                  <p className="text-sm font-extrabold">Nova ocorrência</p>
                  <p className="text-[11px] text-slate-400">Registrar um fato</p>
                </div>
              </Link>

              {/* Mais frequentes */}
              {frequent.length > 0 && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-extrabold">Mais frequentes</h3>
                  <div className="flex flex-col gap-3">
                    {frequent.slice(0, 3).map((rider, i) => (
                      <div key={rider.id} className="flex items-center gap-2.5">
                        <span className="w-5 shrink-0 text-center text-[10px] font-bold text-slate-300">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold">{rider.name}</p>
                          <p className="text-[10px] text-slate-400">{rider.accessCount} entradas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
