"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_STORAGE_KEY,
} from "../constants";
import { activeSessions, navItems, projectRows } from "../fixtures";

function clampSidebarWidth(width: number): number {
  if (!Number.isFinite(width)) return SIDEBAR_DEFAULT_WIDTH;
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));
}

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname === "/discover";
  if (href === "/settings") return pathname.startsWith("/settings") || pathname.startsWith("/configs");
  return pathname.startsWith(href);
}

interface StoredPrefs {
  expanded: boolean;
  width: number;
}

function readStoredPrefs(): StoredPrefs {
  if (typeof window === "undefined") return { expanded: true, width: SIDEBAR_DEFAULT_WIDTH };
  try {
    const raw = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (!raw) return { expanded: true, width: SIDEBAR_DEFAULT_WIDTH };
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    return {
      expanded: parsed.expanded !== false,
      width: clampSidebarWidth(parsed.width ?? SIDEBAR_DEFAULT_WIDTH),
    };
  } catch {
    return { expanded: true, width: SIDEBAR_DEFAULT_WIDTH };
  }
}

export function useNavigationSidebar(initialPath = "/") {
  const [activePath, setActivePath] = useState(initialPath);
  const [expanded, setExpandedState] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [width, setWidthState] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const resizeCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const prefs = readStoredPrefs();
    setExpandedState(prefs.expanded);
    setWidthState(prefs.width);
    setHydrated(true);
  }, []);

  const persist = useCallback((prefs: StoredPrefs) => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // storage errors are ignored with local fallback, matching the reference
    }
  }, []);

  const setExpanded = useCallback(
    (next: boolean) => {
      setExpandedState(next);
      persist({ expanded: next, width });
    },
    [persist, width],
  );

  const setWidth = useCallback(
    (next: number) => {
      const clamped = clampSidebarWidth(next);
      setWidthState(clamped);
      persist({ expanded, width: clamped });
    },
    [persist, expanded],
  );

  /* Cmd/Ctrl+K toggles session search; Escape closes drawer/search. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
        return;
      }
      if (event.key === "Escape") {
        setMobileOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => () => resizeCleanupRef.current?.(), []);

  const startResize = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!expanded) return;
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      setResizing(true);

      const onMouseMove = (moveEvent: MouseEvent) => {
        setWidth(startWidth + moveEvent.clientX - startX);
      };
      const cleanup = () => {
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", cleanup);
        resizeCleanupRef.current = null;
        setResizing(false);
      };

      resizeCleanupRef.current?.();
      resizeCleanupRef.current = cleanup;
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", cleanup);
    },
    [expanded, width, setWidth],
  );

  const items = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        active: isRouteActive(activePath, item.href),
      })),
    [activePath],
  );

  return {
    activePath,
    activeSessions,
    expanded,
    hydrated,
    items,
    mobileOpen,
    projects: projectRows,
    resizing,
    searchOpen,
    width,
    activatePath: setActivePath,
    isRouteActive,
    setExpanded,
    setMobileOpen,
    setSearchOpen,
    setWidth,
    startResize,
  };
}
