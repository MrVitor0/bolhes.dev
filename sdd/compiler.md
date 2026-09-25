# Compiler

`@bolhes/compiler` exports `compile(source, options)` and performs no IO. The result contains `ok`, `code`, `target`, `pragmas`, `social` and `diagnostics`. On error, `code` and `social` are omitted. Diagnostic codes are stable.

Current pipeline: read header directives (default `bolha`) -> extract metadata takes -> resolve conflicts -> lower the default Bolhes block syntax -> parse the emitted module with the TypeScript parser -> collect AST facts and comments -> execute declared requirement rules -> emit JavaScript -> build the social artifact.

Implemented rule IDs: `requires-type`, `no-any`, `no-anonymous-function`, `ast-contains-call`, `ast-contains-identifier`, `ast-contains-url`, `ast-contains-number`, `take-contains-any`, `comment-marker`, `take-or-comment-marker`, `take-max-length` and `take-question`. Unknown rule IDs/options fail the registry build.

The compiler uses `transpileModule` for isolated files. It does not provide semantic checking across files. Source maps remapped to `.bolhes` and the complete Ruby/Python parser and implicit returns are pending.
