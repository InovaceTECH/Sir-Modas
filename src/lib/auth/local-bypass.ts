const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeHostname(hostname: string | undefined) {
  if (!hostname) return "";

  const value = hostname.trim().toLowerCase();

  if (value.startsWith("[")) {
    return value.slice(1, value.indexOf("]"));
  }

  return value.split(":")[0];
}

export function isLocalAuthBypassEnabled(hostname: string | undefined) {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.AUTH_BYPASS_LOCAL === "true" &&
    loopbackHosts.has(normalizeHostname(hostname))
  );
}
