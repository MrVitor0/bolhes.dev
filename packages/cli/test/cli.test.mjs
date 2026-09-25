import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "../../..");
const cli = resolve(root, "packages/cli/dist/index.js");
const fixture = resolve(root, "examples/localhost-nao-paga.bolhes");

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: "utf8" });
}

test("personas lists the canonical registry", () => {
  const result = run(["personas"]);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim().split(/\r?\n/).length, 30);
  assert.match(result.stdout, /^guara\tbona, guaracloud/m);
});

test("official examples compile and the invalid requirement stays rejected", () => {
  const valid = ["localhost-nao-paga", "ruby-python", "canon", "product", "default"]
    .map((name) => resolve(root, `examples/${name}.bolhes`));
  assert.equal(run(["check", ...valid]).status, 0);
  const invalid = run(["check", resolve(root, "examples/invalid-requirement.bolhes")]);
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /BOLHES_AKITA_REQUIREMENT_FAILED/);
});

test("check validates a fixture without writing build artifacts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bolhes-check-"));
  try {
    const result = run(["check", fixture]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(await readdir(directory), []);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("human diagnostics include source line and column", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bolhes-diagnostic-"));
  try {
    const input = join(directory, "broken.bolhes");
    await writeFile(input, 'hot take "broken"\nend\n', "utf8");
    const result = run(["check", input]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /broken\.bolhes:2:1: BOLHES_UNEXPECTED_END/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("build stages module and social sidecars", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bolhes-build-"));
  try {
    const result = run(["build", fixture, "--out-dir", directory]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual((await readdir(directory)).sort(), ["localhost-nao-paga.js", "localhost-nao-paga.quote.txt", "localhost-nao-paga.social.json"]);
    assert.match(await readFile(join(directory, "localhost-nao-paga.js"), "utf8"), /function deploy/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("a failed input prevents every output in a multi-file build", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bolhes-failed-build-"));
  try {
    const invalid = join(directory, "invalid.bolhes");
    await writeFile(invalid, 'hot take "broken"\nend\n', "utf8");
    const output = join(directory, "out");
    const result = run(["build", fixture, invalid, "--out-dir", output]);
    assert.equal(result.status, 1);
    await assert.rejects(readdir(output));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("output collisions and invalid options fail before writing", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bolhes-collision-"));
  try {
    const first = join(directory, "a", "same.bolhes");
    const second = join(directory, "b", "same.bolhes");
    await mkdir(join(directory, "a"), { recursive: true });
    await mkdir(join(directory, "b"), { recursive: true });
    await writeFile(first, 'hot take "one"\nconst value = 1;\n', "utf8");
    await writeFile(second, 'hot take "two"\nconst value = 2;\n', "utf8");
    const output = join(directory, "out");
    const collision = run(["build", first, second, "--out-dir", output]);
    assert.equal(collision.status, 1);
    assert.match(collision.stderr, /BOLHES_OUTPUT_COLLISION/);
    assert.equal(run(["build", fixture, "--target", "wasm"]).status, 1);
    await assert.rejects(readdir(output));
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("project check performs cross-file type checking and build rewrites .bolhes imports", async () => {
  const output = await mkdtemp(join(tmpdir(), "bolhes-project-build-"));
  const config = resolve(root, "examples/project/tsconfig.json");
  try {
    const check = run(["check", "--project", config]);
    assert.equal(check.status, 0, check.stderr);
    const build = run(["build", "--project", config, "--out-dir", output]);
    assert.equal(build.status, 0, build.stderr);
    assert.match(await readFile(join(output, "main.js"), "utf8"), /from "\.\/value\.js"/);
    assert.match(await readFile(join(output, "main.js"), "utf8"), /import\("\.\/value\.js"\)/);
    assert.match(await readFile(join(output, "main.js"), "utf8"), /getValueThroughBarrel/);
    assert.match(await readFile(join(output, "value.js"), "utf8"), /getValue/);
    assert.match(await readFile(join(output, "value.d.ts"), "utf8"), /getValue/);
    assert.match(await readFile(join(output, "value.social.json"), "utf8"), /"pragmas": \[\s*"bolha"/);
    const map = JSON.parse(await readFile(join(output, "value.js.map"), "utf8"));
    assert.equal(map.file, "value.js");
    assert.match(map.sources[0], /value\.bolhes$/);
    assert.match(map.sourcesContent[0], /@use bolha/);
  } finally { await rm(output, { recursive: true, force: true }); }
});

test("project check reports a type error across a Bolhes module boundary", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bolhes-project-type-error-"));
  const sourceDir = join(directory, "src");
  try {
    await mkdir(sourceDir, { recursive: true });
    await writeFile(join(directory, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", strict: true, rootDir: "src" }, include: ["src/**/*"] }), "utf8");
    await writeFile(join(sourceDir, "main.ts"), 'import { getValue } from "./value.bolhes";\nconst text: string = getValue();\n', "utf8");
    await writeFile(join(sourceDir, "value.bolhes"), '@use bolha\nhot take "typed module"\nexport function getValue(): number { return 42; }\n', "utf8");
    const result = run(["check", "--project", join(directory, "tsconfig.json"), "--format", "json"]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /2322/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
