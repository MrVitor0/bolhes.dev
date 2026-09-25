# Bolhês

Bolhês é um dialeto de autoria para programas JS/TS, com pragmas sociais e artefatos de quote-tweet determinísticos.

## Requisitos

- Node.js 20 ou superior
- pnpm 10

## Começar

```sh
pnpm install
pnpm build
pnpm bolhes --help
pnpm bolhes personas
pnpm bolhes build examples/localhost-nao-paga.bolhes --out-dir dist
```

`bolhes build` gera o módulo JavaScript, um arquivo `.social.json` e um `.quote.txt` depois de uma compilação sem erros. `bolhes check` valida sem gravar os artefatos. Use `--target ts` para preservar o TypeScript.

## Estado do compiler

A API `compile(source, options)` e o CLI suportam atualmente a sintaxe de compatibilidade JS/TS, diretivas de cabeçalho `@use` e takes de metadado `hot take "..."`. O compiler remove essas declarações e emite o módulo usando o transpiler do TypeScript. O registry contém os 30 IDs do inventário do plano.

A sintaxe padrão Ruby/Python (`def`, `class`, `end`, `@campo`), checagens específicas de requisitos além de take obrigatório, projeto multi-arquivo, source maps remapeados e Worker web ainda não estão implementados. Consulte [`sdd/roadmap.md`](sdd/roadmap.md).
