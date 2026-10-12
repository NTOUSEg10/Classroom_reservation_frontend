import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(
  new URL("../build/200.html", import.meta.url),
  "utf8",
);
const meta = html.match(
  /<meta\s+http-equiv="content-security-policy"\s+content="([^"]+)"\s*\/?\s*>/i,
);
assert(
  meta,
  "The static fallback must contain SvelteKit-generated CSP metadata.",
);
const directives = new Map(
  meta[1].split(";").map((value) => {
    const [name, ...sources] = value.trim().split(/\s+/);
    return [name, sources];
  }),
);
const expected = {
  "default-src": ["'self'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "font-src": ["'self'"],
  "img-src": ["'self'", "data:", "https://*.supabase.co"],
  "connect-src": ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
  "worker-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
};
for (const [name, sources] of Object.entries(expected)) {
  assert.deepEqual(
    directives.get(name),
    sources,
    `${name} must retain its security boundary.`,
  );
}
const scriptSources = directives.get("script-src");
assert(
  scriptSources?.includes("'self'"),
  "Same-origin external application scripts must be allowed.",
);
assert(
  scriptSources.every(
    (source) =>
      source === "'self'" || /^'sha256-[A-Za-z0-9+/]+=*'$/.test(source),
  ),
  "Scripts must be limited to self and exact hashes, without unsafe-inline, unsafe-eval or remote sources.",
);
assert(
  !directives.has("script-src-elem"),
  "A separate script-src-elem must not override bootstrap hashes.",
);
const inlineScripts = [
  ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi),
]
  .filter((match) => !/\bsrc\s*=/.test(match[1]))
  .map((match) => match[2]);
assert(
  inlineScripts.some((script) => script.includes("kit.start(")),
  "The fallback must contain its bootstrap.",
);
assert(
  meta.index < html.indexOf("<script"),
  "The CSP must precede the application bootstrap.",
);
const hash = (script) =>
  `'sha256-${createHash("sha256").update(script).digest("base64")}'`;
for (const script of inlineScripts) {
  assert(
    scriptSources.includes(hash(script)),
    "Every generated inline script must have its exact CSP hash.",
  );
}
assert(
  !scriptSources.includes(hash("window.__unexpectedInlineScript = true;")),
  "An injected inline script must not match the allowed bootstrap hash.",
);
const modules = [...html.matchAll(/import\("([^"\n]+)"\)/g)].map(
  (match) => match[1],
);
assert(
  modules.length > 0,
  "The bootstrap must load its external application modules.",
);
for (const module of modules) {
  assert(
    module.startsWith("/_app/"),
    "Application modules must be same-origin assets.",
  );
  assert(
    existsSync(new URL(`../build${module}`, import.meta.url)),
    "Every bootstrap module must ship in the build.",
  );
}
console.log(
  JSON.stringify({
    fallback: "build/200.html",
    inline_scripts_verified: inlineScripts.length,
    bootstrap_hashes_match: true,
    injected_inline_allowed: false,
    self_modules_allowed: modules.length,
  }),
);
