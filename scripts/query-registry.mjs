#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { DUAL_FLAVOR_SLUGS } from "../lib/dual-flavor-slugs.mjs";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const REGISTRY_PATH = join(ROOT, "registry.json");
const PUBLIC_R = join(ROOT, "public", "r");
const BASE_URL = "https://www.fluidfunctionalism.com/r";
const dualSource = new Set(DUAL_FLAVOR_SLUGS);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const registry = readJson(REGISTRY_PATH);
const items = registry.items;
const byName = new Map(items.map((item) => [item.name, item]));

function usage(exitCode = 0) {
  const stream = exitCode === 0 ? process.stdout : process.stderr;
  stream.write(`Fluid Functionalism registry query

Usage:
  node scripts/query-registry.mjs --list [--all] [--json]
  node scripts/query-registry.mjs --search <terms> [--all] [--json]
  node scripts/query-registry.mjs <name> [--flavor radix|base] [--json]

Examples:
  node scripts/query-registry.mjs --search "chat attachment queue"
  node scripts/query-registry.mjs input-message --flavor base
  node scripts/query-registry.mjs select --flavor radix --json
`);
  process.exitCode = exitCode;
}

function parseArgs(argv) {
  const options = {
    all: false,
    flavor: "radix",
    json: false,
    list: false,
    name: null,
    search: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      usage(0);
      return null;
    }
    if (arg === "--all") {
      options.all = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--list") {
      options.list = true;
      continue;
    }
    if (arg === "--flavor") {
      const flavor = argv[++i];
      if (flavor !== "radix" && flavor !== "base") {
        throw new Error("--flavor must be radix or base");
      }
      options.flavor = flavor;
      continue;
    }
    if (arg === "--search") {
      const search = argv[++i];
      if (!search) throw new Error("--search requires terms");
      options.search = search;
      continue;
    }
    if (arg.startsWith("-")) throw new Error(`unknown option: ${arg}`);
    if (options.name) throw new Error("provide only one component or registry item name");
    options.name = arg.replace(/-base$/, "");
  }

  const modes = Number(options.list) + Number(Boolean(options.search)) + Number(Boolean(options.name));
  if (modes !== 1) throw new Error("choose exactly one of --list, --search, or <name>");
  return options;
}

function relativePath(path) {
  return relative(ROOT, path).replaceAll("\\", "/");
}

function payloadsFor(name) {
  const candidates = {
    flat: join(PUBLIC_R, `${name}.json`),
    radix: join(PUBLIC_R, "radix", `${name}.json`),
    base: join(PUBLIC_R, "base", `${name}.json`),
  };
  return Object.fromEntries(
    Object.entries(candidates)
      .filter(([, path]) => existsSync(path))
      .map(([flavor, path]) => [flavor, relativePath(path)])
  );
}

function docsPath(name) {
  const direct = join(ROOT, "app", "docs", name, "page.tsx");
  if (existsSync(direct)) return relativePath(direct);
  if (name === "scroll-area") {
    const scrollbars = join(ROOT, "app", "docs", "scrollbars", "page.tsx");
    if (existsSync(scrollbars)) return relativePath(scrollbars);
  }
  return null;
}

function itemKind(item) {
  if (item.type !== "registry:ui") return item.type.replace("registry:", "");
  const payloads = payloadsFor(item.name);
  if (dualSource.has(item.name)) return "dual-source-ui";
  if (payloads.base && payloads.radix) return "single-source-flavored-payload-ui";
  return "single-source-ui";
}

function chosenPayload(name, flavor) {
  const payloads = payloadsFor(name);
  if (flavor === "base" && payloads.base) return payloads.base;
  if (flavor === "radix" && payloads.flat) return payloads.flat;
  return payloads.flat ?? payloads[flavor] ?? null;
}

function sourceItemFor(name, flavor) {
  if (flavor === "base" && byName.has(`${name}-base`)) return byName.get(`${name}-base`);
  return byName.get(name);
}

function describe(item, flavor) {
  const name = item.name.replace(/-base$/, "");
  const sourceItem = sourceItemFor(name, flavor) ?? item;
  const payloads = payloadsFor(name);
  const payloadPath = chosenPayload(name, flavor);
  const payload = payloadPath ? readJson(join(ROOT, payloadPath)) : null;
  const urlPath = payloadPath?.replace(/^public\/r\//, "");

  return {
    name,
    title: item.title ?? name,
    type: item.type,
    kind: itemKind(byName.get(name) ?? item),
    description: item.description ?? "",
    requestedFlavor: flavor,
    selectedPayload: payloadPath,
    installUrl: urlPath ? `${BASE_URL}/${urlPath}` : null,
    installCommand: urlPath
      ? `npx shadcn@latest add ${BASE_URL}/${urlPath}`
      : null,
    availablePayloads: payloads,
    docs: docsPath(name),
    sourceFiles: (sourceItem.files ?? []).map((file) => ({
      path: file.path,
      target: file.target ?? null,
      type: file.type,
    })),
    dependencies: payload?.dependencies ?? sourceItem.dependencies ?? [],
    registryDependencies: payload?.registryDependencies ?? sourceItem.registryDependencies ?? [],
  };
}

function candidates(includeAll) {
  return items.filter((item) => {
    if (item.name.endsWith("-base")) return false;
    return includeAll || item.type === "registry:ui";
  });
}

function searchItems(terms, includeAll) {
  const words = terms.toLowerCase().split(/\s+/).filter(Boolean);
  return candidates(includeAll)
    .map((item) => {
      const haystack = [item.name, item.title, item.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const score = words.reduce(
        (matches, word) => matches + Number(haystack.includes(word)),
        0
      );
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .map(({ item }) => item);
}

function summary(item) {
  const data = describe(item, "radix");
  return {
    name: data.name,
    kind: data.kind,
    docs: data.docs,
    payloads: Object.keys(data.availablePayloads),
    description: data.description,
  };
}

function printSummary(rows) {
  for (const row of rows) {
    const docs = row.docs ? "docs" : "support";
    process.stdout.write(
      `${row.name.padEnd(22)} ${row.kind.padEnd(36)} ${docs.padEnd(8)} ${row.description}\n`
    );
  }
}

function printDetail(data) {
  process.stdout.write(`${data.name} — ${data.title}\n`);
  process.stdout.write(`${data.description}\n\n`);
  process.stdout.write(`Type: ${data.type}\n`);
  process.stdout.write(`Kind: ${data.kind}\n`);
  process.stdout.write(`Flavor: ${data.requestedFlavor}\n`);
  process.stdout.write(`Docs: ${data.docs ?? "none"}\n`);
  process.stdout.write(`Payload: ${data.selectedPayload ?? "none"}\n`);
  process.stdout.write(`Install: ${data.installCommand ?? "not installable"}\n`);
  process.stdout.write(`Available payloads: ${Object.keys(data.availablePayloads).join(", ") || "none"}\n`);
  process.stdout.write("Source files:\n");
  for (const file of data.sourceFiles) {
    process.stdout.write(`  - ${file.path}${file.target ? ` -> ${file.target}` : ""}\n`);
  }
  process.stdout.write(`NPM dependencies: ${data.dependencies.join(", ") || "none"}\n`);
  process.stdout.write(
    `Registry dependencies: ${data.registryDependencies.join(", ") || "none"}\n`
  );
}

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  process.stderr.write(`Error: ${error.message}\n\n`);
  usage(2);
}

if (options) {
  if (options.list) {
    const rows = candidates(options.all).map(summary).sort((a, b) => a.name.localeCompare(b.name));
    if (options.json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    else printSummary(rows);
  } else if (options.search) {
    const matches = searchItems(options.search, options.all);
    const rows = matches.map(summary);
    if (rows.length === 0) {
      process.stderr.write(`No registry items matched: ${options.search}\n`);
      process.exitCode = 2;
    } else if (options.json) {
      process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
    } else {
      printSummary(rows);
    }
  } else {
    const item = byName.get(options.name);
    if (!item) {
      const matches = searchItems(options.name, options.all);
      if (matches.length === 0) {
        process.stderr.write(`Unknown registry item: ${options.name}\n`);
        process.exitCode = 2;
      } else {
        const rows = matches.map(summary);
        if (options.json) process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
        else printSummary(rows);
      }
    } else {
      const data = describe(item, options.flavor);
      if (options.flavor === "base" && !data.availablePayloads.base) {
        process.stderr.write(
          `Note: ${data.name} has no Base-specific payload; using the flat primitive-agnostic payload.\n`
        );
      }
      if (options.json) process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
      else printDetail(data);
    }
  }
}
