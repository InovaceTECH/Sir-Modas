"use client";

import { Bell, ChevronRight, LogOut, Menu, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { navigation } from "@/config/navigation";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

type AppShellProps = Readonly<{
  children: React.ReactNode;
  storeName: string;
  user: { name: string; email: string };
}>;

const byHref = (hrefs: string[]) => navigation.filter((item) => hrefs.includes(item.href));
const groups = [
  { label: "Principal", items: byHref(["/inicio", "/vendas/nova"]) },
  { label: "Operação", items: byHref(["/vendas", "/produtos", "/estoque", "/caixa"]) },
  { label: "Relacionamento", items: byHref(["/clientes", "/trocas"]) },
  { label: "Análises", items: byHref(["/relatorios", "/configuracoes"]) },
];

function isNavigationActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/vendas") return pathname.startsWith("/vendas/") && pathname !== "/vendas/nova";
  return pathname.startsWith(`${href}/`);
}

function NavigationLinks({ onNavigate, dark = false }: Readonly<{ onNavigate?: () => void; dark?: boolean }>) {
  const pathname = usePathname();

  return groups.map((group) => (
    <div key={group.label} className="mb-4">
      <p className={cn("mb-1.5 px-3 text-[0.64rem] font-semibold uppercase tracking-[0.16em]", dark ? "text-white/35" : "text-muted-soft")}>{group.label}</p>
      <div className="space-y-1">
        {group.items.map(({ href, icon: Icon, label, priority }) => {
          const active = isNavigationActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                (priority || active) && "bg-brand font-semibold text-black",
                dark && !priority && !active && "text-white/68 hover:bg-white/10 hover:text-white",
                !dark && !priority && !active && "text-muted hover:bg-brand-subtle hover:text-foreground",
              )}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span className="flex-1">{label}</span>
              {active ? <ChevronRight aria-hidden="true" size={14} /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  ));
}

export function AppShell({ children, storeName, user }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden bg-black text-white lg:flex lg:flex-col">
        <div className="flex justify-center border-b border-white/10 px-5 py-4">
          <Image src="/brand/sir-modas-logo.png" alt="Sir Modas Store" width={800} height={800} priority className="size-36 object-contain" />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Menu principal">
          <NavigationLinks dark />
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-white/8 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand text-black"><UserRound aria-hidden="true" size={17} /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{user.name}</p><p className="truncate text-[0.65rem] text-white/45">{user.email}</p></div>
            <button onClick={signOut} disabled={signingOut} className="grid size-9 shrink-0 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-brand" aria-label="Sair do sistema"><LogOut aria-hidden="true" size={17} /></button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3 lg:hidden"><span className="grid size-9 place-items-center rounded-lg bg-black font-bold text-brand">S</span><div><p className="text-sm font-bold">Sir Modas</p><p className="max-w-44 truncate text-[0.65rem] text-muted">{storeName}</p></div></div>
          <p className="hidden text-sm font-semibold lg:block">{navigation.find((item) => isNavigationActive(pathname, item.href))?.label ?? "Sir Modas"}</p>
          <div className="flex items-center gap-1">
            <button className="grid size-10 place-items-center rounded-lg text-muted hover:bg-brand-subtle" aria-label="Notificações"><Bell aria-hidden="true" size={19} /></button>
            <div className="ml-2 hidden items-center gap-2 border-l border-border pl-4 lg:flex"><span className="grid size-8 place-items-center rounded-full bg-brand text-xs font-bold text-black">{user.name.slice(0, 1).toUpperCase()}</span><span className="max-w-36 truncate text-xs font-semibold">{user.name}</span></div>
            <button onClick={() => setMenuOpen(true)} className="ml-1 grid size-10 place-items-center rounded-lg border border-border lg:hidden" aria-label="Abrir menu"><Menu aria-hidden="true" size={21} /></button>
          </div>
        </header>

        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu principal">
            <button className="absolute inset-0 bg-black/45" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />
            <aside className="absolute inset-y-0 right-0 flex w-[min(88vw,21rem)] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-border bg-black p-4 text-white"><div><p className="text-sm font-bold text-brand">Sir Modas</p><p className="text-xs text-white/55">{user.name}</p></div><button onClick={() => setMenuOpen(false)} className="grid size-10 place-items-center rounded-lg border border-white/20" aria-label="Fechar menu"><X aria-hidden="true" size={20} /></button></div>
              <nav className="flex-1 overflow-y-auto p-3"><NavigationLinks onNavigate={() => setMenuOpen(false)} /></nav>
              <div className="border-t border-border p-4"><button onClick={signOut} disabled={signingOut} className="ui-button-secondary w-full"><LogOut aria-hidden="true" size={17} />{signingOut ? "Saindo..." : "Sair do sistema"}</button></div>
            </aside>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-[92rem] px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-10">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-border bg-white/96 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Atalhos principais">
          {navigation.slice(0, 5).map(({ href, icon: Icon, label, priority }) => {
            const active = isNavigationActive(pathname, href);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-muted", (priority || active) && "text-brand-deep")}><Icon aria-hidden="true" size={19} /><span className="text-[0.64rem] font-medium">{label}</span></Link>;
          })}
        </nav>
      </div>
    </div>
  );
}
