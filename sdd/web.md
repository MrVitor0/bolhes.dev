# Playground web

O app `apps/web` e um consumer React/Vite da API pública do compiler e do registry de pragmas. O compile roda em `src/worker.ts`; o editor, chips, demos, JS, diagnostics e quote-tweets consomem resultados serializáveis do Worker. Demos são importadas de `examples/` como texto.

## Bundle medido

Medida local em 2026-09-25 com `pnpm --filter @bolhes/web build`:

- Worker compiler: 3,619,964 bytes; gzip: 1,037,119 bytes.
- UI: 243,274 bytes; gzip: 75,987 bytes.
- CSS: 3,567 bytes; gzip: 1,379 bytes.

O Worker inclui a API de parser do TypeScript, principal responsável pelo tamanho. A compilação é debounced em 160 ms e não bloqueia a main thread. Usar parsers menores ou dividir carregamento do playground exige medição própria; não carregar o compiler eager na janela.

## Limites atuais

- A UI permite selecionar pragmas, mas apresenta conflitos/requisitos como diagnostics comuns; não explica ainda os gestos no seletor.
- O Worker não tem cancelamento de compilação em andamento nem limite de tamanho de entrada.
- Não há syntax highlighting, persistência local, compartilhamento por URL ou acessibilidade auditada.
- Um teste executa o bundle do Worker e compara o resultado à API pública Node para uma fixture de referência.
