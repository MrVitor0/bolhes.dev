# AGENTS.md — Bolhês

Instruções para humanos e LLMs que trabalham neste repositório.

## O que é o Bolhês

Bolhês é uma linguagem meme open source da bolha dev brasileira. O código parece um take de Twitter; o transpiler o converte em JS/TS e gera um quote-tweet no tom da persona ativa.

- Site: <https://bolhes.dev>
- Extensão: `.bolhes`
- CLI prevista: `bolhes`, `npx bolhes`, `bolhes build`

Cada `@use` / pragma precisa representar um gesto real da pessoa: o que ela posta ou construiu. O resultado deve reconhecer o trabalho da pessoa, não apenas usar um nome conhecido.

## Escopo

- Transpiler: parser → AST → checagem de pragmas → JS/TS + artefatos sociais.
- Site React com playground e demos.
- Spec viva em `sdd/` e personas em YAML.
- Monorepo único para frontend, compiler, CLI, docs e SDD.

O projeto é open source. Código, issues e tom devem poder ser lidos pela própria bolha sem constrangimento barato.

## Monorepo

```text
/
  AGENTS.md
  llms.txt
  README.md
  package.json
  pnpm-workspace.yaml
  apps/web/                  # React — site bolhes.dev
  packages/compiler/         # parser, typecheck social, emit
  packages/cli/              # bolhes / npx bolhes
  packages/pragmas/          # YAML de personas + schema
  packages/shared/           # tipos, matriz de treta, constants
  sdd/                       # spec, decisões, roadmap
  docs/
  examples/                  # demos .bolhes
```

- O app usa a API pública do compiler, nunca a implementação interna.
- O schema de pragma vive em `packages/pragmas` ou `packages/shared`; compiler e web compartilham a fonte.
- Não duplique a lista de personas no frontend.
- Packages internos versionam juntos inicialmente. Sem micro-publish prematuro.

## Transpiler

### Pipeline mínimo

1. Lex / parse de `.bolhes`.
2. Resolver pragmas (`@use` e aliases).
3. Validar requisitos da persona (`exige`).
4. Aplicar matriz de treta.
5. Emitir JS/TS, diagnostics no tom da persona e quote-tweet / artefato social.

Easter egg só entra quando o stack é compatível de verdade.

### Regras obrigatórias

- Pragma muda a compilação; não é comentário.
- Treta incompatível é erro de compile: `TretaError` ou nome estável definido no SDD.
- Output social é artefato de build.
- Nome estável de erro vale mais que piada nova a cada commit.

```bolhes
@use guara

hot take "localhost nao paga" {
  // corpo
}
```

Se mudar a gramática, atualize `sdd/` no mesmo PR.

## Frontend (`apps/web`)

React. O site é playground + demos.

Versão útil inicial:

- Editor de `.bolhes`.
- Seletor / chips de pragma.
- Painel de JS/TS emitido.
- Painel de erro na voz da persona.
- Painel de quote-tweet.
- Demos em `examples/`, sem hardcode duradouro em componente.

Não inclua secret de LLM no bundle. Chamadas de modelo passam por backend ou edge com env de servidor.

Se o compiler rodar no browser, isole-o em worker e registre WASM / bundle size no SDD antes de bloquear a main thread.

## SDD

O projeto é spec-driven. Leia o SDD relevante antes de criar uma feature.

| Caminho | Conteúdo |
| --- | --- |
| `sdd/vision.md` | o que é e o que não é |
| `sdd/language.md` | gramática, keywords, `@use`, takes |
| `sdd/pragmas.md` | mapeamento pelo gesto, não fofoca |
| `sdd/compiler.md` | pipeline, diagnostics, emit |
| `sdd/treta.md` | conflitos e easter eggs |
| `sdd/web.md` | playground e demos |
| `sdd/decisions/` | ADRs curtos |
| `sdd/roadmap.md` | roadmap |

Se código e SDD divergem, corrija o código ou atualize o SDD no mesmo PR.

## Personas e pragmas

Fonte da verdade: YAML por persona + `index.yml`. Markdown é overview humano; contexto de compile/playground não deve receber um tratado de 80 KB no system prompt.

Cada pragma precisa de:

- `id` e aliases;
- `exige` (gesto de compile);
- erro canônico;
- recusas / conflitos;
- `easter_egg`;
- bloco curto de voz;
- exemplo de erro.

Se não der para dizer em uma linha o que a pessoa construiu, não crie o pragma.

Canon e circuito builder entram. Roasts são afetuosos. Sem doxxing, ataque à vida pessoal ou treta inventada. Handles incertos usam `handle: TBD` no YAML; nunca chute um handle.

## Variáveis, secrets e config

- Nunca commite `.env`, tokens, service accounts, chaves de IA, cookies de preview ou deploy tokens.
- Use `.env.example` com nomes falsos e comentários.
- Use prefixo `BOLHES_`; apenas `BOLHES_PUBLIC_*` vai ao client.
- Não logue env, header `authorization`, API key ou body de webhook.
- Nunca coloque secret numa mensagem de erro do compiler.
- Fixtures e demos usam valores dummy, como `pk_test_xxx` e `user_demo`.
- Produção: `bolhes.dev`. Preview não herda secret de produção sem necessidade.

Se for necessária uma chave para gerar copy, peça env local. Não inclua fallback oculto.

## Como trabalhar

1. Leia este arquivo, `llms.txt` e o SDD relevante.
2. Faça mudança pequena e local; não refatore o monorepo por conveniência.
3. Use nomes estáveis em inglês no código (`pragma`, `emit`, `TretaError`) e voz em pt-BR.
4. Inclua teste: parse, pragma, treta e emit.
5. Demo nova exige arquivo em `examples/` e entrada no playground.
6. Persona nova exige YAML, index e nota no SDD; não use string solta no React.
7. Dependência pesada exige ADR de uma página.

## Tom do projeto

O projeto convida quem foi mapeado a entrar na brincadeira. A piada reconhece trabalho concreto: PaaS, scaffold, design, analytics, recruiting etc.

Sem capacitismo, piada de aparência ou briga privada. Erro de compiler pode ser ácido; documentação é clara e adulta.

## Fora de escopo

- Backend social real ou login obrigatório.
- Marketplace de pragma da comunidade sem schema.
- Publicar packages no npm antes de o emit JS estar honesto.
- Copiar outra linguagem meme e trocar apenas o nome.

## Definition of done

- Compila no monorepo.
- Tem teste ou example `.bolhes`.
- SDD atualizado quando uma regra muda.
- Nenhum secret novo sem `.env.example`.
- Frontend usa o package, sem cópia de implementação.
- Erro soa como a persona, não como `Error: invalid`.

## Comandos

Documente no `README` apenas comandos reais.

```bash
pnpm install
pnpm dev          # site
pnpm build
pnpm test
pnpm bolhes build examples/localhost-nao-paga.bolhes
```

Se o comando ainda não existe, crie o stub no CLI antes de anunciá-lo no README.
