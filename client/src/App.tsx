import { AuthProvider } from "@/lib/auth-context";
import { RouterProvider, useLocation } from "@/lib/router";
import { Toaster } from "@/components/ui/sonner";
import { HomePage } from "@/routes/index";
import { LoginPage } from "@/routes/login";
import { RegisterPage } from "@/routes/register";
import { LibraryPage } from "@/routes/library";
import { PdfPage } from "@/routes/pdf.$id";
import { RequireAuth } from "@/components/RequireAuth";

function AppRoutes() {
  const { pathname } = useLocation();

  if (pathname === "/") return <HomePage />;
  if (pathname === "/login") return <LoginPage />;
  if (pathname === "/register") return <RegisterPage />;
  if (pathname === "/library") {
    return (
      <RequireAuth>
        <LibraryPage />
      </RequireAuth>
    );
  }
  if (pathname.startsWith("/pdf/")) {
    return (
      <RequireAuth>
        <PdfPage />
      </RequireAuth>
    );
  }
  return <NotFoundPage />;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </RouterProvider>
  );
}
