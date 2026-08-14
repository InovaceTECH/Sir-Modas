import "server-only";

import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { APIError } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";

import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { getAuthEnv } from "@/lib/env";

const env = getAuthEnv();
const db = getDb();

export const auth = betterAuth({
  appName: "Sir Modas",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: !env.allowSignUp,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: async () => {
          const [existingUser] = await db
            .select({ id: schema.user.id })
            .from(schema.user)
            .limit(1);

          if (existingUser) {
            throw new APIError("FORBIDDEN", {
              message: "A proprietária já foi cadastrada.",
            });
          }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  telemetry: {
    enabled: false,
  },
  trustedOrigins: [env.BETTER_AUTH_URL],
});

export type AuthSession = typeof auth.$Infer.Session;
