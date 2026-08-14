import { AppShell } from "@/components/layout/app-shell";
import { getStoreByOwner } from "@/features/settings/queries/get-store-by-owner";
import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const session = await requireSession();
  const store = await getStoreByOwner(session.user.id);

  return (
    <AppShell
      storeName={store?.name ?? "Configuração inicial"}
      user={{ name: session.user.name, email: session.user.email }}
    >
      {children}
    </AppShell>
  );
}
