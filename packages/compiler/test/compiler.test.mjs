import test from "node:test";
import assert from "node:assert/strict";
import { compile } from "../dist/index.js";

test("lowers methods and inserts an implicit return for a final expression", () => {
  const result = compile([
    "@use akita",
    'hot take "tipo explicito"',
    "class Greeter",
    "  attr_accessor :name as string",
    "  def initialize(name: string)",
    "    @name = name",
    "  end",
    "  def label(): string",
    '    "ola " + @name',
    "  end",
    "end",
  ].join("\n"));

  assert.equal(result.ok, true);
  assert.match(result.code, /constructor\(name\)\s*\{\s*this\.name = name;/);
  assert.match(result.code, /label\(\)\s*\{\s*return "ola " \+ this\.name;/);
  assert.doesNotMatch(result.code, /constructor\(name\)\s*\{\s*return/);
});

test("inserts implicit returns into the final if branches", () => {
  const result = compile([
    'hot take "ramos"',
    "class Choice",
    "  def label(ready: boolean): string",
    "    if ready",
    '      "sim"',
    "    else",
    '      "nao"',
    "    end",
    "  end",
    "end",
  ].join("\n"));
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.match(result.code, /if \(ready\) \{\s*return "sim";/);
  assert.match(result.code, /else \{\s*return "nao";/);
});

test("does not rewrite text in regular expressions or templates", () => {
  const source = [
    'hot take "lexico"',
    "const regex = /nil|and/;",
    "const template = `nil # end`;",
  ].join("\n");
  const result = compile(source);

  assert.equal(result.ok, true);
  assert.match(result.code, /\/nil\|and\//);
  assert.match(result.code, /`nil # end`/);
});

test("single-file source maps retain the original Bolhes source", () => {
  const source = '@use bolha\nhot take "mapped"\nconst answer = 42;\n';
  const result = compile(source, { filename: "answer.bolhes", sourceMap: true });

  assert.equal(result.ok, true);
  const map = JSON.parse(result.map);
  assert.deepEqual(map.sourcesContent, [source]);
  assert.match(result.code, /sourceMappingURL=answer\.js\.map/);
});

test("reports an unmatched end as a stable diagnostic", () => {
  const result = compile('hot take "syntax"\nend');

  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "BOLHES_UNEXPECTED_END"));
});

test("resolves aliases before reporting pragma conflicts", () => {
  const result = compile([
    "@use akitando",
    "@use vibe",
    'hot take "conflito"',
    "const value: string = \"ok\";",
  ].join("\n"));

  assert.equal(result.ok, false);
  assert.deepEqual(result.pragmas, ["akita", "vibe"]);
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "BOLHES_TRETA_CONFLICT"));
});

test("the Akita rules reject any and preserve the canonical requirement code", () => {
  const result = compile([
    "@use akita",
    'hot take "sem tipo"',
    "const value: any = 1;",
  ].join("\n"));

  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "BOLHES_AKITA_REQUIREMENT_FAILED"));
});

test("the pt-br syntax profile enables se/senao without reserving identifier names", () => {
  const source = [
    'hot take "perfil"',
    "const se = true;",
    "const ready = true;",
    'let result = "";',
    "se ready",
    '  result = "ok"',
    "senao",
    '  result = "nao"',
    "end",
  ].join("\n");
  const result = compile(source, { syntaxProfiles: ["pt-br"] });

  assert.equal(result.ok, true);
  assert.match(result.code, /if \(ready\)/);
  assert.match(result.code, /const se = true/);
});

test("native ts regions preserve base-language syntax without Bolhes rewrites", () => {
  const result = compile(`hot take "native syntax"\nnative ts {\n  const identity = <T>(value: T) => value\n  const label = nil\n}\n`, { target: "ts" });
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  assert.match(result.code, /const identity = <T>\(value: T\) => value/);
  assert.match(result.code, /const label = nil/);
  const inline = compile('hot take "inline native"\nnative ts { const value = nil }', { target: "ts" });
  assert.equal(inline.ok, true, JSON.stringify(inline.diagnostics));
  assert.match(inline.code, /const value = nil/);
  assert.doesNotMatch(inline.code, /native ts/);
});

test("reports an unclosed native region", () => {
  const result = compile("native ts {\n  const value = 1\n");
  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "BOLHES_UNCLOSED_NATIVE_REGION"));
});
