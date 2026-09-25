# Roadmap

## Implementado

- Workspace pnpm com `shared`, `pragmas`, `compiler` e `cli`.
- Registry canonico YAML, validado no build e compilado para JSON.
- Validacao de campos, tipos, handles, IDs, aliases, recusas, codigos de erro e conflitos.
- API `compile`, extracao de `@use` e `hot take`, resolucao de conflitos e emissao JS via TypeScript.
- Lowering inicial do dialeto: `class`, `def`, `initialize`, `attr_accessor`, `@campo`, `if/elif/else`, `while`, `for/in`, `try/catch/finally`, `end`, comentarios `#`, `nil` e operadores logicos.
- Predicates declarativos para anotacao de tipo, `any`, funcao anonima, chamadas, identificadores, URL, numero, comentario marcador e regras de take.
- CLI `build`, `check`, `personas`, exemplo e sidecars sociais.

## Proximos blocos

1. Completar o parser do dialeto: multilinea, regioes nativas, aliases, implicit return, heranca/super e source maps.
2. Revisar e completar os predicates por pragma com fixtures positivas e negativas.
3. Adapter de projeto TypeScript, resolucao `.bolhes`, checker, maps e declarations.
4. Saida atomica por staging/rename e diagnostics CLI com filename, linha e coluna.
5. CI multiplataforma, documentacao/API e Worker web medido.
