import ts from "typescript";
import { registry, resolvePragma } from "@bolhes/pragmas";
import type { Diagnostic, RequirementRule, SocialArtifact } from "@bolhes/shared";

export interface CompileOptions {
  filename?: string;
  target?: "js" | "ts";
  syntax?: "bolhes" | "js" | "ts" | "jsx" | "tsx";
}

export interface CompileResult {
  ok: boolean;
  code?: string;
  target: "js" | "ts";
  pragmas: string[];
  social?: SocialArtifact;
  diagnostics: Diagnostic[];
}

const version = "0.1.0";

function position(source: string, offset: number) {
  const before = source.slice(0, offset);
  const line = before.split(/\r\n|\r|\n/).length;
  return { start: offset, end: offset + 1, line, column: before.length - Math.max(before.lastIndexOf("\n"), before.lastIndexOf("\r")) };
}

export function compile(source: string, options: CompileOptions = {}): CompileResult {
  const target = options.target ?? "js";
  const diagnostics: Diagnostic[] = [];
  const pragmaNames: string[] = [];
  const bodyLines = source.split(/(?<=\n)/);
  let header = true;
  let offset = 0;
  let body = "";

  for (const line of bodyLines) {
    const content = line.replace(/\r?\n$/, "");
    const pragma = header && content.match(/^\s*@use\s+([@\w-]+)\s*$/i);
    if (pragma) {
      const name = pragma[1];
      const resolved = resolvePragma(name);
      if (!resolved) diagnostics.push({ code: "BOLHES_UNKNOWN_PRAGMA", severity: "error", message: `pragma desconhecido: ${name}`, span: position(source, offset) });
      else {
        if (pragmaNames.includes(resolved.id)) diagnostics.push({ code: "BOLHES_DUPLICATE_PRAGMA", severity: "warning", message: `@${resolved.id} jÃ¡ foi declarado`, span: position(source, offset) });
        else pragmaNames.push(resolved.id);
      }
      offset += line.length;
      continue;
    }
    if (content.trim() && !content.trimStart().startsWith("#")) header = false;
    body += line;
    offset += line.length;
  }

  const active = pragmaNames.length ? [...new Set(pragmaNames)] : ["bolha"];
  for (const [left, right] of registry.conflicts) {
    if (active.includes(left) && active.includes(right)) diagnostics.push({
      code: "BOLHES_TRETA_CONFLICT", severity: "error",
      message: `treta incompatível entre @${left} e @${right}`,
      related: [{ message: `pragma @${left}` }, { message: `pragma @${right}` }]
    });
  }

  const takes: Array<{ text: string; quoteTweet: string }> = [];
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, body);
  const tokens: Array<{ kind: ts.SyntaxKind; start: number; end: number; text: string }> = [];
  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) {
    tokens.push({ kind: scanner.getToken(), start: scanner.getTokenPos(), end: scanner.getTextPos(), text: scanner.getTokenText() });
  }
  const removals: Array<{ start: number; end: number }> = [];
  for (let i = 0; i + 2 < tokens.length; i++) {
    const first = tokens[i];
    if (first.kind !== ts.SyntaxKind.Identifier || first.text !== "hot") continue;
    const second = tokens[i + 1];
    const literalToken = tokens[i + 2];
    const lineStart = Math.max(body.lastIndexOf("\n", first.start - 1), body.lastIndexOf("\r", first.start - 1)) + 1;
    const lineEndCandidates = [body.indexOf("\n", literalToken.end), body.indexOf("\r", literalToken.end)].filter((value) => value >= 0);
    const lineEnd = lineEndCandidates.length ? Math.min(...lineEndCandidates) : body.length;
    const line = body.slice(lineStart, lineEnd);
    if (body.slice(lineStart, first.start).trim() || !/^hot\s+take\s+/.test(line) || second.text !== "take" || literalToken.kind !== ts.SyntaxKind.StringLiteral) continue;
    const rest = body.slice(literalToken.end, lineEnd).trim();
    if (rest !== "" && rest !== ";") continue;
    const literal = literalToken.text;
    try {
      const text = literal[0] === '"' ? JSON.parse(literal) as string : literal.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
      if (!text.trim()) diagnostics.push({ code: "BOLHES_TAKE_EMPTY", severity: "error", message: "take não pode ficar vazio", span: position(source, first.start) });
      else {
        const voice = registry.pragmas.find((p) => active.includes(p.id)) ?? registry.pragmas[0];
        takes.push({ text, quoteTweet: voice.quote });
      }
    } catch {
      diagnostics.push({ code: "BOLHES_TAKE_INVALID", severity: "error", message: "texto do take inválido", span: position(source, first.start) });
    }
    removals.push({ start: lineStart, end: lineEnd });
    i += 2;
  }
  for (const removal of removals.reverse()) body = body.slice(0, removal.start) + body.slice(removal.start, removal.end).replace(/[^\r\n]/g, " ") + body.slice(removal.end);

  const sourceFile = ts.createSourceFile(options.filename ?? "module.bolhes", body, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const identifiers = new Set<string>();
  const calls = new Set<string>();
  let hasAny = false;
  let hasType = false;
  let hasAnonymousFunction = false;
  let hasNumber = false;
  let hasUrl = false;
  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node)) identifiers.add(node.text.toLowerCase());
    if (node.kind === ts.SyntaxKind.AnyKeyword) hasAny = true;
    if (ts.isTypeNode(node)) hasType = true;
    if (ts.isArrowFunction(node) || (ts.isFunctionExpression(node) && !node.name)) hasAnonymousFunction = true;
    if (ts.isNumericLiteral(node)) hasNumber = true;
    if (ts.isStringLiteralLike(node) && /^https?:\/\//i.test(node.text)) hasUrl = true;
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isIdentifier(expression)) calls.add(expression.text.toLowerCase());
      else if (ts.isPropertyAccessExpression(expression)) calls.add(expression.name.text.toLowerCase());
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  const commentScanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, body);
  const comments: string[] = [];
  while (commentScanner.scan() !== ts.SyntaxKind.EndOfFileToken) {
    const kind = commentScanner.getToken();
    if (kind === ts.SyntaxKind.SingleLineCommentTrivia || kind === ts.SyntaxKind.MultiLineCommentTrivia) comments.push(commentScanner.getTokenText().toLowerCase());
  }

  for (const id of active) {
    const def = registry.pragmas.find((p) => p.id === id)!;
    if ((def.requiresTake && takes.length === 0) || def.rules.some((rule) => !evaluateRule(rule, { takes: takes.map((take) => take.text), identifiers, calls, hasAny, hasType, hasAnonymousFunction, hasNumber, hasUrl, comments }))) {
      diagnostics.push({ code: def.errorCode, severity: "error", message: def.errorMessage });
    }
  }

  if (diagnostics.some((d) => d.severity === "error")) return { ok: false, target, pragmas: active, diagnostics };

  const filename = options.filename ?? "module.bolhes";
  const tsResult = ts.transpileModule(body, {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.Preserve }
  });
  for (const d of tsResult.diagnostics ?? []) {
    const start = d.start ?? 0;
    diagnostics.push({ code: `TS${d.code}`, severity: "error", message: ts.flattenDiagnosticMessageText(d.messageText, "\n"), span: position(source, start) });
  }
  if (diagnostics.some((d) => d.severity === "error")) return { ok: false, target, pragmas: active, diagnostics };
  const code = target === "ts" ? body : tsResult.outputText;
  const social: SocialArtifact = { schemaVersion: 1, compilerVersion: version, pragmas: active, takes, easterEggs: [] };
  return { ok: true, code, target, pragmas: active, social, diagnostics };
}

interface RuleFacts {
  takes: string[];
  identifiers: Set<string>;
  calls: Set<string>;
  hasAny: boolean;
  hasType: boolean;
  hasAnonymousFunction: boolean;
  hasNumber: boolean;
  hasUrl: boolean;
  comments: string[];
}

function evaluateRule(rule: RequirementRule, facts: RuleFacts): boolean {
  const options = rule.options ?? {};
  const any = Array.isArray(options.any) ? options.any.map((value) => String(value).toLowerCase()) : [];
  switch (rule.id) {
    case "no-any": return !facts.hasAny;
    case "requires-type": return facts.hasType;
    case "no-anonymous-function": return !facts.hasAnonymousFunction;
    case "ast-contains-call": return any.some((name) => facts.calls.has(name));
    case "ast-contains-identifier": return any.some((name) => facts.identifiers.has(name));
    case "ast-contains-url": return facts.hasUrl;
    case "ast-contains-number": return facts.hasNumber;
    case "take-contains-any": return facts.takes.some((take) => any.some((needle) => take.toLowerCase().includes(needle)));
    case "comment-marker": return facts.comments.some((comment) => any.some((needle) => comment.includes(needle)));
    case "take-or-comment-marker": return facts.takes.some((take) => any.some((needle) => take.toLowerCase().includes(needle))) || facts.comments.some((comment) => any.some((needle) => comment.includes(needle)));
    case "take-max-length": return facts.takes.length > 0 && facts.takes.every((take) => take.length <= Number(options.max));
    case "take-question": return facts.takes.some((take) => take.includes("?"));
    default: return false;
  }
}
