'use client'

import Link from 'next/link'
import { Bell, Bike, BookOpen, ClipboardList, FileWarning, History, LayoutDashboard, LogOut } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const items = [
  { label: 'Portaria', href: '/', icon: LayoutDashboard },
  { label: 'Entregadores', href: '/entregadores', icon: Bike },
  { label: 'Ocorrências', href: '/ocorrencias', icon: FileWarning },
  { label: 'Relatórios', href: '/relatorios', icon: ClipboardList },
  { label: 'Histórico', href: '/historico', icon: History },
  { label: 'Alertas', href: '/alertas', icon: Bell },
]

export function DesktopNav() {
  const pathname = usePathname()
  async function signOut() { await createClient().auth.signOut() }

  return <aside className="desktop-nav fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col border-r border-slate-200 bg-white lg:flex">
    <div className="flex h-[92px] shrink-0 items-center gap-3 border-b border-slate-100 px-7"><img src="/icon-192.png" alt="Drogaria Nordeste" className="size-11 rounded-xl object-cover"/><div><p className="text-[11px] font-bold tracking-[0.12em] text-[#c92228]">DROGARIA</p><p className="text-lg font-extrabold leading-5 tracking-tight">Nordeste</p></div></div>
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-7"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Operação</p><nav className="flex flex-col gap-1">{items.map(({ label, href, icon: Icon }) => { const active = pathname === href; return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${active ? 'bg-[#c92228] text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={18} strokeWidth={active ? 2.4 : 1.9}/>{label}</Link> })}</nav><p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Ajuda</p><Link href="/manual" aria-current={pathname === '/manual' ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${pathname === '/manual' ? 'bg-red-50 text-[#c92228]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><BookOpen size={18}/>Manual</Link></div>
    <div className="shrink-0 p-4"><button onClick={() => void signOut()} className="flex min-h-11 w-full items-center gap-3 border-t border-slate-100 pt-4 text-left text-xs font-bold"><span className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-white">AM</span><span className="min-w-0 flex-1 truncate">Ana Martins</span><LogOut size={16} className="shrink-0 text-slate-400"/></button></div>
  </aside>
}
