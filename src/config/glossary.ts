/**
 * ATTORNEY-CONTROLLED CONFIG — approved glossary.
 *
 * Definition cards are served VERBATIM by retrieval when a user asks what a
 * term means. They are never generated, never paraphrased, and never applied
 * to the user's facts ("what does waiver mean?" gets the card; "so do I waive
 * X?" gets the DEFLECT_CONSULT card instead — see src/lib/bot/classifier.ts).
 *
 * All definition text is [ATTORNEY TO SUPPLY] placeholder in Stage 1. The
 * placeholders below are intentionally generic descriptions of what the
 * attorney should write, NOT legal definitions — do not ship until replaced.
 */

export interface GlossaryTerm {
  id: string;
  term: string;
  /** Lowercase alias strings the classifier may match against. */
  aliases: string[];
  definition: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    id: "TERM_UNCONTESTED",
    term: "Uncontested divorce",
    aliases: ["uncontested", "uncontested divorce"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of an uncontested divorce in NJ.]",
  },
  {
    id: "TERM_IRRECONCILABLE",
    term: "Irreconcilable differences",
    aliases: ["irreconcilable differences", "irreconcilable"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of irreconcilable differences as a ground for divorce in NJ.]",
  },
  {
    id: "TERM_EQUITABLE_DISTRIBUTION",
    term: "Equitable distribution",
    aliases: ["equitable distribution", "ed", "property division", "division of property"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of equitable distribution.]",
  },
  {
    id: "TERM_ALIMONY",
    term: "Alimony / spousal maintenance",
    aliases: ["alimony", "spousal maintenance", "spousal support", "maintenance"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of alimony / spousal maintenance.]",
  },
  {
    id: "TERM_QDRO",
    term: "QDRO",
    aliases: ["qdro", "qualified domestic relations order"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of a Qualified Domestic Relations Order and when one is needed to divide a retirement account.]",
  },
  {
    id: "TERM_CIS",
    term: "Case Information Statement (CIS)",
    aliases: ["cis", "case information statement"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of the NJ Case Information Statement.]",
  },
  {
    id: "TERM_VENUE",
    term: "Venue",
    aliases: ["venue"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of venue (which county the case is filed in).]",
  },
  {
    id: "TERM_SERVICE",
    term: "Service of process",
    aliases: ["service of process", "service", "serve papers", "being served"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of service of process.]",
  },
  {
    id: "TERM_WAIVER",
    term: "Waiver",
    aliases: ["waiver", "waive"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of a waiver, generally. The card must NOT discuss the effect of any waiver on the user's case.]",
  },
  {
    id: "TERM_MSA",
    term: "Marital Settlement Agreement",
    aliases: ["msa", "marital settlement agreement", "settlement agreement"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of a marital settlement agreement.]",
  },
  {
    id: "TERM_JUDGMENT",
    term: "Judgment of Divorce",
    aliases: ["judgment of divorce", "judgment", "final judgment", "jod"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of the final judgment of divorce.]",
  },
  {
    id: "TERM_DOCKET",
    term: "Docket number",
    aliases: ["docket number", "docket"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of a docket number.]",
  },
  {
    id: "TERM_NAME_RESUMPTION",
    term: "Name resumption",
    aliases: ["name resumption", "maiden name", "resume name", "name change"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English explanation of resuming a prior name as part of a divorce.]",
  },
  {
    id: "TERM_CONFLICT_CHECK",
    term: "Conflict check",
    aliases: ["conflict check", "conflict of interest", "conflicts"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English explanation of why a law office runs a conflict-of-interest check before an intake.]",
  },
  {
    id: "TERM_PRO_SE",
    term: "Pro se",
    aliases: ["pro se"],
    definition: "[ATTORNEY TO SUPPLY — plain-English definition of pro se.]",
  },
  {
    id: "TERM_DEFERRED_COMP",
    term: "Deferred compensation",
    aliases: ["deferred compensation", "deferred comp"],
    definition:
      "[ATTORNEY TO SUPPLY — plain-English definition of deferred compensation as a marital asset category.]",
  },
];

export function getTermById(id: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.id === id);
}
