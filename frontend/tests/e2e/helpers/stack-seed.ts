import fs from "node:fs";
import path from "node:path";
import { request, type APIRequestContext } from "@playwright/test";
import { loadStackEnv, requireAdminCredentials } from "./env";

export const E2E_DOMAIN_ID = "e2e";
export const E2E_DOMAIN_DISPLAY_NAME = "E2E Pilot";
export const E2E_PROVIDER_CREDENTIAL = "e2e-playwright-credential";
export const E2E_DOMAIN_QUESTION = "What does startup require?";
export const E2E_DIRECT_QUESTION = "Say hello in one short sentence.";

const ARTIFACTS_DIR = path.resolve(__dirname, "../artifacts");
const SEED_PATH = path.join(ARTIFACTS_DIR, "seed.json");
const FIXTURE_PATH = path.resolve(__dirname, "../fixtures/seed-source.md");
const POLL_TIMEOUT_MS = 180_000;
const POLL_INTERVAL_MS = 2_000;

export type SeedInfo = {
  domainId: string;
  displayName: string;
};

type DomainRow = {
  id: string;
  displayName: string;
  available?: boolean;
  state?: string;
};

type SourceRow = {
  id?: string;
  state?: string;
  indexState?: string;
};

export function readSeedInfo(): SeedInfo {
  if (!fs.existsSync(SEED_PATH)) {
    throw new Error(`Missing seed file at ${SEED_PATH}. Did global setup run?`);
  }
  return JSON.parse(fs.readFileSync(SEED_PATH, "utf8")) as SeedInfo;
}

function writeSeedInfo(info: SeedInfo) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  fs.writeFileSync(SEED_PATH, `${JSON.stringify(info, null, 2)}\n`, "utf8");
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function readJson(
  response: Awaited<ReturnType<APIRequestContext["fetch"]>>,
): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`non-JSON body (HTTP ${response.status()})`);
  }
}

async function jsonOrThrow(
  response: Awaited<ReturnType<APIRequestContext["fetch"]>>,
  label: string,
): Promise<unknown> {
  const status = response.status();
  if (status >= 400) {
    throw new Error(`${label} failed: HTTP ${status}`);
  }
  return readJson(response);
}

function isReadySource(source: SourceRow | undefined): boolean {
  return source?.state === "prepared" && source?.indexState === "ready";
}

async function findReadySource(
  api: APIRequestContext,
  domainId: string,
): Promise<SourceRow | null> {
  const body = (await jsonOrThrow(
    await api.get(`/api/v1/admin/domains/${domainId}/sources`),
    "list sources",
  )) as { sources?: SourceRow[] };
  return body.sources?.find((source) => isReadySource(source)) ?? null;
}

async function ensureDomainStarted(api: APIRequestContext, domain: DomainRow | undefined) {
  if (domain?.available) return;

  const started = await api.post(`/api/v1/admin/domains/${E2E_DOMAIN_ID}/start`);
  if (started.ok()) {
    await readJson(started);
    return;
  }
  if (started.status() === 409) {
    // Already ready / conflicting lifecycle — continue if domain is available.
    const domainsBody = (await jsonOrThrow(
      await api.get("/api/v1/admin/domains"),
      "list domains after start conflict",
    )) as { domains?: DomainRow[] };
    const refreshed = domainsBody.domains?.find((row) => row.id === E2E_DOMAIN_ID);
    if (refreshed?.available) return;
  }
  throw new Error(`domain start failed: HTTP ${started.status()}`);
}

async function waitForSourceReady(api: APIRequestContext, sourceId: string) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const get = await api.get(`/api/v1/admin/domains/${E2E_DOMAIN_ID}/sources/${sourceId}`);
    const body = (await jsonOrThrow(get, "source poll")) as { source?: SourceRow };
    if (isReadySource(body.source)) return;
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(
    `source not ready within ${POLL_TIMEOUT_MS / 1000}s (prepared + indexState=ready). Is the stack worker healthy?`,
  );
}

export async function seedIndexedDomain(baseURL: string): Promise<SeedInfo> {
  const env = loadStackEnv();
  const { username, password } = requireAdminCredentials(env);
  const api = await request.newContext({
    baseURL,
    extraHTTPHeaders: { Accept: "application/json" },
  });

  try {
    await jsonOrThrow(
      await api.post("/api/v1/auth/login", { data: { username, password } }),
      "auth login",
    );

    await jsonOrThrow(
      await api.put("/api/v1/admin/runtime-settings/providers/openai", {
        data: { credential: E2E_PROVIDER_CREDENTIAL },
      }),
      "provider credential",
    );

    const domainsBody = (await jsonOrThrow(
      await api.get("/api/v1/admin/domains"),
      "list domains",
    )) as { domains?: DomainRow[] };
    let domain = domainsBody.domains?.find((row) => row.id === E2E_DOMAIN_ID);

    if (!domain) {
      const created = await api.post("/api/v1/admin/domains", {
        data: {
          id: E2E_DOMAIN_ID,
          displayName: E2E_DOMAIN_DISPLAY_NAME,
          embeddingProfileId: "openai-embedding-default",
        },
      });
      if (created.status() !== 201 && created.status() !== 200 && created.status() !== 409) {
        await jsonOrThrow(created, "domain create");
      }
      const refreshed = (await jsonOrThrow(
        await api.get("/api/v1/admin/domains"),
        "list domains after create",
      )) as { domains?: DomainRow[] };
      domain = refreshed.domains?.find((row) => row.id === E2E_DOMAIN_ID);
    }

    await ensureDomainStarted(api, domain);

    const existingReady = await findReadySource(api, E2E_DOMAIN_ID);
    if (!existingReady) {
      const fixtureBytes = fs.readFileSync(FIXTURE_PATH);
      const upload = await api.post(`/api/v1/admin/domains/${E2E_DOMAIN_ID}/sources`, {
        multipart: {
          file: {
            name: "e2e-pilot.md",
            mimeType: "text/markdown",
            buffer: fixtureBytes,
          },
        },
      });
      const uploaded = (await jsonOrThrow(upload, "source upload")) as {
        source?: SourceRow;
      };
      const sourceId = uploaded.source?.id;
      if (!sourceId) {
        throw new Error("source upload: source id missing");
      }
      await waitForSourceReady(api, sourceId);
    }

    const info: SeedInfo = {
      domainId: E2E_DOMAIN_ID,
      displayName: domain?.displayName ?? E2E_DOMAIN_DISPLAY_NAME,
    };
    writeSeedInfo(info);
    return info;
  } finally {
    await api.dispose();
  }
}
