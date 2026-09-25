# Roadmap

## Implementado

- Workspace pnpm com `shared`, `pragmas`, `compiler` e `cli`.
- Registry canonico YAML, validado no build e compilado para JSON.
- Validacao de campos, tipos, handles, IDs, aliases, recusas, codigos de erro e conflitos.
- API `compile`, extracao de `@use` e `hot take`, resolucao de conflitos e emissao JS via TypeScript.
- Predicates declarativos para anotacao de tipo, `any`, funcao anonima, chamadas, identificadores, URL, numero, comentario marcador e regras de take.
- CLI `build`, `check`, `personas`, exemplo e sidecars sociais.

## Proximos blocos

1. Scanner/parser do dialeto Ruby/Python, lowering e mapas de origem.
2. Revisar e completar os predicates por pragma com fixtures positivas e negativas.
3. Adapter de projeto TypeScript, resolucao `.bolhes`, checker, maps e declarations.
4. Saida atomica por staging/rename e diagnostics CLI com filename, linha e coluna.
5. CI multiplataforma, documentacao/API e Worker web medido.
