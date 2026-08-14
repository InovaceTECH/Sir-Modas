import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getCurrentSession } from "@/lib/auth/session";
import { getSetupStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  if (!getSetupStatus().ready) redirect("/setup");
  if (await getCurrentSession()) redirect("/inicio");

  const params = await searchParams;
  const requestedReturn = typeof params.retorno === "string" ? params.retorno : "/inicio";
  const returnTo = requestedReturn.startsWith("/") && !requestedReturn.startsWith("//") ? requestedReturn : "/inicio";

  return (
    <AuthCard eyebrow="Acesso protegido" title="Bem-vinda de volta" description="Entre para acompanhar vendas, estoque, caixa e clientes." footer={<span>Primeira configuração? <Link className="font-semibold text-brand-deep hover:underline" href="/primeiro-acesso">Criar acesso</Link></span>}>
      <SignInForm returnTo={returnTo} />
    </AuthCard>
  );
}
