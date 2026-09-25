#!/usr/bin/env node
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, basename, resolve, extname } from "node:path";
import { compile } from "@bolhes/compiler";
import { registry } from "@bolhes/pragmas";

const [command, ...args] = process.argv.slice(2);
function help() {
  process.stdout.write("Bolhês 0.1.0\n\nUso: bolhes <build|check|personas> [arquivos] [--target js|ts] [--out-dir pasta] [--format human|json]\n");
}
if (!command || command === "--help" || command === "-h") help();
else if (command === "--version" || command === "-v") process.stdout.write("0.1.0\n");
else if (command === "personas") {
  process.stdout.write(registry.pragmas.map((p) => `${p.id}\t${p.aliases.join(", ")}\t${p.gesture}\t${p.handle ?? "—"}`).join("\n") + "\n");
} else if (command === "build" || command === "check") {
  let target: "js" | "ts" = "js";
  let outDir: string | undefined;
  let format = "human";
  const files: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--target") target = args[++i] === "ts" ? "ts" : "js";
    else if (args[i] === "--out-dir") outDir = args[++i];
    else if (args[i] === "--format") format = args[++i];
    else files.push(args[i]);
  }
  if (!files.length) { process.stderr.write("informe pelo menos um arquivo .bolhes\n"); process.exitCode = 1; }
  else {
    const results: Array<{ file: string } & ReturnType<typeof compile>> = [];
    for (const file of files) {
      const absolute = resolve(file);
      try {
        const source = await readFile(absolute, "utf8");
        results.push({ file, ...compile(source, { filename: absolute, target }) });
      } catch (error) {
        results.push({ file, ok: false, target, pragmas: [], diagnostics: [{ code: "BOLHES_IO_ERROR", severity: "error", message: error instanceof Error ? error.message : "falha de leitura" }] });
      }
    }
    if (command === "build" && results.every((item) => item.ok)) {
      for (const item of results) {
        const destinationDir = resolve(outDir ?? dirname(resolve(item.file)));
        await mkdir(destinationDir, { recursive: true });
        const stem = basename(item.file, extname(item.file));
        const ext = target === "ts" ? ".ts" : ".js";
        await writeFile(resolve(destinationDir, `${stem}${ext}`), item.code!, "utf8");
        await writeFile(resolve(destinationDir, `${stem}.social.json`), JSON.stringify(item.social, null, 2) + "\n", "utf8");
        await writeFile(resolve(destinationDir, `${stem}.quote.txt`), item.social!.takes.map((take) => take.quoteTweet).join("\n") + (item.social!.takes.length ? "\n" : ""), "utf8");
      }
    }
    if (format === "json") process.stdout.write(JSON.stringify(results, null, 2) + "\n");
    else for (const item of results) for (const diagnostic of item.diagnostics) process.stderr.write(`${item.file}: ${diagnostic.code}: ${diagnostic.message}\n`);
    if (results.some((item) => !item.ok)) process.exitCode = 1;
  }
} else { process.stderr.write(`comando desconhecido: ${command}\n`); help(); process.exitCode = 1; }
