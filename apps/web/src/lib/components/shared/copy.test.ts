import { describe, expect, it } from "vitest";
import { COPIED_MS, copyValue, shortId, type CopyDeps } from "./copy";

function harness(writeText: CopyDeps["writeText"]) {
  const log: string[] = [];
  const timers: { fn: () => void; ms: number }[] = [];
  const deps: CopyDeps = {
    writeText,
    setCopied: (copied) => log.push(`copied:${copied}`),
    success: (message) => log.push(`success:${message}`),
    error: (message) => log.push(`error:${message}`),
    schedule: (fn, ms) => timers.push({ fn, ms }),
  };
  return { deps, log, timers };
}

describe("shortId", () => {
  it("shows the first eight characters", () => {
    expect(shortId("0f8fad5b-d9cb-469f-a165-70867728950e")).toBe("0f8fad5b");
    expect(shortId("abc")).toBe("abc");
  });
});

describe("copyValue", () => {
  it("copies the whole value, shows the tick and a toast, and clears the tick later", async () => {
    const written: string[] = [];
    const { deps, log, timers } = harness(async (text) => {
      written.push(text);
    });

    await expect(copyValue("0f8fad5b-d9cb-469f-a165-70867728950e", deps)).resolves.toBe(true);

    expect(written).toEqual(["0f8fad5b-d9cb-469f-a165-70867728950e"]);
    expect(log).toEqual(["copied:true", "success:Copied!"]);
    expect(timers).toHaveLength(1);
    expect(timers[0].ms).toBe(COPIED_MS);
    expect(COPIED_MS).toBe(2000);

    timers[0].fn();
    expect(log).toEqual(["copied:true", "success:Copied!", "copied:false"]);
  });

  it("reports a refused clipboard instead of showing the tick", async () => {
    const { deps, log, timers } = harness(() => Promise.reject(new Error("denied")));

    await expect(copyValue("x", deps)).resolves.toBe(false);

    expect(log).toEqual(["error:Could not copy to the clipboard"]);
    expect(timers).toHaveLength(0);
  });

  it("reports a missing clipboard (an insecure origin) the same way", async () => {
    const { deps, log, timers } = harness(undefined);

    await expect(copyValue("x", deps)).resolves.toBe(false);

    expect(log).toEqual(["error:Could not copy to the clipboard"]);
    expect(timers).toHaveLength(0);
  });
});
