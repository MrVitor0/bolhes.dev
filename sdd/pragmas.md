# Pragmas

O index canonico e `packages/pragmas/index.yml`; cada registro vive em `packages/pragmas/personas/<id>.yml`. O build valida o schema e gera `registry.json`, consumido pela API publica de `@bolhes/pragmas`. O catalogo contem os 30 IDs do inventario, aliases confirmados e handles incertos preservados como `TBD` ou `null`.

O validator rejeita chaves desconhecidas, campos ausentes, tipos incorretos, IDs e aliases duplicados, handles invalidos, recusas sem destino, arquivos fora de `personas/` e conflitos duplicados ou autorreferentes. Erros apontam o caminho do campo.

As regras sao declarativas e selecionam predicates com options tipadas. O compiler atualmente executa predicates estruturais sobre o AST do TypeScript e predicates de texto limitado aos takes/comentarios. Essas verificacoes so confirmam evidencia sintatica; nao provam qualidade, receita, retencao, distribuicao real nem qualquer fato externo.

Nem todos os requisitos editoriais estao mapeados. Regras ainda ausentes devem continuar listadas como pendentes, sem substituir inferencia de intencao por heuristicas NLP.
