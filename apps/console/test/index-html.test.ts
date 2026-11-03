// The built `index.html` under the server's CSP, `script-src 'self'`: the
// browser refuses inline scripts and inline event handlers, so a page that
// had either would load blank. SvelteKit writes its bootstrap inline; the
// build's last step (`scripts/extract-inline-scripts.mjs`) moves it out.
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { distPath, md5, precacheManifest, readDist } from "./build-output";

/** Every `<script ...>` opening tag in the page. */
const scriptTags = (html: string) => [...html.matchAll(/<script\b[^>]*>/gi)].map((m) => m[0]);

/** The value of `name` in an HTML tag, if it has one. */
function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}

/** The files the page loads from the console (scripts, preloads, styles), relative to `dist/`. */
function loadedFiles(html: string): string[] {
  const urls = [
    ...scriptTags(html).map((tag) => attr(tag, "src")),
    ...[...html.matchAll(/<link\b[^>]*>/gi)]
      .map((m) => m[0])
      .filter((tag) => /^(modulepreload|stylesheet)$/.test(attr(tag, "rel") ?? ""))
      .map((tag) => attr(tag, "href")),
  ];
  return urls.map((url) => {
    expect(url, "a script or link without a URL").toBeDefined();
    expect(url!.startsWith("/console/"), url).toBe(true);
    return url!.slice("/console/".length);
  });
}

describe("the built index.html", () => {
  it("exists (run `pnpm build` first)", () => {
    expect(existsSync(distPath("index.html"))).toBe(true);
  });

  it("has no inline script: every <script> has a src", () => {
    const html = readDist("index.html");
    const tags = scriptTags(html);
    expect(tags.length, "Kit's bootstrap should be loaded by a script").toBeGreaterThan(0);
    for (const tag of tags) {
      expect(attr(tag, "src"), tag).toBeTruthy();
    }
    // A `<script src>` with a body would run the src and ignore the body.
    expect(html).not.toMatch(/<script\b[^>]*>(?!\s*<\/script>)/i);
  });

  it("has no inline event handler attributes", () => {
    expect(readDist("index.html")).not.toMatch(/<[^>]+\son[a-z]+\s*=/i);
  });

  it("boots Kit from an external script that is part of the build", () => {
    const html = readDist("index.html");
    const boot = scriptTags(html)
      .map((tag) => attr(tag, "src")!)
      .find((src) => src.startsWith("/console/_app/boot."));
    expect(boot, "the extracted bootstrap").toBeDefined();
    const source = readDist(boot!.slice("/console/".length));
    expect(source).toContain("kit.start(");
    expect(source).toContain('base: "/console"');
  });

  it("loads only files that exist in the build", () => {
    for (const file of loadedFiles(readDist("index.html"))) {
      expect(existsSync(distPath(file)), file).toBe(true);
    }
  });
});

describe("the service worker's precache matches the final index.html", () => {
  it("gives index.html the revision of its final content", () => {
    const manifest = precacheManifest(readDist("sw.js"));
    const index = manifest.filter((e) => e.url === "index.html");
    expect(index).toHaveLength(1);
    expect(index[0].revision).toBe(md5(readDist("index.html")));
  });

  it("precaches every file index.html loads", () => {
    const urls = new Set(precacheManifest(readDist("sw.js")).map((e) => e.url));
    for (const file of loadedFiles(readDist("index.html"))) {
      expect(urls.has(file), file).toBe(true);
    }
  });
});
