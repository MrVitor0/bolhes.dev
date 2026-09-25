# CLI

```sh
pnpm bolhes personas
pnpm bolhes check examples/localhost-nao-paga.bolhes
pnpm bolhes build examples/localhost-nao-paga.bolhes --out-dir dist --source-map
pnpm bolhes check --project examples/project/tsconfig.json
pnpm bolhes build --project examples/project/tsconfig.json --out-dir dist
```

`check` não grava arquivos. `build` só publica saídas depois que todas as entradas passam. Arquivos avulsos geram `.js` ou `.ts`, `.social.json`, `.quote.txt` e opcionalmente `.js.map`. Human diagnostics vão para stderr com arquivo/linha/coluna; `--format json` retorna estrutura para automação.

No modo `--project`, opções de emit vêm do `tsconfig`; `--target ts` não se aplica. O adapter suporta imports, re-exports e imports dinâmicos literais `.bolhes`, checker do TypeScript, `.d.ts`/maps quando configurados e rewrites para `.js`. Mapas preservam o texto e caminho original, mas colunas após lowering são aproximadas. `outFile` não combina com `.bolhes`.
