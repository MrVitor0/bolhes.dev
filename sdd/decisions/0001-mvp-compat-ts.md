# ADR 0001: primeiro corte por arquivo em modo de compatibilidade TS

- Status: aceito para o primeiro corte
- Decisão: usar `typescript.transpileModule` para emitir JavaScript de módulos de compatibilidade e manter a API `compile` síncrona e pura.
- Motivo: o checkout não continha monorepo nem compiler; isso entrega um caminho executável sem fingir que o parser Ruby/Python está pronto.
- Consequência: checker entre arquivos, parser próprio, source maps remapeados e sintaxe Ruby/Python permanecem trabalho explícito no roadmap. Não trocar o parser Bolhês por regex.
