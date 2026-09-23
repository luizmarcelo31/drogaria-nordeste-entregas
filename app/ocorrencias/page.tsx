'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowLeft, CheckCircle2, FileWarning, ShieldOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatPlate } from '@/lib/formatters'
import { createOccurrence, listOccurrences, type Occurrence } from '@/lib/supabase/queries'

// Tipos pré-definidos evitam inconsistência de escrita livre
const TIPOS = [
  'Recusa de identificação',
  'Acesso não autorizado',
  'Comportamento impróprio',
  'Objeto proibido',
  'Conflito com funcionário',
  'Outro',
]

const LEVELS: { value: Occurrence['level']; label: string; description: string; icon: React.ElementType; style: string; activeStyle: string }[] = [
  {
    value: 'advertencia',
    label: 'Advertência',
    description: 'Ocorrência leve',
    icon: AlertTriangle,
    style: 'border-slate-200 bg-white text-slate-600',
    activeStyle: 'border-amber-400 bg-amber-50 text-amber-700 ring-2 ring-amber-200',
  },
  {
    value: 'grave',
    label: 'Grave',
    description: 'Risco à operação',
    icon: FileWarning,
    style: 'border-slate-200 bg-white text-slate-600',
    activeStyle: 'border-orange-400 bg-orange-50 text-orange-700 ring-2 ring-orange-200',
  },
  {
    value: 'bloqueio',
    label: 'Bloqueio',
    description: 'Impede acesso',
    icon: ShieldOff,
    style: 'border-slate-200 bg-white text-slate-600',
    activeStyle: 'border-red-400 bg-red-50 text-[#c92228] ring-2 ring-red-200',
  },
]

const LEVEL_LABELS: Record<Occurrence['level'], string> = {
  advertencia: 'Advertência',
  grave: 'Grave',
  bloqueio: 'Bloqueio',
}

const LEVEL_BADGE: Record<Occurrence['level'], string> = {
  advertencia: 'bg-amber-50 text-amber-700',
  grave: 'bg-orange-50 text-orange-700',
  bloqueio: 'bg-red-50 text-[#c92228]',
}

export default function OcorrenciasPage() {
  const [items, setItems] = useState<Occurrence[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Campos controlados do formulário
  const [rider, setRider] = useState('')
  const [plate, setPlate] = useState('')
  const [tipo, setTipo] = useState('')
  const [tipoCustom, setTipoCustom] = useState('')
  const [level, setLevel] = useState<Occurrence['level']>('advertencia')
  const [description, setDescription] = useState('')

  useEffect(() => {
    listOccurrences()
      .then(setItems)
      .catch(() => setError('Não foi possível carregar as ocorrências.'))
      .finally(() => setLoading(false))
  }, [])

  function resetForm() {
    setRider(''); setPlate(''); setTipo(''); setTipoCustom('')
    setLevel('advertencia'); setDescription('')
    setError('')
  }

  function openForm() { resetForm(); setSuccess(false); setOpen(true) }
  function closeForm() { setOpen(false) }

  async function save() {
    const tipoFinal = tipo === 'Outro' ? tipoCustom.trim() : tipo
    if (!rider.trim() || !tipoFinal || !description.trim()) {
      setError('Preencha: nome/CPF do entregador, tipo e descrição.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createOccurrence({ rider: rider.trim(), plate: plate.trim(), type: tipoFinal, description: description.trim(), level })
      setItems(await listOccurrences())
      setOpen(false)
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível registrar a ocorrência.')
    } finally { setSaving(false) }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-4 py-5 pb-24 text-slate-950 md:px-10 md:py-8">
      <div className="mx-auto max-w-[860px]">

        {/* Breadcrumb */}
        <Link href="/" className="flex w-fit items-center gap-1.5 text-sm font-bold text-[#c92228]">
          <ArrowLeft size={15} /> Portaria
        </Link>

        {/* Header */}
        <div className="mb-6 mt-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#c92228]">Operação</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">Ocorrências</h1>
          </div>
          {!open && (
            <button
              onClick={openForm}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-[#c92228] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#a91d22]"
            >
              + Nova
            </button>
          )}
        </div>

        {/* Feedback de sucesso */}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={16} />
            Ocorrência registrada com sucesso.
          </div>
        )}

        {/* Erro global */}
        {error && !open && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>
        )}

        {/* ── Formulário ──────────────────────────────────────────────────── */}
        {open && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-extrabold">Nova ocorrência</h2>
              <button onClick={closeForm} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Fechar">
                ✕
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* Identificação */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-700">Nome ou CPF do entregador *</span>
                  <input
                    value={rider}
                    onChange={(e) => setRider(e.target.value)}
                    placeholder="Ex.: João Silva ou 000.000.000-00"
                    className="field"
                    required
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold text-slate-700">Placa da moto</span>
                  <input
                    value={plate}
                    onChange={(e) => setPlate(formatPlate(e.target.value))}
                    placeholder="ABC-1234"
                    maxLength={8}
                    className="field uppercase"
                  />
                </label>
              </div>

              {/* Tipo — chips pré-definidos */}
              <div>
                <p className="mb-2 text-xs font-bold text-slate-700">Tipo de ocorrência *</p>
                <div className="flex flex-wrap gap-2">
                  {TIPOS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        tipo === t
                          ? 'border-[#c92228] bg-red-50 text-[#c92228] ring-2 ring-red-100'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {tipo === 'Outro' && (
                  <input
                    value={tipoCustom}
                    onChange={(e) => setTipoCustom(e.target.value)}
                    placeholder="Descreva o tipo..."
                    className="field mt-2"
                    autoFocus
                  />
                )}
              </div>

              {/* Nível — 3 cards clicáveis */}
              <div>
                <p className="mb-2 text-xs font-bold text-slate-700">Gravidade *</p>
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map(({ value, label, description: desc, icon: Icon, style, activeStyle }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLevel(value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${level === value ? activeStyle : style} hover:border-slate-300`}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-extrabold">{label}</span>
                      <span className="text-[10px] opacity-70">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">O que aconteceu *</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva brevemente o ocorrido..."
                  className="field min-h-[96px] resize-none"
                  required
                />
              </label>

              {/* Erro do form */}
              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">{error}</p>
              )}

              {/* Ações */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="flex-[2] rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? 'Registrando...' : 'Registrar ocorrência'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Lista de ocorrências ─────────────────────────────────────── */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-extrabold">
              Registros{' '}
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{items.length}</span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2.5 p-10 text-sm text-slate-400">
              <span className="size-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#c92228]" />
              Carregando...
            </div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <FileWarning className="mx-auto text-slate-200" size={32} />
              <p className="mt-3 text-sm font-bold text-slate-500">Nenhuma ocorrência registrada</p>
              <p className="mt-1 text-xs text-slate-400">Tudo tranquilo por aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-4 px-5 py-4">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <FileWarning size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">{item.type}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${LEVEL_BADGE[item.level]}`}>
                        {LEVEL_LABELS[item.level]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.riderName}{item.plate ? ` · ${item.plate}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}
