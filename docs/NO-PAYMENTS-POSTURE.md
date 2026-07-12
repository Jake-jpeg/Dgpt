# No-Payments Posture — DivorceGPT 2.0

**The application itself does not collect money.** Verified by
`tests/no-payments.test.ts`, which FAILS the build if payment machinery is
ever introduced.

## Facts (verified this pass)

- No Stripe (or Braintree/Square/PayPal) dependency in any dependency
  section of package.json.
- No payment, checkout, billing, invoice, subscription, or webhook API
  route anywhere under `src/app/api/`.
- No checkout component, no token billing, no AI surcharge, no client
  software-subscription surface, no legal-fee calculation, and no
  payment-related database table (the DDL in `src/lib/db/index.ts` contains
  none).
- No `STRIPE_*` environment variable is read anywhere in `src/`.
- Stage-1 records already established that payments are "never in-app, any
  stage" (AGENTS.md); this pass adds the enforcement test.

## Posture

1. **Client legal fees** are governed entirely outside DivorceGPT by the
   separate written retainer/engagement agreement with Jake Kim Law Firm.
   The portal neither calculates, displays, nor collects them.
2. **Portal use carries no separate client software charge.**
3. **Institutional arrangements** — any future institutional pilot,
   license, support arrangement, or acquisition — would require a separate
   written agreement; nothing in the application implements or implies one.
4. **No public "free forever" claim** is made anywhere; the application
   simply does not transact. (Marketing copy must not describe the software
   as permanently free.)

## Guardrails

- `tests/no-payments.test.ts` — dependency scan, route scan, source scan
  (stripe imports, STRIPE_* keys, payment tables, checkout references,
  webhooks, client-facing fee fields).
- Any future payment feature is a business-model change requiring explicit
  owner instruction, counsel review, and removal of these guard tests — it
  cannot slip in quietly.
