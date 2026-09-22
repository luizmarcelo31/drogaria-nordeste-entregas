'use client'

import type React from 'react'
import Link from 'next/link'
import { ArrowLeft, Bike, Loader2, Plus, Search, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatCpf, formatPhone, formatPlate } from '@/lib/formatters'
import { createRider, deactivateRider, listRiders, type Rider, updateRiderStatus } from '@/lib/supabase/queries'
import { MobileNav } from '@/components/mobile-nav'

export default function EntregadoresPage() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try { setRiders(await listRiders()); setError('') } catch { setError('Não foi possível carregar os entregadores.') } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  async function add(form: FormData) {
    setSaving(true)
    try { const rider = await createRider({ name: String(form.get('name')), cpf: String(form.get('cpf')), plate: String(form.get('plate')), phone: String(form.get('phone')) }); setRiders((current) => [...current, rider].sort((a, b) => a.name.localeCompare(b.name))); setOpen(false) } catch { setError('Não foi possível salvar o cadastro. Verifique CPF e placa.') } finally { setSaving(false) }
  }
  async function toggleStatus(rider: Rider) { const status = rider.status === 'bloqueado' ? 'ativo' : 'bloqueado'; try { await updateRiderStatus(rider.id, status); setRiders((current) => current.map((item) => item.id === rider.id ? { ...item, status } : item)) } catch { setError('Não foi possível atualizar o status.') } }
  async function remove(rider: Rider) { if (!window.confirm(`Excluir o cadastro de ${rider.name}?`)) return; try { await deactivateRider(rider.id); setRiders((current) => current.filter((item) => item.id !== rider.id)) } catch { setError('Não foi possível excluir o entregador.') } }

  const filtered = riders.filter((rider) => `${rider.name} ${rider.plate}`.toLowerCase().includes(search.toLowerCase()))
  return <Shell><div className="page-enter mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-semibold text-[#c92228]">Operação / Entregadores</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Entregadores</h1><p className="mt-1 text-sm text-slate-500">Cadastre e consulte quem pode acessar a unidade.</p></div><button onClick={() => setOpen(true)} className="flex w-fit items-center gap-2 rounded-xl bg-[#c92228] px-4 py-3 text-sm font-bold text-white"><Plus size={17}/> Novo entregador</button></div>{open && <form action={add} className="route-fade mb-6 grid gap-3 rounded-2xl border border-red-100 bg-white p-5 shadow-sm md:grid-cols-4"><input name="name" required placeholder="Nome completo" className="field"/><input name="cpf" required placeholder="CPF" maxLength={14} className="field" onChange={(e) => { e.currentTarget.value = formatCpf(e.currentTarget.value) }}/><input name="plate" required placeholder="Placa da moto" maxLength={8} className="field uppercase" onChange={(e) => { e.currentTarget.value = formatPlate(e.currentTarget.value) }}/><input name="phone" required placeholder="Telefone" maxLength={15} className="field" onChange={(e) => { e.currentTarget.value = formatPhone(e.currentTarget.value) }}/><button disabled={saving} className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60 md:col-span-4">{saving ? 'Salvando...' : 'Salvar cadastro'}</button></form>}{error && <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}<section className="route-fade rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><div className="relative max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou placa" className="field pl-11"/></div></div>{loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18}/> Carregando entregadores...</div> : <div className="divide-y divide-slate-100">{filtered.map((rider) => <div key={rider.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-center"><div className="flex size-11 items-center justify-center rounded-full bg-red-50 text-[#c92228]"><UserRound size={19}/></div><div className="min-w-0 flex-1"><p className="font-bold">{rider.name}</p><p className="mt-1 text-xs text-slate-400">{rider.plate} · {rider.phone}</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${rider.status === 'bloqueado' ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{rider.status === 'bloqueado' ? 'Bloqueado' : 'Ativo'}</span><button onClick={() => void toggleStatus(rider)} className="w-fit text-xs font-bold text-slate-500 hover:text-[#c92228]">{rider.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}</button><button type="button" onClick={() => void remove(rider)} aria-label={`Excluir ${rider.name}`} title="Excluir entregador" className="flex size-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-50 hover:text-[#c92228]"><X size={16}/></button></div>)}{filtered.length === 0 && <p className="p-10 text-center text-sm text-slate-500">Nenhum entregador encontrado.</p>}</div>}</section><MobileNav /></Shell>
}

function Shell({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-[#f7f8fa] px-5 py-6 pb-24 text-slate-950 md:px-10 md:py-9 lg:pb-9"><div className="mx-auto max-w-[1180px]"><nav className="route-fade mb-8 flex items-center gap-4 text-sm font-bold"><Link href="/" className="flex items-center gap-2 text-[#c92228]"><ArrowLeft size={16}/> Portaria</Link><span className="text-slate-300">/</span><span className="flex items-center gap-2"><Bike size={16}/> Entregadores</span></nav>{children}</div></main> }
