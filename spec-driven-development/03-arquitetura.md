# Arquitetura e API pública

## Pipeline

~~~text
source + options
  -> resolve diretivas e perfis de extensão
  -> lexer/parser Bolhês (ou normalizador no modo JS/TS explícito)
  -> lowering para módulo TS com mapa de origem
  -> parse do módulo completo pela linguagem base
  -> coleta facts do AST
  -> aplica requisitos
  -> aplica treta/easter eggs
  -> sem erros: emite JS/TS + artifacts sociais
  -> CompileResult
~~~

Não emitir com erro. Warnings não bloqueiam output. Cada fase é função isolada, recebe dados explícitos e não altera AST compartilhada.

## Packages

### packages/shared

Tipos compartilhados de spans, diagnostics, códigos e constantes usados por mais de um package. Sem parser, filesystem ou cópia de personas.

### packages/pragmas

YAML de personas/pragmas, catálogo de aliases de sintaxe, index.yml, schema/validator e build de registry imutável tipado/JSON. Compilar tudo em um registry com namespace de IDs único. A matriz de treta/easter eggs é derivada dessas declarações, sem cópia manual. CLI e web nunca leem YAML por conta própria.

### packages/compiler

API pública, lexer/parser Bolhês, lowering, resolução, validação, diagnostics e emit. Módulos pequenos: lexer, parser, lowering, normalizer, pragma-resolver, facts, requirements, treta, emitter, social-artifacts. Facts usam AST do módulo JS/TS completo e origem Bolhês. Nova persona configurável não exige editar pipeline; nova regra exige handler registrado e testes. Sem dependência de CLI ou React.

### packages/cli

Comandos, IO e console. Toda compilação passa pela API pública. Sem lista de persona ou regra gramatical copiada.

### examples

Exemplos válidos e inválidos compartilhados pela documentação e testes golden.

## Dependências propostas

| Dependência | Uso | Limite |
| --- | --- | --- |
| TypeScript | parser/runtime do compiler e tooling | Parser/checker/emitter da linguagem base, configuração de projeto e modo JSX/TSX; fixar versão. Não implementa a gramática Bolhês por si só. |
| yaml | build/test de pragmas | Ler fonte YAML; não precisa ir ao bundle runtime se registry JSON for gerado. |
| zod | validação de dados de persona | Usar no build/validator; evitar carregar no runtime se dados já estiverem validados. |
| Vitest | testes | Unit, integration e golden em TS. |
| Commander | CLI | Só para parsing de subcomandos/help; Node argv manual é alternativa se CLI ficar trivial. |

Usar pnpm conforme AGENTS.MD. Começar com tsc para build dos packages. A prova do normalizador deve decidir se APIs públicas do TypeScript bastam para reconhecer extensões sem corromper JS/TS. Se exigirem parser extensível ou biblioteca de source maps, justificar em ADR e adicionar somente a dependência necessária. Evitar fork privado do parser TS e substituição por regex. Escolher Node LTS, module format e engines no scaffolding.

Para a sintaxe Ruby/Python, usar parser próprio de statements e expressões conforme documento 10, sem tentar fazer o TypeScript reconhecer def/end. O normalizador acima atende ao modo compatível e às regiões nativas; o lowering converte AST Bolhês em construções da linguagem base.

## Direção de dependências

shared não depende de compiler/web/cli. pragmas publica dados/tipos validados. compiler depende de shared e registry. cli depende da API pública de compiler. web depende da API pública e roda processamento em Worker. Consumidores não importam paths internos do compiler.

## API proposta

~~~ts
export type CompileOptions = {
  filename?: string;
  target?: "js" | "ts";
  syntax?: "bolhes" | "js" | "ts" | "jsx" | "tsx";
  syntaxProfiles?: readonly string[];
  registry?: Registry;
  compilerOptions?: BaseCompilerOptions;
};

export type CompileResult = {
  ok: boolean;
  code?: string;
  target: "js" | "ts";
  pragmas: string[];
  social?: SocialArtifact;
  map?: string;
  diagnostics: Diagnostic[];
};

export function compile(
  source: string,
  options?: CompileOptions,
): CompileResult;
~~~

compile é síncrona e pura; não lança para falhas esperadas do usuário e não retorna code/social se houver erro. Exceções internas inesperadas podem escapar; CLI captura como falha interna sem expor env/secrets. Começar só com compile; não publicar funções extras por antecipação.

Registry é validado e imutável, com default oficial; sua injeção permite testar novas personas sem alterar globals. BaseCompilerOptions é a projeção documentada de opções TS aplicáveis à compilação de arquivo, incluindo target ECMAScript, módulo, JSX e source maps.

compile faz transformação por arquivo e diagnostics sintáticos/sociais; não promete checagem de tipos entre arquivos. build/check de projeto usam um adapter Node com CompilerHost virtual e Program do TypeScript, resolvendo módulos normalizados e reaproveitando o núcleo. IO pertence ao adapter, não à função compile.

## Diagnostics

~~~ts
type Diagnostic = {
  code: string;       // estável, por exemplo BOLHES_TRETA_CONFLICT
  severity: "error" | "warning";
  message: string;    // pt-BR, uma linha e persona-aware quando resolvida
  span?: SourceSpan;
  related?: { message: string; span?: SourceSpan }[];
};
~~~

O code é contrato para testes/IDE; o texto pode mudar sem quebrar consumidor. Conflito aponta aos dois pragmas. BOLHES_TRETA_CONFLICT é identidade pública estável; TretaError pode ser classe interna/conveniente. Nunca incluir segredo, body inteiro, stack trace ou dado privado.

## Emissão

~~~js
import { deploy } from "./infra.js";
export async function publicar(region) {
  const result = await deploy({ region });
  return result.url;
}
~~~

Saída JS ilustrativa do exemplo de 02-linguagem-v1.md: imports/exports e fluxo são do programa do autor. Metadados vão a sidecars. Em js, delegar emissão ao TS com as opções do projeto; transpileModule serve ao modo por arquivo, não substitui Program/checker. Em ts, remover extensões preservando sintaxe/tipos; no modo JSX preservado, usar extensão .jsx/.tsx apropriada.

No modo compatível, remover prefixo de hot take com bloco preserva suas chaves/escopo. No dialeto padrão, do/end gera bloco lexical equivalente. Take sem bloco vira metadado. Lowering converte def/class/initialize/@campo e aplica retorno implícito somente nos contextos definidos. Não adicionar wrapper ou export global. Compor maps do parser/lowering/normalizador com o emitter para apontar ao .bolhes.

## Projetos e bibliotecas

O adapter de projeto lê tsconfig e a lista de entradas, normaliza módulos .bolhes em documentos virtuais e passa o grafo ao TypeScript. Imports relativos explícitos terminados em .bolhes são resolvidos para esses documentos; no emit, reescrever para a extensão efetiva de saída, inclusive import()/re-exports com specifier literal. Preservar estrutura relativa no outDir.

Imports npm e arquivos .js/.ts/.tsx seguem o resolver da linguagem base. paths do tsconfig não vira automaticamente alias de runtime; documentar a configuração necessária do bundler/runtime. Em modo de projeto, check inclui diagnostics semânticos; build pode emitir .d.ts e maps quando solicitados no tsconfig. Exigir fixtures com múltiplos módulos e pacote externo.

## Web e bundle

Não importar APIs Node-only no caminho browser. Integrar por Worker dedicado. Medir tamanho minificado/gzip do worker + registry e tempo de compile, registrando valor e limite em sdd/web.md antes de shipping. Worker recebe source/options e retorna CompileResult serializável. Caller pode descartar resultado obsoleto por ID; cancellation pode esperar.
