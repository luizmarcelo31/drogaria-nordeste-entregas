'use client'

import Link from 'next/link'
import { ArrowLeft, ClipboardList, Loader2, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { StoreReportHeader } from '@/components/store-report-header'
import { listAccessEvents, listOccurrences, type AccessEvent, type Occurrence } from '@/lib/supabase/queries'

type Summary = { name: string; accesses: number; occurrences: number; status: string }

export default function RelatoriosPage() {
  const [events, setEvents] = useState<AccessEvent[]>([])
  const [occurrences, setOccurrences] = useState<Occurrence[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { Promise.all([listAccessEvents(), listOccurrences()]).then(([accesses, facts]) => { setEvents(accesses); setOccurrences(facts) }).finally(() => setLoading(false)) }, [])

  const summaries = events.reduce<Summary[]>((list, event) => {
    let item = list.find((entry) => entry.name === event.rider.name)
    if (!item) { item = { name: event.rider.name, accesses: 0, occurrences: 0, status: 'Regular' }; list.push(item) }
    if (event.status === 'registrado') item.accesses += 1
    item.occurrences = occurrences.filter((occurrence) => occurrence.riderName === event.rider.name).length
    item.status = item.occurrences > 2 ? 'Atenção' : 'Regular'
    return list
  }, [])

  return <main className="page-enter min-h-screen bg-[#f7f8fa] px-5 py-6 text-slate-950 md:px-10 md:py-9"><div className="mx-auto max-w-[1180px]"><div className="no-print mb-8 flex items-center justify-between"><Link href="/" className="flex items-center gap-2 text-sm font-bold text-[#c92228]"><ArrowLeft size={16}/> Voltar para portaria</Link><button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-[#c92228] px-4 py-3 text-sm font-bold text-white"><Printer size={16}/> Gerar PDF</button></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-8"><StoreReportHeader /><div className="mt-7 border-b border-slate-100 pb-5"><p className="text-xs font-semibold text-[#c92228]">Relatório operacional</p><h1 className="mt-2 text-3xl font-extrabold">Resumo de acessos e ocorrências</h1><p className="mt-1 text-sm text-slate-500">Gerado em {new Date().toLocaleString('pt-BR')}</p></div><section className="mt-6 grid gap-4 sm:grid-cols-3"><Card label="Entradas registradas" value={String(events.filter((event) => event.type === 'entrada' && event.status === 'registrado').length)}/><Card label="Saídas registradas" value={String(events.filter((event) => event.type === 'saida').length)}/><Card label="Ocorrências" value={String(occurrences.length)}/></section><section className="mt-6 rounded-2xl border border-slate-200 p-6"><div className="flex items-center gap-3 border-b border-slate-100 pb-5"><div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-[#c92228]"><ClipboardList size={19}/></div><div><h2 className="font-extrabold">Resumo por entregador</h2><p className="text-xs text-slate-500">Dados registrados no sistema</p></div></div>{loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={18}/> Calculando relatório...</div> : <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase tracking-wider text-slate-400"><tr><th className="pb-3">Entregador</th><th className="pb-3">Acessos</th><th className="pb-3">Ocorrências</th><th className="pb-3">Status</th></tr></thead><tbody>{summaries.map((row) => <tr key={row.name} className="border-t border-slate-100"><td className="py-4 font-bold">{row.name}</td><td className="py-4">{row.accesses}</td><td className="py-4">{row.occurrences}</td><td className="py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${row.status === 'Atenção' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{row.status}</span></td></tr>)}</tbody></table>{summaries.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Ainda não há dados para o relatório.</p>}</div>}</section></div></div></main>
}

function Card({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-extrabold">{value}</p></div> }
