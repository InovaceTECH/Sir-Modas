import { afterEach, describe, expect, it, vi } from "vitest";

import { isLocalAuthBypassEnabled } from "./local-bypass";

describe("isLocalAuthBypassEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
  ])("allows the bypass with the local server URL %s", (authUrl) => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_BYPASS_LOCAL", "true");
    vi.stubEnv("BETTER_AUTH_URL", authUrl);

    expect(isLocalAuthBypassEnabled()).toBe(true);
  });

  it("never allows the bypass in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_BYPASS_LOCAL", "true");
    vi.stubEnv("BETTER_AUTH_URL", "http://127.0.0.1:3000");

    expect(isLocalAuthBypassEnabled()).toBe(false);
  });

  it("rejects a non-local server configuration", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_BYPASS_LOCAL", "true");
    vi.stubEnv("BETTER_AUTH_URL", "https://sir-modas.vercel.app");

    expect(isLocalAuthBypassEnabled()).toBe(false);
  });
});
