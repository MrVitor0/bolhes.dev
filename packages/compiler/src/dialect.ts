import ts from "typescript";
import type { Diagnostic } from "@bolhes/shared";

type Block = { kind: "class" | "function" | "if" | "while" | "for" | "try"; bodyOutputStart?: number; isConstructor?: boolean };
type DialectResult = { code: string; diagnostics: Diagnostic[] };

export function lowerBolhes(source: string, syntaxProfiles: readonly string[] = []): DialectResult {
  const diagnostics: Diagnostic[] = [];
  const lines = source.match(/[^\r\n]*(?:\r\n|\r|\n|$)/g)?.filter((line) => line.length > 0) ?? [];
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, source);
  const tokenAtLine = new Map<number, { kind: ts.SyntaxKind; text: string }>();
  const protectedLines = new Set<number>();
  const nativeBoundaryLines = new Set<number>();
  const nativeMarkerSpans: Array<{ start: number; end: number }> = [];
  const tokens: Array<{ kind: ts.SyntaxKind; start: number; end: number; text: string }> = [];
  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) {
    const start = scanner.getTokenPos();
    const line = source.slice(0, start).split(/\r\n|\r|\n/).length - 1;
    const kind = scanner.getToken();
    tokens.push({ kind, start, end: scanner.getTextPos(), text: scanner.getTokenText() });
    const endLine = source.slice(0, scanner.getTextPos()).split(/\r\n|\r|\n/).length - 1;
    if (kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral || kind === ts.SyntaxKind.TemplateHead || kind === ts.SyntaxKind.TemplateMiddle || kind === ts.SyntaxKind.TemplateTail) {
      for (let templateLine = line; templateLine <= endLine; templateLine++) protectedLines.add(templateLine);
    }
    if (!tokenAtLine.has(line)) tokenAtLine.set(line, { kind, text: scanner.getTokenText() });
  }

  const lineForOffset = (offset: number) => source.slice(0, offset).split(/\r\n|\r|\n/).length - 1;
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].text !== "native") continue;
    const nativeLine = lineForOffset(tokens[index].start);
    const candidate = source.slice(tokens[index].start).match(/^native\s+tsx?\s*\{/);
    if (!candidate) continue;
    const openIndex = tokens.findIndex((token, at) => at > index && token.text === "{");
    if (openIndex < 0) continue;
    let depth = 0;
    let closeIndex = -1;
    for (let at = openIndex; at < tokens.length; at++) {
      if (tokens[at].text === "{") depth++;
      if (tokens[at].text === "}" && --depth === 0) { closeIndex = at; break; }
    }
    if (closeIndex < 0) {
      diagnostics.push({ code: "BOLHES_UNCLOSED_NATIVE_REGION", severity: "error", message: "regiao native sem chave de fechamento", span: spanAt(source, tokens[index].start) });
      for (let line = nativeLine; line < lines.length; line++) protectedLines.add(line);
      nativeBoundaryLines.add(nativeLine);
      break;
    }
    nativeMarkerSpans.push({ start: tokens[index].start, end: tokens[openIndex].end });
    nativeMarkerSpans.push({ start: tokens[closeIndex].start, end: tokens[closeIndex].end });
    const closeLine = lineForOffset(tokens[closeIndex].start);
    nativeBoundaryLines.add(nativeLine);
    nativeBoundaryLines.add(closeLine);
    if (closeLine === nativeLine) protectedLines.add(nativeLine);
    for (let line = nativeLine + 1; line < closeLine; line++) protectedLines.add(line);
    index = closeIndex;
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

    if (nativeBoundaryLines.has(lineNumber)) {
      lowered = maskNativeMarkers(content, lineOffset, nativeMarkerSpans);
    } else if (protectedLines.has(lineNumber)) {
      lowered = content;
    } else if ((firstToken?.kind === ts.SyntaxKind.HashToken || firstToken?.text === "#") && trimmed.startsWith("#")) {
      lowered = `${leading}//${trimmed.slice(1)}`;
    } else if ((tokenIs("class") || tokenIs("export")) && /^(?:export\s+)?class\b/.test(trimmed)) {
      const match = trimmed.match(/^(export\s+)?class\s+([A-Za-z_$][\w$]*)(?:\s*<\s*([A-Za-z_$][\w$]*))?\s*$/);
      if (match) { lowered = `${leading}${match[1] ?? ""}class ${match[2]}${match[3] ? ` extends ${match[3]}` : ""} {`; blocks.push({ kind: "class" }); }
    } else if (tokenIs("async") || tokenIs("def") || tokenIs("export")) {
      const match = trimmed.match(/^(export\s+)?(async\s+)?def\s+([A-Za-z_$][\w$]*)\s*(?:\((.*)\))?\s*(?::\s*(.+))?\s*$/);
      if (match) {
        const isAsync = Boolean(match[2]);
        const name = match[3];
        const parameters = match[4] ?? "";
        const returnType = match[5] ? `: ${match[5]}` : "";
        const inClass = blocks.some((block) => block.kind === "class");
        if (inClass && match[1]) diagnostics.push({ code: "BOLHES_INVALID_METHOD_EXPORT", severity: "error", message: "metodo de classe nao recebe export", span: spanAt(source, lineOffset) });
        if (inClass && name === "initialize" && isAsync) diagnostics.push({ code: "BOLHES_INVALID_CONSTRUCTOR", severity: "error", message: "initialize nao pode ser async", span: spanAt(source, lineOffset) });
        const emittedName = inClass && name === "initialize" ? "constructor" : name;
        lowered = `${leading}${match[1] ?? ""}${isAsync ? "async " : ""}${inClass ? `${emittedName}(${parameters})${returnType}` : `function ${emittedName}(${parameters})${returnType}`} {`;
        blocks.push({ kind: "function", bodyOutputStart: output.length + lowered.length + newline.length, isConstructor: inClass && name === "initialize" });
      }
    } else if (tokenIs("attr_accessor")) {
      const match = trimmed.match(/^attr_accessor\s+(.+)$/);
      if (match && blocks.some((block) => block.kind === "class")) {
        const fields = match[1].split(",").map((part) => part.trim()).map((part) => part.match(/^:([A-Za-z_$][\w$]*)(?:\s+as\s+(.+))?$/));
        if (fields.every((field): field is RegExpMatchArray => field !== null)) lowered = `${leading}  ${fields.map((field) => `${field[1]}${field[2] ? `: ${field[2]}` : ""};`).join(" ")}`;
      }
    } else if (tokenIs("if") || (syntaxProfiles.includes("pt-br") && tokenIs("se"))) {
      const match = trimmed.match(tokenIs("se") ? /^se\s+(?![=(])(.+)$/ : /^if\s+(?!\()(.+)$/);
      if (match) { lowered = `${leading}if (${lowerExpression(match[1])}) {`; blocks.push({ kind: "if" }); }
    } else if (tokenIs("elif")) {
      const condition = trimmed.replace(/^elif\s+/, "");
      if (blocks.at(-1)?.kind === "if" && condition) lowered = `${leading}} else if (${lowerExpression(condition)}) {`;
    } else if ((tokenIs("else") && trimmed === "else") || (syntaxProfiles.includes("pt-br") && tokenIs("senao") && trimmed === "senao")) {
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
      if (blocks.length) {
        const block = blocks.pop()!;
        if (block.kind === "function" && !block.isConstructor && block.bodyOutputStart !== undefined) output = addImplicitReturn(output, block.bodyOutputStart);
        lowered = `${leading}}`;
      }
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

function maskNativeMarkers(line: string, lineOffset: number, spans: Array<{ start: number; end: number }>): string {
  const edits = spans.filter((span) => span.start >= lineOffset && span.end <= lineOffset + line.length)
    .map((span) => ({ start: span.start - lineOffset, end: span.end - lineOffset }));
  for (const edit of edits.reverse()) line = line.slice(0, edit.start) + line.slice(edit.start, edit.end).replace(/[^ \t]/g, " ") + line.slice(edit.end);
  return line;
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

function addImplicitReturn(output: string, bodyStart: number): string {
  const body = output.slice(bodyStart);
  const wrapper = `function __bolhes_implicit_return__() {\n${body}\n}`;
  const parsed = ts.createSourceFile("implicit-return.ts", wrapper, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const fn = parsed.statements.find(ts.isFunctionDeclaration);
  const last = fn?.body?.statements.at(-1);
  if (!last) return output;
  const expressions: ts.Expression[] = [];
  const visitFinal = (statement: ts.Statement) => {
    if (ts.isBlock(statement)) {
      const finalStatement = statement.statements.at(-1);
      if (finalStatement) visitFinal(finalStatement);
    } else if (ts.isExpressionStatement(statement)) expressions.push(statement.expression);
    else if (ts.isIfStatement(statement)) {
      visitFinal(statement.thenStatement);
      if (statement.elseStatement) visitFinal(statement.elseStatement);
    }
  };
  visitFinal(last);
  const eligible = expressions.filter((expression) => {
    if (ts.isBinaryExpression(expression) && expression.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && expression.operatorToken.kind <= ts.SyntaxKind.LastAssignment) return false;
    if ((ts.isPrefixUnaryExpression(expression) || ts.isPostfixUnaryExpression(expression)) && (expression.operator === ts.SyntaxKind.PlusPlusToken || expression.operator === ts.SyntaxKind.MinusMinusToken)) return false;
    return true;
  });
  if (!eligible.length) return output;
  const wrapperBodyStart = "function __bolhes_implicit_return__() {\n".length;
  const edits = eligible.map((expression) => ({
    start: bodyStart + expression.getStart(parsed) - wrapperBodyStart,
    end: bodyStart + expression.getEnd() - wrapperBodyStart,
  })).sort((left, right) => right.start - left.start);
  for (const edit of edits) output = `${output.slice(0, edit.start)}return ${output.slice(edit.start, edit.end)};${output.slice(edit.end)}`;
  return output;
}

function spanAt(source: string, offset: number) {
  const before = source.slice(0, offset);
  const line = before.split(/\r\n|\r|\n/).length;
  return { start: offset, end: offset + 1, line, column: before.length - Math.max(before.lastIndexOf("\n"), before.lastIndexOf("\r")) };
}
