import test from "node:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { compile } from "@bolhes/compiler";

test("browser worker returns the same result as the public compiler API", async () => {
  const assets = join(import.meta.dirname, "../dist/assets");
  const workerFile = (await readdir(assets)).find((name) => /^worker-.*\.js$/.test(name));
  assert.ok(workerFile, "web build must emit a dedicated worker bundle");
  const registered = new Map();
  let response;
  globalThis.self = {
    addEventListener(name, listener) { registered.set(name, listener); },
    postMessage(value) { response = value; },
  };
  try {
    await import(`${pathToFileURL(join(assets, workerFile)).href}?test=${Date.now()}`);
    const source = '@use bolha\nhot take "parity"\nexport const answer = 42\n';
    registered.get("message")({ data: { id: 7, source } });
    assert.equal(response.id, 7);
    assert.deepEqual(response.result, compile(source, { filename: "playground.bolhes" }));
  } finally {
    delete globalThis.self;
  }
});
