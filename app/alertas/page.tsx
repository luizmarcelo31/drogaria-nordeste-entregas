'use client'

import type React from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { listAlerts, resolveAlert, type Alert } from '@/lib/supabase/queries'

type Filter = 'ativos' | 'resolvidos' | 'todos'
type Notice = { kind: 'success' | 'error'; message: string } | null

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filter, setFilter] = useState<Filter>('ativos')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice>(null)

  useEffect(() => { listAlerts().then(setAlerts).catch(() => setNotice({ kind: 'error', message: 'Não foi possível carregar os alertas. Tente atualizar a página.' })).finally(() => setLoading(false)) }, [])

  async function resolve(id: string) {
    setBusyId(id)
    setNotice(null)
    try { await resolveAlert(id); setAlerts((current) => current.map((item) => item.id === id ? { ...item, status: 'resolvida' } : item)); setNotice({ kind: 'success', message: 'Alerta resolvido e retirado da fila ativa.' }) } catch { setNotice({ kind: 'error', message: 'Não foi possível resolver este alerta. Tente novamente.' }) } finally { setBusyId(null) }
  }

  const visible = useMemo(() => alerts.filter((alert) => filter === 'todos' || (filter === 'ativos' ? alert.status === 'aberta' : alert.status === 'resolvida')).sort((a, b) => Number(b.severity === 'bloqueio') - Number(a.severity === 'bloqueio')), [alerts, filter])
  const active = alerts.filter((item) => item.status === 'aberta').length
  const blocked = alerts.filter((item) => item.severity === 'bloqueio').length

  return <main className="min-h-screen bg-[#f7f8fa] px-4 py-5 pb-24 text-slate-950 md:px-10 md:py-8"><div className="mx-auto max-w-[1000px]"><Link href="/" className="flex w-fit items-center gap-2 text-sm font-bold text-[#c92228]"><ArrowLeft size={16}/> Portaria</Link><header className="mb-5 mt-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c92228]">Segurança</p><div className="mt-1 flex items-start justify-between gap-3"><div><h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Fila de alertas</h1><p className="mt-1 text-sm text-slate-500">Resolva primeiro as situações que impedem o acesso.</p></div><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#c92228]"><ShieldAlert size={21}/></div></div></header><div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><Metric label="Na fila" value={String(active)} icon={<ShieldAlert size={17}/>} /><Metric label="Bloqueios" value={String(blocked)} icon={<AlertTriangle size={17}/>} /><Metric label="Resolvidos" value={String(alerts.length - active)} icon={<CheckCircle2 size={17}/>} /></div>{notice && <p role="status" aria-live="polite" className={`mt-4 rounded-xl px-3 py-2.5 text-xs font-semibold ${notice.kind === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{notice.message}</p>}<section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-extrabold">O que exige atenção</h2><p className="mt-1 text-xs text-slate-500">{visible.length} resultado{visible.length === 1 ? '' : 's'}</p></div><div className="grid grid-cols-3 rounded-lg bg-slate-100 p-1" role="group" aria-label="Filtro de alertas">{(['ativos', 'resolvidos', 'todos'] as Filter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-md px-2 py-2 text-[10px] font-bold capitalize ${filter === value ? 'bg-white text-[#c92228] shadow-sm' : 'text-slate-500'}`}>{value}</button>)}</div></div>{loading ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><Loader2 className="animate-spin" size={18}/> Carregando alertas...</div> : visible.length === 0 ? <div className="p-10 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={28}/><p className="mt-2 text-sm font-bold">Nenhum alerta {filter === 'ativos' ? 'ativo' : 'encontrado'}</p><p className="mt-1 text-xs text-slate-500">A portaria não tem pendências nesta fila.</p></div> : <div className="divide-y divide-slate-100">{visible.map((alert) => <article key={alert.id} className="flex items-start gap-3 p-4 md:items-center md:px-5"><span className={`mt-0.5 rounded-lg p-2 ${alert.severity === 'bloqueio' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}><AlertTriangle size={17}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold">{alert.title}</h3>{alert.severity === 'bloqueio' && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-700">Bloqueio</span>}</div><p className="mt-1 text-xs text-slate-500">{alert.description}</p><time className="mt-1 block text-[10px] text-slate-400">{new Date(alert.createdAt).toLocaleString('pt-BR')}</time></div>{alert.status === 'aberta' ? <button type="button" onClick={() => void resolve(alert.id)} disabled={busyId !== null} className="min-h-10 shrink-0 rounded-lg bg-slate-900 px-3 text-[11px] font-bold text-white disabled:opacity-50">{busyId === alert.id ? 'Salvando...' : 'Resolver'}</button> : <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Resolvido</span>}</article>)}</div>}</section></div></main>
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><div className="flex size-8 items-center justify-center rounded-lg bg-red-50 text-[#c92228]">{icon}</div><p className="mt-2 text-[11px] font-semibold text-slate-500">{label}</p><p className="text-2xl font-extrabold">{value}</p></div> }
