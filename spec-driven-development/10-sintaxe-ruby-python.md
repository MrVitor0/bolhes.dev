# Sintaxe de autoria inspirada em Ruby/Python

## Direção adotada

Esta é a sintaxe padrão planejada para .bolhes. A referência visual fornecida pelo usuário orienta class, def, initialize, atributos @nome e blocos fechados por end. Python inspira legibilidade, comentários # e condicionais sem parênteses obrigatórios. Runtime, tipos e bibliotecas continuam sendo JS/TS.

Escolha inicial: end fecha blocos; indentação de dois espaços organiza a leitura e não muda o parse. Não aceitar simultaneamente um segundo sistema de blocos por indentação/colon. Isso evita dois dialetos concorrentes. Se fechamento por indentação for desejado depois, exige uma decisão de gramática separada.

## Exemplo canônico

~~~bolhes
@use bolha

hot take "nome completo merece mais que concatenacao no controller"

export class Nome
  attr_accessor :nome, :sobrenome

  # construtor
  def initialize(nome: string, sobrenome: string)
    @nome = nome
    @sobrenome = sobrenome
  end

  def nome_completo(): string
    @nome + " " + @sobrenome
  end
end

const pessoa = new Nome("Ada", "Lovelace")
console.log(pessoa.nome_completo())
~~~

Saída JS conceitual:

~~~js
export class Nome {
  nome;
  sobrenome;
  constructor(nome, sobrenome) {
    this.nome = nome;
    this.sobrenome = sobrenome;
  }
  nome_completo() {
    return this.nome + " " + this.sobrenome;
  }
}
const pessoa = new Nome("Ada", "Lovelace");
console.log(pessoa.nome_completo());
~~~

Pragma/take viram checagens e artefatos separados. O programa conserva exports e execução normal. O desenho não inclui runtime Ruby/Python nem suas bibliotecas padrão.

## Regras da primeira versão

| Construção | Bolhês | Tradução/contrato |
| --- | --- | --- |
| Comentário | # comentário | comentário; # em string não inicia comentário |
| Função | def nome(args) ... end | function nome(args) { ... } |
| Método | def nome(args) dentro de class | método JS; sem function intermediária |
| Função async | async def nome(args) ... end | async function/método |
| Classe | class Nome ... end | class Nome { ... } |
| Herança | class Nome < Base | extends Base; constructor derivado usa super() antes de @campo |
| Construtor | def initialize(args) | constructor; só dentro de class |
| Instância | @campo | this.campo dentro de método; fora dele é erro |
| Atributos | attr_accessor :nome, :sobrenome | campos públicos; não é reflexão/macros Ruby |
| Condicional | if condição ... elif condição ... else ... end | if / else if / else |
| Repetição | while condição ... end | while |
| Iteração | for item in itens ... end | for (const item of itens); arrays iteram valores |
| Exceções | try ... catch erro ... finally ... end | try/catch/finally JS |
| Retorno | return expressão | retorno explícito |
| Nulo | nil | null; undefined continua disponível |
| Operadores | and / or / not | && / || / !, com precedência JS documentada |
| Variáveis | let nome = valor; const nome = valor | binding explícito, escopo lexical JS |
| Coleções | [a, b], { chave: valor } | arrays e objetos JS |
| Módulos | import { nome } from "pacote" | import normal; export def/class/const também permitido |

Statements terminam por newline; semicolons são opcionais. Continuação dentro de (), [] e {} não encerra statement. Fora desses delimitadores, não inferir continuação por indentação. Chamadas usam parênteses inicialmente; def sem parâmetros pode omitir (). Não implementar chamadas Ruby sem parênteses, monkey patching, symbols gerais ou truthiness de Python/Ruby por aproximação.

Expressões usam operadores/valores da linguagem base, incluindo optional chaining e nullish coalescing. Truthiness segue JS, inclusive 0 e string vazia. Palavras de controle originais continuam disponíveis; catálogo de aliases pode oferecer se para if e senao para else no perfil pt-BR, sem duplicar parser.

## Retorno implícito

Em def, a última expressão de um caminho final vira return. Condicional final aplica essa regra a cada ramo; ramo ausente/sem valor retorna undefined. Bloco que termina com declaração, atribuição ou loop não ganha retorno implícito; return explícito permanece disponível.

Não adicionar retorno ao topo do módulo, construtor initialize, bloco hot take ou finally. Métodos async mantêm a mesma regra sob semântica de Promise. Testar efeitos e exceções para não executar expressão duas vezes. to_s é nome de método comum; não vira toString automaticamente.

## Campos e tipos

attr_accessor aceita nomes :identificador apenas nessa produção; não cria tipo Symbol. @nome representa campo público nome. Para saída TS, inferir tipo de atribuições diretas do initialize quando inequívocas (como parâmetros tipados no exemplo); oferecer anotação explícita na declaração do atributo, por exemplo attr_accessor :nome as string.

Sem inferência segura em modo strict, pedir anotação com diagnostic; não injetar any silenciosamente. Campos seguem regras de inicialização do checker TS. Getter/setter com lógica própria pode ser escrito pelo caminho nativo JS/TS. Anotações de parâmetros/retorno e generics usam tipos TypeScript; tipos complexos mantêm acesso pela interoperabilidade nativa.

## hot take e pragmas

~~~bolhes
hot take "deploy sem log vira adivinhacao"

hot take "agora tem observabilidade" do
  const result = await deploy()
  console.log(result.url)
end
~~~

Forma de uma linha registra metadado; do/end abre bloco lexical executado no lugar em que aparece. Exigir contexto async apropriado para await. @use segue como diretiva de cabeçalho. O lexer distingue @use no cabeçalho e @campo dentro de método; não tratar todo @ como pragma.

## Acesso a toda a linguagem base

O autor pode misturar módulos .bolhes e .js/.ts/.tsx, importar pacotes npm e usar modo de arquivo explicitamente js/ts/jsx/tsx quando quiser sintaxe original.

No modo Bolhês, native ts { ... } ou native tsx { ... } introduz região com gramática original. As chaves delimitadoras pertencem à região e não criam escopo extra: os itens internos são inseridos no mesmo contexto de módulo/statement. Imports/exports só são permitidos no topo. Não aplicar #, @campo, aliases ou retorno implícito dentro da região.

Essa região é a saída explícita para qualquer recurso da linguagem base ainda sem açúcar Bolhês, como JSX, decorators, generators ou tipos avançados. TypeScript analisa seu conteúdo; o lexer precisa respeitar comentários, strings, templates, regex e JSX ao localizar a fronteira. Não usar split por end ou substituição global.

Garantia de capacidade: todo recurso suportado pela configuração JS/TS permanece acessível. Isso não exige inventar uma grafia Ruby para cada recurso na primeira versão.

## Implementação e aceites

Lexer próprio reconhece newline, #, end, @campo e palavras do dialeto. Parser produz AST Bolhês; lowering gera módulo TS equivalente com posições de origem. O parser TS continua responsável pelas regiões nativas, análise da saída e type checking. Não tentar implementar def/end através de aliases textuais.

Parser inicial: recursive descent para statements e Pratt para expressões do dialeto, com operadores/precedência documentados e leitura de regiões nativas delegada. Dependência de parser só entra se prova técnica justificar complexidade; registrar decisão em ADR.

- Fixture da classe Nome compila e executa, retorna nome completo e aceita mutação de campos.
- Testar nested end, end ausente/excedente, # dentro de string, LF/CRLF e expressões multilinha.
- Testar initialize, herança/super, this, campos tipados e erro de @campo fora de método.
- Testar retorno implícito, caminhos condicionais, async e exclusões de constructor/finally.
- Testar operadores e truthiness contra JS equivalente; não contra runtime Ruby/Python.
- Testar imports npm, projeto misto, região native com JSX/generics e source maps.
- Formatter/editor planejam indentação de dois espaços e destaque da gramática real.

O arquivo de exemplo executável entra em examples/ e no catálogo do playground na tarefa SD-060; os blocos acima são especificação, não código implementado.
