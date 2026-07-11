/**
 * Library citation deep-link query params (API-001 / KTD-2).
 *
 * /documents?domainId=&sourceId=&page=&conversationId=&turnId=
 * Back to chat → /chat?conversationId=&turnId=
 */
export type LibraryDeepLink = {
  domainId: string | null;
  sourceId: string | null;
  /** 1-based PDF page when present and valid; otherwise null (open at start). */
  page: number | null;
  conversationId: string | null;
  turnId: string | null;
};

function nonEmpty(value: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Parse a positive integer page; invalid or missing → null. */
export function parsePageParam(raw: string | null): number | null {
  const value = nonEmpty(raw);
  if (value == null) return null;
  if (!/^\d+$/.test(value)) return null;
  const page = Number.parseInt(value, 10);
  if (!Number.isFinite(page) || page < 1) return null;
  return page;
}

export function parseLibraryDeepLink(
  searchParams: URLSearchParams | { get(name: string): string | null },
): LibraryDeepLink {
  return {
    domainId: nonEmpty(searchParams.get("domainId")),
    sourceId: nonEmpty(searchParams.get("sourceId")),
    page: parsePageParam(searchParams.get("page")),
    conversationId: nonEmpty(searchParams.get("conversationId")),
    turnId: nonEmpty(searchParams.get("turnId")),
  };
}

export function hasChatReturn(link: Pick<LibraryDeepLink, "conversationId" | "turnId">): boolean {
  return Boolean(link.conversationId && link.turnId);
}

export function buildChatReturnHref(conversationId: string, turnId: string): string {
  const params = new URLSearchParams({
    conversationId,
    turnId,
  });
  return `/chat?${params.toString()}`;
}

/** After successful evidence→source resolve: Library deep-link with return state. */
export function buildLibraryDeepLinkHref(input: {
  domainId: string;
  sourceId: string;
  page?: number | null;
  conversationId: string;
  turnId: string;
}): string {
  const params = new URLSearchParams({
    domainId: input.domainId,
    sourceId: input.sourceId,
    conversationId: input.conversationId,
    turnId: input.turnId,
  });
  if (input.page != null && input.page >= 1) {
    params.set("page", String(input.page));
  }
  return `/documents?${params.toString()}`;
}

/** Initial pdf.js page: deep-link page when set, otherwise 1 (document start). */
export function resolvePdfInitialPage(page: number | null | undefined): number {
  return page != null && page >= 1 ? page : 1;
}
