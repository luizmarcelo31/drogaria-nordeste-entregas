'use client'

import Link from 'next/link'
import { ArrowLeft, Bike, Loader2, Pencil, Plus, Search, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatCpf, formatPhone, formatPlate } from '@/lib/formatters'
import { createRider, deactivateRider, listRiders, type Rider, updateRider, updateRiderStatus } from '@/lib/supabase/queries'

type Notice = { kind: 'success' | 'error'; message: string } | null

type FormValues = { name: string; cpf: string; plate: string; phone: string }

const emptyForm: FormValues = { name: '', cpf: '', plate: '', phone: '' }

export default function EntregadoresPage() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Rider | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  async function load() { try { setRiders(await listRiders()) } catch { setNotice({ kind: 'error', message: 'Não foi possível carregar os entregadores.' }) } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])

  function openNew() { setEditing(null); setOpen(true); setNotice(null) }
  function openEdit(rider: Rider) { setEditing(rider); setOpen(true); setNotice(null) }
  function closeForm() { setOpen(false); setEditing(null) }

  async function save(form: FormData) {
    setSaving(true)
    setNotice(null)
    const values = { name: String(form.get('name')), cpf: String(form.get('cpf')), plate: String(form.get('plate')), phone: String(form.get('phone')) }
    try {
      const rider = editing ? await updateRider(editing.id, values) : await createRider(values)
      setRiders((current) => (editing ? current.map((item) => item.id === rider.id ? rider : item) : [...current, rider]).sort((a, b) => a.name.localeCompare(b.name)))
      closeForm()
      setNotice({ kind: 'success', message: editing ? 'Cadastro atualizado.' : 'Entregador cadastrado com sucesso.' })
    } catch (caughtError) { setNotice({ kind: 'error', message: caughtError instanceof Error ? caughtError.message : 'Não foi possível salvar o cadastro.' }) } finally { setSaving(false) }
  }

  async function toggleStatus(rider: Rider) { const status = rider.status === 'bloqueado' ? 'ativo' : 'bloqueado'; try { await updateRiderStatus(rider.id, status); setRiders((current) => current.map((item) => item.id === rider.id ? { ...item, status } : item)); setNotice({ kind: 'success', message: `${rider.name} agora está ${status === 'ativo' ? 'ativo' : 'bloqueado'}.` }) } catch { setNotice({ kind: 'error', message: 'Não foi possível atualizar o status.' }) } }
  async function remove(rider: Rider) { if (!window.confirm(`Excluir o cadastro de ${rider.name}?`)) return; try { await deactivateRider(rider.id); setRiders((current) => current.filter((item) => item.id !== rider.id)); setNotice({ kind: 'success', message: 'Cadastro inativado.' }) } catch { setNotice({ kind: 'error', message: 'Não foi possível excluir o entregador.' }) } }
  const filtered = riders.filter((rider) => `${rider.name} ${rider.plate} ${rider.cpf}`.toLowerCase().includes(search.toLowerCase()))
  const initialValues = editing ? { name: editing.name, cpf: formatCpf(editing.cpf), plate: formatPlate(editing.plate), phone: editing.phone } : emptyForm

  return <main className="min-h-screen bg-[#f7f8fa] px-4 py-5 pb-24 text-slate-950 md:px-10 md:py-8"><div className="mx-auto max-w-[1180px]"><nav className="mb-6 flex items-center gap-3 text-sm font-bold"><Link href="/" className="flex items-center gap-2 text-[#c92228]"><ArrowLeft size={16}/> Portaria</Link><span className="text-slate-300">/</span><span className="flex items-center gap-2"><Bike size={16}/> Entregadores</span></nav><header className="mb-5 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c92228]">Cadastros</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Entregadores</h1><p className="mt-1 text-sm text-slate-500">Quem está autorizado a acessar a unidade.</p></div><button type="button" onClick={openNew} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#c92228] text-white md:h-11 md:w-auto md:gap-2 md:px-4 md:text-sm md:font-bold"><Plus size={18}/><span className="hidden md:inline">Novo entregador</span></button></header>{notice && <p role="status" aria-live="polite" className={`mb-4 rounded-xl px-3 py-2.5 text-xs font-semibold ${notice.kind === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{notice.message}</p>}{open && <form action={save} className="mb-4 grid gap-3 rounded-2xl border border-red-100 bg-white p-4 shadow-sm md:grid-cols-4"><div className="md:col-span-4 flex items-center justify-between"><h2 className="font-extrabold">{editing ? 'Editar entregador' : 'Novo entregador'}</h2><button type="button" onClick={closeForm} aria-label="Fechar formulário" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={17}/></button></div><label className="text-xs font-bold text-slate-700">Nome<input name="name" required defaultValue={initialValues.name} placeholder="Nome completo" className="field mt-1"/></label><label className="text-xs font-bold text-slate-700">CPF<input name="cpf" required defaultValue={initialValues.cpf} placeholder="CPF" maxLength={14} className="field mt-1" onChange={(event) => { event.currentTarget.value = formatCpf(event.currentTarget.value) }}/></label><label className="text-xs font-bold text-slate-700">Placa<input name="plate" required defaultValue={initialValues.plate} placeholder="ABC-1234" maxLength={8} className="field mt-1 uppercase" onChange={(event) => { event.currentTarget.value = formatPlate(event.currentTarget.value) }}/></label><label className="text-xs font-bold text-slate-700">Telefone<input name="phone" required defaultValue={initialValues.phone} placeholder="Telefone" maxLength={15} className="field mt-1" onChange={(event) => { event.currentTarget.value = formatPhone(event.currentTarget.value) }}/></label><button disabled={saving} className="h-11 rounded-xl bg-slate-900 text-sm font-bold text-white disabled:opacity-60 md:col-span-4">{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Salvar cadastro'}</button></form>}<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-extrabold">Cadastros ativos <span className="ml-1 rounded-full bg-slate-100 px-2 py-1 text-[10px]">{riders.length}</span></h2><p className="mt-1 text-xs text-slate-500">Pesquise por nome, CPF ou placa.</p></div><div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><label htmlFor="rider-list-search" className="sr-only">Buscar entregador</label><input id="rider-list-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar entregador" className="field h-10 pl-10"/></div></div>{loading ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><Loader2 className="animate-spin" size={18}/> Carregando cadastros...</div> : filtered.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">Nenhum entregador encontrado.</p> : <div className="divide-y divide-slate-100">{filtered.map((rider) => <div key={rider.id} className="flex items-center gap-3 p-4 md:px-5"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-[#c92228]"><UserRound size={17}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{rider.name}</p><p className="text-[11px] text-slate-400">{rider.plate} · {rider.phone}</p></div><span className={`hidden rounded-full px-2 py-1 text-[10px] font-bold sm:block ${rider.status === 'bloqueado' ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{rider.status === 'bloqueado' ? 'Bloqueado' : 'Ativo'}</span><button type="button" onClick={() => openEdit(rider)} aria-label={`Editar ${rider.name}`} className="flex size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil size={15}/></button><button type="button" onClick={() => void toggleStatus(rider)} className="text-[11px] font-bold text-slate-500 hover:text-[#c92228]">{rider.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}</button><button type="button" onClick={() => void remove(rider)} aria-label={`Inativar ${rider.name}`} title="Inativar entregador" className="flex size-9 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-[#c92228]"><X size={16}/></button></div>)}</div>}</section></div></main>
}
