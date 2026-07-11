"use client";

import { Fragment, type ReactNode } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { AppPage, cx, Stat, Table, TBody, TCell, TH, THead, TRow, Tabs } from "../../../_shared/ui";
import { usageSources } from "../constants";
import { useUsageCostReporting } from "../hooks/use-usage-cost-reporting";
import type { ModelUsageRow, SortDirection, SortField, UsageSource } from "../types";

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);
const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const formatMs = (value: number | null) => (value === null ? "—" : `${Math.round(value)}ms`);

const modelColors = [
  "var(--color-usage-chart-1)",
  "var(--color-usage-chart-2)",
  "var(--color-usage-chart-3)",
  "var(--color-usage-chart-4)",
  "var(--color-usage-chart-5)",
  "var(--color-usage-chart-6)",
];

/* Usage / cost reporting — mirrors features/usage/usage-page.tsx: source pill
   tabs, uppercase USAGE header with large mono token total, six-column stat
   strip, daily usage chart, sortable model performance table, and details. */
export function UsageCostReportingDemo() {
  const usage = useUsageCostReporting();
  const totals = usage.stats.totals;

  return (
    <AppPage>
      <div className="mx-auto w-full max-w-[86rem] px-4 py-4 pb-8 sm:px-6 sm:py-6 2xl:px-10">
        {/* Source tabs */}
        <div className="mb-3 flex flex-wrap items-center gap-1 border-b border-(--border)/35 pb-2">
          <span className="mr-1 font-mono text-[length:var(--fs-xs)] uppercase tracking-[0.16em] text-(--dim)">
            source
          </span>
          <Tabs
            variant="pill"
            items={usageSources.map((source) => ({ id: source.id, label: source.label }))}
            activeTab={usage.source}
            onSelectTab={(tab) => usage.setSource(tab as UsageSource)}
            className="[&_button]:h-7 [&_button]:px-2 [&_button]:py-0 [&_button]:text-[length:var(--fs-sm)]"
          />
        </div>

        {/* Header */}
        <section className="px-2 pt-2 pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[length:var(--fs-sm)] tracking-[0.04em]">
                <span className="font-medium uppercase tracking-[0.14em] text-(--dim)">Usage</span>
                <span className="font-mono text-[length:var(--fs-xs)] tabular-nums text-(--dim)/70">
                  {usage.source === "provider" ? "controller" : "pi sessions"}
                </span>
              </div>
              <h1 className="mt-1.5 truncate text-[length:var(--fs-3xl)] font-semibold leading-tight tracking-[-0.01em] text-(--fg)">
                {formatNumber(totals.total_tokens)} tokens
              </h1>
              <div className="mt-1 font-mono text-[length:var(--fs-sm)] text-(--dim)">
                {formatNumber(totals.total_requests)} requests ·{" "}
                {formatNumber(totals.unique_sessions)} sessions ·{" "}
                {formatNumber(totals.unique_users)} users
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-(--surface) px-3 text-[length:var(--fs-md)] text-(--dim) transition-colors hover:bg-(--surface-2) hover:text-(--fg)"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          {/* Six-column stat strip */}
          <dl className="mt-5 grid w-full grid-cols-2 border-b border-(--border)/40 pb-5 sm:grid-cols-3 lg:grid-cols-6">
            <HeaderStat label="prompt" value={formatNumber(totals.prompt_tokens)} detail="input tokens" />
            <HeaderStat
              label="completion"
              value={formatNumber(totals.completion_tokens)}
              detail="output tokens"
            />
            <HeaderStat label="success" value={`${totals.success_rate.toFixed(1)}%`} detail="chat turns" />
            <HeaderStat
              label="24h req"
              value={formatNumber(usage.stats.recent_activity.last_24h_requests)}
              detail={`${formatNumber(usage.stats.recent_activity.last_hour_requests)} last hour`}
            />
            <HeaderStat
              label="avg tokens"
              value={formatNumber(usage.stats.tokens_per_request.avg)}
              detail={`${formatNumber(usage.stats.tokens_per_request.avg_prompt)} in · ${formatNumber(usage.stats.tokens_per_request.avg_completion)} out`}
            />
            <HeaderStat
              label="cache"
              value={`${usage.stats.cache.hit_rate.toFixed(1)}%`}
              detail={`${formatNumber(usage.stats.cache.hits)} hits · ${formatNumber(usage.stats.cache.misses)} misses`}
            />
          </dl>
        </section>

        <DailyUsageChart usage={usage} />

        <ModelPerformanceTable usage={usage} />

        <div className="grid gap-x-6 lg:grid-cols-2">
          <PerformanceDetails usage={usage} />
          <SecondaryMetrics usage={usage} />
        </div>
      </div>
    </AppPage>
  );
}

type UsageHook = ReturnType<typeof useUsageCostReporting>;

function DailyUsageChart({ usage }: { usage: UsageHook }) {
  const daily = usage.stats.daily;
  const maxTokens = Math.max(...daily.map((day) => day.total_tokens), 1);
  const totalTokens = daily.reduce((sum, day) => sum + day.total_tokens, 0);
  const totalRequests = daily.reduce((sum, day) => sum + day.requests, 0);
  const avgDaily = Math.round(totalTokens / (daily.length || 1));

  return (
    <section className="px-2 pt-2 pb-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="font-mono text-[length:var(--fs-2xs)] font-medium uppercase tracking-[0.18em] text-(--dim)/75">
          Daily usage
        </div>
        <div className="flex items-center gap-3 font-mono text-[length:var(--fs-xs)] text-(--dim)">
          <span>{daily.length} days</span>
          <span className="text-(--border)">·</span>
          <span>
            <span className="tabular-nums text-(--fg)">{formatNumber(avgDaily)}</span> avg/day
          </span>
        </div>
      </div>

      {/* Stacked prompt/completion bars, mono date + request captions. */}
      <div className="flex h-44 items-end gap-1 overflow-x-auto border-b border-(--border)/40 pb-3 sm:h-52 sm:gap-1.5">
        {daily.map((day) => {
          const promptHeight = (day.prompt_tokens / maxTokens) * 100;
          const completionHeight = (day.completion_tokens / maxTokens) * 100;
          return (
            <div key={day.date} className="group flex min-w-[24px] flex-1 flex-col items-center gap-1.5">
              <div className="relative w-full" style={{ height: "140px" }}>
                <div
                  className="absolute left-0 w-full bg-(--hl2)/60"
                  style={{
                    height: `${completionHeight}%`,
                    bottom: `${promptHeight}%`,
                    minHeight: completionHeight > 0.5 ? "2px" : "0",
                  }}
                  title={`Completion: ${formatNumber(day.completion_tokens)} tokens`}
                />
                <div
                  className="absolute left-0 w-full bg-(--fg)/20"
                  style={{
                    height: `${promptHeight}%`,
                    bottom: "0%",
                    minHeight: promptHeight > 0.5 ? "2px" : "0",
                  }}
                  title={`Prompt: ${formatNumber(day.prompt_tokens)} tokens`}
                />
              </div>
              <div className="w-full truncate text-center font-mono text-[length:var(--fs-xs)] text-(--dim)">
                {formatDate(day.date)}
              </div>
              <div className="font-mono text-[length:var(--fs-2xs)] tabular-nums text-(--dim)/60">
                {day.requests} req
              </div>
            </div>
          );
        })}
      </div>

      <dl className="mt-4 grid grid-cols-3 border-b border-(--border)/40 pb-4">
        <Stat label="total tokens" value={formatNumber(totalTokens)} />
        <Stat label="total requests" value={formatNumber(totalRequests)} />
        <Stat label="peak day" value={formatNumber(maxTokens)} />
      </dl>
    </section>
  );
}

function ModelPerformanceTable({ usage }: { usage: UsageHook }) {
  return (
    <section className="px-2 pt-2 pb-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-[length:var(--fs-2xs)] font-medium uppercase tracking-[0.18em] text-(--dim)/75">
          Model performance
        </div>
        <div className="font-mono text-[length:var(--fs-xs)] text-(--dim)">
          <span className="tabular-nums text-(--fg)">{usage.sortedModels.length}</span> models
        </div>
      </div>

      <Table bordered={false} className="border-b border-(--border)/40" tableClassName="text-[length:var(--fs-md)]">
        <THead className="bg-transparent">
          <TRow className="border-b border-(--border)/40 hover:bg-transparent">
            <TH className="w-6 px-2 py-2" />
            <SortHeader usage={usage} field="model">
              Model
            </SortHeader>
            <SortHeader usage={usage} field="requests" align="right">
              Requests
            </SortHeader>
            <SortHeader usage={usage} field="tokens" align="right">
              Tokens
            </SortHeader>
            <SortHeader usage={usage} field="success" align="right">
              Success
            </SortHeader>
            <SortHeader usage={usage} field="latency" align="right">
              Latency
            </SortHeader>
            <SortHeader usage={usage} field="ttft" align="right">
              TTFT
            </SortHeader>
            <SortHeader usage={usage} field="speed" align="right">
              Speed
            </SortHeader>
          </TRow>
        </THead>
        <TBody className="divide-y-0">
          {usage.sortedModels.map((model, index) => (
            <ModelRow
              key={model.model}
              model={model}
              color={modelColors[index % modelColors.length]}
              expanded={usage.expandedRows.has(model.model)}
              onToggle={() => usage.toggleRow(model.model)}
            />
          ))}
        </TBody>
      </Table>
    </section>
  );
}

function ModelRow({
  model,
  color,
  expanded,
  onToggle,
}: {
  model: ModelUsageRow;
  color: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Fragment>
      <TRow
        className={cx(
          "cursor-pointer border-b border-(--border)/25 transition-colors hover:bg-(--hover)",
          expanded ? "bg-(--hover)" : "",
        )}
        onClick={onToggle}
      >
        <TCell className="px-2 py-2">
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-(--dim)" />
          ) : (
            <ChevronUp className="h-3 w-3 rotate-[-90deg] text-(--dim)" />
          )}
        </TCell>
        <TCell className="px-2 py-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-1 shrink-0" style={{ backgroundColor: color }} />
            <div
              className="max-w-[150px] truncate font-mono text-[length:var(--fs-sm)] text-(--fg) sm:max-w-[240px]"
              title={model.model}
            >
              {model.model.split("/").pop()}
            </div>
          </div>
        </TCell>
        <TCell align="right" className="px-2 py-2 font-mono tabular-nums text-(--dim)">
          {formatNumber(model.requests)}
        </TCell>
        <TCell align="right" className="px-2 py-2 font-mono tabular-nums text-(--dim)">
          {formatNumber(model.total_tokens)}
        </TCell>
        <TCell align="right" className="px-2 py-2">
          <MetricTone value={model.success_rate} type="success" />
        </TCell>
        <TCell align="right" className="px-2 py-2">
          <MetricTone value={model.avg_latency_ms} type="latency" />
        </TCell>
        <TCell align="right" className="px-2 py-2 font-mono tabular-nums text-(--dim)">
          {formatMs(model.avg_ttft_ms)}
        </TCell>
        <TCell align="right" className="px-2 py-2 font-mono">
          {model.tokens_per_sec === null ? (
            <span className="text-(--dim)">—</span>
          ) : (
            <span className="tabular-nums text-(--fg)">{model.tokens_per_sec.toFixed(0)} t/s</span>
          )}
        </TCell>
      </TRow>
      {expanded ? (
        <TRow className="border-b border-(--border)/25 hover:bg-transparent">
          <TCell colSpan={8} className="px-2 py-3">
            <dl className="grid grid-cols-2 border-y border-(--border)/40 py-3 sm:grid-cols-4">
              <ExpandedCell label="prompt tokens" value={formatNumber(model.prompt_tokens)} />
              <ExpandedCell label="completion tokens" value={formatNumber(model.completion_tokens)} />
              <ExpandedCell label="avg tokens/req" value={formatNumber(model.avg_tokens)} />
              <ExpandedCell label="p50 latency" value={formatMs(model.p50_latency_ms)} />
              {model.peak_generation_tps ? (
                <ExpandedCell label="peak generation" value={`${model.peak_generation_tps.toFixed(1)} t/s`} />
              ) : null}
            </dl>
          </TCell>
        </TRow>
      ) : null}
    </Fragment>
  );
}

function PerformanceDetails({ usage }: { usage: UsageHook }) {
  const perf = usage.stats.performance;
  return (
    <section className="px-2 pt-2 pb-5">
      <div className="mb-3 font-mono text-[length:var(--fs-2xs)] font-medium uppercase tracking-[0.18em] text-(--dim)/75">
        Performance details
      </div>
      <dl className="space-y-1.5 border-t border-(--border)/40 pt-3">
        <DetailRow label="avg latency" value={formatMs(perf.avg_latency_ms)} />
        <DetailRow label="p50 latency" value={formatMs(perf.p50_latency_ms)} />
        <DetailRow label="p95 latency" value={formatMs(perf.p95_latency_ms)} />
        <DetailRow label="avg ttft" value={formatMs(perf.avg_ttft_ms)} />
        <DetailRow label="avg generation" value={`${perf.avg_generation_tps.toFixed(1)} t/s`} />
      </dl>
    </section>
  );
}

function SecondaryMetrics({ usage }: { usage: UsageHook }) {
  const secondary = usage.stats.secondary;
  return (
    <section className="px-2 pt-2 pb-5">
      <div className="mb-3 font-mono text-[length:var(--fs-2xs)] font-medium uppercase tracking-[0.18em] text-(--dim)/75">
        Secondary metrics
      </div>
      <dl className="space-y-1.5 border-t border-(--border)/40 pt-3">
        <DetailRow label="top session" value={`${formatNumber(secondary.top_session_tokens)} tokens`} />
        <DetailRow label="avg session" value={`${formatNumber(secondary.avg_session_tokens)} tokens`} />
        <DetailRow label="error rate" value={`${secondary.error_rate.toFixed(1)}%`} />
        <DetailRow label="longest streak" value={`${secondary.longest_streak_days} days`} />
      </dl>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 font-mono text-[length:var(--fs-sm)]">
      <dt className="uppercase tracking-[0.12em] text-(--dim)">{label}</dt>
      <dd className="tabular-nums text-(--fg)">{value}</dd>
    </div>
  );
}

function SortHeader({
  usage,
  field,
  children,
  align = "left",
}: {
  usage: UsageHook;
  field: SortField;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const isActive = usage.sortField === field;
  const direction: SortDirection = usage.sortDirection;
  return (
    <TH
      align={align}
      className={cx(
        "cursor-pointer select-none px-3 py-2 font-mono text-[length:var(--fs-xs)] font-normal uppercase tracking-[0.14em] text-(--dim) transition-colors hover:text-(--fg)",
        align === "right" ? "text-right" : "text-left",
      )}
      onClick={() => usage.handleSort(field)}
    >
      <div className={cx("flex items-center gap-1", align === "right" ? "justify-end" : "")}>
        {children}
        {isActive ? <span>{direction === "asc" ? "↑" : "↓"}</span> : null}
      </div>
    </TH>
  );
}

function MetricTone({ value, type }: { value: number | null; type: "success" | "latency" }) {
  if (value === null) {
    return (
      <span className="font-mono text-[length:var(--fs-md)] tabular-nums text-(--dim)">
        {type === "success" ? "0.0%" : "0ms"}
      </span>
    );
  }
  const toneClass =
    type === "success"
      ? value >= 95
        ? "text-(--hl2)"
        : value >= 90
          ? "text-(--hl3)"
          : "text-(--err)"
      : value < 500
        ? "text-(--hl2)"
        : value < 1500
          ? "text-(--hl3)"
          : "text-(--err)";
  return (
    <span className={cx("font-mono text-[length:var(--fs-md)] tabular-nums", toneClass)}>
      {type === "success" ? `${value.toFixed(1)}%` : formatMs(value)}
    </span>
  );
}

function ExpandedCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-r border-(--border)/40 pr-2 pl-3 first:pl-0 last:border-r-0 sm:pr-4 sm:pl-5">
      <dt className="truncate font-mono text-[length:var(--fs-2xs)] font-medium uppercase tracking-[0.18em] text-(--dim)/75">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-[length:var(--fs-base)] leading-none tabular-nums text-(--fg)">
        {value}
      </dd>
    </div>
  );
}

function HeaderStat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="min-w-0 overflow-hidden border-r border-(--border)/40 pr-2 pl-3 first:pl-0 last:border-r-0 sm:pr-4 sm:pl-5">
      <dt className="truncate font-mono text-[length:var(--fs-2xs)] font-medium uppercase tracking-[0.18em] text-(--dim)/75">
        {label}
      </dt>
      <dd className="mt-1 min-w-0 font-mono text-[length:var(--fs-2xl)] leading-none tabular-nums text-(--fg)">
        {value}
      </dd>
      {detail ? (
        <dd className="mt-1 truncate font-mono text-[length:var(--fs-xs)] text-(--dim)">{detail}</dd>
      ) : null}
    </div>
  );
}
