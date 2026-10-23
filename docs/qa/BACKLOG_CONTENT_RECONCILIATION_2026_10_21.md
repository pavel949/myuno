# Content and instrumentation backlog reconciliation

Base main: fb4b944a4c736f680ddb8e4b178f833030e021b1. Homepage PR156 f782951 remains independent and is not overwritten.

PR19: merge current main into original PR ancestry, keep deleted legacy pages deleted, preserve existing route contracts, and correct false provenance introduced by the proposal. Submitted expected IRR is labelled an estimate, not historical evidence. Calculator notes describe inputs/assumptions. No unsupported CBRE period is added. PROJECT.md supersedes the old commission-only product definition.

PR1 and PR36 require separate instrumentation reconciliation. Neither unconditional SDK injection nor a second pnpm lockfile is appropriate for the current npm/Vite/Lovable public deployment. Existing optional consent and private operational surfaces must be respected. No account-side analytics activation or hosting mutation is part of this work.
