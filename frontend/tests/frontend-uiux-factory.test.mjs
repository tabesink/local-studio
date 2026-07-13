import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const repoRoot = join(root, "..");
const docsFrontend = join(repoRoot, "docs/frontend");

function readRepo(relativePath) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return walk(path);
    return [path];
  });
}

function toPosix(filePath) {
  return relative(docsFrontend, filePath).split("\\").join("/");
}

const REQUIRED_FILES = [
  "docs/frontend/README.md",
  "docs/frontend/AGENTS.md",
  "docs/frontend/theme.md",
  "docs/frontend/_templates/feature-README.template.md",
  "docs/frontend/shared/README.md",
  "docs/frontend/shared/accordion-storage-kit.md",
  "docs/frontend/app-shell/README.md",
  "docs/frontend/chat/README.md",
  "docs/frontend/documents/README.md",
  "docs/frontend/graph/README.md",
  "docs/frontend/settings/README.md",
  "docs/frontend/user-preferences/README.md",
  "docs/frontend/settings/knowledge-graphs/README.md",
  "docs/frontend/settings/knowledge-graphs/anatomy.md",
  "docs/frontend/settings/knowledge-graphs/components.md",
  "docs/frontend/settings/knowledge-graphs/behavior.md",
  "docs/frontend/settings/knowledge-graphs/do-dont.md",
];

const STUBS = [
  {
    file: "docs/frontend/app-shell/README.md",
    featurePath: "frontend/src/features/navigation-sidebar/",
  },
  {
    file: "docs/frontend/chat/README.md",
    featurePath: "frontend/src/features/chat-shell/",
  },
  {
    file: "docs/frontend/documents/README.md",
    featurePath: "frontend/src/features/documents/",
  },
  {
    file: "docs/frontend/graph/README.md",
    featurePath: "frontend/src/features/graph/",
  },
  {
    file: "docs/frontend/settings/README.md",
    featurePath: "frontend/src/features/settings-panel/",
  },
  {
    file: "docs/frontend/user-preferences/README.md",
    featurePath: "frontend/src/features/user-preferences/",
  },
];

const FORBIDDEN_MARKERS = [
  "client/src",
  "Analysis Dashboard",
  "plot-typography",
  "preference-kit",
];

describe("frontend UIUX factory docs", () => {
  it("requires foundation, shared kit, stubs, and KG complete pack files", () => {
    for (const relativePath of REQUIRED_FILES) {
      assert.equal(
        existsSync(join(repoRoot, relativePath)),
        true,
        `missing required factory file: ${relativePath}`,
      );
    }
  });

  it("forbids foreign Analysis Dashboard markers under docs/frontend", () => {
    assert.equal(existsSync(docsFrontend), true, "docs/frontend must exist");
    const offenders = [];
    for (const file of walk(docsFrontend)) {
      if (!/\.(md|mdx)$/i.test(file)) continue;
      const body = readFileSync(file, "utf8");
      for (const marker of FORBIDDEN_MARKERS) {
        if (body.includes(marker)) {
          offenders.push(`${toPosix(file)} contains "${marker}"`);
        }
      }
    }
    assert.deepEqual(offenders, [], offenders.join("\n"));
  });

  it("documents Controllers accordion/storage as not exported yet with environment-controls cite", () => {
    const kit = readRepo("docs/frontend/shared/accordion-storage-kit.md");
    assert.match(kit, /not exported yet/i);
    assert.match(kit, /not in kit yet/i);
    assert.match(kit, /environment-controls/);
    assert.match(kit, /storageSummary|storage summary/i);

    const sharedIndex = readRepo("docs/frontend/shared/README.md");
    assert.match(sharedIndex, /not exported yet|Not exported yet|not in kit yet/i);
    assert.match(sharedIndex, /accordion-storage-kit/);
  });

  it("KG pack teaches target grammar with drift callouts and safe storageSummary guidance", () => {
    const readme = readRepo("docs/frontend/settings/knowledge-graphs/README.md");
    assert.match(readme, /[Dd]rift/);
    assert.match(readme, /target grammar/i);
    assert.match(readme, /2026-07-11-002/);
    assert.match(readme, /2026-07-10-006/);
    assert.match(readme, /2026-07-11-003/);
    // Canon must not steer agents to freeze live hand-rolls / SettingsPanel as the pattern.
    assert.match(readme, /do not freeze hand-rolls|Do not treat current hand-rolled|prefer.*target/i);

    const behavior = readRepo("docs/frontend/settings/knowledge-graphs/behavior.md");
    assert.match(behavior, /storageSummary/);
    assert.match(behavior, /expand/i);

    const doDont = readRepo("docs/frontend/settings/knowledge-graphs/do-dont.md");
    assert.match(doDont, /not exported yet/i);
    assert.match(doDont, /hand-rolled|drift/i);
    assert.match(doDont, /[Dd]on'?t:[\s\S]*hand-rolled|Copying hand-rolled|copy.*hand-rolled/i);

    const components = readRepo("docs/frontend/settings/knowledge-graphs/components.md");
    assert.equal(
      /ControllersStyleAccordionRow|<\s*Accordion[\w.]*/.test(components),
      false,
      "KG components must not invent Accordion* / ControllersStyle* JSX APIs",
    );
  });

  it("stubs declare Status Stub and point at existing frontend/src/features paths", () => {
    for (const stub of STUBS) {
      const body = readRepo(stub.file);
      assert.match(body, /\*\*Status:\*\*\s*Stub/);
      assert.match(body, new RegExp(stub.featurePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.equal(
        existsSync(join(repoRoot, stub.featurePath)),
        true,
        `stub pointer missing on disk: ${stub.featurePath}`,
      );
    }
  });

  it("AGENTS and theme point at DESIGN.md and @/components/ui", () => {
    const agents = readRepo("docs/frontend/AGENTS.md");
    assert.match(agents, /DESIGN\.md/);
    assert.match(agents, /@\/components\/ui/);
    assert.match(agents, /environment-controls/);
    assert.match(agents, /Local Studio/);

    const theme = readRepo("docs/frontend/theme.md");
    assert.match(theme, /DESIGN\.md/);
    assert.match(theme, /--ui-\*/);
    assert.match(theme, /Context Engine|Local Studio/);
  });
});
