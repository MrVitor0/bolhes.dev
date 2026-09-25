# Roadmap

## Implementado

- Workspace pnpm com `shared`, `pragmas`, `compiler` e `cli`.
- Registry canônico YAML, validado no build e compilado para JSON; templates e validação de campos, aliases, handlers e conflitos.
- API `compile`, pragmas e takes, resolução de conflitos, regras declarativas e artefatos sociais.
- Lowering Ruby/Python inicial com classes, métodos, campos, condicionais, loops, exceções, operadores, perfil `pt-br` e retorno implícito de expressão final.
- Regiões multiline `native ts { ... }` preservadas sem lowering interno.
- CLI de arquivos e projetos TypeScript, checker entre módulos `.ts` e `.bolhes`, imports/re-exports/dynamic imports literais, emissão social, declarations e mapas de origem, staging de outputs e diagnostics com posição.
- App React/Vite com editor, seletor de pragmas, demos vindas de `examples/`, JS, diagnostics e quote-tweet; compilação executada em Worker.
- Testes unitários e de integração via `node:test`; workflow CI configurado para Node 20/22 em Windows e Linux.

## Pendências

1. Completar parser e mapeamento de origem para statements multilinha, escapes, regiões `native tsx`, JSX/TSX, diagnóstico do checker e stack traces.
2. Completar as regras de requisitos por pragma e cobrir options inválidas e fixtures positivas/negativas para o catálogo inteiro.
3. Checagem de herança/`super`, atributos tipados e equivalência diferencial do lowering.
4. Adapter de projeto: ampliar testes de execução de projetos mistos e documentar exceções do emit (`outFile` com `.bolhes`).
5. Expandir o catálogo para easter eggs reais quando seus predicados forem definidos; exemplos, documentação de API/gramática/diagnostics e contribuição têm cobertura inicial.
6. Playground está integrado em Worker; medir startup/latência no browser e adicionar parity tests, limite de entrada, cancelamento, highlighting e acessibilidade.

## Ordem de trabalho

1. Estabilizar gramática, spans, parser e source maps.
2. Cobrir predicates, conflitos e fixtures de personas.
3. Ampliar testes de execução de projetos mistos e verificar a CI Windows/Linux nos primeiros pushes.
4. Expandir exemplos e predicates de easter egg somente quando houver dados/predicados justificáveis.
5. Medir latência em browser real, limitar/cancelar trabalho do Worker e completar acessibilidade do playground.
