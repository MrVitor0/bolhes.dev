# CLI, artifacts e entrega

## Comandos planejados

Criar os scripts/bins antes de anunciá-los em README:

~~~bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm bolhes check examples/localhost-nao-paga.bolhes
pnpm bolhes build examples/localhost-nao-paga.bolhes
pnpm bolhes personas
~~~

- check compila em memória, imprime diagnostics e não escreve.
- build emite JS por default; --target ts escolhe TS; --out-dir define destino.
- build/check --project <tsconfig> usam grafo de módulos e checker do TypeScript via adapter Node. Configuração Bolhês adiciona registry/perfis de aliases e modo syntax; configuração base define JSX, módulo e target ECMAScript.
- --format human|json define saída legível ou machine-readable.
- personas lista registry, aliases e status TBD.
- help/version saem antes de ler source.
- --syntax bolhes|js|ts|jsx|tsx seleciona gramática; .bolhes assume bolhes. Esse seletor não muda o target/runtime.
- Não implementar watch, init, playground server, login, deploy ou publish sem requisito aprovado.

## Exit codes

- 0: todos os inputs passaram.
- 1: source tem erro de gramática/pragma/regra/treta.
- 2: uso inválido da CLI ou flag ausente.
- 3: falha local de IO/configuração.
- 70: falha interna inesperada, sem conteúdo sensível.

Com vários inputs, build não deixa sucesso parcial se qualquer um falhar. Escrever temporários e renomear após sucesso, ou preparar todo conteúdo antes de tocar nos destinos.

## Artifacts

Para example.bolhes:

- example.js ou example.ts
- example.social.json
- example.quote.txt

Com source maps habilitados, emitir também .map com origem .bolhes. Se JSX for preservado, usar .jsx/.tsx conforme o formato; declarations .d.ts vêm do modo projeto quando solicitadas. Preservar árvore relativa no outDir e reescrever imports .bolhes para extensão efetivamente emitida.

Detectar colisão de basename entre inputs antes de escrever. Definir overwrite behavior, diretório default e teste; nunca sobrescrever silenciosamente. JSON social versionado, sem timestamp/cwd.

## Release

Packages internos usam versão única inicialmente. Registry e grammar versionam juntos. Mudança de code de diagnostic ou shape social exige compatibilidade documentada; atualizar schemaVersion se contrato público quebrar. npm publish permanece fora do escopo até emit honesto e autorização editorial.
