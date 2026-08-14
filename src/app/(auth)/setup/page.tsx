import { CheckCircle2, Circle, Database, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { getSetupStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  const setup = getSetupStatus();
  const steps = [
    { ready: setup.database, label: "Conexão DATABASE_URL configurada", icon: Database },
    { ready: setup.auth, label: "Segredo e URL da autenticação configurados", icon: KeyRound },
    { ready: setup.allowSignUp, label: "Primeiro cadastro temporariamente habilitado", icon: ShieldCheck },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 sm:px-6">
      <section className="ui-card w-full p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-deep">Sir Modas · Sprint 1</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em]">Preparar o ambiente</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">O código está pronto para trabalhar com o Neon. Complete as variáveis locais antes de criar o primeiro acesso.</p>

        <ul className="mt-8 space-y-3">
          {steps.map(({ ready, label, icon: Icon }) => (
            <li key={label} className="flex items-center gap-3 rounded-xl border border-border p-4">
              <span className={ready ? "grid size-10 place-items-center rounded-lg bg-[#149e6129] text-success" : "grid size-10 place-items-center rounded-lg bg-[#f4d7da] text-muted"}><Icon aria-hidden="true" size={20} /></span>
              <span className="flex-1 text-sm font-medium">{label}</span>
              {ready ? <CheckCircle2 className="text-success" aria-label="Configurado" size={21} /> : <Circle className="text-stone-300" aria-label="Pendente" size={21} />}
            </li>
          ))}
        </ul>

        <div className="mt-8 rounded-xl bg-black p-5 text-sm leading-7 text-white/75">
          <p>1. Copie <code className="text-white">.env.example</code> para <code className="text-white">.env.local</code>.</p>
          <p>2. Cole a conexão do Neon e gere o segredo com <code className="text-white">npx auth@latest secret</code>.</p>
          <p>3. Execute <code className="text-white">npm run db:migrate</code> e reinicie o servidor.</p>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          {setup.ready ? <Link href={setup.allowSignUp ? "/primeiro-acesso" : "/entrar"} className="ui-button-primary">Continuar</Link> : null}
          <Link href="/" className="ui-button-secondary">Verificar novamente</Link>
        </div>
      </section>
    </main>
  );
}
