# Linguagem

## Modo suportado no MVP

Um `.bolhes` pode começar com diretivas `@use <id-ou-alias>` em linhas próprias. Linhas `hot take "texto"` declaram metadados e não geram instruções executáveis. O restante do arquivo é tratado como módulo TypeScript e emitido como JavaScript por `typescript.transpileModule`; `target: "ts"` retorna o corpo TypeScript sem emissão JS.

Exemplo:

```bolhes
@use guara
hot take "localhost nao paga"
export const region = "sa-east-1";
```

O JS emitido preserva o escopo de módulo. Takes ficam no artefato social. Sem pragma explícito, o pragma padrão é `bolha`.

## Ainda não suportado

O lexer/parser próprio Ruby/Python descrito em `spec-driven-development/10-sintaxe-ruby-python.md`, blocos de take, sintaxe `do/end`, lowering de classes/campos e aliases sintáticos opt-in ainda estão pendentes. A implementação atual não transforma sintaxe por substituição textual.
