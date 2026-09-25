# Contribuindo

1. Leia `AGENTS.MD` e o documento pertinente em `sdd/` antes de mudar comportamento.
2. Instale com `pnpm install --frozen-lockfile` e valide com `pnpm test`.
3. Mudança de gramática inclui atualização da spec e um `.bolhes` em `examples/`.
4. Pragma novo exige YAML, entrada em `packages/pragmas/index.yml`, regra objetiva com fixture positiva/negativa e revisão do gesto/recusa.
5. Mantenha APIs internas em inglês e copy/documentação em pt-BR; não invente handles, claims de produto ou treta pessoal.

PR deve descrever os outputs, diagnósticos e limitações que mudaram. Código de diagnostic é contrato estável; texto de humor pode evoluir.
