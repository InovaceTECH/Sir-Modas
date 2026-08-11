import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
  });

  if (!parsed.success) {
    throw new Error(
      "Configuração inválida: defina DATABASE_URL conforme o arquivo .env.example.",
    );
  }

  return parsed.data;
}
