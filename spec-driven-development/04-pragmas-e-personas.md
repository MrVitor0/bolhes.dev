# Registry de pragmas, requisitos e artifacts sociais

## Fonte da verdade

Migrar personality.md para arquivos YAML pequenos em packages/pragmas/personas/ e um index.yml. O Markdown atual é material de origem/overview; compiler e web não consomem prosa longa nem mantêm listas duplicadas.

Build lê YAML, valida schema/referências/unicidade e gera registry imutável JSON/tipado. Dado inválido quebra build/test; nunca usar fallback silencioso.

Persona é um perfil editorial com regras de compile; pragma é a unidade ativada por @use e pode representar uma persona ou capacidade técnica. O mesmo registry resolve ambos, sem obrigar pragma técnico a ter biografia. Workflow de extensão e contratos estão em [09-extensibilidade.md](09-extensibilidade.md).

## Inventário

Criar registro por ID canônico abaixo e aliases conforme personality.md; aliases não criam outra persona:

~~~text
bolha, akita, deschamps, deyvin, montano, galego, tranquilao,
real, fitfolio, helio, conty, arara, banhos, otto, vibe, linkedin,
6meses, junior, amargurado, palestrinha, gringa, rustacean,
guara, kubo, dalaz, noctral, himetrica, luke, terron, nort
~~~

Preservar os aliases documentados: curso -> 6meses, akitando -> akita, tabnews -> deschamps, chorume/mano -> deyvin, oficial/acgfbr -> real, gobbi -> fitfolio, dinzo/listamrr -> helio, aliases de infra/craft/mercado e demais mapeamentos do documento.

Dados incertos continuam incertos. otto é arquétipo/stub sem pessoa inventada; dalaz e noctral mantêm handle TBD enquanto personality.md não o cravar. Registrar se registro representa pessoa pública, produto/time ou arquétipo. Não completar fatos por memória.

## Campos obrigatórios

~~~yaml
id: guara
aliases: [bona, guaracloud]
kind: person
display_name: Victor Bona
handle: "@BonaVictor"
gesture: "PaaS brasileira: deploy, região, cobrança ou observabilidade"
exige:
  summary: "a aplicação precisa aparecer fora do localhost"
  rules:
    - id: ast-contains-call
      options: { any: ["deploy", "region", "billing", "observability"] }
error:
  code: IssoNaoSaiDoLocalhost
  message: "mensagem curta em pt-BR"
refuses: [gringa]
easter_eggs: []
voice:
  summary: "bloco curto de voz pública"
  max_error_lines: 1
social:
  quote_templates: ["template revisado"]
example_error: "mensagem de exemplo"
~~~

Exemplo de shape, não texto final. Schema exige id, aliases, kind, gesture, exige, erro canônico, refuses (pode vazio), easter_eggs (pode vazio), voz curta e exemplo de erro. handle aceita valor conhecido, TBD ou null conforme kind; nunca troca TBD por chute.

## Requisitos compiláveis

Cada regra tem ID do catálogo implementado no compiler e parâmetros tipados. YAML não contém código, regex arbitrária ou import executável. Build falha para rule ID desconhecido, options inválidas, referência inválida ou erro canônico duplicado indevidamente.

Regras iniciais operam no AST do módulo completo: take não vazio, funções anônimas, declarações tipadas, any, chamadas/membros com nomes listados, URL literal, número/expressão de métrica, controle de fluxo e prompt/comentário marcador quando aplicável. Chamar checks pelo que realmente observam (ex.: ast-contains-call) em vez de prometer que detectam “produto com retenção”.

Requisito sem evidência sintática confiável não deve virar heurística NLP. Manter intenção em gesture e descrever limitações. Se depender de declaração explícita do autor, abrir ADR e atualizar gramática antes de codar.

## Erros, treta e easter eggs

- Cada erro editorial tem code canônico estável no YAML; texto curto e em voz pública.
- Conflitos são pares não ordenados, independentes da ordem de @use. Alias não contorna conflito.
- Duplicata do mesmo ID após alias gera warning, não conflito.
- Matriz é validada para simetria e consistência; conflito configurado uma vez e referências inversas podem ser geradas.
- Treta incompatível é erro de compilação; easter egg é efeito social compatível e nunca altera validade.
- Easter eggs dependem somente de stack/facts suportados; são determinísticos, afetivos, sem rede/sorteio/alegação factual.

Cobrir matriz base de personality.md e adicionais: guara+gringa, noctral+6meses, nort+banhos, luke+dalaz, himetrica+helio, terron+vibe e kubo+akita. Preservar se cada linha é erro, easter egg ou tensão sem erro.

## Quote-tweet e metadados

Um artifact social por take, em sidecar separado do código. Templates revisados no registry, no máximo duas linhas; escolher pela primeira persona ativa e regras de stack determinísticas. Pragmas técnicos não substituem a voz. Sem persona explícita, usar voz bolha; a ativação de suas regras implícitas segue 02-linguagem-v1.md. Sem take, array vazio quando requisitos permitem. Dinâmicos limitados a texto e facts sintáticos seguros; sem IA/fatos inventados.

~~~json
{
  "schemaVersion": 1,
  "compilerVersion": "workspace-version",
  "pragmas": ["guara", "arara"],
  "takes": [
    { "text": "localhost nao paga", "quoteTweet": "..." }
  ],
  "easterEggs": ["..."]
}
~~~

JSON UTF-8 reproduzível, com ordem definida e sem timestamp, caminho absoluto ou dado da máquina. Também pode ser escrito como .quote.txt.

## Migração

1. Inventariar IDs, aliases, exige, erro, recusa, ama, easter eggs, voz e exemplos.
2. Transcrever sem enriquecer por memória/pesquisa.
3. Marcar kind e incertezas, mantendo TBD.
4. Converter relações para IDs canônicos e validar referências.
5. Checar aliases únicos e matriz consistente.
6. Revisar copy de errors/quotes antes de publicar.
7. Manter personality.md como overview ou marcar que YAML governa compile; evitar edição independente.
