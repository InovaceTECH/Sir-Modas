"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function ConfirmSubmitButton({ confirmation, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { confirmation: string; children: ReactNode }) {
  return <button type="submit" {...props} onClick={(event) => { if (!window.confirm(confirmation)) event.preventDefault(); }}>{children}</button>;
}
