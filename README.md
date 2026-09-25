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

A API publica `compile(source, options)` e o CLI suportam o modo de compatibilidade JS/TS, diretivas `@use` e takes `hot take`. O registry canonico YAML contem os 30 pragmas; o build valida os dados e gera JSON. Regras declarativas aplicam predicates estruturais a um subconjunto de personas.

O parser Ruby/Python completo, projeto multi-arquivo, source maps remapeados e Worker web ainda estao pendentes. O registry documenta gestos e exemplos, mas os predicates implementados so verificam evidencia sintatica; consulte [sdd/roadmap.md](sdd/roadmap.md).
