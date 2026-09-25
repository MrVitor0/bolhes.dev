# Adicionar personas, pragmas e aliases

## Contrato de facilidade

Persona ou pragma que reutiliza capacidades existentes entra com arquivo YAML, entrada no index.yml, fixtures e nota no SDD. Não editar parser, pipeline, CLI ou lista React. Nova capacidade sem equivalente existente exige implementação pequena e isolada; não prometer que YAML descreve qualquer algoritmo ou gramática.

| Adição | Mudanças esperadas |
| --- | --- |
| Nome alternativo de pragma | aliases do registro e fixture de resolução |
| Persona com regras existentes | YAML, index, exemplos positivo/negativo, nota editorial |
| Pragma técnico com checks/transformações existentes | YAML, index, fixtures, nota SDD |
| Nova regra de análise | handler + registro explícito + schema de options + testes |
| Nova grafia para sintaxe suportada | catálogo de aliases com contexto + testes de colisão/equivalência |
| Nova construção de linguagem | produção, normalizador/transformação, mapa de origem, spec e testes |

## Dados e interfaces

Manter schema base de PragmaDefinition: id, aliases, exige, error, refuses, easter_eggs, voice, example_error, syntaxProfiles e transformations. Campos opcionais têm defaults explícitos. Persona acrescenta kind, display_name, handle e gesture editorial; pragma técnico acrescenta purpose e não precisa inventar pessoa.

Cada pragma deve produzir efeito verificável: requisito, transformação ou perfil de sintaxe. Apenas mudar cor/texto não satisfaz o contrato do projeto.

Um RuleDefinition registra id, schema das opções e check(context, options), que retorna diagnostics. Context recebe AST, facts, spans e acesso somente leitura ao módulo. Um TransformDefinition registra id, opções e transformação determinística com mapeamento da origem; não carrega código indicado por YAML. Persona seleciona IDs existentes em vez de importar implementações.

O registry de handlers é registro explícito de funções, sem classes-base, container de DI, decorators ou descoberta dinâmica de JavaScript. SOLID aqui significa responsabilidades pequenas e dependência de contratos: pipeline conhece checks/transformações, não nomes de pessoas.

## Fonte única

- index.yml enumera registros oficiais; aliases vivem no arquivo de seu dono.
- Validador gera lookup canônico e aliases; colisão de ID/alias é erro.
- Recusa fica declarada uma vez em um dos registros; build deriva o par simétrico e rejeita classificação contraditória.
- Regras de easter egg têm ID e definição única; demais registros referenciam o ID.
- Catálogo de aliases sintáticos define grafia, construção destino, contexto e perfil que habilita a grafia.
- Compiler, CLI e frontend consomem registry gerado, sem manter listas auxiliares.

Não corrigir todas as features a cada persona adicionada. Testes do registry percorrem automaticamente as entradas novas. Só criar fixture específica onde há comportamento novo ou regra particular.

## Roteiro do contributor

1. Copiar template de persona ou pragma técnico e escolher ID único.
2. Para pessoa, descrever gesto real em uma linha e manter handle incerto como TBD.
3. Reutilizar IDs de regras; declarar options que satisfaçam o schema.
4. Declarar aliases e relações; não adicionar if de pessoa no compiler.
5. Adicionar entrada no index.yml e fixtures de sucesso/falha.
6. Rodar validação, testes do registry e examples; revisar código canônico e copy.
7. Atualizar nota no SDD. Compiler/CLI/web descobrem a entrada pelo mesmo registry.

Templates e uma persona de teste inteiramente adicionada por dados são entregáveis SD-015. Não criar persona pública fictícia para demonstrar extensibilidade; usar fixture marcada como entidade de teste.

## Aliases de linguagem sem perda de JS/TS

Def/class/end e demais construções de autoria estão na gramática padrão de [10-sintaxe-ruby-python.md](10-sintaxe-ruby-python.md). Elas exigem AST/lowering próprios; não são aliases textuais. Perfis adicionam sinônimos a essas produções e aos contextos suportados no modo compatível.

Perfil é opt-in. Keywords originais continuam aceitas, nomes em strings/propriedades/comentários ficam intactos e colisões são diagnostics. Adicionar sinônimo de if usa handler de conditional existente; inventar uma construção com semântica nova exige handler e spec.

O contrato de equivalência compara a saída ao código base esperado. Uma transformação com efeitos adicionais precisa declará-los explicitamente; não introduzir mudança de escopo, atraso da execução ou acesso à rede por ativar uma persona.
