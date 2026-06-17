import { Brain } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/lib/router";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-glow"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Brain className="h-5 w-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">Lumen</span>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-md">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </div>
    </div>
  );
}
