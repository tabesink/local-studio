/* Knowledge Domain wrappers shared by chat, documents, graph, settings, logs. */

import { ceFetch } from "@/lib/api/client";

export type MemberDomain = {
  id: string;
  displayName: string;
  available: boolean;
};

export type AdminDomain = {
  id: string;
  displayName: string;
  state: string;
  embeddingProfileId: string;
  available: boolean;
  /** Present on current admin DTO; older proxies may omit it. */
  storageSummary?: DomainStorageSummary;
  createdAt: string;
  updatedAt: string;
};

export type DomainStorageComponent = {
  kind: "source_storage" | "graph_index" | "database_metadata";
  label: string;
  bytes: number;
  percent: number;
};

export type DomainStorageSummary = {
  limitBytes: number;
  totalBytes: number;
  totalPercent: number;
  warning: "ok" | "near_limit" | "exceeded";
  components: DomainStorageComponent[];
  calculatedAt: string;
};

export type DomainOperation = {
  id: string;
  operationType: string;
  status: string;
  message: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export async function listMemberDomains(): Promise<MemberDomain[]> {
  const body = await ceFetch<{ domains: MemberDomain[] }>("/domains");
  return body.domains;
}

export async function listAdminDomains(): Promise<AdminDomain[]> {
  const body = await ceFetch<{ domains: AdminDomain[] }>("/admin/domains");
  return body.domains;
}

export async function createDomain(input: {
  id: string;
  displayName: string;
  embeddingProfileId: string;
}): Promise<AdminDomain> {
  const body = await ceFetch<{ domain: AdminDomain }>("/admin/domains", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return body.domain;
}

export async function startDomain(domainId: string): Promise<AdminDomain> {
  const body = await ceFetch<{ domain: AdminDomain }>(`/admin/domains/${domainId}/start`, { method: "POST" });
  return body.domain;
}

export async function stopDomain(domainId: string): Promise<AdminDomain> {
  const body = await ceFetch<{ domain: AdminDomain }>(`/admin/domains/${domainId}/stop`, { method: "POST" });
  return body.domain;
}

export async function deleteDomain(domainId: string): Promise<DomainOperation> {
  const body = await ceFetch<{ operation: DomainOperation }>(`/admin/domains/${domainId}`, { method: "DELETE" });
  return body.operation;
}
