const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function hasLoopbackAuthUrl(value: string | undefined) {
  if (!value) return false;

  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return loopbackHosts.has(hostname);
  } catch {
    return false;
  }
}

export function isLocalAuthBypassEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.AUTH_BYPASS_LOCAL === "true" &&
    hasLoopbackAuthUrl(process.env.BETTER_AUTH_URL)
  );
}
