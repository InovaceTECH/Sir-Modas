"use server";

import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { user, verification } from "@/db/schema";
import { getPasswordRecoveryCode } from "@/lib/env";
import { auth } from "@/lib/auth/server";

export type PasswordRecoveryState = { status: "idle" | "success" | "error"; message?: string };

const recoverySchema = z.object({
  recoveryCode: z.string().min(16, "Informe o código de recuperação."),
  password: z.string().min(10, "A senha deve ter pelo menos 10 caracteres.").max(128),
  confirmation: z.string(),
});

function codesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function resetOwnerPassword(_state: PasswordRecoveryState, formData: FormData): Promise<PasswordRecoveryState> {
  const parsed = recoverySchema.safeParse({ recoveryCode: formData.get("recoveryCode"), password: formData.get("password"), confirmation: formData.get("confirmation") });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Revise os dados." };
  if (parsed.data.password !== parsed.data.confirmation) return { status: "error", message: "A confirmação da senha não corresponde." };

  const configuredCode = getPasswordRecoveryCode();
  if (!configuredCode || !codesMatch(configuredCode, parsed.data.recoveryCode)) {
    return { status: "error", message: "Código de recuperação inválido." };
  }

  const [owner] = await getDb().select({ id: user.id }).from(user).where(eq(user.email, "sirmodas@gmail.com")).limit(1);
  if (!owner) return { status: "error", message: "A conta da proprietária ainda não foi configurada." };

  const token = randomBytes(32).toString("base64url");
  await getDb().insert(verification).values({ id: randomUUID(), identifier: `reset-password:${token}`, value: owner.id, expiresAt: new Date(Date.now() + 5 * 60 * 1000) });
  await auth.api.resetPassword({ body: { newPassword: parsed.data.password, token } });

  return { status: "success", message: "Senha redefinida. Entre com a nova senha." };
}
