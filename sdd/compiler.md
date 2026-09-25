# Compiler

`@bolhes/compiler` exports `compile(source, options)` and performs no IO. The result contains `ok`, `code`, `target`, `pragmas`, `social` and `diagnostics`. On error, `code` and `social` are omitted. Diagnostic codes are stable.

Current pipeline: read header directives (default `bolha`) -> extract metadata takes -> resolve conflicts -> lower the default Bolhes block syntax -> parse the emitted module with the TypeScript parser -> collect AST facts and comments -> execute declared requirement rules -> emit JavaScript -> build the social artifact.

Implemented rule IDs: `requires-type`, `no-any`, `no-anonymous-function`, `ast-contains-call`, `ast-contains-identifier`, `ast-contains-url`, `ast-contains-number`, `take-contains-any`, `comment-marker`, `take-or-comment-marker`, `take-max-length` and `take-question`. Unknown rule IDs/options fail the registry build.

The compiler uses `transpileModule` for isolated files. Project mode uses the TypeScript Program for semantic checking across `.ts` and `.bolhes` files. Source maps retain `.bolhes` source paths and source content in single-file and project builds; columns after lowering are approximate. The Ruby/Python parser remains a line-oriented subset; multiline statements, native TSX, remapped checker diagnostics and mapped runtime stack traces are pending.
