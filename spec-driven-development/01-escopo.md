# Visão, escopo e conclusão

## Problema

Bolhês é uma linguagem meme open source da bolha dev brasileira. Um arquivo .bolhes combina pragmas, takes curtos e corpos com sintaxe de programação. O compiler valida a composição social declarada e transforma o arquivo em módulo JS ou TS válido. A compilação também produz quote-tweets e metadados determinísticos.

O pragma altera semântica da compilação: escolhe regras, diagnostics, voz e contribuição para o artifact social. Não é comentário nem skin.

## Objetivos v1

1. Definir uma camada pequena de extensões sobre a gramática JS/TS, com erros localizados por linha e coluna.
2. Resolver IDs e aliases a partir de registry compartilhado e validado.
3. Aplicar requisitos determinísticos, conflitos explícitos e easter eggs compatíveis.
4. Herdar recursos de JS/TS e emitir módulos equivalentes, preservando imports/exports, escopo e execução, sem wrappers automáticos.
5. Produzir quote-tweet/social metadata como saída normal de build, sem LLM/rede.
6. Expor API pública simples para CLI, testes e consumidor web.
7. Cobrir comportamento por unit, integration, golden examples e testes da CLI.
8. Migrar todas as personas em personality.md sem inventar handles ou biografias.
9. Adicionar personas/pragmas declarativos por YAML + index + fixtures, sem editar o pipeline.
10. Compilar projetos com múltiplos módulos, bibliotecas npm, tsconfig, JSX/TSX e source maps; delegar type checking ao TypeScript.
11. Oferecer sintaxe padrão semelhante a Ruby/Python: def/class/end, #, atributos @campo e retorno implícito controlado. Manter linguagem base acessível por regiões nativas e módulos mistos.

## Fora de escopo v1

- Criar uma implementação própria da semântica/checker/runtime de JS/TS; esses comportamentos são herdados da linguagem base.
- Avaliação semântica do texto, detecção de opinião por modelo ou geração de copy online.
- Login, backend, publicação automática, marketplace de pragmas e publicação npm.
- Macros arbitrárias, plugins executáveis de terceiros ou loading dinâmico de código de persona.
- Inferência factual sobre pessoas ou pesquisa para preencher handles.
- Refatoração do frontend antes de existir a API pública.

## Definition of functional

- Exemplos oficiais compilam de ponta a ponta.
- Sintaxe inválida e incompatibilidades retornam diagnostics estáveis/localizados.
- Todos os IDs/aliases cadastrados resolvem; default, requisitos e treta são determinísticos e independentes da ordem.
- Cada regra declarada tem validador registrado e casos positivos/negativos.
- JS emitido parseia como JavaScript; TS emitido parseia como TypeScript.
- Artifacts são reproduzíveis byte a byte para a mesma entrada e versão dos dados.
- CLI só grava após compilação sem erro, usa exit codes úteis e não deixa arquivo parcial em falha.
- Build e testes passam em ambiente limpo.
- Compiler não depende de filesystem, env, rede ou estado mutável para compilar.
- Registry valida schema, referências, aliases únicos e regras implementadas.
- Compatibilidade JS/TS é demonstrada por execução diferencial de fixtures controladas e projeto com imports, pacote npm e JSX/TSX.
- Classe com initialize/attr_accessor e função def compilam do dialeto para código JS/TS equivalente conforme documento 10.
- Contributor adiciona persona/pragma com regras existentes sem alterar compiler, CLI ou frontend; checks automáticos descobrem o registro.

## Limite das checagens sociais

O compiler valida evidência estrutural declarada no AST, não se o software realmente entrega valor, tem usuários, faturamento, qualidade visual ou segurança. Uma chamada como produto.mrr pode satisfazer um marcador sintático de métrica, mas não prova receita. Documentar esse limite. Evitar palavras-chave secretas para “enganar” o compiler.
