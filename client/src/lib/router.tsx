import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type RouterContextValue = {
  pathname: string;
  search: string;
  navigate: (to: string, options?: { replace?: boolean }) => void;
};

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

function normalizePath(to: string) {
  return to.startsWith("/") ? to : `/${to}`;
}

function currentLocation() {
  if (typeof window === "undefined") {
    return { pathname: "/", search: "" };
  }
  return { pathname: window.location.pathname, search: window.location.search };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(currentLocation);

  useEffect(() => {
    const sync = () => setLocation(currentLocation());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const value = useMemo<RouterContextValue>(
    () => ({
      pathname: location.pathname,
      search: location.search,
      navigate: (to, options) => {
        const next = normalizePath(to);
        if (options?.replace) window.history.replaceState({}, "", next);
        else window.history.pushState({}, "", next);
        setLocation(currentLocation());
      },
    }),
    [location.pathname, location.search],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouterContext() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("RouterProvider is missing");
  return ctx;
}

export function useLocation() {
  const { pathname, search } = useRouterContext();
  return { pathname, search };
}

export function useNavigate() {
  return useRouterContext().navigate;
}

export function useParams(pattern: string) {
  const { pathname } = useRouterContext();
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = pathname.split("/").filter(Boolean);
  const params: Record<string, string> = {};
  if (patternSegments.length !== pathSegments.length) return params;
  for (let i = 0; i < patternSegments.length; i += 1) {
    const patternSegment = patternSegments[i];
    const pathSegment = pathSegments[i];
    if (patternSegment.startsWith(":")) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment);
    } else if (patternSegment !== pathSegment) {
      return {};
    }
  }
  return params;
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  replace?: boolean;
};

export function Link({ to, replace, onClick, ...rest }: LinkProps) {
  const navigate = useNavigate();

  return (
    <a
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.altKey ||
          event.ctrlKey ||
          event.shiftKey
        ) {
          return;
        }
        event.preventDefault();
        navigate(to, { replace });
      }}
      {...rest}
    />
  );
}
