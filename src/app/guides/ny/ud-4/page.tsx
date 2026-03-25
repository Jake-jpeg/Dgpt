"use client";
import Link from "next/link";

export default function UD4Guide() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20">
                <span className="text-lg">⚖️</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1>
                <p className="text-xs text-zinc-500">
                  by{" "}
                  <a href="https://juneguidedsolutions.com" className="underline hover:text-[#1a365d]">
                    June Guided Solutions, LLC
                  </a>
                </p>
              </div>
            </Link>
            <Link href="/guides" className="text-sm font-medium text-zinc-600 hover:text-[#1a365d] transition">
              ← All Guides
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0f2440] via-[#1a365d] to-[#1e3a5f] py-16 lg:py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#c59d5f]/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center rounded-full bg-[#c59d5f]/20 px-4 py-1.5 text-xs font-semibold text-[#c59d5f] mb-6">
            Resource Guide · New York
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl lg:leading-[1.15]">
            Form UD-4 &amp; UD-4A: Removal of Barriers to Remarriage
          </h1>
          <p className="mt-5 text-lg text-zinc-300 leading-relaxed max-w-2xl mx-auto">
            What these forms are, why they exist, what the law actually says, and what changed in the December 2025 revision.
          </p>
        </div>
      </section>

      {/* Scope Banner */}
      <div className="bg-[#1a365d]/5 border-b border-[#1a365d]/10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-zinc-600 text-center">
            <strong className="text-[#1a365d]">Scope:</strong> This guide covers Form UD-4 and Form UD-4A as they apply to{" "}
            <strong>uncontested divorces in New York — no children under 21.</strong>{" "}
            Other forms in the Uniform Uncontested Divorce Packet are addressed in separate guides.
          </p>
        </div>
      </div>

      {/* Article Body */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        {/* Disclaimer */}
        <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 p-5 mb-12">
          <p className="text-sm text-amber-800">
            <strong>Disclaimer:</strong> This guide is published by DivorceGPT, a product of June Guided Solutions, LLC, for educational purposes only. It does not constitute legal advice. The information below reflects the law and court forms as of March 2026. Laws and forms change. If you have questions about your specific situation, consult a licensed attorney.
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="rounded-xl bg-white ring-1 ring-zinc-200 p-6 mb-12">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide mb-4">In This Guide</h2>
          <ol className="space-y-2 text-sm">
            {[
              ["#what-is-ud4", "What Is Form UD-4?"],
              ["#does-it-apply", "Does This Form Apply to You?"],
              ["#drl-253", "The Law: DRL § 253 — Removal of Barriers to Remarriage"],
              ["#history", "Why This Law Exists: A Brief History"],
              ["#what-barrier-means", "What \"Barrier to Remarriage\" Actually Means"],
              ["#the-clergyman-safeguard", "The Clergyman Safeguard"],
              ["#penalty", "The Penalty for a False Statement"],
              ["#2025-revision", "The December 2025 Revision: What Changed"],
              ["#ud4a", "Form UD-4A: Affirmation of Service"],
              ["#waiver", "The Waiver Option: When UD-4 Is Not Required"],
              ["#how-it-connects", "How UD-4 Connects to the Rest of Your Divorce Packet"],
            ].map(([href, label], i) => (
              <li key={i}>
                <a href={href} className="text-[#1a365d] hover:text-[#c59d5f] transition">
                  {i + 1}. {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ---- Section 1 ---- */}
        <section id="what-is-ud4" className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">1. What Is Form UD-4?</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            Form UD-4 is the <strong>Sworn Statement of Removal of Barriers to Remarriage</strong>. It is a document filed in the Supreme Court of the State of New York as part of an uncontested divorce action. In it, the Plaintiff states — under penalty of perjury — that they have taken all steps solely within their power to remove any barriers to the Defendant&apos;s remarriage following the divorce.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-4">
            In plain language: before a court will grant your final judgment of divorce, you have to promise that you have not done anything — and are not withholding anything — that would prevent your spouse from being able to remarry under the rules of their faith.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            This form exists because of a specific provision in New York law — Domestic Relations Law § 253 — which we will break down in full below.
          </p>
        </section>

        {/* ---- Section 2 ---- */}
        <section id="does-it-apply" className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">2. Does This Form Apply to You?</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            <strong>Form UD-4 only applies if your marriage was solemnized by a religious officiant</strong> — a minister, clergyman, rabbi, imam, or leader of the Society for Ethical Culture.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-4">
            If you were married in a <strong>civil ceremony</strong> — by a judge, justice of the peace, city clerk, or court officiant — you do not need to file this form. When you complete your Verified Complaint (Form UD-2), you will indicate that your marriage was &ldquo;not&rdquo; solemnized by a clergyman or minister, and the UD-4 requirement does not apply.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            If your marriage was performed by a religious officiant, you must either file the UD-4 with proof of service (Form UD-4A), or have the Defendant waive the requirement by checking the appropriate box on the Affidavit of Defendant (Form UD-7). There is no third option. The court will not enter a final judgment of divorce without one or the other.
          </p>
        </section>

        {/* ---- Section 3 ---- */}
        <section id="drl-253" className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">3. The Law: DRL § 253 — Removal of Barriers to Remarriage</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            Form UD-4 is the court&apos;s implementation of <strong>Domestic Relations Law § 253</strong>. This statute applies to any marriage solemnized by a person specified in DRL § 11(1) — which covers clergy, ministers, and leaders of the Society for Ethical Culture.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-4">
            The statute operates at three stages of the divorce:
          </p>

          <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-6 mb-6">
            <h3 className="text-base font-bold text-[#1a365d] mb-3">At Filing (DRL § 253(2))</h3>
            <p className="text-sm text-zinc-700 leading-relaxed">
              Any party who commences a divorce must allege in their Verified Complaint that they have taken — or will take, prior to final judgment — all steps solely within their power to remove any barrier to the Defendant&apos;s remarriage. Alternatively, they may allege that the Defendant has waived this requirement in writing.
            </p>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-6 mb-6">
            <h3 className="text-base font-bold text-[#1a365d] mb-3">Before Final Judgment — Plaintiff (DRL § 253(3))</h3>
            <p className="text-sm text-zinc-700 leading-relaxed">
              No final judgment of divorce shall be entered unless the Plaintiff has filed and served a sworn statement that they have, to the best of their knowledge, taken all steps solely within their power to remove all barriers to the Defendant&apos;s remarriage. This is the UD-4.
            </p>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-6 mb-6">
            <h3 className="text-base font-bold text-[#1a365d] mb-3">Before Final Judgment — Both Parties in Uncontested Cases (DRL § 253(4))</h3>
            <p className="text-sm text-zinc-700 leading-relaxed">
              In an uncontested divorce where the Defendant enters a general appearance and does not contest the relief, <em>both parties</em> must file and serve sworn statements — or waive the requirement. This is why your Defendant&apos;s Form UD-7 includes its own barriers-to-remarriage provision (Box 6a and 6b).
            </p>
          </div>

          <p className="text-zinc-700 leading-relaxed">
            The statute is clear: a final judgment will not be entered without compliance. This is not a suggestion. It is a gate.
          </p>
        </section>

        {/* ---- Section 4 ---- */}
        <section id="history" className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">4. Why This Law Exists: A Brief History</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            DRL § 253 was enacted by the New York State Legislature in 1983. It was commonly known as the <strong>&ldquo;Get Law&rdquo;</strong> — a direct reference to the Jewish religious divorce document called a <em>Get</em>.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-4">
            Under Jewish law (Halacha), a civil divorce does not dissolve a religious marriage. For a Jewish marriage to end in the eyes of the faith, the husband must voluntarily grant his wife a Get. Without it, the woman is considered an <em>Agunah</em> — literally, a &ldquo;chained woman.&rdquo; She cannot remarry within the faith. She cannot date. And the consequences extend beyond her: under traditional Jewish law, children born to a woman who remarries without a Get may be classified as <em>mamzerim</em> — a status that restricts their ability to marry within the Jewish community for multiple generations.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-4">
            This created a problem that civil courts could not ignore. Husbands were using the Get as leverage — withholding it to extract concessions in custody, support, or property division. In some cases, the refusal was simply vindictive. The wife had her civil divorce, but she remained religiously chained.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-4">
            The Governor&apos;s 1983 Memorandum of Approval described the situation as &ldquo;tragically unfair&rdquo; and signed the bill into law despite acknowledging open constitutional questions about the separation of church and state. The statute was deliberately written in religiously neutral language — it never mentions Judaism, the Get, or any specific faith by name. But its legislative history leaves no ambiguity about what it was designed to address.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-4">
            In 1992, the Legislature went further. Finding that DRL § 253 alone was not a sufficient deterrent, New York enacted a second provision — DRL § 236B(5)(h) and (6)(d) — which allows a court to consider a party&apos;s failure to remove barriers to remarriage when deciding equitable distribution and maintenance. In other words: if you refuse to cooperate with a religious divorce, the judge can factor that into how property and support are divided.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            Together, these two statutes represent one of the most significant intersections of civil and religious law in American family law. New York remains one of the only states to address this problem directly by statute.
          </p>
        </section>

        {/* ---- Section 5 ---- */}
        <section id="what-barrier-means" className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">5. What &ldquo;Barrier to Remarriage&rdquo; Actually Means</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            DRL § 253(6) defines the term broadly. A &ldquo;barrier to remarriage&rdquo; includes any religious or conscientious restraint or inhibition that is imposed on a party to the marriage, under the principles held by the clergyman or minister who solemnized the marriage, by reason of the other party&apos;s commission or withholding of any voluntary act.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-4">
            The statute also includes important limitations. It is <strong>not</strong> considered a barrier to remarriage if the restraint cannot be removed by the party&apos;s voluntary act. And it is not a barrier if removing it would require expenses that the other party refuses to reasonably cover.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-4">
            There is another critical carve-out: &ldquo;all steps solely within his or her power&rdquo; does <strong>not</strong> include applying to a marriage tribunal or similar religious body that has authority to annul or dissolve a marriage under the rules of that denomination. The law requires you to do what is within your personal power. It does not require you to petition a religious court.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            This distinction matters. The statute is not asking anyone to obtain a religious divorce or an ecclesiastical annulment. It is asking you to remove barriers that you personally control — such as granting a Get, or signing a document that allows a religious process to move forward.
          </p>
        </section>

        {/* ---- Section 6 ---- */}
        <section id="the-clergyman-safeguard" className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">6. The Clergyman Safeguard</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            DRL § 253(7) contains a provision that is unique in New York divorce law. Even after the Plaintiff files their sworn statement, the court <strong>cannot</strong> enter a final judgment of divorce if the clergyman or minister who solemnized the marriage files their own sworn statement certifying that, to their knowledge, the Plaintiff has <em>failed</em> to remove all barriers to the Defendant&apos;s remarriage.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            This provision applies only if the clergyman or minister is alive, available, and competent to testify at the time the judgment would be entered. It is, in effect, a safeguard — the religious officiant who married the couple retains the ability to tell the court: &ldquo;This person has not done what they swore they did.&rdquo;
          </p>
        </section>

        {/* ---- Section 7 ---- */}
        <section id="penalty" className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">7. The Penalty for a False Statement</h2>
          <p className="text-zinc-700 leading-relaxed">
            DRL § 253(8) makes this explicit: any person who knowingly submits a false sworn statement under this section is guilty of <strong>making an apparently sworn false statement in the first degree</strong> under Penal Law § 210.40. This is a <strong>Class E felony</strong>. The form is not paperwork to rush through. The court treats it with corresponding weight.
          </p>
        </section>

        {/* ---- Section 8 ---- */}
        <section id="2025-revision" className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">8. The December 2025 Revision: What Changed</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            The current version of Form UD-4 is <strong>Rev. 12/23/25</strong>. This revision made a significant procedural change.
          </p>

          <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-6 mb-6">
            <h3 className="text-base font-bold text-[#1a365d] mb-3">Before the Revision</h3>
            <p className="text-sm text-zinc-700 leading-relaxed mb-3">
              Prior versions of the UD-4 required the Plaintiff&apos;s signature to be <strong>notarized</strong>. The form included a &ldquo;Subscribed and Sworn to before me on&rdquo; block with a line for a Notary Public. Even after the January 2024 amendment to CPLR 2106 — which broadly allowed affirmations in lieu of notarized affidavits in civil proceedings — an earlier revision of the UD-4 (Rev. 1/1/24) included a footnote stating that the form should &ldquo;still be signed before a notary public to comply with DRL 253.&rdquo;
            </p>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-6 mb-6">
            <h3 className="text-base font-bold text-[#1a365d] mb-3">After the Revision (Rev. 12/23/25)</h3>
            <p className="text-sm text-zinc-700 leading-relaxed">
              The December 2025 revision removed the notary requirement entirely. The form now uses the standard CPLR 2106 affirmation language: &ldquo;I affirm this ___ day of ___, under the penalties of perjury under the laws of New York, which may include a fine or imprisonment, that the foregoing is true...&rdquo; There is no notary line. No &ldquo;Subscribed and Sworn&rdquo; block. The court system determined that DRL § 253&apos;s requirement of a &ldquo;sworn statement&rdquo; is satisfied by an affirmation under penalty of perjury — consistent with the broader legislative intent behind the CPLR 2106 amendment to reduce unnecessary barriers to court access.
            </p>
          </div>

          <p className="text-zinc-700 leading-relaxed mb-4">
            This change matters for practical reasons. The notary requirement was a real obstacle for pro se litigants — people filing without an attorney. Finding a notary, scheduling a visit, and paying a fee added friction to a process that was already difficult to navigate alone. The December 2025 revision removed that friction for the UD-4, just as earlier revisions had already done for other forms in the divorce packet.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            It is worth noting what did <strong>not</strong> change: the substance of the sworn statement remains identical. The Plaintiff still affirms, under penalty of perjury (a Class E felony for a false statement), that they have removed all barriers to the Defendant&apos;s remarriage. The legal weight of the document is unchanged. Only the mechanism of attestation — affirmation rather than notarization — has been updated.
          </p>
        </section>

        {/* ---- Section 9 ---- */}
        <section id="ud4a" className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">9. Form UD-4A: Affirmation of Service</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            Form UD-4A is the <strong>Affirmation of Service</strong> that must be attached to and filed with the UD-4. It proves that the Defendant was served with a copy of the Plaintiff&apos;s Sworn Statement of Removal of Barriers to Remarriage.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-4">
            The person who serves the document — who must be over 18 years of age and not a party to the action — affirms that they delivered a true copy of the Removal of Barriers Statement to the Defendant. Service can be completed in one of two ways: personally, or by depositing a true copy in a post-paid wrapper at an official U.S. Postal Service depository within New York State, addressed to the Defendant.
          </p>
          <p className="text-zinc-700 leading-relaxed mb-4">
            Like the UD-4 itself, the UD-4A was updated in the December 2025 revision. What was previously called the &ldquo;Affidavit of Service&rdquo; is now titled the &ldquo;Affirmation of Service.&rdquo; The notary requirement for the server has been removed. The server now affirms under penalty of perjury using the standard CPLR 2106 language.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            There is also a third option on the UD-4A: the Defendant (or Defendant&apos;s attorney) can simply acknowledge service by signing the form directly.
          </p>
        </section>

        {/* ---- Section 10 ---- */}
        <section id="waiver" className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">10. The Waiver Option: When UD-4 Is Not Required</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            There are two situations where the UD-4 does not need to be filed:
          </p>
          <p className="text-zinc-700 leading-relaxed mb-4">
            <strong>Civil ceremony:</strong> If your marriage was not solemnized by a clergyman, minister, or leader of the Society for Ethical Culture, the UD-4 does not apply. Your Verified Complaint (Form UD-2) will reflect this, and you skip the form entirely.
          </p>
          <p className="text-zinc-700 leading-relaxed">
            <strong>Defendant waiver:</strong> If the Defendant waives the requirement, the UD-4 is not needed. The Defendant does this by checking Box 6b on Form UD-7 (Affidavit of Defendant), which states: &ldquo;I waive the requirements of DRL § 253 subdivisions (2), (3), and (4).&rdquo; In this scenario, both the UD-4 and the UD-4A are omitted from the filing.
          </p>
        </section>

        {/* ---- Section 11 ---- */}
        <section id="how-it-connects" className="mb-14">
          <h2 className="text-2xl font-bold text-zinc-900 mb-4">11. How UD-4 Connects to the Rest of Your Divorce Packet</h2>
          <p className="text-zinc-700 leading-relaxed mb-4">
            The UD-4 does not exist in isolation. It connects to several other documents in the Uniform Uncontested Divorce Packet:
          </p>

          <div className="space-y-4">
            <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-5">
              <p className="text-sm text-zinc-700">
                <strong className="text-[#1a365d]">Form UD-2 (Verified Complaint):</strong> Field 8 of the Verified Complaint is where the Plaintiff first declares whether the marriage was solemnized by a religious officiant. This is the trigger. If yes, you check the box indicating you have taken or will take steps to remove barriers — and the UD-4 becomes required.
              </p>
            </div>
            <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-5">
              <p className="text-sm text-zinc-700">
                <strong className="text-[#1a365d]">Form UD-7 (Affidavit of Defendant):</strong> The Defendant&apos;s form mirrors the barriers requirement. Box 6a states the Defendant will take or has taken steps to remove barriers to the Plaintiff&apos;s remarriage. Box 6b allows the Defendant to waive the DRL § 253 requirement entirely — which also eliminates the need for the Plaintiff to file the UD-4.
              </p>
            </div>
            <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-5">
              <p className="text-sm text-zinc-700">
                <strong className="text-[#1a365d]">Form UD-4A (Affirmation of Service):</strong> If the UD-4 is filed, the UD-4A must be attached to prove the Defendant received a copy of the sworn statement.
              </p>
            </div>
            <div className="rounded-xl bg-white ring-1 ring-zinc-200 p-5">
              <p className="text-sm text-zinc-700">
                <strong className="text-[#1a365d]">Form UD-11 (Judgment of Divorce):</strong> The final judgment. The court will not sign it unless the UD-4 has been filed (or the requirement has been waived). This is the statutory gate that DRL § 253 creates.
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <hr className="border-zinc-200 my-12" />

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-b from-[#1a365d] to-[#234876] p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-3">Ready to Prepare Your Divorce Documents?</h3>
          <p className="text-sm text-zinc-300 mb-6 max-w-lg mx-auto">
            DivorceGPT handles the UD-4, UD-4A, and every other form in your uncontested divorce packet — with plain-language guidance through every field.
          </p>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c59d5f] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#c59d5f]/25 hover:bg-[#d4ac6e] hover:shadow-xl transition-all">
            Get Started — $99 →
          </Link>
          <p className="mt-3 text-xs text-zinc-400">New York &amp; New Jersey · Uncontested · No Children</p>
        </div>

        {/* Footer attribution */}
        <div className="mt-12 pt-8 border-t border-zinc-200">
          <p className="text-xs text-zinc-400 text-center">
            © 2025 June Guided Solutions, LLC · This guide is for educational purposes only and does not constitute legal advice.
          </p>
          <p className="text-xs text-zinc-400 text-center mt-1">
            Forms referenced: UD-4 (Rev. 12/23/25) · UD-4A (Rev. 12/23/25) · DRL § 253
          </p>
        </div>

      </article>
    </div>
  );
}
