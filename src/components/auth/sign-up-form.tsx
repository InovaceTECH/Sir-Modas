"use client";

import { LoaderCircle, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password"));
    const confirmation = String(formData.get("passwordConfirmation"));

    if (password !== confirmation) {
      setError("A confirmação de senha não corresponde.");
      setPending(false);
      return;
    }

    const result = await authClient.signUp.email({
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password,
    });

    if (result.error) {
      setError(result.error.message ?? "Não foi possível criar o acesso.");
      setPending(false);
      return;
    }

    router.replace("/configuracoes");
    router.refresh();
  }

  const inputClassName = "ui-input mt-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="text-sm font-semibold text-foreground">Nome</label>
        <input id="name" name="name" autoComplete="name" required minLength={2} className={inputClassName} placeholder="Nome da proprietária" />
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-foreground">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClassName} placeholder="voce@exemplo.com" />
      </div>
      <div>
        <label htmlFor="new-password" className="text-sm font-semibold text-foreground">Senha</label>
        <input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={10} className={inputClassName} placeholder="Mínimo de 10 caracteres" />
      </div>
      <div>
        <label htmlFor="password-confirmation" className="text-sm font-semibold text-foreground">Confirmar senha</label>
        <input id="password-confirmation" name="passwordConfirmation" type="password" autoComplete="new-password" required minLength={10} className={inputClassName} />
      </div>
      {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <button disabled={pending} className="ui-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" size={19} /> : <UserPlus aria-hidden="true" size={19} />}
        {pending ? "Criando acesso..." : "Criar primeiro acesso"}
      </button>
    </form>
  );
}
