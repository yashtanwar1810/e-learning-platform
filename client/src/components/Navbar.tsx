import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Brain, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { location } = useRouterState();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground shadow-glow transition-transform group-hover:scale-105"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Brain className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Lumen</span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/library">
                <Button variant={location.pathname.startsWith("/library") ? "secondary" : "ghost"} size="sm">
                  My Library
                </Button>
              </Link>
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="hero" size="sm">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}