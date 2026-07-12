# AI Cost & Usage Accounting

## What is recorded

Every invocation writes one `ai_invocation` row: matter, acting user,
action, model, status, provider response ID, prompt version, latency (ms),
and **token counts** (`tokens_in`, `tokens_out`) exactly as reported by the
provider's usage block. Disabled/denied/rejected attempts are recorded too
(without token counts where no call happened), so the ledger reflects
attempts, not just successes.

## Useful local queries

```sql
-- Spend drivers by action (token volume)
SELECT feature, COUNT(*) runs,
       SUM(COALESCE(tokens_in,0))  tin,
       SUM(COALESCE(tokens_out,0)) tout
FROM ai_invocation GROUP BY feature ORDER BY tin+tout DESC;

-- Per-matter usage
SELECT matter_ref, COUNT(*) runs,
       SUM(COALESCE(tokens_in,0)+COALESCE(tokens_out,0)) tokens
FROM ai_invocation GROUP BY matter_ref ORDER BY tokens DESC;

-- Outcome mix (OK vs REJECTED_OUTPUT vs ERROR/DISABLED/DENIED)
SELECT status, COUNT(*) FROM ai_invocation GROUP BY status;

-- Latency profile per model
SELECT model, COUNT(*), AVG(latency_ms), MAX(latency_ms)
FROM ai_invocation WHERE status='OK' GROUP BY model;
```

Dollar cost = token counts × the current OpenAI price sheet for the
configured model; prices change, so the ledger stores tokens, not dollars.

## Cost controls in the design

- `AI_FEATURES_ENABLED=false` is a hard zero-spend switch (no code path
  reaches the provider).
- `OPENAI_MAX_OUTPUT_TOKENS` bounds every response (default 4000).
- Context is bounded: extraction text capped per document (≤6000 chars in
  context), answers serialized compactly, one call per action — no agent
  loops, no tool invocations, no background calls, no retries on 4xx.
- Rate limiting on the AI endpoint (`bot` lane) throttles per-source bursts.
- `store:false` keeps no provider-side state to bill or leak.
- Rejected outputs still consumed tokens — the ledger shows them, which is
  the right incentive to fix prompts/models rather than hide waste.

## Review cadence (pilot recommendation)

Weekly during the local pilot: outcome mix (a rising REJECTED_OUTPUT rate
means the model/prompt pairing is drifting), token totals by action, and
latency. The workbench is supervision tooling — if an action's cost is not
paying for attorney time saved, turn that action off in practice; the kill
switch and per-action UI make that a workflow decision, not a deploy.

LOCAL DEVELOPMENT BUILD — NOT APPROVED FOR LIVE CLIENT USE.
