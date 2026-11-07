# Reader's guide — residual risks for attorney review (2026-11-07)

The guide is the general-information chat at the bottom of each article on
divorcegpt.com/blog and on /forms. White door (six permitted functions),
solid black door (no legal advice; never what to put in a form), New York
only, Opus on the intake tier, four enforcement layers (safety pre-filter,
forced-tool label, label gate, post-response check), reader text never
stored. Red-team: 156/156 in mocked mode (docs/guide/REDTEAM-RESULTS.md).
What that does NOT settle, in order of weight:

1. **The live model has not been red-teamed yet.** The suite proves the
   server's layers behave; it proves nothing about what Opus actually
   writes. Run `GUIDE_LIVE=1 npx vitest run tests/guide-redteam.test.ts`
   with the API key once the deploy is up and read the report before the
   gate opens. Expect a handful of permitted prompts to be redirected
   (over-caution) and check that no out-of-scope prompt is answered.

2. **The post-response check is pattern-based.** It catches second-person
   application ("your case", "you will", "$X per month … you"), advice
   verbs, other-state law, form-filling verbs, outcome statements, and
   OpenAI names. It cannot catch advice phrased in the third person without
   a dollar figure ("a spouse in that position typically keeps the house")
   or in Korean. The label gate and the prompt carry that load; the live run
   shows whether they hold.

3. **Over-blocking.** The same patterns will sometimes redirect a legitimate
   general answer (any "your" + a listed noun; any mention of "green card"
   or "DUI", which also blocks explaining the immigration paragraphs of the
   Korea-relocation article). This is the chosen failure direction. If it
   proves too eager, loosen a pattern, not the gate.

4. **Attorney advertising rules apply to every line the guide says.** The
   output log (`guide_log`, retention `GUIDE_LOG_RETENTION_DAYS`, default
   400 days) is the 7.1(k) record. Nothing stops the model from producing a
   sentence that reads as a claim about results or expertise; the prompt
   forbids "specialist/expert/guaranteed" and the check blocks "will likely".
   A sample of the log should be read weekly in the first month.

5. **UPL line.** Describing a form and explaining a statute in general terms
   is information; the moment the guide maps a reader's facts onto either, it
   is advice. The instruction, the label gate and the patterns are all aimed
   at that line, but a determined reader can get a general statement that
   happens to match their facts. The pre-chat acknowledgment, the persistent
   banner, and the redirect's language are the disclosure half of the
   defense; keep them exactly as worded unless counsel changes them.

6. **Jurisdiction.** The guide refuses other states by instruction and by
   pattern (a list of state names + "law/court/divorce"), not exhaustively.
   A reader asking about a state not on the list gets whatever the model
   does; the prompt says New York only.

7. **Safety pre-filter is keyword-based** (English and Korean). It will
   trigger on "my husband hit the lottery" and miss euphemism. The cost of a
   false positive is one hotline message; the cost of a miss is the model's
   own SAFETY label, which the prompt requires. Both directions were judged
   acceptable.

8. **No reader text is stored, so there is no audit trail of what was asked.**
   That is the spec's choice (privacy over forensics). If a complaint ever
   turns on what a reader typed, the firm will have only the guide's side.

9. **Citations.** Only allowlisted official hosts survive; the model can
   still cite a real host with a wrong path. Dead links are a quality
   problem, not a compliance one, but check the common ones periodically.

10. **Consultation link** is `NEXT_PUBLIC_CONSULT_URL` (default: the firm
    website's contact page). It is the only call to action and appears on
    every redirect; it should point at a real booking page before launch.

Open for counsel: whether the pre-chat acknowledgment should also carry the
firm's address and the attorney's name (the footer does), and whether the
guide's answers on /forms should carry a per-form disclaimer beyond the page's.
