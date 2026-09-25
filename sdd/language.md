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

## Limites atuais

Ainda faltam blocos de take, sintaxe `do/end`, regioes `native ts/tsx`, aliases sintaticos opt-in, retorno implicito, continuacao multilinea e mapeamento completo de origem. A implementacao nao faz substituicao textual global.

## Dialeto Ruby/Python implementado parcialmente

O modo padrao baixa blocos simples de classe e metodo, construtor `initialize`, campos `@campo`, `attr_accessor`, controles `if/elif/else`, `while`, `for/in`, `try/catch/finally`, `nil`, `and/or/not` e comentarios de linha `#`. Cada bloco exige `end`. Veja `examples/ruby-python.bolhes`.

`class Nome < Base` gera `extends Base` e chamadas `super()` continuam como JavaScript normal, mas o compiler ainda nao valida a ordem de inicializacao da classe derivada. Retorno implicito, continuacao multilinea, regioes `native ts/tsx` e mapeamento completo de origem continuam pendentes. Metodos devem usar `return` explicito por enquanto.
