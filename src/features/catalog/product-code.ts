import { randomUUID } from "node:crypto";

export function generateProductCode() {
  return `PRD-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}
