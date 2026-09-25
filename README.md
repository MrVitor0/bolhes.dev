# Bolhês

Bolhês é um dialeto de autoria para programas JS/TS, com pragmas sociais e artefatos de quote-tweet determinísticos.

## Requisitos

- Node.js 20 ou superior
- pnpm 10

## Começar

```sh
pnpm install
pnpm build
pnpm dev
pnpm bolhes --help
pnpm bolhes personas
pnpm bolhes check --project examples/project/tsconfig.json
pnpm bolhes build --project examples/project/tsconfig.json --out-dir dist
pnpm bolhes build examples/localhost-nao-paga.bolhes --out-dir dist --source-map
```

`bolhes build` gera o módulo JavaScript, um arquivo `.social.json` e um `.quote.txt` depois de uma compilação sem erros. `bolhes check` valida sem gravar os artefatos. Use `--target ts` para preservar o TypeScript.

## Estado do compiler

A API publica `compile(source, options)` e o CLI suportam o modo de compatibilidade JS/TS, diretivas `@use`, takes `hot take`, regioes `native ts { ... }`, source maps e projetos TypeScript com imports `.bolhes`. `pnpm dev` abre o playground React; a compilacao acontece em Worker e demos sao lidas de `examples/`. Os arquivos `packages/pragmas/personas/*.yml` e `index.yml` sao a fonte dos 30 pragmas; o build valida e gera JSON. Regras declarativas aplicam predicates estruturais a um subconjunto de personas.

O lowering Ruby/Python cobre blocos simples e retorno implicito de expressoes finais e ramos `if/else`; o checker de projeto verifica tipos entre arquivos e emite declarations. Os mapas preservam o caminho e o texto original `.bolhes`, mas as colunas de construcoes transformadas ainda sao aproximadas. Ainda faltam suporte completo a TSX/regioes nativas, mapeamento de diagnostics do checker e medicao de latencia do Worker no browser. Os predicates implementados verificam evidencia sintatica, sem inferir intencao; consulte [sdd/roadmap.md](sdd/roadmap.md) e [sdd/web.md](sdd/web.md).

## Documentacao

- [Linguagem](docs/language.md)
- [API do compiler](docs/compiler-api.md)
- [Pragmas e requisitos](docs/pragmas.md)
- [CLI](docs/cli.md)
- [Como contribuir](CONTRIBUTING.md)
