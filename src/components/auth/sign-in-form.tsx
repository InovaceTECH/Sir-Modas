"use client";

import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";

export function SignInForm({ returnTo }: Readonly<{ returnTo: string }>) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    const formData = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      rememberMe: true,
    });

    if (result.error) {
      setError("E-mail ou senha inválidos. Confira os dados e tente novamente.");
      setPending(false);
      return;
    }

    router.replace(returnTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-foreground">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="ui-input mt-2" placeholder="voce@exemplo.com" />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold text-foreground">Senha</label>
        <div className="relative mt-2">
          <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required minLength={10} className="ui-input pr-12" placeholder="Sua senha" />
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
            {showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
          </button>
        </div>
      </div>
      {error ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <button disabled={pending} className="ui-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" size={19} /> : <LogIn aria-hidden="true" size={19} />}
        {pending ? "Entrando..." : "Entrar no sistema"}
      </button>
    </form>
  );
}
