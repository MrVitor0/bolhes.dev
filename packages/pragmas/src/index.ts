import registryJson from "../registry.json" with { type: "json" };
import type { PragmaDefinition, Registry } from "@bolhes/shared";

export const registry = registryJson as Registry;

const lookup = new Map<string, PragmaDefinition>();
for (const pragma of registry.pragmas) {
  for (const name of [pragma.id, ...pragma.aliases]) {
    const key = name.replace(/^@/, "").toLocaleLowerCase("en-US");
    if (lookup.has(key)) throw new Error(`Duplicate pragma name: ${key}`);
    lookup.set(key, pragma);
  }
}

export function resolvePragma(name: string): PragmaDefinition | undefined {
  return lookup.get(name.replace(/^@/, "").toLocaleLowerCase("en-US"));
}
