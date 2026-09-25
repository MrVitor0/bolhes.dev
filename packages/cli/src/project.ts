import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import ts from "typescript";
import { compile } from "@bolhes/compiler";
import type { Diagnostic as BolhesDiagnostic, SocialArtifact } from "@bolhes/shared";
import type { PendingOutput } from "./io.js";

export interface ProjectResult {
  ok: boolean;
  configFile: string;
  diagnostics: Array<{ file?: string; code: string | number; severity: "error" | "warning"; message: string; line?: number; column?: number }>;
  outputs: PendingOutput[];
}

export function compileProject(configPath: string, emit: boolean, outDir?: string): ProjectResult {
  const absoluteConfig = resolve(configPath);
  const configDir = dirname(absoluteConfig);
  const diagnostics: ProjectResult["diagnostics"] = [];
  const outputs: PendingOutput[] = [];
  const configRead = ts.readConfigFile(absoluteConfig, ts.sys.readFile);
  if (configRead.error) return { ok: false, configFile: absoluteConfig, diagnostics: [formatDiagnostic(configRead.error)], outputs };
  const parsed = ts.parseJsonConfigFileContent(configRead.config, ts.sys, configDir, undefined, absoluteConfig);
  const includedBolhes = ts.sys.readDirectory(configDir, [".bolhes"], configRead.config.exclude, configRead.config.include ?? ["**/*"]);
  diagnostics.push(...parsed.errors.filter((diagnostic) => !(diagnostic.code === 18003 && includedBolhes.length > 0)).map(formatDiagnostic));
  const roots = [...new Set([...parsed.fileNames.filter((name) => !name.endsWith(".bolhes")), ...includedBolhes.map(toVirtualName)])];
  const options: ts.CompilerOptions = { ...parsed.options, outDir: outDir ? resolve(outDir) : parsed.options.outDir, noEmit: !emit, noEmitOnError: true };
  if (emit && options.outFile && includedBolhes.length) {
    diagnostics.push({ code: "BOLHES_PROJECT_OUTFILE_UNSUPPORTED", severity: "error", message: "outFile nao pode combinar modulos .bolhes no MVP" });
  }

  const socialBySource = new Map<string, SocialArtifact>();
  const sourceDiagnostics: ts.Diagnostic[] = [];
  const compileCache = new Map<string, ReturnType<typeof compile>>();
  const host = ts.createCompilerHost(options);
  const baseFileExists = host.fileExists.bind(host);
  host.fileExists = (fileName) => baseFileExists(isVirtualBolhes(fileName) ? toSourceName(fileName) : fileName);
  const baseReadFile = host.readFile.bind(host);
  host.readFile = (fileName) => baseReadFile(isVirtualBolhes(fileName) ? toSourceName(fileName) : fileName);
  const baseGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    if (!isVirtualBolhes(fileName)) return baseGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    const sourcePath = resolve(toSourceName(fileName));
    let result = compileCache.get(sourcePath);
    let original: string;
    try { original = readFileSync(sourcePath, "utf8"); }
    catch (error) { onError?.(error instanceof Error ? error.message : "falha de leitura"); return undefined; }
    if (!result) {
      result = compile(original, { filename: sourcePath, target: "ts" });
      compileCache.set(sourcePath, result);
      if (result.social) socialBySource.set(sourcePath, result.social);
      const sourceFile = ts.createSourceFile(sourcePath, original, languageVersion, true, ts.ScriptKind.TS);
      for (const diagnostic of result.diagnostics) sourceDiagnostics.push(toTsDiagnostic(diagnostic, sourceFile));
    }
    return ts.createSourceFile(fileName, result.code ?? "", languageVersion, true, ts.ScriptKind.TS);
  };
  host.resolveModuleNames = (moduleNames, containingFile) => moduleNames.map((moduleName) => {
    if (moduleName.endsWith(".bolhes")) {
      const candidate = resolve(dirname(containingFile), moduleName);
      if (ts.sys.fileExists(candidate)) return { resolvedFileName: toVirtualName(candidate), extension: ts.Extension.Ts };
    }
    return ts.resolveModuleName(moduleName, containingFile, options, host).resolvedModule;
  });

  const program = ts.createProgram({ rootNames: roots, options, host });
  const allDiagnostics = [...diagnostics, ...sourceDiagnostics.map(formatDiagnostic), ...ts.getPreEmitDiagnostics(program).filter((diagnostic) => !isBolhesTsExtensionDiagnostic(diagnostic)).map(formatDiagnostic)];
  const hasErrors = allDiagnostics.some((diagnostic) => diagnostic.severity === "error");
  if (emit && !hasErrors) {
    const result = program.emit(undefined, (fileName, data, _bom, _onError, sourceFiles) => {
      const finalFileName = normalizeEmitName(fileName);
      const rewritten = finalFileName.endsWith(".map") ? rewriteProjectSourceMap(fileName, finalFileName, data, includedBolhes) : rewriteBolhesSpecifiers(finalFileName, data);
      outputs.push({ directory: dirname(finalFileName), name: finalFileName.slice(dirname(finalFileName).length + 1), content: rewritten });
      if (/\.(?:js|mjs|cjs|jsx)$/i.test(finalFileName)) {
        for (const sourceFile of sourceFiles ?? []) {
          const social = socialBySource.get(resolve(isVirtualBolhes(sourceFile.fileName) ? toSourceName(sourceFile.fileName) : sourceFile.fileName));
          if (!social) continue;
          const stem = finalFileName.replace(/\.(?:js|mjs|cjs|jsx)$/i, "");
          const directory = dirname(finalFileName);
          outputs.push({ directory, name: `${stem.slice(directory.length + 1)}.social.json`, content: `${JSON.stringify(social, null, 2)}\n` });
          outputs.push({ directory, name: `${stem.slice(directory.length + 1)}.quote.txt`, content: social.takes.map((take) => take.quoteTweet).join("\n") + (social.takes.length ? "\n" : "") });
        }
      }
    });
    if (result.emitSkipped) allDiagnostics.push({ code: "BOLHES_PROJECT_EMIT_FAILED", severity: "error", message: "TypeScript pulou a emissao do projeto" });
  }
  return { ok: !allDiagnostics.some((diagnostic) => diagnostic.severity === "error"), configFile: absoluteConfig, diagnostics: allDiagnostics, outputs };
}

function formatDiagnostic(diagnostic: ts.Diagnostic): ProjectResult["diagnostics"][number] {
  const position = diagnostic.file && diagnostic.start !== undefined ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start) : undefined;
  return {
    file: diagnostic.file?.fileName.replace(/\.bolhes\.ts$/i, ".bolhes"),
    code: diagnostic.code,
    severity: diagnostic.category === ts.DiagnosticCategory.Warning ? "warning" : "error",
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    line: position ? position.line + 1 : undefined,
    column: position ? position.character + 1 : undefined,
  };
}

function toVirtualName(sourcePath: string) { return `${sourcePath}.ts`; }
function toSourceName(virtualPath: string) { return virtualPath.slice(0, -3); }
function isVirtualBolhes(fileName: string) { return fileName.toLowerCase().endsWith(".bolhes.ts"); }
function normalizeEmitName(fileName: string) { return fileName.replace(/\.bolhes(?=\.(?:js|mjs|cjs|jsx|d\.ts)(?:\.map)?$)/i, ""); }

function toTsDiagnostic(diagnostic: BolhesDiagnostic, file: ts.SourceFile): ts.Diagnostic {
  return {
    category: diagnostic.severity === "error" ? ts.DiagnosticCategory.Error : ts.DiagnosticCategory.Warning,
    code: 91000,
    file,
    start: diagnostic.span?.start,
    length: diagnostic.span ? Math.max(1, diagnostic.span.end - diagnostic.span.start) : undefined,
    messageText: `${diagnostic.code}: ${diagnostic.message}`,
  };
}

function isBolhesTsExtensionDiagnostic(diagnostic: ts.Diagnostic): boolean {
  if (diagnostic.code !== 5097 || !diagnostic.file || diagnostic.start === undefined) return false;
  return diagnostic.file.text.slice(Math.max(0, diagnostic.start - 2), diagnostic.start + 128).includes(".bolhes");
}

function rewriteBolhesSpecifiers(fileName: string, content: string): string {
  if (!/\.(?:js|mjs|cjs|jsx|d\.ts)$/i.test(fileName)) return content;
  const source = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const edits: Array<{ start: number; end: number; text: string }> = [];
  const visit = (node: ts.Node) => {
    let specifier: ts.StringLiteralLike | undefined;
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) specifier = node.moduleSpecifier;
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) specifier = node.arguments[0];
    if (specifier?.text.endsWith(".bolhes")) {
      const raw = specifier.getText(source);
      const quote = raw[0];
      edits.push({ start: specifier.getStart(source), end: specifier.getEnd(), text: `${quote}${specifier.text.slice(0, -7)}.js${quote}` });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  for (const edit of edits.reverse()) content = content.slice(0, edit.start) + edit.text + content.slice(edit.end);
  return content;
}

function rewriteProjectSourceMap(fileName: string, finalFileName: string, content: string, bolhesFiles: string[]): string {
  try {
    const map = JSON.parse(content) as { file?: string; sources?: string[]; sourceRoot?: string; sourcesContent?: Array<string | null> };
    if (map.file) map.file = map.file.replace(/\.bolhes(?=\.(?:js|mjs|cjs|jsx)$)/i, "");
    map.sourcesContent ??= [];
    map.sources = map.sources?.map((source, index) => {
      const original = source.replace(/\.bolhes\.ts$/i, ".bolhes");
      let sourcePath = resolve(dirname(fileName), map.sourceRoot ?? "", original);
      const normalized = original.replace(/\\/g, "/").replace(/^\.\.\//, "");
      const candidate = bolhesFiles.find((path) => path.replace(/\\/g, "/").endsWith(normalized.replace(/^(?:\.\.\/)+/, "")))
        ?? bolhesFiles.find((path) => path.replace(/\\/g, "/").endsWith(`/${normalized.split("/").at(-1)}`));
      if (candidate) sourcePath = candidate;
      try {
        map.sourcesContent![index] = readFileSync(sourcePath, "utf8");
        return relative(dirname(finalFileName), sourcePath).replace(/\\/g, "/") || sourcePath;
      } catch { return original; }
    });
    return `${JSON.stringify(map)}\n`;
  } catch { return content; }
}
