# Plano de implementação

Backlog inicial. Para cada tarefa, PR deve listar testes/evidências e spec atualizada. Não iniciar tarefa dependente antes do contrato/tipo correspondente estar merged.

## Fase 0 — contrato e scaffolding

### SD-001 — Consolidar contrato da linguagem

- Confirmar herança de JS/TS completo, módulos, JSX/TSX, take como metadado/bloco, aliases opt-in e pragmas sociais.
- Congelar gramática de autoria Ruby/Python (documento 10), fechamento end, retornos, campos e fronteira de regiões nativas.
- Escrever examples mínimos válidos/inválidos.
- Registrar ADR se escolha de parser/output mudar.
- Aceite: duas pessoas predizem o mesmo output sem interpretação ad hoc.

### SD-002 — Criar monorepo mínimo

- Criar package.json root, pnpm-workspace.yaml, scripts reais, TS config, .gitignore.
- Criar packages/shared, pragmas, compiler, cli, examples e sdd canônico.
- Escolher Node LTS, module format, engines e CI.
- Aceite: instalação limpa e build recursivo passam.

### SD-003 — Exports e direção

- Export público por package e workspace dependency explícita.
- Teste de import público.
- Aceite: CLI importa API pública, nunca path interno; sem ciclos.

## Fase 1 — tipos e registry

### SD-010 — Contratos compartilhados

- Definir SourceSpan, Diagnostic, códigos estáveis, PragmaDefinition, RequirementRule, Conflict, SocialArtifact.
- Codes em inglês estáveis, mensagens em pt-BR.
- Aceite: tipos sem ciclo entre packages.

### SD-011 — Schema/validador YAML

- Validar campos, IDs/aliases, kind/handle, gesture, exige, error, refuses, easter_eggs, voice.
- Validar unicidade, destino, regra existente e consistência de matriz.
- Rejeitar typo de chave.
- Aceite: fixture inválida aponta caminho/causa legível.

### SD-012 — Migrar personas

- Criar os 30 registros de 04-pragmas-e-personas.md e aliases confirmados.
- Preservar TBD e sem inventar dados.
- Separar editorial longo do bloco de voz curto.
- Aceite: nenhum ID/alias foi perdido; validator resolve todos; revisão editorial feita.

### SD-013 — Matriz e easter eggs

- Converter matriz base/extra e classificar erro, compatível ou tensão.
- Aceite: pares nas duas ordens passam e ficam determinísticos.

### SD-014 — Registry de runtime

- Build de YAML para JSON/tipos.
- Testar determinismo e fail-fast.
- Aceite: compiler usa registry compilado sem YAML parser no caminho principal.

### SD-015 — Extensibilidade por contrato

- Criar templates de persona/pragma técnico, catálogo de aliases e registry explícito de handlers.
- Contratos genéricos percorrem index.yml; options de regra/transformação validadas.
- Aceite: adicionar fixture de persona/pragma só por dados e exemplos; compiler/CLI/web não mudam.
- Depende de SD-011/014; integrar handler novo somente quando houver comportamento novo.

## Fase 2 — parser e diagnostics

### SD-020 — Posições/diagnostics

- Implementar offset/linha/coluna, CRLF/Unicode, related locations e ordenação.
- Aceite: posições testadas em ASCII, acento, emoji e newline.

### SD-021 — Scanner externo

- Reconhecer directives, nomes, hot take, strings e delimitadores.
- Preservar origem e erros de escape/nome.
- Não reimplementar TS scanner.
- Aceite: suite de lexer passa sem estado global.
- Implementar lexer do dialeto para newline, #, @campo, def e end; scanner JS/TS é usado somente onde a gramática nativa se aplica.

### SD-022 — Normalização com origem

- Remover diretivas/takes de metadados, preservar chaves de take-bloco e normalizar aliases habilitados.
- Cobrir regex, templates, JSX, comentários e decorators sem alterar código base.
- Aceite: documento JS/TS normalizado tem mapa de origem, sem wrapper ou export inventado.

### SD-023 — AST do módulo completo

- Parser base recebe módulo completo; pragmas/takes/aliases ficam em side tables.
- Take não é obrigatório na gramática; regras de bolha checam opinião.
- Aceite: imports, exports, classes, tipos e JSX/TSX são aceitos conforme configuração.

### SD-024 — Aliases de sintaxe

- Implementar perfil opt-in para se -> if e catálogo para novas grafias.
- Provar o normalizador com ambiguidades JS/TS antes de fechar tecnologia em ADR.
- Aceite: keyword original funciona; identificadores comuns sem perfil são preservados; ambiguidades falham claramente.

### SD-025 — Códigos e copy de parser

- Codes para sintaxe externa/body, unknown, duplicata, requisito e conflito.
- Mensagem curta em pt-BR e persona-aware quando possível.
- Aceite: consumers dependem de code, não de piada.

### SD-026 — Parser do dialeto Ruby/Python

- Statements por recursive descent e expressões por Pratt, com precedência documentada.
- def/class/end, if/elif/else, while, for/in, try/catch/finally, async/await e comentários #.
- Aceite: blocos aninhados, multilinha, delimitadores incompletos e palavras em strings têm fixtures.

### SD-027 — Classes e retorno implícito

- AST/lowering de initialize, @campo, attr_accessor, herança/super e tipos.
- Retorno implícito somente em expressão final de def e ramos finais; excluir constructor/finally.
- Aceite: classe da referência executa, campos funcionam, tipos/checker e efeitos conferem com JS equivalente.

### SD-028 — Regiões nativas e modos de arquivo

- syntax bolhes padrão; modos JS/TS/JSX/TSX explícitos e native ts/tsx delimitado.
- Preservar contexto, imports/exports e maps; nenhuma transformação Bolhês dentro da região nativa.
- Aceite: módulo misto com generics/JSX importa pacote e exporta API sem escopo adicional.

## Fase 3 — semântica social

### SD-030 — Resolver pragmas

- Default, @ opcional, case-insensitive, canônico ordenado, duplicate warning, unknown com span.
- Aceite: todos os aliases em testes parametrizados; sem lista duplicada na web.

### SD-031 — Catálogo de regras

- Implementar predicates objetivas: take, tipos, any, funções anônimas, chamadas/membros, URL/número/controle de fluxo e marcadores necessários.
- YAML só seleciona checks e options tipadas.
- Aceite: cada regra tem teste positivo, negativo, invalid options.

### SD-032 — Executar exige

- Coletar facts do módulo completo e executar cada pragma canônico uma vez, sem switch por persona.
- Ligar falha ao code/texto configurado e span razoável.
- Aceite: fixture por persona e resultado determinístico.

### SD-033 — Treta

- Comparar IDs canônicos como pares não ordenados.
- Emitir BOLHES_TRETA_CONFLICT/TretaError com ambos spans.
- Aceite: alias não contorna regra; ordem não muda resultado.

### SD-034 — Easter eggs

- Configuração declarativa baseada em stack/facts suportados.
- Não alterar sucesso/falha; ordenar efeitos.
- Aceite: combinações listadas geram effects esperados sem aleatoriedade.

## Fase 4 — emit/API

### SD-040 — Emit equivalente à linguagem base

- Preservar imports/exports, escopo, this, async e efeitos do programa; metadados ficam em sidecars.
- JS segue opções TS de target/module/JSX; TS preserva tipos e remove extensões.
- Aceite: execução diferencial de fixtures comprova equivalência, sem wrapper run.

### SD-041 — Escaping/determinismo

- Escapar texto, normalizar newline, ordenar dados.
- Testar Unicode, quote, backslash e newline.
- Aceite: bytes idênticos em Windows/Linux.
- Cobrir lowering de AST Bolhês para TS e composição com emissão base, incluindo retorno implícito e campos.

### SD-042 — Quote por take

- Seleção de template do pragma principal e efeitos compatíveis.
- Máximo 2 linhas; sem LLM/fatos inventados.
- Aceite: golden para default, stack, múltiplos takes e easter egg.

### SD-043 — Social JSON/text

- schemaVersion, compilerVersion, pragmas, takes, quotes e easterEggs.
- Excluir timestamp/cwd/path absoluto/secret.
- Aceite: JSON válido e golden estável.

### SD-044 — API compile

- Orquestrar fases, erro de usuário como diagnostic, sem IO/mutação.
- Nenhum output parcial em erro.
- Aceite: API tests e recompile idempotente.

### SD-045 — Source maps

- Compor normalização + emit; remapear diagnostics, checker e stack traces ao .bolhes.
- Aceite: testes em linhas deslocadas, Unicode e CRLF apontam origem correta.

### SD-046 — Adapter de projeto JS/TS

- Ler tsconfig via adapter Node; criar documentos virtuais e usar Program/CompilerHost para checker e emit.
- Resolver módulos .bolhes, misturar .js/.ts/.tsx, bibliotecas npm e imports/re-exports dinâmicos literais.
- Reescrever extensão .bolhes no output para extensão emitida, manter estrutura relativa e suportar .d.ts quando configurado.
- Aceite: projeto com múltiplos arquivos compila/executa; erro de tipo entre módulos é localizado.

## Fase 5 — CLI

### SD-050 — Bin/help

- Bin bolhes, help/version, exit handling.
- Aceite: pnpm bolhes --help após build.

### SD-051 — check

- Ler N arquivos, compilar sem gravar, diagnostics filename:line:column.
- JSON machine-readable.
- --project lê tsconfig e aplica checker da linguagem base; documentar limite da compilação avulsa.
- Aceite: exit 0/1 e IO documentado.

### SD-052 — build

- JS default, --target js|ts, --out-dir, --format human|json.
- Gerar módulo + social JSON + quote text só após sucesso.
- --project usa SD-046 e preserva árvore de módulos; maps/declarations conforme config.
- Aceite: outputs nomeados/documentados.

### SD-053 — personas

- Listar IDs, aliases, gesture e handle status direto do registry.
- Aceite: sem cópia hardcoded.

### SD-054 — CLI multiplataforma

- Temp dirs, espaços/Unicode, multi-input, stdout/stderr, exit codes, atomic outputs.
- Aceite: Windows e Linux CI.

## Fase 6 — examples/documentação/CI/web

### SD-060 — Examples oficiais

- localhost-nao-paga, canon, produto, default, easter egg, invalid fixtures.
- Classe Nome inspirada na referência, função async e projeto misto; registrar demos no catálogo do playground.
- APIs fictícias/dummy values e sem falsas claims.
- Aceite: válidos compilam, inválidos falham esperado.

### SD-061 — Docs

- Quickstart, grammar, API, diagnostics, catálogo, limites sociais e CLI.
- README só documenta comandos implementados; sincronizar SDD/AGENTS references.
- Aceite: usuário compila aplicação comum com imports e entende que compilação não executa código, mas output preserva execução normal.

### SD-062 — CI

- Frozen install, typecheck, build, tests, examples em Node suportado, Windows/Linux.
- Sem publish npm nesta fase.
- Aceite: clone limpo passa; exports resolvem.

### SD-063 — Worker web (consumer separado)

- Bundle compiler/registry sem APIs Node; Worker dedicado.
- Medir gzip/startup/compile e registrar em sdd/web.md.
- Aceite: resultado de fixture é igual na API/CLI e Worker.

## Sequência

SD-001..003 -> SD-010..015 -> SD-020..028 -> SD-030..034 -> SD-040..046 -> SD-050..054 -> SD-060..062 -> SD-063.

Só paralelizar tarefas dentro de fase se contratos/tipos estiverem prontos. Não alterar schema ao mesmo tempo da migração de personas sem coordenar a interface.
