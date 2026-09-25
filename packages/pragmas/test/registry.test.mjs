import test from "node:test";
import assert from "node:assert/strict";
import { registry, resolvePragma } from "../dist/index.js";

test("registry has the planned set and resolves canonical names case-insensitively", () => {
  assert.equal(registry.pragmas.length, 30);
  assert.equal(resolvePragma("AKITA")?.id, "akita");
  assert.equal(resolvePragma("@Bona")?.id, "guara");
  assert.equal(resolvePragma("not-a-pragma"), undefined);
});

test("conflicts are canonical, unique unordered pairs with valid endpoints", () => {
  const ids = new Set(registry.pragmas.map((pragma) => pragma.id));
  const pairs = new Set();
  for (const [left, right] of registry.conflicts) {
    assert.ok(ids.has(left));
    assert.ok(ids.has(right));
    const key = [left, right].sort().join("+");
    assert.ok(!pairs.has(key));
    pairs.add(key);
  }
});
