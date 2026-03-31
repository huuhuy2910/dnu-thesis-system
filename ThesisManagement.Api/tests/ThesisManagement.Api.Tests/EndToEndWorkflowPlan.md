# End-to-End Workflow Test Plan

This repository currently uses Oracle and environment-bound credentials, so CI-safe full integration tests are provided as an execution plan.

## Required flow

1. Sync data: `POST /api/v1/defense-periods/{periodId}/sync`
2. Generate councils: `POST /api/v1/defense-periods/{periodId}/auto-generate`
3. Assign/review councils: manual step APIs
4. Submit score: lecturer scoring APIs
5. Finalize: `POST /api/v1/defense-periods/{periodId}/finalize`
6. Publish: `POST /api/v1/defense-periods/{periodId}/publish-scores`
7. Rollback: `POST /api/v1/defense-periods/{periodId}/rollback`

## Assertions

- Every write endpoint requires and accepts `Idempotency-Key`.
- Replay with same key + same payload returns deterministic result with `idempotencyReplay=true`.
- Replay with same key + different payload returns business error code `IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_PAYLOAD`.
- Concurrency conflicts return HTTP `409`.
- Response envelope carries `traceId`, `code`, and warnings/actions when relevant.
- Audit records include before/after snapshots.

## Manual execution

Use Postman/Newman collection in this sequence and export run report as UAT artifact.
