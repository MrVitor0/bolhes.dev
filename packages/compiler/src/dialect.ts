import ts from "typescript";
import type { Diagnostic } from "@bolhes/shared";

type Block = { kind: "class" | "function" | "if" | "while" | "for" | "try" };
type DialectResult = { code: string; diagnostics: Diagnostic[] };

export function lowerBolhes(source: string): DialectResult {
  const diagnostics: Diagnostic[] = [];
  const lines = source.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g)?.filter((line) => line.length > 0) ?? [];
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, source);
  const tokenAtLine = new Map<number, { kind: ts.SyntaxKind; text: string }>();
  const protectedLines = new Set<number>();
  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) {
    const start = scanner.getTokenPos();
    const line = source.slice(0, start).split(/\r\n|\r|\n/).length - 1;
    const kind = scanner.getToken();
    const endLine = source.slice(0, scanner.getTextPos()).split(/\r\n|\r|\n/).length - 1;
    if (kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral || kind === ts.SyntaxKind.TemplateHead || kind === ts.SyntaxKind.TemplateMiddle || kind === ts.SyntaxKind.TemplateTail) {
      for (let templateLine = line; templateLine <= endLine; templateLine++) protectedLines.add(templateLine);
    }
    if (!tokenAtLine.has(line)) tokenAtLine.set(line, { kind, text: scanner.getTokenText() });
  }

  const blocks: Block[] = [];
  let lineOffset = 0;
  let output = "";
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    const fullLine = lines[lineNumber];
    const newline = fullLine.match(/(?:\r\n|\r|\n)$/)?.[0] ?? "";
    const content = fullLine.slice(0, fullLine.length - newline.length);
    const leading = content.match(/^\s*/)?.[0] ?? "";
    const trimmed = content.slice(leading.length);
    const firstToken = tokenAtLine.get(lineNumber);
    let lowered: string | undefined;
    const tokenIs = (name: string) => firstToken?.text === name;

    if (protectedLines.has(lineNumber)) {
      lowered = content;
    } else if ((firstToken?.kind === ts.SyntaxKind.HashToken || firstToken?.text === "#") && trimmed.startsWith("#")) {
      lowered = `${leading}//${trimmed.slice(1)}`;
    } else if (tokenIs("class")) {
      const match = trimmed.match(/^class\s+([A-Za-z_$][\w$]*)(?:\s*<\s*([A-Za-z_$][\w$]*))?\s*$/);
      if (match) { lowered = `${leading}class ${match[1]}${match[2] ? ` extends ${match[2]}` : ""} {`; blocks.push({ kind: "class" }); }
    } else if (tokenIs("async") || tokenIs("def")) {
      const match = trimmed.match(/^(async\s+)?def\s+([A-Za-z_$][\w$]*)\s*(?:\((.*)\))?\s*(?::\s*(.+))?\s*$/);
      if (match) {
        const isAsync = Boolean(match[1]);
        const name = match[2];
        const parameters = match[3] ?? "";
        const returnType = match[4] ? `: ${match[4]}` : "";
        const inClass = blocks.some((block) => block.kind === "class");
        if (inClass && name === "initialize" && isAsync) diagnostics.push({ code: "BOLHES_INVALID_CONSTRUCTOR", severity: "error", message: "initialize nao pode ser async", span: spanAt(source, lineOffset) });
        const emittedName = inClass && name === "initialize" ? "constructor" : name;
        lowered = `${leading}${isAsync ? "async " : ""}${inClass ? `${emittedName}(${parameters})${returnType}` : `function ${emittedName}(${parameters})${returnType}`} {`;
        blocks.push({ kind: "function" });
      }
    } else if (tokenIs("attr_accessor")) {
      const match = trimmed.match(/^attr_accessor\s+(.+)$/);
      if (match && blocks.some((block) => block.kind === "class")) {
        const fields = match[1].split(",").map((part) => part.trim()).map((part) => part.match(/^:([A-Za-z_$][\w$]*)(?:\s+as\s+(.+))?$/));
        if (fields.every((field): field is RegExpMatchArray => field !== null)) lowered = fields.map((field) => `${leading}  ${field[1]}${field[2] ? `: ${field[2]}` : ""};`).join(newline || "\n");
      }
    } else if (tokenIs("if")) {
      const match = trimmed.match(/^if\s+(?!\()(.+)$/);
      if (match) { lowered = `${leading}if (${lowerExpression(match[1])}) {`; blocks.push({ kind: "if" }); }
    } else if (tokenIs("elif")) {
      const condition = trimmed.replace(/^elif\s+/, "");
      if (blocks.at(-1)?.kind === "if" && condition) lowered = `${leading}} else if (${lowerExpression(condition)}) {`;
    } else if (tokenIs("else") && trimmed === "else") {
      if (blocks.at(-1)?.kind === "if") lowered = `${leading}} else {`;
    } else if (tokenIs("while")) {
      const match = trimmed.match(/^while\s+(?!\()(.+)$/);
      if (match) { lowered = `${leading}while (${lowerExpression(match[1])}) {`; blocks.push({ kind: "while" }); }
    } else if (tokenIs("for")) {
      const match = trimmed.match(/^for\s+([A-Za-z_$][\w$]*)\s+in\s+(.+)$/);
      if (match) { lowered = `${leading}for (const ${match[1]} of ${lowerExpression(match[2])}) {`; blocks.push({ kind: "for" }); }
    } else if (tokenIs("try") && trimmed === "try") {
      lowered = `${leading}try {`; blocks.push({ kind: "try" });
    } else if (tokenIs("catch")) {
      const match = trimmed.match(/^catch(?:\s+([A-Za-z_$][\w$]*))?\s*$/);
      if (match && blocks.at(-1)?.kind === "try") lowered = `${leading}} catch${match[1] ? ` (${match[1]})` : ""} {`;
    } else if (tokenIs("finally") && trimmed === "finally") {
      if (blocks.at(-1)?.kind === "try") lowered = `${leading}} finally {`;
    } else if (tokenIs("end") && trimmed === "end") {
      if (blocks.length) { blocks.pop(); lowered = `${leading}}`; }
      else diagnostics.push({ code: "BOLHES_UNEXPECTED_END", severity: "error", message: "end sem bloco aberto", span: spanAt(source, lineOffset) });
    }

    if (lowered === undefined) {
      const transformed = lowerExpressionLine(content, lineOffset, source, blocks, diagnostics);
      lowered = transformed;
    }
    output += lowered + newline;
    lineOffset += fullLine.length;
  }
  if (blocks.length) diagnostics.push({ code: "BOLHES_UNCLOSED_BLOCK", severity: "error", message: `${blocks.length} bloco(s) sem end`, span: spanAt(source, source.length) });
  return { code: output, diagnostics };
}

function lowerExpressionLine(line: string, offset: number, source: string, blocks: Block[], diagnostics: Diagnostic[]): string {
  const leading = line.match(/^\s*/)?.[0] ?? "";
  const text = line.slice(leading.length);
  if (!text) return line;
  const transformed = lowerExpression(text, (fieldOffset) => {
    const inMethod = blocks.some((block) => block.kind === "function") && blocks.some((block) => block.kind === "class");
    if (!inMethod) diagnostics.push({ code: "BOLHES_FIELD_OUTSIDE_METHOD", severity: "error", message: "@campo so pode ser usado dentro de metodo", span: spanAt(source, offset + leading.length + fieldOffset) });
  });
  return leading + transformed;
}

function lowerExpression(expression: string, onField?: (offset: number) => void): string {
  const parsed = ts.createSourceFile("expression.ts", expression, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const protectedSpans: Array<{ start: number; end: number }> = [];
  const findProtected = (node: ts.Node) => {
    if (ts.isRegularExpressionLiteral(node) || ts.isTemplateExpression(node) || ts.isNoSubstitutionTemplateLiteral(node)) protectedSpans.push({ start: node.getStart(parsed), end: node.getEnd() });
    ts.forEachChild(node, findProtected);
  };
  findProtected(parsed);
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, expression);
  const tokens: Array<{ kind: ts.SyntaxKind; start: number; end: number; text: string }> = [];
  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) tokens.push({ kind: scanner.getToken(), start: scanner.getTokenPos(), end: scanner.getTextPos(), text: scanner.getTokenText() });
  let result = "";
  let cursor = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    result += expression.slice(cursor, token.start);
    let replacement = token.text;
    const isProtected = protectedSpans.some((span) => token.start >= span.start && token.start < span.end);
    if (!isProtected && token.kind === ts.SyntaxKind.Identifier) {
      if (token.text === "nil") replacement = "null";
      else if (token.text === "and") replacement = "&&";
      else if (token.text === "or") replacement = "||";
      else if (token.text === "not") replacement = "!";
    }
    if (!isProtected && token.kind === ts.SyntaxKind.AtToken && tokens[i + 1]?.kind === ts.SyntaxKind.Identifier) {
      const field = tokens[i + 1];
      onField?.(token.start);
      replacement = `this.${field.text}`;
      result += replacement;
      cursor = field.end;
      i++;
      continue;
    }
    result += replacement;
    cursor = token.end;
  }
  return result + expression.slice(cursor);
}

function spanAt(source: string, offset: number) {
  const before = source.slice(0, offset);
  const line = before.split(/\r\n|\r|\n/).length;
  return { start: offset, end: offset + 1, line, column: before.length - Math.max(before.lastIndexOf("\n"), before.lastIndexOf("\r")) };
}
