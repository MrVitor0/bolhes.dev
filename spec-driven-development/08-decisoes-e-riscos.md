# Decisões, riscos e revisão

## Decisões propostas

### D-01 — Extensões pequenas sobre JS/TS completo

Módulo inteiro usa linguagem base; diretivas/takes/aliases são normalizados com mapa de origem. Imports/exports e execução permanecem normais. TypeScript governa AST/checker/emit; prova técnica define normalização contextual sem parser parcial.

### D-02 — Catálogo de aliases opt-in

se é o primeiro alias; novos sinônimos de construções existentes entram no catálogo. Perfil é explícito; keywords originais continuam funcionando. Colisões têm diagnostic e testes, nunca troca silenciosa em texto.

### D-03 — Checks de pragma são sintáticos

Não usar NLP/LLM. Cada check tem nome, parâmetros tipados, implementação, teste e limitação descrita.

### D-04 — YAML validado alimenta runtime

personality.md é material editorial; YAML/index são source of truth do compiler. Dados incertos ficam TBD.

### D-05 — Compile puro e IO na CLI

Ajuda browser worker, testes, determinismo e segurança.

### D-06 — Aparência Ruby/Python, destino JS/TS

Modo bolhes passa a ser padrão, com def/class/end, #, initialize, @campo e retorno implícito definido. End é delimitador; indentação é visual. Parser/lowering próprios implementam essa sintaxe. Modo compatível e regiões nativas preservam acesso a toda a linguagem base. Documento 10 governa essas construções.

## Riscos

| Risco | Mitigação |
| --- | --- |
| TypeScript grande no browser | Worker, medir gzip/startup antes do playground; se exceder limite, ADR para parser leve ou serviço sem bloquear main thread. |
| Heurística social falsa | facts sintáticos, linguagem transparente, sem claims de intenção; fixtures por regra. |
| YAML diverge de personality.md | uma migração, validator, aviso editorial e teste de inventário; definir qual fica como overview. |
| se reescreve identificador válido | scanner token-aware, posição estrita e testes em string/property/comment/var. |
| TypeScript muda diagnostics/output | fixar versão; codes Bolhês próprios; atualizar goldens deliberadamente. |
| Catálogo enorme atrasa MVP | migrar catálogo atual sem expandir; regra objetiva por persona, sem adições agora. |
| Requirements ocultam conflito | diagnostics ordenados e related spans; testar combinação. |
| Build parcial | preparar ou staging + atomic rename; testar falha de IO. |
| Reduzir JS/TS a DSL isolada | fixtures diferenciais, imports/exports top-level, múltiplos módulos e JSX/TSX obrigatórios. |
| Nova persona exige editar o núcleo | registry de handlers, YAML validado e fixture adicionada somente por dados. |
| Parser reconhece extensão dentro de JS válido | prova contextual com regex, JSX, templates/decorators; ADR antes de congelar implementação. |
| imports .bolhes quebram no runtime | adapter de projeto e teste que executa output com specifiers/árvore corretos. |
| Copy inventa fato pessoal | usar somente personality.md; TBD; revisão editorial; sem doxxing ou acusação. |
| Aparência Ruby sugere semântica Ruby | documentar truthiness JS, tipos, retorno e campos; testes diferenciais e exemplos. |
| Parser cresce sem limite | gramática inicial definida, regiões nativas para recursos sem açúcar, handlers separados de persona. |

## ADRs a criar durante scaffolding

1. Node LTS, module format e configuração workspace.
2. TypeScript runtime dependency e limite medido do Worker.
3. Checks objetivos para @akita e requisitos builder atualmente descritos em prosa.
4. Schema de artifact social, naming de arquivos e overwrite.
5. Destino editorial de personality.md.
6. Limites iniciais de tamanho/quantidade de takes.
7. Duplicate @use e ordem de múltiplos pragmas; proposta: warning e ordem preservada.
8. Normalizador contextual, aliases opt-in, composição de maps e resolução de módulos .bolhes.
9. Schema comum de pragmas, especialização de persona e registro de novas regras/transformações.

## Defaults para não bloquear

- Alias aceita @ opcional e emite ID sem @.
- Múltiplos takes permitidos, um artifact por take.
- Erro de usuário retorna diagnostic, não exception; TretaError é code/identidade.
- Sem @use: bolha.
- .bolhes assume dialeto Ruby/Python; JSX/TSX entra por região nativa, módulo importado ou modo explícito.
- Social: JSON versionado e texto simples.
- Templates locais; nenhuma chave/serviço de IA.

## Checklist de spec change

- Token/ordem/sintaxe: atualize 02-linguagem-v1.md, examples e parser tests.
- Semântica de persona: atualize YAML/schema, matriz, fixtures e spec.
- API/diagnostic code: atualize arquitetura e contract tests.
- Output: atualize goldens e schemaVersion se necessário.
- Comando: confirme bin/script real e atualize docs.
- Integração web: registre worker size/performance em sdd/web.md.

## Pronto para implementação

Antes das tarefas dependentes, SD-001 confirma herança de JS/TS, YAML schema, default/treta, aliases opt-in e emissão sem wrappers. SD-021/024 comprovam estratégia de parser; SD-015 comprova extensão por dados. Não é necessário descobrir mais fatos sobre pessoas para começar.
