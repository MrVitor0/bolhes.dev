# Linguagem

Arquivos `.bolhes` são módulos JavaScript/TypeScript com uma camada de autoria opcional. `@use` e `hot take` são metadados; as linhas restantes preservam semântica JS/TS, exceto pelas construções Bolhês documentadas abaixo.

## Primeiro programa

```bolhes
@use bolha

hot take "localhost nao paga"

export def deploy(region: string): string
  const endpoint = `https://${region}.example.test`
  endpoint
end
```

`def` vira função, `class` vira classe, `end` fecha blocos e `#` inicia comentário. `initialize` dentro de classe vira construtor; `@campo` em métodos vira `this.campo`. `if/elif/else`, `while`, `for item in items`, `try/catch/finally`, `nil`, `and`, `or` e `not` são reduzidos para a sintaxe JS equivalente. `class Child < Base` gera `extends Base`.

Expressões JS/TS continuam disponíveis. A última expressão de `def` vira retorno; isso vale para os ramos finais de `if/else`. Use `return` para outras formas de controle de fluxo. Statements separados por linhas não são concatenados automaticamente, então quebre expressões longas dentro de delimitadores `()`, `[]` ou `{}`.

`native ts { ... }` protege uma região TypeScript contra as transformações Bolhês; o wrapper é removido. JSX/TSX em `.bolhes` ainda não é suportado.

## Pragma e take

`@use <id-ou-alias>` só vale no cabeçalho e pode repetir com warning. Sem diretiva, o compilador ativa `bolha`. `hot take "texto"` registra opinião para requisitos e artefatos sociais. O compiler não executa o código nem chama modelos de linguagem.

O profile opt-in `pt-br` habilita `se` e `senao` em statements. A forma original `if/else` sempre funciona.
