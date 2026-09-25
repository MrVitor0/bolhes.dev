# Contrato da linguagem v1

## Linguagem base e compatibilidade

A sintaxe padrão de autoria agora é inspirada em Ruby/Python: def, class, #, @campo e end. O contrato detalhado e exemplos estão em [10-sintaxe-ruby-python.md](10-sintaxe-ruby-python.md). As formas JS/TS abaixo descrevem o modo de compatibilidade explícito e o destino do lowering; não são a única forma de escrever Bolhês.

Bolhês estende JavaScript/TypeScript. Um arquivo pode conter imports, exports, funções, classes, async/await, generators, loops, tratamento de exceções, objetos, destructuring, tipos, generics e as demais construções suportadas pela versão/configuração do TypeScript adotada. JSX/TSX entra por modo de sintaxe explícito. Não limitar esses recursos a corpos de takes.

A camada Bolhês acrescenta diretivas, takes e aliases; a sintaxe original continua disponível. A compilação preserva escopo, exports, ordem de efeitos, this, controle de fluxo e async do programa equivalente na linguagem base. Nenhum wrapper run ou export bolhes é inserido automaticamente.

A garantia é relativa à versão de TypeScript, tsconfig e runtime escolhidos: APIs de Node, browser, bibliotecas npm e restrições ESM/CJS continuam sendo as desses ambientes. O transpiler não fornece polyfills nem torna uma API de Node disponível no navegador.

## Arquivo e configuração

- .bolhes usa modo bolhes por padrão; opção syntax seleciona bolhes, js, ts, jsx ou tsx. Arquivos JS/TS comuns podem coexistir no projeto.
- Encoding UTF-8; LF e CRLF aceitos.
- Posições públicas: offset UTF-16 e linha/coluna a partir de 1.
- Separar formato de saída (JS/TS) de target ECMAScript, módulo e configuração JSX.
- JS/TS válido sem extensão Bolhês atravessa a normalização sem alteração semântica. A ativação de aliases de linguagem é explícita.

## Uso no modo de compatibilidade TS

~~~bolhes
@use guara

import { deploy } from "./infra.js";

hot take "localhost nao paga";

export async function publicar(region: string): Promise<string> {
  const result = await deploy({ region });
  return result.url;
}
~~~

O resultado TS mantém o import e a função exportada no topo, remove a diretiva/take e gera metadados sociais em arquivo separado. O resultado JS também remove tipos usando o compilador base. Bibliotecas externas seguem sendo imports normais.

## Formas de hot take

Nesta seção, as chaves descrevem o modo JS/TS. No modo Bolhês padrão, newline encerra o take de metadados e do/end delimita o take com bloco, conforme documento 10.

- hot take "texto"; declara metadado social sem criar escopo ou executar código. Pode aparecer entre declarações de módulo ou em posição de statement.
- hot take "texto" { statements } declara o take e conserva um bloco lexical normal no mesmo ponto do programa.
- O bloco executa quando o fluxo normal o alcança; não é adiado para uma função. return/await/break continuam sujeitos ao contexto da linguagem base.
- Imports/exports de módulo ficam no topo normal; um bloco de take não autoriza import/export onde JS/TS não permite.
- Texto deve ser literal não vazio, sem interpolação executável. Adotar strings delimitadas por aspas simples ou duplas e escapes da linguagem base.
- Compilar nunca executa o programa. A presença de take é avaliada estaticamente mesmo dentro de ramo que não execute.

Não é obrigatório ter take para fazer parse. O requisito de opinião é semântico e pertence à persona bolha, não à gramática.

## Gramática do modo de compatibilidade

~~~text
Program       := UseDirective* ModuleItem*
UseDirective  := "@use" PragmaName Newline
ModuleItem    := BaseModuleItem | HotTake
Statement     := BaseStatement | HotTake | EnabledAliasStatement
HotTake       := "hot" "take" StringLiteral (";" | Block)
Block         := bloco da linguagem base, com statements Bolhês permitidos
~~~

Essa EBNF descreve somente extensões do modo compatível. O modo Bolhês tem lexer/parser próprio e lowering para TS; não é mera substituição de tokens. Diretivas de pragma são de arquivo, no cabeçalho antes de código; reconhecer @use sem confundir decorators no modo nativo.

## Aliases de pragma e de sintaxe

São mecanismos diferentes. Alias de pragma resolve nome para ID, como bona -> guara. IDs como 6meses são válidos; @ opcional no nome, comparação sem case, emissão canônica minúscula. Não aproximar grafia.

Alias sintático resolve construção, como se -> if, com perfil habilitado pela configuração ou por pragma que declare essa capacidade. O perfil inicial oferece se (condição) { ... }; if continua válido. Adicionar grafia para uma construção já suportada deve ser uma mudança de dados no catálogo de aliases.

Sem perfil habilitado, identificadores como se continuam identificadores normais de JS/TS. Com perfil habilitado, a grafia fica reservada apenas no contexto declarado. Usos ambíguos entre chamada normal e alias devem produzir diagnostic com orientação para usar a keyword original ou desabilitar o perfil, nunca mudar silenciosamente o programa.

Não substituir texto por regex. Respeitar strings, regex literals, templates e suas interpolações, comentários, propriedades, escopos de tipos e JSX. Contexto de parser é necessário para distinguir divisão de regex e tipos de JSX. A escolha técnica deve ser provada em SD-021/SD-024 com casos de ambiguidade antes de consolidar o parser.

Exemplos legados de personality.md com se sem parênteses e rant sem chamada são notação ainda não especificada. Na migração, adaptá-los à gramática documentada ou adicionar produção e testes explicitamente; não alegar suporte já existente.

## Pragmas e semântica social

- .bolhes sem @use assume bolha, conforme personality.md; pode falhar por ausência de opinião apesar de ser JS/TS sintaticamente válido.
- Módulos .js/.ts convencionais mantêm sua semântica normal, sem receber bolha implicitamente.
- Recursos completos da linguagem base coexistem com restrições deliberadas de personas ativas, como proibição de any por akita.
- Resolver aliases, preservar primeira ordem de declaração e emitir warning por duplicata canônica.
- Primeiro pragma associado a persona fornece voz; pragmas técnicos sem persona não substituem essa voz.
- Requisitos examinam o módulo completo, não somente blocos hot take.
- Takes geram artifacts separados. Sem takes, personas que não exigem opinião podem compilar e gerar artifact com takes vazio; .quote.txt fica vazio.

## Representação interna e origem

Manter AST Bolhês no modo padrão, documento gerado/normalizado na linguagem base e side table de pragmas/takes/aliases com spans originais. Edições/lowering precisam de mapa de posições; offsets deixam de coincidir quando uma construção é removida ou cresce.

Parser diagnostics, requisitos, checker TS e source maps finais devem remapear ao .bolhes. AST público completo não é necessário para a primeira API.

## Critérios de aceite

- Módulo com import/export e execução top-level não sofre mudança de escopo ou execução.
- Código JS/TS e equivalente Bolhês têm mesmo resultado/efeitos em fixtures controladas.
- JSX/TSX, generics, regex, templates, decorators no modo suportado e async possuem casos de compatibilidade.
- Diretivas malformadas, aliases ambíguos e takes incompletos apontam para a origem correta.
- Uma falha de requisito social é distinguível de erro de sintaxe ou tipo.
