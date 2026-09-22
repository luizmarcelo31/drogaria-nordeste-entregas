'use client'

import Link from 'next/link'
import { Bike, ClipboardList, FileWarning, LayoutDashboard } from 'lucide-react'
import { usePathname } from 'next/navigation'

const items = [
  { label: 'Portaria', href: '/', icon: LayoutDashboard },
  { label: 'Entregadores', href: '/entregadores', icon: Bike },
  { label: 'Ocorrências', href: '/ocorrencias', icon: FileWarning },
  { label: 'Relatórios', href: '/relatorios', icon: ClipboardList },
]

export function MobileNav() {
  const pathname = usePathname()
  return <nav aria-label="Navegação principal mobile" className="mobile-nav fixed inset-x-0 bottom-0 z-30 flex h-[72px] items-center justify-around border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">{items.map(({ label, href, icon: Icon }) => { const active = pathname === href; return <Link key={href} href={href} className={`relative flex min-w-[68px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold transition-colors ${active ? 'text-[#c92228]' : 'text-slate-400'}`}><span className={`flex size-8 items-center justify-center rounded-xl ${active ? 'bg-red-50' : ''}`}><Icon size={18} strokeWidth={active ? 2.4 : 1.8} /></span>{label}{label === 'Ocorrências' && <span className="absolute right-1 top-1 size-2 rounded-full bg-[#c92228] ring-2 ring-white" />}</Link> })}</nav>
}
