"use client";

import { KeyRound, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { resetOwnerPassword, type PasswordRecoveryState } from "@/features/auth/actions/password-recovery";

const initialState: PasswordRecoveryState = { status: "idle" };

export function PasswordRecoveryForm() {
  const [state, action, pending] = useActionState(resetOwnerPassword, initialState);
  if (state.status === "success") return <div className="space-y-5"><p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{state.message}</p><Link href="/entrar" className="ui-button-primary w-full">Ir para entrar</Link></div>;
  return <form action={action} className="space-y-5">
    <label className="block"><span className="text-sm font-semibold text-foreground">Código de recuperação</span><input name="recoveryCode" type="password" required minLength={16} autoComplete="off" className="ui-input mt-2" /></label>
    <label className="block"><span className="text-sm font-semibold text-foreground">Nova senha</span><input name="password" type="password" required minLength={10} autoComplete="new-password" className="ui-input mt-2" /></label>
    <label className="block"><span className="text-sm font-semibold text-foreground">Confirmar nova senha</span><input name="confirmation" type="password" required minLength={10} autoComplete="new-password" className="ui-input mt-2" /></label>
    {state.message ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p> : null}
    <button disabled={pending} className="ui-button-primary w-full disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={19} /> : <KeyRound size={19} />}{pending ? "Redefinindo..." : "Redefinir senha"}</button>
  </form>;
}
