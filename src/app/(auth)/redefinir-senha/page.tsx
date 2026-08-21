import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export const dynamic = "force-dynamic";

export default function PasswordRecoveryPage() {
  return <AuthCard eyebrow="Recuperar acesso" title="Redefinir senha" description="Informe o código de recuperação definido pela proprietária e escolha uma nova senha." footer={<Link className="font-semibold text-brand-deep hover:underline" href="/entrar">Voltar para entrar</Link>}><PasswordRecoveryForm /></AuthCard>;
}
