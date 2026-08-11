import { Menu } from "lucide-react";
import Link from "next/link";

import { navigation } from "@/config/navigation";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="hidden border-r border-border bg-surface lg:flex lg:flex-col">
        <div className="border-b border-border px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Sir Modas</p>
          <p className="mt-1 text-sm text-muted">Gestão da loja</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Menu principal">
          {navigation.map(({ href, icon: Icon, label, priority }) => (
            <Link
              key={href}
              href={href}
              className={
                priority
                  ? "mb-3 flex min-h-12 items-center gap-3 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong"
                  : "flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              }
            >
              <Icon aria-hidden="true" size={19} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
          <div>
            <p className="text-sm font-bold text-brand">Sir Modas</p>
            <p className="text-xs text-muted">Gestão da loja</p>
          </div>
          <button className="grid size-11 place-items-center rounded-xl border border-border" aria-label="Abrir menu">
            <Menu aria-hidden="true" size={22} />
          </button>
        </header>

        <main className="mx-auto w-full max-w-[92rem] px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:py-9 lg:pb-10">
          {children}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-surface px-1 pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Atalhos principais">
          {navigation.slice(0, 5).map(({ href, icon: Icon, label, priority }) => (
            <Link
              key={href}
              href={href}
              className={priority ? "flex min-h-16 flex-col items-center justify-center gap-1 text-brand" : "flex min-h-16 flex-col items-center justify-center gap-1 text-stone-600"}
            >
              <Icon aria-hidden="true" size={20} />
              <span className="text-[0.68rem] font-medium">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
