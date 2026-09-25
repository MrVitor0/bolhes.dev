import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(packageRoot, "index.yml");
const outputPath = resolve(packageRoot, "registry.json");
const indexDocument = YAML.parseDocument(await readFile(sourcePath, "utf8"), { uniqueKeys: true });
if (indexDocument.errors.length) throw new Error(indexDocument.errors.map((error) => error.message).join("\n"));
const index = indexDocument.toJS();
const errors = validateIndex(index);
const pragmas = [];
if (Array.isArray(index?.pragmas)) for (const [position, entry] of index.pragmas.entries()) {
  if (!isRecord(entry) || typeof entry.file !== "string" || !/^personas\/[a-z0-9-]+\.yml$/i.test(entry.file)) continue;
  const personaPath = resolve(packageRoot, entry.file);
  if (!personaPath.startsWith(`${resolve(packageRoot, "personas")}${sep}`)) { errors.push(`pragmas[${position}].file: path escapes personas directory`); continue; }
  try {
    const personaDocument = YAML.parseDocument(await readFile(personaPath, "utf8"), { uniqueKeys: true });
    if (personaDocument.errors.length) { errors.push(`${entry.file}: ${personaDocument.errors.map((error) => error.message).join("; ")}`); continue; }
    const pragma = personaDocument.toJS();
    if (pragma?.id !== entry.id) errors.push(`${entry.file}.id: does not match index ID (${entry.id})`);
    pragmas.push(pragma);
  } catch { errors.push(`${entry.file}: file not found`); }
}
const registry = { version: index?.version, pragmas, conflicts: index?.conflicts };
errors.push(...validateRegistry(registry));
if (errors.length) throw new Error(`Invalid pragma registry:\n${errors.map((error) => `- ${error}`).join("\n")}`);
await writeFile(outputPath, `${JSON.stringify(registry, null, 2)}\n`, "utf8");

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateIndex(value) {
  const errors = [];
  if (!isRecord(value)) return ["index: expected object"];
  checkKeys(value, ["version", "pragmas", "conflicts"], "index", errors);
  if (typeof value.version !== "string" || !value.version.trim()) errors.push("index.version: expected non-empty string");
  if (!Array.isArray(value.pragmas)) errors.push("index.pragmas: expected list");
  if (!Array.isArray(value.pragmas)) return errors;
  const ids = new Set();
  const paths = new Set();
  value.pragmas.forEach((entry, position) => {
    const path = `index.pragmas[${position}]`;
    if (!isRecord(entry)) { errors.push(`${path}: expected object`); return; }
    checkKeys(entry, ["id", "file"], path, errors);
    if (typeof entry.id !== "string" || !/^[a-z0-9][a-z0-9-]*$/i.test(entry.id)) errors.push(`${path}.id: invalid format`);
    else if (ids.has(entry.id.toLowerCase())) errors.push(`${path}.id: duplicate (${entry.id})`);
    else ids.add(entry.id.toLowerCase());
    if (typeof entry.file !== "string" || !/^personas\/[a-z0-9-]+\.yml$/i.test(entry.file)) errors.push(`${path}.file: expected personas/<id>.yml`);
    else if (paths.has(entry.file.toLowerCase())) errors.push(`${path}.file: duplicate path`);
    else paths.add(entry.file.toLowerCase());
  });
  return errors;
}

function validateRegistry(value) {
  const errors = [];
  if (!isRecord(value)) return ["registry: esperado objeto"];
  checkKeys(value, ["version", "pragmas", "conflicts"], "registry", errors);
  if (typeof value.version !== "string" || !value.version.trim()) errors.push("version: esperado texto nÃ£o vazio");
  if (!Array.isArray(value.pragmas)) errors.push("pragmas: esperado lista");
  if (!Array.isArray(value.conflicts)) errors.push("conflicts: esperado lista");
  if (!Array.isArray(value.pragmas)) return errors;

  const ids = new Map();
  const names = new Map();
  const errorCodes = new Set();
  const stringFields = ["displayName", "gesture", "errorCode", "errorMessage", "voice", "quote"];
  const required = ["id", "aliases", "kind", "displayName", "handle", "gesture", "requiresTake", "rules", "errorCode", "errorMessage", "refuses", "voice", "quote"];
  value.pragmas.forEach((pragma, index) => {
    const path = `pragmas[${index}]`;
    if (!isRecord(pragma)) { errors.push(`${path}: esperado objeto`); return; }
    checkKeys(pragma, required, path, errors);
    for (const field of stringFields) if (typeof pragma[field] !== "string" || !pragma[field].trim()) errors.push(`${path}.${field}: esperado texto nÃ£o vazio`);
    if (typeof pragma.errorCode === "string") {
      if (!/^[A-Z][A-Z0-9_]*$/.test(pragma.errorCode)) errors.push(`${path}.errorCode: use cÃ³digo estÃ¡vel em maiÃºsculas`);
      if (errorCodes.has(pragma.errorCode)) errors.push(`${path}.errorCode: duplicado (${pragma.errorCode})`);
      errorCodes.add(pragma.errorCode);
    }
    if (typeof pragma.id !== "string" || !/^[a-z0-9][a-z0-9-]*$/i.test(pragma.id)) errors.push(`${path}.id: formato invÃ¡lido`);
    else if (ids.has(pragma.id.toLowerCase())) errors.push(`${path}.id: duplicado (${pragma.id})`);
    else ids.set(pragma.id.toLowerCase(), pragma);
    if (!["persona", "technical"].includes(pragma.kind)) errors.push(`${path}.kind: esperado persona ou technical`);
    if (!(pragma.handle === null || pragma.handle === "TBD" || (typeof pragma.handle === "string" && /^@[A-Za-z0-9_.-]+$/.test(pragma.handle)))) errors.push(`${path}.handle: esperado handle, TBD ou null`);
    if (typeof pragma.requiresTake !== "boolean") errors.push(`${path}.requiresTake: esperado boolean`);
    validateRules(pragma.rules, `${path}.rules`, errors);
    for (const field of ["aliases", "refuses"]) if (!Array.isArray(pragma[field]) || pragma[field].some((item) => typeof item !== "string" || !item.trim())) errors.push(`${path}.${field}: esperado lista de textos nÃ£o vazios`);
    if (Array.isArray(pragma.aliases)) for (const alias of pragma.aliases) {
      if (typeof alias !== "string" || !alias.trim()) continue;
      addName(alias, `${path}.aliases`, names, errors);
    }
    if (typeof pragma.id === "string") addName(pragma.id, `${path}.id`, names, errors);
    if (typeof pragma.quote === "string" && pragma.quote.split(/\r?\n/).length > 2) errors.push(`${path}.quote: mÃ¡ximo de duas linhas`);
  });

  for (const [index, pragma] of value.pragmas.entries()) if (isRecord(pragma) && Array.isArray(pragma.refuses)) {
    pragma.refuses.forEach((refused, itemIndex) => {
      if (typeof refused === "string" && !ids.has(normalize(refused))) errors.push(`pragmas[${index}].refuses[${itemIndex}]: destino inexistente '${refused}'`);
    });
  }

  const conflictPairs = new Set();
  if (Array.isArray(value.conflicts)) value.conflicts.forEach((pair, index) => {
    if (!Array.isArray(pair) || pair.length !== 2 || pair.some((id) => typeof id !== "string")) { errors.push(`conflicts[${index}]: esperado par de IDs`); return; }
    const [left, right] = pair.map(normalize);
    if (!ids.has(left) || !ids.has(right)) errors.push(`conflicts[${index}]: referÃªncia de pragma inexistente`);
    if (left === right) errors.push(`conflicts[${index}]: conflito nÃ£o pode apontar para si mesmo`);
    const key = [left, right].sort().join("+");
    if (conflictPairs.has(key)) errors.push(`conflicts[${index}]: par duplicado (${key})`);
    conflictPairs.add(key);
  });
  return errors;
}

function addName(name, path, names, errors) {
  const key = normalize(name);
  if (names.has(key)) errors.push(`${path}: colisÃ£o '${name}' com ${names.get(key)}`);
  else names.set(key, path);
}

function checkKeys(value, allowed, path, errors) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${path}.${key}: campo desconhecido`);
  for (const key of allowed) if (!(key in value)) errors.push(`${path}.${key}: campo obrigatÃ³rio ausente`);
}

function normalize(name) {
  return name.replace(/^@/, "").toLowerCase();
}

function validateRules(rules, path, errors) {
  const noOptions = new Set(["no-any", "requires-type", "no-anonymous-function", "ast-contains-url", "ast-contains-number", "take-question"]);
  const anyOptions = new Set(["ast-contains-call", "ast-contains-identifier", "take-contains-any", "comment-marker", "take-or-comment-marker"]);
  if (!Array.isArray(rules)) { errors.push(`${path}: esperado lista`); return; }
  rules.forEach((rule, index) => {
    const rulePath = `${path}[${index}]`;
    if (!isRecord(rule)) { errors.push(`${rulePath}: esperado objeto`); return; }
    if (Object.keys(rule).some((key) => !["id", "options"].includes(key))) errors.push(`${rulePath}: campo desconhecido`);
    if (typeof rule.id !== "string") { errors.push(`${rulePath}.id: esperado texto`); return; }
    if (noOptions.has(rule.id)) {
      if ("options" in rule) errors.push(`${rulePath}.options: esta regra não aceita options`);
      return;
    }
    if (anyOptions.has(rule.id)) {
      const options = rule.options;
      if (!isRecord(options) || Object.keys(options).some((key) => key !== "any") || !Array.isArray(options.any) || options.any.length === 0 || options.any.some((item) => typeof item !== "string" || !item.trim())) errors.push(`${rulePath}.options: esperado { any: [texto, ...] }`);
      return;
    }
    if (rule.id === "take-max-length") {
      if (!isRecord(rule.options) || Object.keys(rule.options).length !== 1 || !Number.isInteger(rule.options.max) || rule.options.max < 1 || rule.options.max > 1000) errors.push(`${rulePath}.options: esperado { max: inteiro entre 1 e 1000 }`);
      return;
    }
    errors.push(`${rulePath}.id: regra desconhecida '${rule.id}'`);
  });
}
