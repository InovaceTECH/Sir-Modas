import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

const authEnvSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  AUTH_ALLOW_SIGN_UP: z.enum(["true", "false"]).default("false"),
});

export function getDatabaseEnv() {
  const parsed = databaseEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
  });

  if (!parsed.success) {
    throw new Error(
      "Configuração inválida: defina DATABASE_URL conforme o arquivo .env.example.",
    );
  }

  return parsed.data;
}

export function getAuthEnv() {
  const parsed = authEnvSchema.safeParse({
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    AUTH_ALLOW_SIGN_UP: process.env.AUTH_ALLOW_SIGN_UP,
  });

  if (!parsed.success) {
    throw new Error(
      "Configuração de autenticação inválida. Revise BETTER_AUTH_SECRET e BETTER_AUTH_URL.",
    );
  }

  return {
    ...parsed.data,
    allowSignUp: parsed.data.AUTH_ALLOW_SIGN_UP === "true",
  };
}

export function getPasswordRecoveryCode() {
  const code = process.env.AUTH_PASSWORD_RESET_CODE;
  return code && code.length >= 16 ? code : null;
}

export function getSetupStatus() {
  const database = databaseEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
  }).success;
  const auth = authEnvSchema.safeParse({
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    AUTH_ALLOW_SIGN_UP: process.env.AUTH_ALLOW_SIGN_UP,
  }).success;

  return {
    database,
    auth,
    allowSignUp: process.env.AUTH_ALLOW_SIGN_UP === "true",
    ready: database && auth,
  };
}
