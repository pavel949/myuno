# E2.9 booking-message dispatch rollback

No data/schema migration. Security-preserving handler rollback must retain `access.ts` and its authenticated object/module/action checks; disable interactive dispatch entirely if compatibility fails. Never restore the previous authenticated arbitrary-ID service access. Keep internal-secret scheduler ingress separate. Do not deploy the original handler as rollback. No live send/rollback call performed.
