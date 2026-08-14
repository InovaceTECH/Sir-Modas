import Image from "next/image";
import Link from "next/link";

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}>) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden min-h-screen place-items-center overflow-hidden bg-black p-12 lg:grid">
        <div className="absolute inset-x-0 top-0 h-px bg-brand/50" />
        <div className="text-center">
          <Image src="/brand/sir-modas-logo.png" alt="Sir Modas Store" width={800} height={800} priority className="mx-auto size-[min(35vw,31rem)] object-contain" />
          <p className="-mt-8 text-xs font-medium uppercase tracking-[0.28em] text-white/45">Gestão da boutique</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-14">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden"><span className="grid size-10 place-items-center rounded-lg bg-black font-bold text-brand">S</span><span className="font-bold">Sir Modas Store</span></Link>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.035em] text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-7 border-t border-border pt-5 text-center text-sm text-muted">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}
