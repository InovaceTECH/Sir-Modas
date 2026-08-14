import { afterEach, describe, expect, it, vi } from "vitest";

import { isLocalAuthBypassEnabled } from "./local-bypass";

describe("isLocalAuthBypassEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("allows the bypass on localhost during development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_BYPASS_LOCAL", "true");

    expect(isLocalAuthBypassEnabled("localhost:3000")).toBe(true);
    expect(isLocalAuthBypassEnabled("127.0.0.1:3000")).toBe(true);
  });

  it("never allows the bypass in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_BYPASS_LOCAL", "true");

    expect(isLocalAuthBypassEnabled("localhost:3000")).toBe(false);
  });

  it("rejects non-local hosts", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_BYPASS_LOCAL", "true");

    expect(isLocalAuthBypassEnabled("sir-modas.vercel.app")).toBe(false);
  });
});
