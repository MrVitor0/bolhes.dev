# API do compiler

```ts
import { compile } from "@bolhes/compiler";

const result = compile(source, {
  filename: "app.bolhes",
  target: "js",
  syntax: "bolhes",
  syntaxProfiles: ["pt-br"],
  sourceMap: true,
});
```

`compile(source, options)` é síncrona e não faz IO. Sucesso retorna `ok`, `code`, pragmas resolvidos, `social`, `diagnostics` e opcionalmente `map`. Falha retorna diagnostics estáveis sem código parcial ou artefatos sociais. O alvo padrão é JS; `target: "ts"` retorna a fonte TypeScript já transformada.

Cada diagnostic tem `code`, `severity`, `message` e, quando há origem, `span` com offset, linha e coluna. Mensagens são pt-BR; consumers devem condicionar comportamento pelo código.

## Limites

O modo arquivo usa `typescript.transpileModule`: ele valida sintaxe, mas não resolve tipos entre módulos. Use `bolhes check --project tsconfig.json` para type-check de projeto. A análise social verifica fatos sintáticos declarados; não executa código nem comprova afirmações de produto ou intenção.
