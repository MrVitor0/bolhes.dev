# Planejamento spec-driven do transpiler Bolhês

**Status:** proposta de implementação, antes do primeiro código do monorepo  
**Escopo:** transpiler v1 funcional, dados de persona, testes e CLI  
**Base:** AGENTS.MD e personality.md

## Como usar estes documentos

1. Leia [01-escopo.md](01-escopo.md) e [02-linguagem-v1.md](02-linguagem-v1.md).
2. Implemente conforme [03-arquitetura.md](03-arquitetura.md) e [06-plano-de-implementacao.md](06-plano-de-implementacao.md).
3. Migre personas usando [04-pragmas-e-personas.md](04-pragmas-e-personas.md).
4. Feche cada etapa com [05-testes-e-qualidade.md](05-testes-e-qualidade.md) e [07-cli-e-entrega.md](07-cli-e-entrega.md).
5. Registre decisões duradouras em ADRs e atualize a spec junto com mudanças de linguagem.
6. Para adicionar personas, pragmas ou aliases, siga [09-extensibilidade.md](09-extensibilidade.md).
7. A sintaxe padrão inspirada em Ruby/Python está em [10-sintaxe-ruby-python.md](10-sintaxe-ruby-python.md).

## Relação com sdd/

O AGENTS.MD define sdd/ como o lugar canônico da especificação viva. Esta pasta foi criada a pedido para planejar a implementação antes de existir o monorepo. Ao iniciar o código, promova as decisões aprovadas para os documentos correspondentes em sdd/; não mantenha duas specs concorrentes. Até essa promoção, use estes arquivos como plano de trabalho.

## Resultado esperado

Bolhês com sintaxe de autoria inspirada em Ruby/Python e destino JS/TS: def, class, comentários # e blocos end. Recursos da linguagem base continuam acessíveis por lowering, regiões nativas e módulos importados. Compiler determinístico, registry extensível em YAML, mapas de origem, artefatos sociais separados e CLI para arquivos/projetos. Não há chamada de LLM, rede ou secret na compilação.

## Princípios

- Uma passagem, uma responsabilidade, entradas explícitas.
- O núcleo compila string para resultado; não lê arquivos, ambiente, relógio, rede nem estado global.
- Nomes de código em inglês; documentação e voz de diagnostics em pt-BR.
- Regras sociais são pequenas e verificáveis. Não fingimos compreender intenção por NLP.
- Manter pequenas as extensões próprias e herdar a linguagem base; novas construções exigem spec, testes e exemplo.
- Sem dependência de runtime sem requisito concreto.

~~~text
source
  -> diretivas/perfis -> parser Bolhês -> lowering TS -> parser/checker base
  -> requisitos -> treta/easter eggs
  -> emit JS/TS + artifacts sociais -> CompileResult
                         ^
       CLI e web consomem somente a API pública
~~~
