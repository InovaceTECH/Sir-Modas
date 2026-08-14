import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold text-brand-deep">Página não encontrada</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Este caminho não existe</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Volte ao início para continuar acompanhando a loja.</p>
        <Link href="/inicio" className="ui-button-primary mt-6">Voltar ao início</Link>
      </div>
    </main>
  );
}
