#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, basename, resolve, extname } from "node:path";
import { compile } from "@bolhes/compiler";
import { registry } from "@bolhes/pragmas";
import { commitOutputs } from "./io.js";
import { compileProject } from "./project.js";

const [command, ...args] = process.argv.slice(2);
function help() {
  process.stdout.write("Bolhês 0.1.0\n\nUso: bolhes <build|check|personas> [arquivos] [--project tsconfig.json] [--target js|ts] [--out-dir pasta] [--source-map] [--format human|json]\n");
}
if (!command || command === "--help" || command === "-h") help();
else if (command === "--version" || command === "-v") process.stdout.write("0.1.0\n");
else if (command === "personas") {
  process.stdout.write(registry.pragmas.map((p) => `${p.id}\t${p.aliases.join(", ")}\t${p.gesture}\t${p.handle ?? "—"}`).join("\n") + "\n");
} else if (command === "build" || command === "check") {
  let target: "js" | "ts" = "js";
  let outDir: string | undefined;
  let format = "human";
  let projectFile: string | undefined;
  let sourceMap = false;
  const files: string[] = [];
  let optionError: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--target") {
      const value = args[++i];
      if (value !== "js" && value !== "ts") optionError = `target invalido: ${value ?? "(ausente)"}`;
      else target = value;
    }
    else if (args[i] === "--out-dir") outDir = args[++i];
    else if (args[i] === "--project") projectFile = args[++i];
    else if (args[i] === "--source-map") sourceMap = true;
    else if (args[i] === "--format") format = args[++i];
    else if (args[i].startsWith("-")) optionError = `opcao desconhecida: ${args[i]}`;
    else files.push(args[i]);
  }
  if (format !== "human" && format !== "json") optionError = `formato invalido: ${format}`;
  if (optionError) { process.stderr.write(`${optionError}\n`); process.exitCode = 1; }
  else if (projectFile) {
    if (files.length) { process.stderr.write("--project nao pode combinar com arquivos posicionais\n"); process.exitCode = 1; }
    else if (target === "ts") { process.stderr.write("--project emite conforme o target do tsconfig; --target ts nao se aplica\n"); process.exitCode = 1; }
    else {
      const project = compileProject(projectFile, command === "build", outDir);
      if (command === "build" && project.ok) {
        try { await commitOutputs(project.outputs); }
        catch (error) {
          project.ok = false;
          project.diagnostics.push({ code: "BOLHES_IO_ERROR", severity: "error", message: error instanceof Error ? error.message : "falha ao gravar saidas" });
        }
      }
      if (format === "json") process.stdout.write(`${JSON.stringify({ ok: project.ok, configFile: project.configFile, diagnostics: project.diagnostics }, null, 2)}\n`);
      else for (const diagnostic of project.diagnostics) process.stderr.write(`${diagnostic.file ?? project.configFile}${diagnostic.line ? `:${diagnostic.line}:${diagnostic.column}` : ""}: ${diagnostic.code}: ${diagnostic.message}\n`);
      if (!project.ok) process.exitCode = 1;
    }
  }
  else if (!files.length) { process.stderr.write("informe pelo menos um arquivo .bolhes\n"); process.exitCode = 1; }
  else {
    const results: Array<{ file: string } & ReturnType<typeof compile>> = [];
    for (const file of files) {
      const absolute = resolve(file);
      try {
        const source = await readFile(absolute, "utf8");
        results.push({ file, ...compile(source, { filename: absolute, target, sourceMap }) });
      } catch (error) {
        results.push({ file, ok: false, target, pragmas: [], diagnostics: [{ code: "BOLHES_IO_ERROR", severity: "error", message: error instanceof Error ? error.message : "falha de leitura" }] });
      }
    }
    if (command === "build" && results.every((item) => item.ok)) {
      const outputs = results.flatMap((item) => {
        const destinationDir = resolve(outDir ?? dirname(resolve(item.file)));
        const stem = basename(item.file, extname(item.file));
        const ext = target === "ts" ? ".ts" : ".js";
        return [
          { directory: destinationDir, name: `${stem}${ext}`, content: item.code! },
          ...(item.map ? [{ directory: destinationDir, name: `${stem}${ext}.map`, content: item.map }] : []),
          { directory: destinationDir, name: `${stem}.social.json`, content: `${JSON.stringify(item.social, null, 2)}\n` },
          { directory: destinationDir, name: `${stem}.quote.txt`, content: item.social!.takes.map((take) => take.quoteTweet).join("\n") + (item.social!.takes.length ? "\n" : "") },
        ];
      });
      const names = outputs.map((output) => resolve(output.directory, output.name).toLowerCase());
      if (new Set(names).size !== names.length) {
        results[0].ok = false;
        results[0].diagnostics.push({ code: "BOLHES_OUTPUT_COLLISION", severity: "error", message: "mais de uma entrada gera o mesmo caminho de saida" });
      }
      else {
        try { await commitOutputs(outputs); }
        catch (error) {
          results[0].ok = false;
          results[0].diagnostics.push({ code: "BOLHES_IO_ERROR", severity: "error", message: error instanceof Error ? error.message : "falha ao gravar saidas" });
        }
      }
    }
    if (format === "json") process.stdout.write(JSON.stringify(results, null, 2) + "\n");
    else for (const item of results) for (const diagnostic of item.diagnostics) process.stderr.write(`${item.file}${diagnostic.span ? `:${diagnostic.span.line}:${diagnostic.span.column}` : ""}: ${diagnostic.code}: ${diagnostic.message}\n`);
    if (results.some((item) => !item.ok)) process.exitCode = 1;
  }
} else { process.stderr.write(`comando desconhecido: ${command}\n`); help(); process.exitCode = 1; }
