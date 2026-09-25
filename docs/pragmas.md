# Pragmas

A fonte de verdade está em `packages/pragmas/index.yml` e `packages/pragmas/personas/*.yml`. `pnpm bolhes personas` lista os dados carregados pelo mesmo registry usado no compiler e no playground.

Cada registro inclui IDs/aliases, gesto reconhecido, contexto de voz curto, requisitos, recusas e template de quote. Handles incertos permanecem como `TBD`/`null`. A lista não é copiada no React.

As regras atuais são predicates sobre AST do TypeScript, takes ou comentários. Uma regra confirma presença de sintaxe; não verifica métricas, história, qualidade ou uso real de serviço. Requirements novos devem usar fatos verificáveis e fixtures positivas/negativas. A voz dos diagnostics fica em `errorMessage`; códigos de erro são a API estável.

Conflitos são pares não ordenados em `index.yml`; resolver aliases antes de consultá-los garante que aliases não contornem a matriz.
