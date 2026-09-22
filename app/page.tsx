'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { formatDocumentOrPlate } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import { findRider, listAccessEvents, listAlerts, registerAccess, type Rider } from '@/lib/supabase/queries'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Bike,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  FileWarning,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'

type DashboardRider = { id: string | number; name: string; initials: string; plate: string; model: string; phone: string; entry: string; status: string; tone: string }

const riders: DashboardRider[] = [
  { id: 1, name: 'João da Silva', initials: 'JS', plate: 'QWE-4A21', model: 'Honda CG 160 · Vermelha', phone: '(85) 9 8877-2211', entry: '08:42', status: 'local', tone: 'bg-sky-100 text-sky-700' },
  { id: 2, name: 'Marcos Oliveira', initials: 'MO', plate: 'RTE-9B84', model: 'Yamaha Factor · Preta', phone: '(85) 9 9123-4410', entry: '09:05', status: 'local', tone: 'bg-violet-100 text-violet-700' },
  { id: 3, name: 'Carlos Henrique', initials: 'CH', plate: 'PQL-2C77', model: 'Honda CG 150 · Azul', phone: '(85) 9 9988-1020', entry: '09:18', status: 'local', tone: 'bg-amber-100 text-amber-700' },
  { id: 4, name: 'Rafael Santos', initials: 'RS', plate: 'NMX-6D32', model: 'Honda Biz 125 · Branca', phone: '(85) 9 8765-3344', entry: '09:36', status: 'local', tone: 'bg-emerald-100 text-emerald-700' },
]

const routeMap: Record<string, string> = { Portaria: '/', Entregadores: '/entregadores', Ocorrências: '/ocorrencias', Relatórios: '/relatorios', Alertas: '/alertas', Histórico: '/historico', Manual: '/manual' }

const initialAlerts = [
  { title: 'Atenção: permanência acima do esperado', description: 'Carlos Henrique está no local há 1h 48min.', time: 'Agora', critical: true },
  { title: 'Nova ocorrência registrada', description: 'Excesso de velocidade · Placa QWE-4A21', time: 'Há 18 min', critical: false },
]

export default function Page() {
  const [active, setActive] = useState('Portaria')
  const [query, setQuery] = useState('')
  const [checkin, setCheckin] = useState('')
  const [localRiders, setLocalRiders] = useState<DashboardRider[]>([])
  const [alerts, setAlerts] = useState(initialAlerts)
  const [showAlerts, setShowAlerts] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const filteredRiders = useMemo(() => localRiders.filter((rider) => `${rider.name} ${rider.plate}`.toLowerCase().includes(query.toLowerCase())), [localRiders, query])

  useEffect(() => {
    async function loadDashboard() {
      const [events, databaseAlerts] = await Promise.all([listAccessEvents(), listAlerts()])
      const latest = new Map<string, (typeof events)[number]>()
      events.forEach((event) => { if (!latest.has(event.riderId)) latest.set(event.riderId, event) })
      const colors = ['bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700']
      setLocalRiders([...latest.values()].filter((event) => event.type === 'entrada' && event.status === 'registrado').map((event, index) => ({ id: event.rider.id, name: event.rider.name, initials: event.rider.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(), plate: event.rider.plate, model: [event.rider.model, event.rider.color].filter(Boolean).join(' · ') || 'Veículo não informado', phone: event.rider.phone, entry: new Date(event.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), status: 'local', tone: colors[index % colors.length] })))
      setAlerts(databaseAlerts.map((alert) => ({ title: alert.title, description: alert.description, time: new Date(alert.createdAt).toLocaleString('pt-BR'), critical: alert.severity === 'bloqueio' })))
    }
    void loadDashboard()
  }, [])

  async function registerCheckin() {
    if (!checkin.trim()) return
    const found = await findRider(checkin)
    if (found && found.status === 'bloqueado') await registerAccess(found, 'entrada', 'bloqueado', 'Entregador bloqueado')
    if (found && found.status !== 'bloqueado' && !localRiders.some((rider) => rider.id === found.id)) { await registerAccess(found, 'entrada'); setLocalRiders((current) => [...current, { id: found.id, name: found.name, initials: found.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(), plate: found.plate, model: [found.model, found.color].filter(Boolean).join(' · ') || 'Veículo não informado', phone: found.phone, entry: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), status: 'local', tone: 'bg-sky-100 text-sky-700' }]) }
    setCheckin('')
  }

  async function checkout(id: string | number) {
    const rider = localRiders.find((item) => item.id === id)
    const found = rider ? await findRider(rider.plate) : null
    if (rider && found) { await registerAccess(found, 'saida'); setLocalRiders((current) => current.filter((item) => item.id !== rider.id)) }
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <aside className="route-fade fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-[92px] items-center gap-3 border-b border-slate-100 px-7">
          <img src="/drogaria-nordeste-mark.svg" alt="Drogaria Nordeste" className="size-11 rounded-xl object-cover" />
          <div><p className="text-[11px] font-bold tracking-[0.12em] text-[#c92228]">DROGARIA</p><p className="text-lg font-extrabold leading-5 tracking-tight">Nordeste</p></div>
        </div>
        <div className="px-4 pt-7"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Operação</p><nav className="flex flex-col gap-1">
          {[['Portaria', LayoutDashboard], ['Entregadores', Bike], ['Ocorrências', FileWarning], ['Relatórios', ClipboardList]].map(([label, Icon]) => <Link key={label as string} href={routeMap[label as string]} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active === label ? 'bg-[#c92228] text-white shadow-sm shadow-red-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={18} strokeWidth={1.8} />{label as string}{label === 'Ocorrências' && <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">3</span>}</Link>)}
        </nav></div>
        <div className="mt-auto p-4"><div className="rounded-2xl bg-[#fff4f3] p-4"><div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-white text-[#c92228]"><CircleHelp size={18} /></div><p className="text-xs font-bold text-slate-800">Precisa de ajuda?</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Consulte o manual rápido da portaria.</p><Link href="/manual" className="mt-3 inline-block text-xs font-bold text-[#c92228]">Abrir manual →</Link></div><div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4"><div className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">AM</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">Ana Martins</p><p className="text-[11px] text-slate-400">Operadora</p></div><button type="button" aria-label="Sair da conta" className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-[#c92228]" onClick={() => window.alert('A saída será conectada ao fluxo de autenticação.')}><LogOut size={16} /></button></div></div>
      </aside>

      <main className="pb-20 lg:pb-0 lg:pl-[250px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur md:px-9">
          <div className="flex items-center gap-3"><button type="button" aria-label="Menu" className="rounded-lg p-2 text-slate-500 lg:hidden" onClick={() => setShowMenu(!showMenu)}><Menu size={20} /></button><div><p className="text-xs font-medium text-slate-400">Segunda-feira, 22 de setembro de 2026</p><h1 className="mt-0.5 text-xl font-extrabold tracking-tight md:text-2xl">Olá, Ana</h1></div></div>
          <div className="relative"><button onClick={() => setShowAlerts(!showAlerts)} className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50" aria-label="Notificações"><Bell size={19} />{alerts.length > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-[#c92228] ring-2 ring-white" />}</button>{showAlerts && <div className="absolute right-0 top-12 w-[310px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"><div className="flex items-center justify-between px-2 pb-2"><p className="text-sm font-bold">Notificações</p><button onClick={() => setShowAlerts(false)}><X size={15} className="text-slate-400" /></button></div>{alerts.map((alert) => <div key={alert.title} className="border-t border-slate-100 px-2 py-3"><div className="flex gap-2"><span className={`mt-0.5 rounded-full p-1.5 ${alert.critical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{alert.critical ? <AlertTriangle size={13} /> : <Bell size={13} />}</span><div><p className="text-xs font-bold">{alert.title}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{alert.description}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{alert.time}</p></div></div></div>)}</div>}</div>
        </header>

        <div className="mx-auto max-w-[1320px] px-5 py-7 md:px-9 md:py-9">
          <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400"><span>Operação</span><span>/</span><span className="text-[#c92228]">{active}</span></div><h2 className="text-2xl font-extrabold tracking-tight md:text-[30px]">Visão geral da portaria</h2><p className="mt-1 text-sm text-slate-500">Acompanhe as movimentações e mantenha tudo sob controle.</p></div><button className="flex w-fit items-center gap-2 rounded-xl bg-[#c92228] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-[#ad1e24]"><Plus size={17} /> Nova ocorrência</button></div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={UsersRound} label="No local agora" value={String(localRiders.length)} helper="entregadores presentes" color="red" /><Metric icon={ArrowDownToLine} label="Entradas hoje" value="28" helper="+12% vs. ontem" color="blue" trend /><Metric icon={ArrowUpFromLine} label="Saídas hoje" value="21" helper="última às 09:42" color="green" /><Metric icon={ShieldAlert} label="Bloqueados" value="03" helper="requer atenção" color="amber" alert /></div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-extrabold tracking-tight">Controle de entrada</h3><p className="mt-1 text-xs text-slate-500">Localize por placa ou CPF para liberar o acesso.</p></div><span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" />Portaria aberta</span></div><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={checkin} onChange={(e) => setCheckin(formatDocumentOrPlate(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && registerCheckin()} placeholder="Digite a placa ou CPF do entregador" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#c92228] focus:bg-white focus:ring-4 focus:ring-red-100" /></div><button onClick={registerCheckin} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#c92228] px-5 text-sm font-bold text-white transition hover:bg-[#ad1e24]"><ArrowDownToLine size={17} />Registrar entrada</button></div><div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800"><AlertTriangle size={15} className="shrink-0 text-amber-600" /><span><strong>Atenção:</strong> entregadores bloqueados terão a entrada impedida automaticamente.</span></div></section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-extrabold tracking-tight">Recorrência de acessos</h3><p className="mt-1 text-xs text-slate-500">Entregadores mais frequentes</p></div><button className="flex items-center gap-1 text-xs font-bold text-slate-500">Últimos 7 dias <ChevronDown size={14} /></button></div><div className="flex flex-col gap-3">{riders.slice(0, 3).map((rider, index) => <div key={rider.id} className="flex items-center gap-3"><span className="w-4 text-xs font-bold text-slate-400">0{index + 1}</span><div className={`flex size-8 items-center justify-center rounded-full text-[10px] font-extrabold ${rider.tone}`}>{rider.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{rider.name}</p><p className="text-[10px] text-slate-400">{rider.plate}</p></div><div className="text-right"><p className="text-sm font-extrabold">{18 - index * 4}</p><p className="text-[10px] text-slate-400">acessos</p></div></div>)}</div></section>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between md:p-6"><div><div className="flex items-center gap-2"><h3 className="font-extrabold tracking-tight">Entregadores no local</h3><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{localRiders.length}</span></div><p className="mt-1 text-xs text-slate-500">Acompanhe quem está dentro da unidade neste momento.</p></div><div className="relative w-full md:w-64"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar entregador..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-slate-400" /></div></div><div className="hidden overflow-x-auto md:block"><table className="w-full text-left"><thead><tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400"><th className="px-6 py-3">Entregador</th><th className="px-4 py-3">Veículo</th><th className="px-4 py-3">Entrada</th><th className="px-4 py-3">Permanência</th><th className="px-6 py-3 text-right">Ação</th></tr></thead><tbody>{filteredRiders.map((rider) => <tr key={rider.id} className="border-b border-slate-50 last:border-0"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className={`flex size-9 items-center justify-center rounded-full text-[11px] font-extrabold ${rider.tone}`}>{rider.initials}</div><div><p className="text-sm font-bold">{rider.name}</p><p className="mt-0.5 text-[11px] text-slate-400">{rider.plate}</p></div></div></td><td className="px-4 py-4 text-xs text-slate-600">{rider.model}</td><td className="px-4 py-4 text-xs font-semibold text-slate-700">{rider.entry}</td><td className="px-4 py-4"><span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><Clock3 size={14} className="text-slate-400" />{rider.id === 3 ? '1h 48min' : rider.id === 4 ? '12min' : '32min'}</span></td><td className="px-6 py-4 text-right"><button onClick={() => checkout(rider.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-[#c92228] hover:text-[#c92228]"><ArrowUpFromLine size={14} className="mr-1.5 inline" />Registrar saída</button></td></tr>)}</tbody></table></div><div className="flex flex-col gap-3 p-4 md:hidden">{filteredRiders.map((rider) => <div key={rider.id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center gap-3"><div className={`flex size-9 items-center justify-center rounded-full text-[11px] font-extrabold ${rider.tone}`}>{rider.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{rider.name}</p><p className="text-[11px] text-slate-400">{rider.plate} · entrada {rider.entry}</p></div><span className="text-xs font-semibold text-slate-500">{rider.id === 3 ? '1h 48min' : '32min'}</span></div><button onClick={() => checkout(rider.id)} className="mt-3 h-9 w-full rounded-lg border border-slate-200 text-xs font-bold text-slate-600">Registrar saída</button></div>)}</div>{filteredRiders.length === 0 && <div className="px-6 py-10 text-center text-sm text-slate-400">Nenhum entregador encontrado.</div>}</section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-red-100 bg-[#fff9f8] p-5 md:p-6"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-lg bg-red-100 text-red-600"><ShieldAlert size={17} /></div><h3 className="font-extrabold tracking-tight">Alertas de segurança</h3></div><Link href="/alertas" className="text-xs font-bold text-[#c92228]">Ver todos</Link></div><div className="flex items-start gap-3 rounded-xl border border-red-100 bg-white p-3"><div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600"><AlertTriangle size={16} /></div><div><p className="text-xs font-bold">3 entregadores bloqueados</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Verifique a lista negra antes de liberar novas entradas.</p></div></div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600"><FileWarning size={17} /></div><h3 className="font-extrabold tracking-tight">Últimas ocorrências</h3></div><Link href="/historico" className="text-xs font-bold text-[#c92228]">Ver histórico</Link></div><div className="flex items-center gap-3"><div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-xs font-extrabold text-amber-700">JS</div><div className="flex-1"><p className="text-xs font-bold">Excesso de velocidade</p><p className="mt-1 text-[11px] text-slate-400">João da Silva · há 18 min</p></div><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">Advertência</span></div></section></div>
        </div>
      </main>
      <nav aria-label="Navegação principal mobile" className="fixed inset-x-0 bottom-0 z-30 flex h-[72px] items-center justify-around border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">{[['Portaria', LayoutDashboard], ['Entregadores', Bike], ['Ocorrências', FileWarning], ['Relatórios', ClipboardList]].map(([label, Icon]) => <Link key={label as string} href={routeMap[label as string]} className={`relative flex min-w-[68px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold ${active === label ? 'text-[#c92228]' : 'text-slate-400'}`}><span className={`flex size-8 items-center justify-center rounded-xl ${active === label ? 'bg-red-50' : ''}`}><Icon size={18} strokeWidth={active === label ? 2.4 : 1.8} /></span>{label as string}{label === 'Ocorrências' && <span className="absolute right-1 top-1 size-2 rounded-full bg-[#c92228] ring-2 ring-white" />}</Link>)}</nav>\n      {showMenu && <div className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={() => setShowMenu(false)}><div className="flex h-full w-[270px] flex-col bg-white p-5" onClick={(e) => e.stopPropagation()}><div className="mb-8 flex items-center gap-3"><img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-ovGJwWZX2BJc2hCYBIeaMkjGv37AfJ.png" alt="Drogaria Nordeste" className="size-11 rounded-xl object-cover" /><p className="font-extrabold">Drogaria Nordeste</p></div><nav className="flex flex-col gap-1">{['Portaria', 'Entregadores', 'Ocorrências', 'Relatórios'].map((item) => <Link key={item} href={routeMap[item]} onClick={() => setShowMenu(false)} className="rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50">{item}</Link>)}</nav><div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-4"><div className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">AM</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">Ana Martins</p><p className="text-[11px] text-slate-400">Operadora</p></div><button type="button" aria-label="Sair da conta" className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-[#c92228]" onClick={() => window.alert('A saída será conectada ao fluxo de autenticação.')}><LogOut size={16} /></button></div></div></div>}
    </div>
  )
}

function Metric({ icon: Icon, label, value, helper, color, trend, alert }: { icon: typeof UsersRound; label: string; value: string; helper: string; color: string; trend?: boolean; alert?: boolean }) {
  const colors: Record<string, string> = { red: 'bg-red-50 text-[#c92228]', blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600' }
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div className={`flex size-10 items-center justify-center rounded-xl ${colors[color]}`}><Icon size={19} /></div>{alert && <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600">Atenção</span>}{trend && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">↗ 12%</span>}</div><p className="mt-4 text-xs font-semibold text-slate-500">{label}</p><div className="mt-1 flex items-end gap-2"><p className="text-3xl font-extrabold tracking-tight">{value}</p><p className="mb-1 text-[10px] font-semibold text-slate-400">{helper}</p></div></div>
}
