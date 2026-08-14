import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getCurrentSession } from "@/lib/auth/session";
import { getSetupStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function FirstAccessPage() {
  const setup = getSetupStatus();
  if (!setup.ready) redirect("/setup");
  if (await getCurrentSession()) redirect("/configuracoes");

  return (
    <AuthCard eyebrow="Configuração inicial" title="Criar acesso da proprietária" description="Este cadastro deve ser feito somente uma vez. Depois, desative novos cadastros no ambiente." footer={<Link className="font-semibold text-brand-deep hover:underline" href="/entrar">Já tenho acesso</Link>}>
      {setup.allowSignUp ? (
        <SignUpForm />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          A criação de usuários está desativada. Para o primeiro acesso, defina <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">AUTH_ALLOW_SIGN_UP=true</code>, crie a proprietária e volte o valor para <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">false</code>.
        </div>
      )}
    </AuthCard>
  );
}
