"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { stores } from "@/db/schema";
import { requireSession } from "@/lib/auth/session";

import { storeSettingsSchema } from "../schemas/store-settings";

export type StoreSettingsState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<"name" | "phone" | "address" | "exchangeDeadlineDays", string[]>>;
};

export async function saveStoreSettings(
  _previousState: StoreSettingsState,
  formData: FormData,
): Promise<StoreSettingsState> {
  const session = await requireSession();
  const parsed = storeSettingsSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    exchangeDeadlineDays: formData.get("exchangeDeadlineDays"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const values = parsed.data;

  await getDb()
    .insert(stores)
    .values({
      ownerAuthId: session.user.id,
      ...values,
    })
    .onConflictDoUpdate({
      target: stores.ownerAuthId,
      set: {
        ...values,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Configurações salvas com sucesso.",
  };
}
