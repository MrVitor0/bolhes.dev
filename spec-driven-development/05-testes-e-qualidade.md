# Estratégia de testes e qualidade

## Ferramentas

Vitest para unit/integration/golden; TypeScript checker; API do TypeScript compiler para parse de body/output; fixtures .bolhes versionadas. Não adicionar framework de property testing inicialmente. Casos tabulares bastam; fuzz/property tests entram quando bug indicar. Testes rodam offline, sem internet/modelo.

Este é trabalho de planejamento: não executar testes enquanto código não existe. Ao implementar, rodar comandos reais de package.json e não anunciar script ausente.

## Testes unitários do lexer/parser

- @use, nomes começando com dígito, strings e escapes, Unicode, comentários, LF/CRLF e blocos aninhados.
- Chaves em strings, template strings e comentários não fecham take.
- se traduz em statement e não em string, comentário, propriedade/nome local.
- Sem pragma, stacks, takes múltiplos, whitespace, spans e EOF em cada ponto incompleto.
- Erro TS dentro do body remapeado para .bolhes.
- Parser não trava em input curto/adversarial; limites são opções explícitas aplicáveis pela CLI e pelo Worker.

## Testes de registry e análise

- ID, cada alias, case-insensitive, @ opcional, default bolha, unknown.
- Alias colidente rejeitado; destino inexistente falha; duplicata canônica gera warning.
- Cada rule: positivo, negativo e options inválidas.
- Cada persona tem regra válida, erro e fixture smoke aprovada.
- Cada conflito em ambas as ordens retorna BOLHES_TRETA_CONFLICT com spans relacionados.
- Pares compatíveis/easter eggs passam e são determinísticos.
- Códigos estáveis mesmo se frase de humor mudar.

## Testes do emitter/social

- Golden pequeno de JS/TS para exemplos canônicos; sem paths absolutos.
- Parse de output JS/TS pela TypeScript API.
- Escaping: Unicode, acento, emoji, aspas, backslash e newline.
- Body preservado semanticamente; se vira if apenas no lugar certo.
- Compile não executa o programa; código emitido mantém efeitos top-level e não recebe wrapper run.
- Recompilação produz mesmos bytes.
- Cada take tem artifact; erro fatal não tem output; quote tem até duas linhas.
- JSON sem timestamp, cwd, env, secret ou source inteiro.

## Integração CLI

- build válido escreve JS/TS e sidecars; check não escreve.
- Arquivo inexistente, erro de encoding/sintaxe/regra/treta tem exit code documentado; diagnóstico em stderr.
- --target, --out-dir e --format json são testados.
- Falha não deixa output parcial: preparar todos conteúdos antes de gravar ou staging + rename.
- personas reflete registry, sem lista hardcoded.
- Caminhos com espaço/Unicode em Windows e POSIX.

## Fixtures e coverage

- Exemplo válido para bolha, canon, builder, default e stack com easter egg.
- Um fixture por pragma migrado valida sua regra principal sem inventar fatos.
- Fixtures inválidas para parser, unknown pragma, requisito e cada família de treta.
- Exemplos válidos compilam; inválidos falham pela razão esperada.
- Usar valores dummy como pk_test_xxx/user_demo; nunca segredo real.
- Meta inicial: >=90% branches em resolver, requisito e matriz; sem perseguir coverage de wrappers CLI.
- Bug corrigido ganha regression test. Não snapshottear humor como único contrato; testar code/span.

## Gates por PR

1. pnpm install --frozen-lockfile.
2. Build recursivo e typecheck.
3. Unit/integration.
4. CLI compila válidos e rejeita inválidos.
5. Lint/format só se configurado; não criar duas ferramentas concorrentes.
6. Mudança gramatical inclui spec e example.
7. Antes da integração web, registrar bundle/performance do Worker em sdd/web.md.

Comandos só entram no README depois de os scripts existirem.

## Compatibilidade com a linguagem base

- Corpus JS/TS sem extensões atravessa o normalizador sem mudança semântica. Validar esse contrato separadamente das regras de bolha.
- Para cada extensão, compilar uma versão Bolhês e equivalente JS/TS manual; executar somente fixtures controladas e comparar exports, valores, exceções e ordem dos efeitos.
- Cobrir imports/exports, import() literal, re-exports, classes/this, closures, generators, async/await, top-level await onde permitido, loops, return/break, destructuring, generics, types e JSX/TSX.
- Casos lexicais incluem regex/divisão, templates interpolados, comentários, nomes em propriedades e decorators no modo suportado.
- Alias desabilitado preserva identificador comum; habilitado transforma somente contexto definido; ambiguidade tem diagnostic.
- Fixture de projeto mistura .bolhes, .ts/.js e dependência npm instalada por lockfile. check encontra erro de tipo entre módulos; build executa o output com imports válidos.
- Mapear sintaxe, erro de tipo e stack trace de fixture ao .bolhes, incluindo Unicode e CRLF.

## Extensibilidade como critério de produto

- Fixture de registry acrescenta persona/pragma/alias apenas por dados. compile, CLI e listagem web descobrem o registro sem editar seus fontes.
- Novo check é handler isolado com options validadas; nenhum switch central ganha caso por persona.
- Contratos genéricos percorrem index.yml automaticamente e exigem exemplo positivo/negativo para cada registro.
- IDs, aliases e perfis conflitantes falham na validação, com localização no YAML.

## Dialeto Ruby/Python

- Parser: def/class/end, # versus strings, @use versus @campo, blocos aninhados, newline/multilinha e end ausente/excedente.
- Classes: initialize, attr_accessor, tipos explícitos/inferidos, this e super antes de acesso aos campos.
- Retorno implícito: expressão final, ramos finais, undefined em ramo sem valor, async e nenhum retorno inserido em constructor/finally.
- Execução diferencial da classe Nome e funções/loops/exceções; sem avaliação duplicada.
- Regiões native ts/tsx com código complexo; ausência de transformação em strings/regex/JSX.
- Verificar que indentação organiza visualmente, mas somente end fecha bloco; syntax bolhes é o default.
