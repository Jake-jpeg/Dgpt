"use client";
import Link from "next/link";

const states = [
  {
    code: "ny", name: "New York", available: true,
    description: "The NY Unified Court System provides free uncontested divorce forms and a DIY form-filling program.",
    links: [
      { label: "DIY Uncontested Divorce Program", url: "https://nycourts.gov/courthelp/diy/divorce.shtml" },
      { label: "Uncontested Divorce Forms & Instructions", url: "https://ww2.nycourts.gov/divorce/forms.shtml" },
      { label: "Uncontested Divorce Packet (PDF)", url: "https://www.nycourts.gov/LegacyPDFS/divorce/COMPOSITE-UNCONTESTED-DIVORCE-FORMS.pdf" },
    ],
    note: "Filing fee: ~$335. Forms are free.",
  },
  {
    code: "nj", name: "New Jersey", available: true,
    description: "NJ Courts has a self-help divorce page with some forms. LSNJ sells a complete divorce kit for $25. You can also get forms from your county courthouse ombudsman.",
    links: [
      { label: "NJ Courts — Self-Help Divorce", url: "https://www.njcourts.gov/self-help/divorce" },
      { label: "NJ Courts — All Forms", url: "https://www.njcourts.gov/self-help/forms" },
      { label: "LSNJ Divorce Guide (Free)", url: "https://proxy.lsnj.org/rcenter/GetPublicDocument/Sites/LAW/Documents/Publications/Manuals/Divorce.pdf" },
    ],
    note: "Filing fee: ~$300. Some forms available free; full kit $25 from LSNJ.",
  },
];

export default function FreeFormsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-zinc-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 transition hover:opacity-80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a365d] to-[#2c5282] shadow-lg shadow-[#1a365d]/20"><span className="text-lg">⚖️</span></div>
              <div><h1 className="text-lg font-semibold text-zinc-900">DivorceGPT</h1><p className="text-xs text-zinc-500">Free Court Forms</p></div>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">Free Divorce Forms by State</h2>
          <p className="mt-4 text-lg text-zinc-600">Every state provides official divorce forms. Download them directly from the court — no cost.</p>
        </div>

        <div className="space-y-8">
          {states.map((s) => (
            <div key={s.code} className="rounded-2xl bg-white p-8 ring-1 ring-zinc-200">
              <h3 className="text-xl font-bold text-zinc-900">{s.name}</h3>
              <p className="mt-2 text-sm text-zinc-600">{s.description}</p>
              <div className="mt-4 space-y-2">
                {s.links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg bg-zinc-50 px-4 py-3 text-sm font-medium text-[#1a365d] ring-1 ring-zinc-100 hover:bg-zinc-100 hover:ring-zinc-200 transition">
                    {link.label} <span className="text-zinc-400">→</span>
                  </a>
                ))}
              </div>
              <p className="mt-4 text-xs text-zinc-400">{s.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-gradient-to-b from-[#1a365d] to-[#234876] p-8 text-center">
          <h3 className="text-xl font-bold text-white">Want AI to Fill Out Your Forms?</h3>
          <p className="mt-2 text-sm text-zinc-300">DivorceGPT walks you through every field in plain language and prepares your complete court-ready packet for $99.</p>
          <Link href="/#states" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#c59d5f] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#c59d5f]/30 hover:bg-[#d4ac6e] transition">Get AI Assistance — $99 →</Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-500">Case too complex? Consider consulting a licensed attorney in your state.</p>
        </div>
      </main>
    </div>
  );
}
