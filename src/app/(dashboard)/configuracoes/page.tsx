import { Building2, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StoreSettingsForm } from "@/features/settings/components/store-settings-form";
import { getStoreByOwner } from "@/features/settings/queries/get-store-by-owner";
import { requireSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const session = await requireSession();
  const store = await getStoreByOwner(session.user.id);

  return (
    <>
      <PageHeader title="Configurações" description="Dados e regras gerais aplicadas à operação da loja." />
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section className="ui-card p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-border/80 pb-5">
            <span className="grid size-11 place-items-center rounded-lg bg-brand-subtle text-brand-deep"><Building2 aria-hidden="true" size={21} /></span>
            <div><h2 className="font-semibold">Dados da Sir Modas</h2><p className="text-sm text-muted">Essas informações serão usadas em toda a operação.</p></div>
          </div>
          <StoreSettingsForm initialValues={{ name: store?.name ?? "Sir Modas Store", phone: store?.phone ?? "", address: store?.address ?? "", exchangeDeadlineDays: store?.exchangeDeadlineDays ?? 30 }} />
        </section>
        <aside className="h-fit rounded-2xl border border-[#149e6133] bg-[#149e6114] p-5">
          <ShieldCheck className="text-success" aria-hidden="true" size={24} />
          <h2 className="mt-4 font-semibold text-emerald-950">Acesso protegido</h2>
          <p className="mt-2 text-sm leading-6 text-emerald-900/75">A sessão é validada no servidor e os dados da loja ficam vinculados à proprietária autenticada.</p>
          <p className="mt-4 break-all text-xs text-emerald-900/60">{session.user.email}</p>
        </aside>
      </div>
    </>
  );
}
