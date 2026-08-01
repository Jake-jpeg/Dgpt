/**
 * AiConfigError lives here so the provider adapters and the client that
 * dispatches to them can both import it without a cycle.
 *
 * It means: an OPERATOR misconfiguration — a bad or missing key, an unknown
 * model, a base-URL override in production. Never a client-facing condition,
 * and never carrying a provider response body (which can echo request
 * content). responses.ts re-exports it, so every existing import keeps
 * working.
 */
export class AiConfigError extends Error {}
