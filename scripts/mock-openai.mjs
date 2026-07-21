/**
 * OFFLINE mock of the OpenAI Responses API for acceptance DRY-RUNS.
 * Development-only: the app refuses OPENAI_BASE_URL in production builds.
 * Returns a schema-valid report for whatever kind the request asks for,
 * citing only always-present provenance (the client-name answer) and a
 * known snapshot authority. SYNTHETIC — no external calls, no secrets.
 *
 * Usage: node scripts/mock-openai.mjs   (PORT env, default 4546)
 */
import http from "node:http";

const PORT = Number(process.env.PORT || 4546);

function reportFor(kind, jurisdiction) {
  const authority = jurisdiction === "NY" ? "NY-DIVORCE-GROUNDS-001" : "NJ-DIVORCE-GROUNDS-001";
  return {
    kind,
    title: `Mock ${kind} (dry-run, synthetic)`,
    summary: "Deterministic mock output for pipeline dry-runs. Synthetic data only.",
    factualAssertions: [
      {
        assertion: "The client identified themselves in the intake. (mock)",
        supportStatus: "SUPPORTED",
        intakeAnswerIds: ["shared.identity.client_name"],
        documentVersionIds: [],
        documentLocations: [],
        sourceQuoteOrSummary: "",
        notes: "",
      },
    ],
    legalPropositions: [
      {
        proposition: "Statutory grounds govern dissolution in this jurisdiction. (mock)",
        legalAuthorityIds: [authority],
        jurisdiction: "NY",
        authorityReviewStatus: "COUNSEL_REVIEW_REQUIRED",
        attorneyReviewRequired: true,
      },
    ],
    items: [{ label: "Mock item", detail: "Pipeline dry-run marker.", flag: "" }],
    followUpQuestions: [],
  };
}

const server = http.createServer((req, res) => {
  if (!req.url?.includes("/responses")) {
    res.writeHead(404).end();
    return;
  }
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    let kind = "AttorneyIntakeMemo";
    let jurisdiction = "NY";
    try {
      const parsed = JSON.parse(body);
      kind = parsed?.text?.format?.name ?? kind;
      const userMsg = JSON.stringify(parsed?.input ?? "");
      if (userMsg.includes('"jurisdictionConfirmed":"NY"') || userMsg.includes("NY_SUPREME")) jurisdiction = "NY";
    } catch {
      /* default */
    }
    const payload = {
      id: `resp_mock_${Math.abs(Date.now() % 100000)}`,
      model: "mock-structured-model",
      output_text: JSON.stringify(reportFor(kind, jurisdiction)),
      usage: { input_tokens: 200, output_tokens: 90 },
    };
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(payload));
  });
});

server.listen(PORT, () => console.log(`mock-openai on :${PORT} (dry-run only)`));
