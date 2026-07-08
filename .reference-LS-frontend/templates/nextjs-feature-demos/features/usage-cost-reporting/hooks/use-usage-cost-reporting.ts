"use client";

import { useMemo, useState } from "react";
import { piSessionUsageStats, providerUsageStats } from "../fixtures";
import type { SortDirection, SortField, UsageSource } from "../types";

export function useUsageCostReporting() {
  const [source, setSource] = useState<UsageSource>("provider");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("success");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const stats = source === "pi-sessions" ? piSessionUsageStats : providerUsageStats;

  const sortedModels = useMemo(() => {
    const rows = [...stats.by_model];
    rows.sort((a, b) => {
      const values: Record<SortField, [number | string, number | string]> = {
        model: [a.model.toLowerCase(), b.model.toLowerCase()],
        requests: [a.requests, b.requests],
        tokens: [a.total_tokens, b.total_tokens],
        success: [a.success_rate, b.success_rate],
        latency: [a.avg_latency_ms ?? -1, b.avg_latency_ms ?? -1],
        ttft: [a.avg_ttft_ms ?? -1, b.avg_ttft_ms ?? -1],
        speed: [a.tokens_per_sec ?? -1, b.tokens_per_sec ?? -1],
      };
      const [av, bv] = values[sortField];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDirection === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDirection === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return rows;
  }, [sortDirection, sortField, stats.by_model]);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  function toggleRow(model: string) {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(model)) next.delete(model);
      else next.add(model);
      return next;
    });
  }

  return { expandedRows, handleSort, setSource, sortDirection, sortField, sortedModels, source, stats, toggleRow };
}
