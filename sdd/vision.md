# Visão

Bolhês compila arquivos `.bolhes` em módulos JS/TS e gera metadados sociais de forma determinística. A compilação não executa o programa, não acessa a rede nem chama modelos.

## Estado nesta implementação

O primeiro corte funcional implementa a API pura por arquivo para o modo de compatibilidade JS/TS: remoção de `@use` e `hot take`, resolução do registry, conflito social configurado e emissão JavaScript com TypeScript. Ainda não implementa o dialeto Ruby/Python completo nem type-check de projetos.
