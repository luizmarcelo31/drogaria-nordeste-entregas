'use client'

import Link from 'next/link'
import { Bell, Bike, ClipboardList, FileWarning, LayoutDashboard } from 'lucide-react'
import { usePathname } from 'next/navigation'

const items = [
  { label: 'Portaria',      href: '/',             icon: LayoutDashboard },
  { label: 'Entregadores',  href: '/entregadores', icon: Bike },
  { label: 'Ocorrências',   href: '/ocorrencias',  icon: FileWarning },
  { label: 'Dados',         href: '/relatorios',   icon: ClipboardList },
  { label: 'Alertas',       href: '/alertas',      icon: Bell },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegação principal mobile"
      className="mobile-nav fixed inset-x-0 bottom-0 z-30 flex h-[68px] items-center justify-around border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
    >
      {items.map(({ label, href, icon: Icon }) => {
        // "Dados" fica ativo também na rota /historico
        const active = pathname === href || (href === '/relatorios' && pathname === '/historico')
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-bold transition-colors ${
              active ? 'text-[#c92228]' : 'text-slate-400'
            }`}
          >
            <span className={`flex size-7 items-center justify-center rounded-xl transition-colors ${active ? 'bg-red-50' : ''}`}>
              <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
            </span>
            {label}
            {label === 'Alertas' && (
              <span className="absolute right-1/2 top-1 size-2 translate-x-4 rounded-full bg-[#c92228] ring-2 ring-white" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
